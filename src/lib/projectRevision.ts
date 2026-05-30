import { db, type ProjectRevisionRecord } from '../db';
import { logCommunication } from './aftercareLogic';
import { generateToken } from './leadConfirmation';

// ── Helpers ──

async function getNextVersion(projectId: string): Promise<number> {
  const latest = await db.projectRevisions
    .where('projectId').equals(projectId)
    .reverse()
    .sortBy('version');
  return (latest[0]?.version || 0) + 1;
}

function makeId(): string {
  return 'prev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

// ── CRUD ──

export async function createProjectRevision(params: {
  projectId: string;
  artistId: string;
  imageUrls: string[];
  note?: string;
  clientId?: string;
}): Promise<ProjectRevisionRecord> {
  const version = await getNextVersion(params.projectId);
  const now = Date.now();
  const record: ProjectRevisionRecord = {
    id: makeId(),
    projectId: params.projectId,
    artistId: params.artistId,
    clientId: params.clientId,
    version,
    imageUrls: params.imageUrls,
    note: params.note,
    status: 'draft',
    createdAt: now,
  };
  await db.projectRevisions.add(record);
  await logCommunication(params.artistId, 'app_note', 'auto', {
    message: `Revision v${version} uploaded`,
    templateType: 'revision_uploaded',
  });
  return record;
}

export async function sendProjectRevision(revisionId: string): Promise<string> {
  const revision = await db.projectRevisions.get(revisionId);
  if (!revision) throw new Error('Revision not found');
  const token = generateToken();
  const now = Date.now();
  await db.projectRevisions.update(revisionId, {
    status: 'sent',
    sentAt: now,
    approvalToken: token,
  });
  await logCommunication(revision.artistId, 'app_note', 'auto', {
    message: `Revision v${revision.version} sent for approval`,
    templateType: 'revision_sent',
  });
  return `/design-review/${token}`;
}

export async function getRevisionByToken(token: string): Promise<ProjectRevisionRecord | undefined> {
  return db.projectRevisions.where('approvalToken').equals(token).first();
}

export async function markRevisionViewed(token: string): Promise<void> {
  const revision = await getRevisionByToken(token);
  if (!revision) return;
  if (revision.status === 'sent') {
    const now = Date.now();
    await db.projectRevisions.update(revision.id, {
      status: 'viewed',
      viewedAt: now,
    });
    await logCommunication(revision.artistId, 'app_note', 'auto', {
      message: `Revision v${revision.version} viewed by client`,
      templateType: 'revision_viewed',
    });
  }
}

export async function approveRevision(token: string): Promise<void> {
  const revision = await getRevisionByToken(token);
  if (!revision) throw new Error('Revision not found');
  const now = Date.now();
  await db.projectRevisions.update(revision.id, {
    status: 'approved',
    approvedAt: now,
  });

  // Find and update related lead
  const project = await db.projects.get(revision.projectId);
  if (project?.sourceLeadId) {
    const lead = await db.leads.get(project.sourceLeadId);
    if (lead) {
      await db.leads.update(project.sourceLeadId, {
        leadPipelineStatus: lead.leadPipelineStatus === 'reviewing' ? 'deposit_requested' : lead.leadPipelineStatus,
      });
    }
  }

  await logCommunication(revision.artistId, 'app_note', 'auto', {
    message: `Revision v${revision.version} approved by client`,
    templateType: 'revision_approved',
  });
}

export async function requestRevisionChanges(
  token: string,
  changes: {
    category: 'placement' | 'size' | 'style' | 'detail' | 'linework' | 'shading' | 'color' | 'wording' | 'other';
    note?: string;
  }[],
): Promise<void> {
  const revision = await getRevisionByToken(token);
  if (!revision) throw new Error('Revision not found');
  const now = Date.now();
  await db.projectRevisions.update(revision.id, {
    status: 'revision_requested',
    requestedChanges: changes,
    revisionRequestedAt: now,
  });

  // Update related lead pipeline
  const project = await db.projects.get(revision.projectId);
  if (project?.sourceLeadId) {
    await db.leads.update(project.sourceLeadId, {
      leadPipelineStatus: 'revision',
    });
  }

  await logCommunication(revision.artistId, 'app_note', 'auto', {
    message: `Revision v${revision.version} changes requested: ${changes.map(c => c.category).join(', ')}`,
    templateType: 'revision_requested',
  });
}

export async function getLatestProjectRevision(projectId: string): Promise<ProjectRevisionRecord | undefined> {
  const revisions = await db.projectRevisions
    .where('projectId').equals(projectId)
    .reverse()
    .sortBy('version');
  return revisions[0];
}

export async function getProjectRevisionSummary(projectId: string): Promise<{
  latestVersion: number;
  approved: boolean;
  pendingApproval: boolean;
  revisionRequested: boolean;
  totalVersions: number;
  latestStatus: ProjectRevisionRecord['status'] | null;
}> {
  const revisions = await db.projectRevisions
    .where('projectId').equals(projectId)
    .toArray();
  const sorted = revisions.sort((a, b) => b.version - a.version);
  const latest = sorted[0];
  return {
    latestVersion: latest?.version || 0,
    approved: sorted.some(r => r.status === 'approved'),
    pendingApproval: !!latest && (latest.status === 'sent' || latest.status === 'viewed'),
    revisionRequested: !!latest && latest.status === 'revision_requested',
    totalVersions: revisions.length,
    latestStatus: latest?.status || null,
  };
}

// ── Deposit integration ──

export function isRevisionApproved(revision: ProjectRevisionRecord): boolean {
  return revision.status === 'approved';
}

export function getRevisionDepositReadiness(summary: {
  approved: boolean;
  pendingApproval: boolean;
  revisionRequested: boolean;
  totalVersions: number;
}): {
  readyForDeposit: boolean;
  label: string;
} {
  if (summary.approved) {
    return { readyForDeposit: true, label: 'Design approved — good time to request deposit' };
  }
  if (summary.revisionRequested) {
    return { readyForDeposit: false, label: 'Awaiting revision' };
  }
  if (summary.pendingApproval) {
    return { readyForDeposit: false, label: 'Waiting client approval' };
  }
  if (summary.totalVersions === 0) {
    return { readyForDeposit: false, label: 'No design sent yet' };
  }
  return { readyForDeposit: false, label: 'Design in progress' };
}

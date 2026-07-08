import { db, type ProjectAssetRecord, type ProjectAssetType } from '../db';
import { logCommunication } from './aftercareLogic';
import { generateToken } from './leadConfirmation';

// ── Asset management ──

export async function addProjectAsset(params: {
  projectId: string;
  artistId: string;
  type: ProjectAssetType;
  imageUrl: string;
  note?: string;
  uploadedBy: 'artist' | 'client';
}): Promise<ProjectAssetRecord> {
  const id = 'passet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const now = Date.now();
  const record: ProjectAssetRecord = {
    id,
    projectId: params.projectId,
    artistId: params.artistId,
    type: params.type,
    imageUrl: params.imageUrl,
    note: params.note,
    uploadedBy: params.uploadedBy,
    revisionNumber: params.type === 'revision'
      ? await getNextRevisionNumber(params.projectId)
      : undefined,
    createdAt: now,
  };
  await db.projectAssets.add(record);

  await logCommunication(params.artistId, 'app_note', 'auto', {
    projectId: params.projectId,
    message: `Asset uploaded: ${params.type}${params.note ? ` — ${params.note}` : ''}`,
    templateType: `asset_${params.type}`,
  });

  return record;
}

export async function getProjectAssets(projectId: string): Promise<ProjectAssetRecord[]> {
  return db.projectAssets
    .where('projectId').equals(projectId)
    .reverse()
    .sortBy('createdAt');
}

export async function getProjectAssetsByType(
  projectId: string,
  type: ProjectAssetType,
): Promise<ProjectAssetRecord[]> {
  const all = await db.projectAssets.where('projectId').equals(projectId).toArray();
  return all.filter(a => a.type === type).reverse();
}

// ── Revision management ──

async function getNextRevisionNumber(projectId: string): Promise<number> {
  const all = await db.projectAssets.where('projectId').equals(projectId).toArray();
  const revisions = all.filter(r => r.type === 'revision');
  return revisions.length > 0
    ? Math.max(...revisions.map(r => r.revisionNumber || 0)) + 1
    : 1;
}

export async function createRevision(
  projectId: string,
  artistId: string,
  imageUrl: string,
  note?: string,
): Promise<ProjectAssetRecord> {
  const revNumber = await getNextRevisionNumber(projectId);
  // Un-approve any previous final design when a new revision is created
  const all = await db.projectAssets.where('projectId').equals(projectId).toArray();
  const currentFinal = all.filter(a => a.type === 'final_design' && a.approved === true);
  for (const f of currentFinal) {
    await db.projectAssets.update(f.id, { approved: false });
  }

  const id = 'passet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const now = Date.now();
  const record: ProjectAssetRecord = {
    id,
    projectId,
    artistId,
    type: 'revision',
    imageUrl,
    note: note ? `v${revNumber}: ${note}` : `v${revNumber}`,
    uploadedBy: 'artist',
    revisionNumber: revNumber,
    createdAt: now,
  };
  await db.projectAssets.add(record);

  await logCommunication(artistId, 'app_note', 'auto', {
    projectId,
    message: `Revision v${revNumber} created${note ? ` — ${note}` : ''}`,
    templateType: 'revision_created',
  });

  return record;
}

// ── Approval system ──

export async function markFinalDesignApproved(
  assetId: string,
  projectId: string,
  artistId: string,
): Promise<void> {
  // Un-approve all other final designs for this project
  const all = await db.projectAssets.where('projectId').equals(projectId).toArray();
  const allFinals = all.filter(a => a.type === 'final_design');
  for (const f of allFinals) {
    await db.projectAssets.update(f.id, { approved: false, approvedAt: undefined });
  }

  // Mark this asset as final_design and approved
  await db.projectAssets.update(assetId, {
    type: 'final_design',
    approved: true,
    approvedAt: Date.now(),
  });

  await logCommunication(artistId, 'app_note', 'auto', {
    projectId,
    message: `Design marked as final approved`,
    templateType: 'design_approved',
  });
}

export async function getLatestApprovedDesign(
  projectId: string,
): Promise<ProjectAssetRecord | undefined> {
  const all = await db.projectAssets.where('projectId').equals(projectId).toArray();
  const designs = all.filter(a => a.type === 'final_design' && a.approved === true);
  return designs.sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0))[0];
}

export async function getLatestRevision(
  projectId: string,
): Promise<ProjectAssetRecord | undefined> {
  const all = await db.projectAssets.where('projectId').equals(projectId).toArray();
  const revisions = all.filter(a => a.type === 'revision');
  return revisions.sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0))[0];
}

export function getProjectTimelineAssets(assets: ProjectAssetRecord[]): ProjectAssetRecord[] {
  return [...assets].sort((a, b) => a.createdAt - b.createdAt);
}

// ── Approval link tokens ──

export async function generateApprovalToken(
  projectId: string,
  assetId: string,
  artistId: string,
  expiresInDays: number = 7,
): Promise<string> {
  const token = generateToken();
  const now = Date.now();
  await db.projectApprovalTokens.add({
    token,
    projectId,
    assetId,
    artistId,
    expiresAt: now + expiresInDays * 86_400_000,
    createdAt: now,
  });

  await logCommunication(artistId, 'app_note', 'outbound', {
    projectId,
    message: `Approval link generated for client`,
    templateType: 'approval_link_sent',
  });

  return token;
}

export async function getApprovalByToken(
  token: string,
): Promise<{ approval: import('../db').ProjectApprovalTokenRecord; asset: ProjectAssetRecord | undefined } | null> {
  const approval = await db.projectApprovalTokens.get(token);
  if (!approval) return null;
  if (approval.expiresAt < Date.now()) return null;
  const asset = await db.projectAssets.get(approval.assetId);
  return { approval, asset: asset || undefined };
}

export async function approveDesign(
  token: string,
  feedback?: string,
): Promise<void> {
  const data = await getApprovalByToken(token);
  if (!data) throw new Error('Invalid or expired approval token');
  const { approval } = data;
  const now = Date.now();

  // Mark asset as final_design + approved
  await db.projectAssets.update(approval.assetId, {
    type: 'final_design',
    approved: true,
    approvedAt: now,
  });

  // Un-approve any other final designs for this project
  const all = await db.projectAssets.where('projectId').equals(approval.projectId).toArray();
  for (const f of all) {
    if (f.id !== approval.assetId && f.type === 'final_design') {
      await db.projectAssets.update(f.id, { approved: false, approvedAt: undefined });
    }
  }

  // Update approval token
  await db.projectApprovalTokens.update(token, {
    viewedAt: approval.viewedAt || now,
    approvedAt: now,
    feedback,
  });

  await logCommunication(approval.artistId, 'app_note', 'inbound', {
    projectId: approval.projectId,
    message: `Client approved the design${feedback ? ` — feedback: ${feedback}` : ''}`,
    templateType: 'client_design_approved',
  });
}

export async function requestRevisionFromClient(
  token: string,
  feedback: string,
): Promise<void> {
  const data = await getApprovalByToken(token);
  if (!data) throw new Error('Invalid or expired approval token');
  const { approval } = data;
  const now = Date.now();

  await db.projectApprovalTokens.update(token, {
    viewedAt: approval.viewedAt || now,
    revisionRequestedAt: now,
    feedback,
  });

  await logCommunication(approval.artistId, 'app_note', 'inbound', {
    projectId: approval.projectId,
    message: `Client requested revision: ${feedback}`,
    templateType: 'client_revision_requested',
  });
}

export async function markApprovalViewed(token: string): Promise<void> {
  const approval = await db.projectApprovalTokens.get(token);
  if (!approval) return;
  if (!approval.viewedAt) {
    await db.projectApprovalTokens.update(token, { viewedAt: Date.now() });
    await logCommunication(approval.artistId, 'app_note', 'auto', {
      projectId: approval.projectId,
      message: `Client viewed the approval link`,
      templateType: 'approval_viewed',
    });
  }
}

export function buildApprovalLink(token: string): string {
  return `${window.location.origin}/project-approve/${token}`;
}

// ── Summary helpers ──

export interface ProjectAssetSummary {
  total: number;
  referenceCount: number;
  artistDraftCount: number;
  revisionCount: number;
  latestRevisionNumber?: number;
  hasApprovedDesign: boolean;
  approvedDesignUrl?: string;
  stencilCount: number;
  healedPhotoCount: number;
  pendingApproval: boolean;       // approval link sent, not yet acted on
  revisionRequested: boolean;     // client asked for changes
}

export async function getProjectAssetSummary(
  projectId: string,
): Promise<ProjectAssetSummary> {
  const assets = await db.projectAssets.where('projectId').equals(projectId).toArray();
  const approved = assets.find(a => a.type === 'final_design' && a.approved === true);
  const latestRev = assets
    .filter(a => a.type === 'revision')
    .sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0))[0];

  // Check for active approval tokens
  const tokens = await db.projectApprovalTokens
    .where('projectId').equals(projectId)
    .toArray();
  const now = Date.now();
  const activeToken = tokens.find(t =>
    t.expiresAt > now && !t.approvedAt && !t.revisionRequestedAt,
  );
  const hasRevisionRequest = tokens.some(t => !!t.revisionRequestedAt && !t.approvedAt);

  return {
    total: assets.length,
    referenceCount: assets.filter(a => a.type === 'client_reference').length,
    artistDraftCount: assets.filter(a => a.type === 'artist_draft').length,
    revisionCount: assets.filter(a => a.type === 'revision').length,
    latestRevisionNumber: latestRev?.revisionNumber,
    hasApprovedDesign: !!approved,
    approvedDesignUrl: approved?.imageUrl,
    stencilCount: assets.filter(a => a.type === 'stencil').length,
    healedPhotoCount: assets.filter(a => a.type === 'healed_photo').length,
    pendingApproval: !!activeToken,
    revisionRequested: hasRevisionRequest,
  };
}

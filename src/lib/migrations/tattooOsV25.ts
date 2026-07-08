import type { Table } from 'dexie';
import { db } from '../../db';
import type {
  AppointmentRecord,
  ClientRecord,
  LeadRecord,
  ProjectRecord,
  SessionRecord,
  StoredAppointmentRecord,
} from '../../db';
import { markMigrationV25Done } from '../projectAccess';

type LegacyAppointment = StoredAppointmentRecord;

function decodeSeriesName(seriesId: string): string {
  const idx = seriesId.indexOf('_', 7);
  return idx > 0 ? decodeURIComponent(seriesId.slice(idx + 1)) : seriesId;
}

function mapLegacyProjectStatus(
  old?: string,
  paymentStatus?: LeadRecord['paymentStatus'],
): ProjectRecord['status'] {
  if (old === 'completed') return 'completed';
  if (old === 'on_hold') return 'on_hold';
  if (old === 'in_progress') return 'in_progress';
  if (paymentStatus === 'paid') return 'scheduled';
  return 'consultation';
}

function mapAppointmentStatus(old: string): AppointmentRecord['status'] {
  const allowed: AppointmentRecord['status'][] = [
    'unconfirmed', 'deposit_paid', 'ready', 'attention', 'blocked', 'done', 'cancelled', 'draft',
  ];
  if (allowed.includes(old as AppointmentRecord['status'])) return old as AppointmentRecord['status'];
  if (old === 'deposit_locked_draft') return 'draft';
  return 'unconfirmed';
}

async function ensureClientForLead(
  clients: Table<ClientRecord>,
  lead: LeadRecord,
  now: number,
): Promise<string> {
  if (lead.phone) {
    const byPhone = await clients.filter(c => c.phone === lead.phone).first();
    if (byPhone) return byPhone.id;
  }
  if (lead.email) {
    const byEmail = await clients
      .filter(c => c.email?.toLowerCase() === lead.email?.toLowerCase())
      .first();
    if (byEmail) return byEmail.id;
  }
  const clientId = `client_mig_${lead.id}`;
  const existing = await clients.get(clientId);
  if (existing) return clientId;
  await clients.put({
    id: clientId,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    allergies: lead.allergies,
    artistId: lead.artistId,
    leadSource: lead.source,
    createdAt: now,
  });
  return clientId;
}

export async function runTattooOsV25Migration(tx: {
  table: (name: string) => Table;
}): Promise<void> {
  const projects = tx.table('projects') as Table<ProjectRecord>;
  const appointments = tx.table('appointments') as Table<AppointmentRecord & {
    seriesId?: string;
    bodyPart?: string;
    designNotes?: string;
    depositAmount?: number;
  }>;
  const sessions = tx.table('sessions') as Table<SessionRecord & { projectId?: string }>;
  const leads = tx.table('leads') as Table<LeadRecord & { convertedProjectId?: string; convertedAt?: number }>;
  const clients = tx.table('clients') as Table<ClientRecord>;

  const leadById = new Map<string, LeadRecord>();
  await leads.toCollection().each(l => leadById.set(l.id, l));

  const projectById = new Map<string, ProjectRecord>();
  await projects.toCollection().each(p => projectById.set(p.id, p));

  // G: normalize legacy project rows
  await projects.toCollection().each(async (raw) => {
    const p = raw as ProjectRecord & { totalSessions?: number };
    const patch: Partial<ProjectRecord> = {};
    if (!p.title) patch.title = 'Tattoo project';
    if (p.completedSessions === undefined) patch.completedSessions = 0;
    if (!p.updatedAt) patch.updatedAt = p.createdAt || Date.now();
    if (p.totalSessions && !p.plannedSessions) patch.plannedSessions = p.totalSessions;
    if (!p.status) patch.status = 'consultation';
    if (Object.keys(patch).length > 0) {
      await projects.update(p.id, patch);
      projectById.set(p.id, { ...p, ...patch });
    }
  });

  const seriesToProjectId = new Map<string, string>();

  function hasValidProjectId(projectId: string | undefined): boolean {
    return !!projectId && projectById.has(projectId);
  }

  async function createProjectFromParts(parts: {
    id: string;
    artistId: string;
    clientId: string;
    title: string;
    sourceLeadId?: string;
    style?: string;
    bodyPart?: string;
    designNotes?: string;
    referenceImages?: string[];
    status?: ProjectRecord['status'];
    depositAmount?: number;
    paymentStatus?: LeadRecord['paymentStatus'];
    paymentMethod?: LeadRecord['paymentMethod'];
    referrerCode?: string;
    plannedSessions?: number;
    completedSessions?: number;
    createdAt?: number;
  }): Promise<string> {
    const now = Date.now();
    const existing = projectById.get(parts.id);
    const record: ProjectRecord = {
      id: parts.id,
      artistId: parts.artistId,
      clientId: parts.clientId,
      sourceLeadId: parts.sourceLeadId,
      title: parts.title,
      style: parts.style,
      bodyPart: parts.bodyPart,
      designNotes: parts.designNotes,
      referenceImages: parts.referenceImages,
      status: parts.status ?? 'consultation',
      plannedSessions: parts.plannedSessions,
      completedSessions: parts.completedSessions ?? existing?.completedSessions ?? 0,
      depositAmount: parts.depositAmount ?? existing?.depositAmount,
      paymentStatus: parts.paymentStatus ?? existing?.paymentStatus,
      paymentMethod: parts.paymentMethod ?? existing?.paymentMethod,
      referrerCode: parts.referrerCode ?? existing?.referrerCode,
      createdAt: parts.createdAt ?? existing?.createdAt ?? now,
      updatedAt: now,
      completedAt: existing?.completedAt,
    };
    await projects.put(record);
    projectById.set(record.id, record);
    return record.id;
  }

  // A: projectId pointed at lead ids
  await appointments.toCollection().each(async (raw) => {
    const a = raw as AppointmentRecord & {
      seriesId?: string;
      bodyPart?: string;
      designNotes?: string;
      depositAmount?: number;
    };
    const lead = a.projectId ? leadById.get(a.projectId) : undefined;
    if (!lead) return;

    let projectId = lead.convertedProjectId;
    if (!projectId) {
      const clientId = await ensureClientForLead(clients, lead, Date.now());
      projectId = `proj_lead_${lead.id}`;
      await createProjectFromParts({
        id: projectId,
        artistId: lead.artistId,
        clientId,
        sourceLeadId: lead.id,
        title: lead.bodyPart ? `${lead.bodyPart} tattoo` : `${lead.name} project`,
        style: lead.style,
        bodyPart: lead.bodyPart,
        designNotes: [lead.note, lead.changeRequest].filter(Boolean).join('\n') || undefined,
        referenceImages: lead.referenceImages,
        status: mapLegacyProjectStatus(undefined, lead.paymentStatus),
        depositAmount: a.depositAmount,
        paymentStatus: lead.paymentStatus,
        paymentMethod: lead.paymentMethod,
        referrerCode: lead.referrerCode,
        createdAt: lead.createdAt,
      });
      await leads.update(lead.id, {
        convertedProjectId: projectId,
        convertedAt: Date.now(),
      });
      lead.convertedProjectId = projectId;
    }

    const clientId = projectById.get(projectId)?.clientId || a.clientId;
    await appointments.update(a.id, {
      projectId,
      clientId: clientId || a.clientId,
      status: mapAppointmentStatus(String(a.status)),
      type: a.type === 'deposit_locked_draft' ? 'new_tattoo' : a.type,
    });
  });

  // B: seriesId groups
  await appointments.toCollection().each(async (raw) => {
    const a = raw as AppointmentRecord & { seriesId?: string; bodyPart?: string; designNotes?: string; depositAmount?: number };
    if (!a.seriesId || a.projectId) return;

    const seriesKey = `${a.artistId}|${a.clientId || ''}|${a.seriesId}`;
    let projectId = seriesToProjectId.get(seriesKey);
    if (!projectId) {
      projectId = `proj_series_${a.seriesId}`;
      const title = decodeSeriesName(a.seriesId);
      let clientId = a.clientId;
      if (!clientId) {
        clientId = `client_series_${a.seriesId}`;
        if (!(await clients.get(clientId))) {
          await clients.put({
            id: clientId,
            name: 'Unknown client',
            artistId: a.artistId,
            createdAt: Date.now(),
          });
        }
      }
      await createProjectFromParts({
        id: projectId,
        artistId: a.artistId,
        clientId,
        title,
        bodyPart: a.bodyPart,
        designNotes: a.designNotes,
        depositAmount: a.depositAmount,
        status: 'in_progress',
        createdAt: a.createdAt,
      });
      seriesToProjectId.set(seriesKey, projectId);
    }

    await appointments.update(a.id, {
      projectId,
      clientId: projectById.get(projectId)?.clientId || a.clientId,
    });
  });

  // C: orphan appointments (no projectId, or projectId not in projects table)
  await appointments.toCollection().each(async (raw) => {
    const a = raw as LegacyAppointment;
    if (a.projectId && hasValidProjectId(a.projectId)) return;
    if (a.projectId && leadById.has(a.projectId)) return;

    let clientId = a.clientId;
    if (!clientId) {
      clientId = `client_orphan_${a.id}`;
      if (!(await clients.get(clientId))) {
        await clients.put({
          id: clientId,
          name: 'Unknown client',
          artistId: a.artistId,
          createdAt: a.createdAt,
        });
      }
    }

    const projectId = `proj_mig_${a.id}`;
    const client = await clients.get(clientId);
    await createProjectFromParts({
      id: projectId,
      artistId: a.artistId,
      clientId,
      title: a.bodyPart ? `${a.bodyPart} tattoo` : `${client?.name || 'Client'} project`,
      bodyPart: a.bodyPart,
      designNotes: a.designNotes,
      depositAmount: a.depositAmount,
      status: a.status === 'done' ? 'completed' : 'scheduled',
      createdAt: a.createdAt,
    });

    await appointments.update(a.id, { projectId, clientId });
  });

  // D: sessions need projectId
  await sessions.toCollection().each(async (s) => {
    if (s.projectId && hasValidProjectId(s.projectId)) return;
    if (!s.appointmentId) return;
    const appt = await appointments.get(s.appointmentId);
    if (!appt?.projectId) return;
    await sessions.update(s.id, {
      projectId: appt.projectId,
      clientId: appt.clientId,
    });
  });

  // E: won leads without project
  await leads.toCollection().each(async (lead) => {
    if (lead.convertedProjectId) return;
    if (lead.status !== 'won') return;
    const clientId = await ensureClientForLead(clients, lead, Date.now());
    const projectId = `proj_lead_${lead.id}`;
    await createProjectFromParts({
      id: projectId,
      artistId: lead.artistId,
      clientId,
      sourceLeadId: lead.id,
      title: lead.bodyPart ? `${lead.bodyPart} tattoo` : `${lead.name} project`,
      style: lead.style,
      bodyPart: lead.bodyPart,
      designNotes: [lead.note, lead.changeRequest].filter(Boolean).join('\n') || undefined,
      referenceImages: lead.referenceImages,
      status: mapLegacyProjectStatus(undefined, lead.paymentStatus),
      paymentStatus: lead.paymentStatus,
      paymentMethod: lead.paymentMethod,
      referrerCode: lead.referrerCode,
      createdAt: lead.createdAt,
    });
    await leads.update(lead.id, { convertedProjectId: projectId, convertedAt: Date.now() });
  });
}

/** Runtime repair using live db (post-upgrade or if Dexie upgrade was skipped) */
export async function runTattooOsV25MigrationLive(): Promise<void> {
  await runTattooOsV25Migration({
    table: (name: string) => db.table(name) as Table,
  });
  markMigrationV25Done();
}

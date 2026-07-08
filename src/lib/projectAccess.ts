import { db } from '../db';
import type {
  AppointmentRecord,
  LeadRecord,
  ProjectRecord,
  SessionRecord,
  StoredAppointmentRecord,
  StoredSessionRecord,
} from '../db';

export const MIGRATION_V25_KEY = 'inkflow_migration_v25_done';
export const MIGRATION_V25_VERSION = 25;

export type ProjectView = {
  id: string;
  artistId: string;
  clientId: string;
  title: string;
  bodyPart?: string;
  designNotes?: string;
  style?: string;
  depositAmount?: number;
  depositStatus?: ProjectRecord['depositStatus'];
  status: ProjectRecord['status'];
  sourceLeadId?: string;
  resolvedFrom: 'project' | 'lead' | 'appointment_legacy' | 'synthetic';
};

export type AppointmentProjectView = {
  appointment: StoredAppointmentRecord;
  projectId: string | null;
  project: ProjectView | null;
  clientName?: string;
  projectTitle?: string;
  projectBodyPart?: string;
  projectDesignNotes?: string;
  projectDepositAmount?: number;
  legacySeriesLabel?: string;
};

function decodeSeriesName(seriesId: string): string {
  const idx = seriesId.indexOf('_', 7);
  return idx > 0 ? decodeURIComponent(seriesId.slice(idx + 1)) : seriesId;
}

function isLeadId(projectId: string | undefined, leadIds: Set<string>): boolean {
  return !!projectId && leadIds.has(projectId);
}

function legacyDepositAmount(appt: StoredAppointmentRecord): number | undefined {
  return appt.depositAmount;
}

function legacyBodyPart(appt: StoredAppointmentRecord): string | undefined {
  return appt.bodyPart;
}

function legacyDesignNotes(appt: StoredAppointmentRecord): string | undefined {
  return appt.designNotes;
}

export function mapLegacyAppointmentStatus(status: string | undefined): AppointmentRecord['status'] {
  const allowed: AppointmentRecord['status'][] = [
    'draft', 'unconfirmed', 'deposit_paid', 'ready', 'attention', 'blocked', 'done', 'cancelled',
  ];
  if (status && allowed.includes(status as AppointmentRecord['status'])) {
    return status as AppointmentRecord['status'];
  }
  if (status === 'deposit_locked_draft') return 'draft';
  return 'unconfirmed';
}

export async function loadLeadIdSet(): Promise<Set<string>> {
  const ids = new Set<string>();
  await db.leads.toCollection().each(l => ids.add(l.id));
  return ids;
}

export async function resolveProjectId(
  appointment: StoredAppointmentRecord,
  leadIds?: Set<string>,
): Promise<string | null> {
  const ids = leadIds ?? (await loadLeadIdSet());
  const pid = appointment.projectId;

  if (pid && !isLeadId(pid, ids)) {
    const project = await db.projects.get(pid);
    if (project) return pid;
  }

  if (pid && isLeadId(pid, ids)) {
    const lead = await db.leads.get(pid);
    if (lead?.convertedProjectId) {
      const converted = await db.projects.get(lead.convertedProjectId);
      if (converted) return lead.convertedProjectId;
    }
    return `proj_lead_${pid}`;
  }

  if (appointment.seriesId) {
    return `proj_series_${appointment.seriesId}`;
  }

  if (pid) return `proj_mig_${appointment.id}`;

  return null;
}

export function buildSyntheticProjectView(
  appointment: StoredAppointmentRecord,
  projectId: string,
  lead?: LeadRecord,
): ProjectView {
  if (lead) {
    return {
      id: projectId,
      artistId: lead.artistId,
      clientId: appointment.clientId || `client_mig_${lead.id}`,
      title: lead.bodyPart ? `${lead.bodyPart} tattoo` : `${lead.name} project`,
      bodyPart: lead.bodyPart ?? legacyBodyPart(appointment),
      designNotes:
        [lead.note, lead.changeRequest].filter(Boolean).join('\n') ||
        legacyDesignNotes(appointment),
      style: lead.style,
      depositAmount: legacyDepositAmount(appointment),
      depositStatus: lead.paymentStatus === 'paid' ? 'paid' : 'none',
      status: lead.paymentStatus === 'paid' ? 'scheduled' : 'consultation',
      sourceLeadId: lead.id,
      resolvedFrom: 'lead',
    };
  }

  return {
    id: projectId,
    artistId: appointment.artistId,
    clientId: appointment.clientId || `client_orphan_${appointment.id}`,
    title: legacyBodyPart(appointment)
      ? `${legacyBodyPart(appointment)} tattoo`
      : 'Tattoo project',
    bodyPart: legacyBodyPart(appointment),
    designNotes: legacyDesignNotes(appointment),
    depositAmount: legacyDepositAmount(appointment),
    depositStatus: legacyDepositAmount(appointment) ? 'paid' : 'none',
    status: appointment.status === 'done' ? 'completed' : 'scheduled',
    resolvedFrom: 'appointment_legacy',
  };
}

export async function resolveProjectView(
  appointment: StoredAppointmentRecord,
  projectId: string,
  leadIds?: Set<string>,
): Promise<ProjectView | null> {
  const ids = leadIds ?? (await loadLeadIdSet());

  const stored = await db.projects.get(projectId);
  if (stored) {
    return {
      id: stored.id,
      artistId: stored.artistId,
      clientId: stored.clientId,
      title: stored.title,
      bodyPart: stored.bodyPart ?? legacyBodyPart(appointment),
      designNotes: stored.designNotes ?? legacyDesignNotes(appointment),
      style: stored.style,
      depositAmount: stored.depositAmount ?? legacyDepositAmount(appointment),
      depositStatus: stored.depositStatus,
      status: stored.status,
      sourceLeadId: stored.sourceLeadId,
      resolvedFrom: 'project',
    };
  }

  const rawPid = appointment.projectId;
  if (rawPid && isLeadId(rawPid, ids)) {
    const lead = await db.leads.get(rawPid);
    if (lead) return buildSyntheticProjectView(appointment, projectId, lead);
  }

  if (appointment.seriesId && projectId === `proj_series_${appointment.seriesId}`) {
    return {
      id: projectId,
      artistId: appointment.artistId,
      clientId: appointment.clientId || `client_series_${appointment.seriesId}`,
      title: decodeSeriesName(appointment.seriesId),
      bodyPart: legacyBodyPart(appointment),
      designNotes: legacyDesignNotes(appointment),
      depositAmount: legacyDepositAmount(appointment),
      depositStatus: legacyDepositAmount(appointment) ? 'paid' : 'none',
      status: 'in_progress',
      resolvedFrom: 'synthetic',
    };
  }

  if (projectId.startsWith('proj_mig_')) {
    return buildSyntheticProjectView(appointment, projectId);
  }

  return null;
}

export async function resolveAppointmentProjectView(
  appointment: StoredAppointmentRecord,
): Promise<AppointmentProjectView> {
  const leadIds = await loadLeadIdSet();
  const projectId = await resolveProjectId(appointment, leadIds);
  const [client, project] = await Promise.all([
    appointment.clientId ? db.clients.get(appointment.clientId) : undefined,
    projectId ? resolveProjectView(appointment, projectId, leadIds) : Promise.resolve(null),
  ]);

  return {
    appointment,
    projectId,
    project,
    clientName: client?.name,
    projectTitle: project?.title,
    projectBodyPart: project?.bodyPart,
    projectDesignNotes: project?.designNotes,
    projectDepositAmount: project?.depositAmount,
    legacySeriesLabel: appointment.seriesId ? decodeSeriesName(appointment.seriesId) : undefined,
  };
}

export async function getAppointmentProjectView(
  appointmentId: string,
): Promise<AppointmentProjectView | null> {
  const appointment = await db.appointments.get(appointmentId);
  if (!appointment) return null;
  return resolveAppointmentProjectView(appointment);
}

export async function resolveSessionProjectId(session: StoredSessionRecord): Promise<string | null> {
  if (session.projectId) {
    const p = await db.projects.get(session.projectId);
    if (p) return session.projectId;
  }
  if (!session.appointmentId) return session.projectId ?? null;
  const appt = await db.appointments.get(session.appointmentId);
  if (!appt) return session.projectId ?? null;
  return resolveProjectId(appt);
}

export async function getSourceLeadForAppointmentView(
  view: AppointmentProjectView,
): Promise<LeadRecord | undefined> {
  if (view.project?.sourceLeadId) {
    return db.leads.get(view.project.sourceLeadId);
  }
  const pid = view.appointment.projectId;
  if (!pid) return undefined;
  const lead = await db.leads.get(pid);
  return lead ?? undefined;
}

export function isMigrationV25Done(): boolean {
  return localStorage.getItem(MIGRATION_V25_KEY) === '1';
}

export function markMigrationV25Done(): void {
  localStorage.setItem(MIGRATION_V25_KEY, '1');
  localStorage.setItem('inkflow_schema_version', String(MIGRATION_V25_VERSION));
}

export async function countUnmigratedAppointments(): Promise<number> {
  const leadIds = await loadLeadIdSet();
  const all = await db.appointments.toArray();
  let count = 0;
  for (const appt of all) {
    const pid = appt.projectId;
    if (!pid) {
      count++;
      continue;
    }
    if (isLeadId(pid, leadIds)) {
      count++;
      continue;
    }
    const project = await db.projects.get(pid);
    if (!project) count++;
  }
  return count;
}

export async function ensureDomainMigration(): Promise<{ ran: boolean; ok: boolean; remaining: number }> {
  if (isMigrationV25Done()) {
    const remaining = await countUnmigratedAppointments();
    if (remaining === 0) return { ran: false, ok: true, remaining: 0 };
  }

  try {
    const { runTattooOsV25MigrationLive } = await import('./migrations/tattooOsV25');
    await runTattooOsV25MigrationLive();
    markMigrationV25Done();
    const remaining = await countUnmigratedAppointments();
    return { ran: true, ok: remaining === 0, remaining };
  } catch (err) {
    console.error('[InkFlow] domain migration v25 failed', err);
    const remaining = await countUnmigratedAppointments();
    return { ran: true, ok: false, remaining };
  }
}

export async function enrichAppointment<T extends StoredAppointmentRecord>(
  appointment: T,
): Promise<
  T & {
    clientName?: string;
    projectTitle?: string;
    projectBodyPart?: string;
    projectDesignNotes?: string;
    projectDepositAmount?: number;
    projectIdResolved?: string | null;
  }
> {
  const view = await resolveAppointmentProjectView(appointment);
  return {
    ...appointment,
    clientName: view.clientName,
    projectTitle: view.projectTitle,
    projectBodyPart: view.projectBodyPart,
    projectDesignNotes: view.projectDesignNotes,
    projectDepositAmount: view.projectDepositAmount,
    projectIdResolved: view.projectId,
  };
}

export function assertAppointmentWritable(
  appointment: Pick<AppointmentRecord, 'projectId' | 'clientId' | 'id'>,
): void {
  if (!appointment.projectId) {
    throw new Error(`Appointment ${appointment.id} missing projectId`);
  }
  if (!appointment.clientId) {
    throw new Error(`Appointment ${appointment.id} missing clientId`);
  }
}

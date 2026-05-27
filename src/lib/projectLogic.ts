import { db } from '../db';
import type {
  AppointmentRecord,
  ClientRecord,
  LeadRecord,
  ProjectRecord,
  ProjectStatus,
  StoredAppointmentRecord,
} from '../db';
import {
  assertAppointmentWritable,
  enrichAppointment as enrichAppointmentDual,
  resolveProjectId,
} from './projectAccess';

export function newProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newAppointmentId(): string {
  return `appt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function projectTitleFromLead(lead: LeadRecord): string {
  if (lead.bodyPart) return `${lead.bodyPart} tattoo`;
  if (lead.style) return `${lead.style} piece`;
  return `${lead.name} project`;
}

export function projectTitleFromClient(client: ClientRecord, bodyPart?: string): string {
  if (bodyPart) return `${bodyPart} tattoo`;
  return `${client.name} project`;
}

export async function createProject(input: {
  artistId: string;
  clientId: string;
  title: string;
  sourceLeadId?: string;
  style?: string;
  bodyPart?: string;
  designNotes?: string;
  referenceImages?: string[];
  status?: ProjectStatus;
  plannedSessions?: number;
  depositAmount?: number;
  depositStatus?: ProjectRecord['depositStatus'];
  paymentStatus?: LeadRecord['paymentStatus'];
  paymentMethod?: LeadRecord['paymentMethod'];
  referrerCode?: string;
}): Promise<ProjectRecord> {
  const now = Date.now();
  const project: ProjectRecord = {
    id: newProjectId(),
    artistId: input.artistId,
    clientId: input.clientId,
    sourceLeadId: input.sourceLeadId,
    title: input.title,
    style: input.style,
    bodyPart: input.bodyPart,
    designNotes: input.designNotes,
    referenceImages: input.referenceImages,
    status: input.status ?? 'consultation',
    plannedSessions: input.plannedSessions,
    completedSessions: 0,
    depositAmount: input.depositAmount,
    depositStatus: input.depositStatus ?? 'none',
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    referrerCode: input.referrerCode,
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}

export async function ensureClientFromLead(lead: LeadRecord): Promise<string> {
  if (lead.phone) {
    const match = await db.clients
      .where('artistId')
      .equals(lead.artistId)
      .filter(c => c.phone === lead.phone)
      .first();
    if (match) return match.id;
  }
  if (lead.email) {
    const match = await db.clients
      .where('artistId')
      .equals(lead.artistId)
      .filter(c => c.email?.toLowerCase() === lead.email?.toLowerCase())
      .first();
    if (match) return match.id;
  }
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await db.clients.add({
    id: clientId,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    allergies: lead.allergies,
    notes: [lead.note, lead.changeRequest, lead.allergyNote].filter(Boolean).join('\n') || undefined,
    artistId: lead.artistId,
    leadSource: lead.source,
    createdAt: Date.now(),
  });
  return clientId;
}

export async function convertLeadToProject(leadId: string): Promise<ProjectRecord> {
  const lead = await db.leads.get(leadId);
  if (!lead) throw new Error('Lead not found');
  if (lead.convertedProjectId) {
    const existing = await db.projects.get(lead.convertedProjectId);
    if (existing) return existing;
  }

  const clientId = await ensureClientFromLead(lead);
  const project = await createProject({
    artistId: lead.artistId,
    clientId,
    sourceLeadId: lead.id,
    title: projectTitleFromLead(lead),
    style: lead.style,
    bodyPart: lead.bodyPart,
    designNotes: [lead.note, lead.changeRequest, lead.allergyNote].filter(Boolean).join('\n') || undefined,
    referenceImages: lead.referenceImages,
    status: lead.paymentStatus === 'paid' ? 'scheduled' : 'consultation',
    paymentStatus: lead.paymentStatus,
    paymentMethod: lead.paymentMethod,
    referrerCode: lead.referrerCode,
    depositStatus: lead.paymentStatus === 'paid' ? 'paid' : lead.paymentStatus === 'pending_verify' ? 'pending' : 'none',
  });

  await db.leads.update(lead.id, {
    status: 'won',
    convertedProjectId: project.id,
    convertedAt: Date.now(),
  });

  const legacyDrafts = await db.appointments
    .where('projectId')
    .equals(lead.id)
    .toArray();
  for (const appt of legacyDrafts) {
    await db.appointments.update(appt.id, {
      projectId: project.id,
      clientId,
      type: appt.type === 'deposit_locked_draft' ? 'new_tattoo' : appt.type,
      status: appt.status === 'draft' ? 'deposit_paid' : appt.status,
    });
  }

  return project;
}

export async function createAppointmentForProject(input: {
  projectId: string;
  artistId: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  type?: string;
  status?: AppointmentRecord['status'];
  station?: string;
  waiverCompleted?: boolean;
  walkIn?: boolean;
}): Promise<AppointmentRecord> {
  const project = await db.projects.get(input.projectId);
  if (!project) throw new Error('Project not found');

  assertAppointmentWritable({ id: 'new', projectId: input.projectId, clientId: input.clientId });

  const appointment: AppointmentRecord = {
    id: newAppointmentId(),
    projectId: input.projectId,
    artistId: input.artistId,
    clientId: input.clientId,
    date: input.date,
    time: input.time,
    duration: input.duration,
    type: input.type ?? 'new_tattoo',
    status: input.status ?? 'unconfirmed',
    waiverCompleted: input.waiverCompleted ?? false,
    station: input.station,
    walkIn: input.walkIn,
    createdAt: Date.now(),
  };

  await db.appointments.add(appointment);

  if (project.status === 'consultation' || project.status === 'approved') {
    await db.projects.update(project.id, { status: 'scheduled', updatedAt: Date.now() });
  }

  return appointment;
}

export async function ensureDraftAppointmentForLead(
  lead: LeadRecord,
  slots?: string[],
): Promise<AppointmentRecord | null> {
  let projectId = lead.convertedProjectId;
  if (!projectId) {
    const project = await convertLeadToProject(lead.id);
    projectId = project.id;
  } else {
    const linked = await db.appointments.where('projectId').equals(projectId).toArray();
    if (linked.some(a => a.status === 'draft' || a.status === 'deposit_paid')) {
      return linked[0];
    }
  }

  const first = slots?.[0];
  const date = first ? first.slice(0, 10) : (lead.preferredDate || new Date().toISOString().slice(0, 10));
  const time = first ? first.slice(11, 16) : (lead.preferredTime || '14:00');
  const project = await db.projects.get(projectId);
  if (!project) return null;

  return createAppointmentForProject({
    projectId,
    artistId: lead.artistId,
    clientId: project.clientId,
    date,
    time,
    duration: 120,
    type: 'new_tattoo',
    status: 'draft',
    waiverCompleted: false,
  });
}

export async function getProjectForAppointment(
  appointment: StoredAppointmentRecord,
): Promise<ProjectRecord | undefined> {
  const projectId = await resolveProjectId(appointment);
  if (!projectId) return undefined;
  return db.projects.get(projectId);
}

export async function getSourceLeadForProject(
  project: ProjectRecord,
): Promise<LeadRecord | undefined> {
  if (!project.sourceLeadId) return undefined;
  return db.leads.get(project.sourceLeadId);
}

export async function getSourceLeadForAppointment(
  appointment: AppointmentRecord,
): Promise<LeadRecord | undefined> {
  const project = await getProjectForAppointment(appointment);
  if (!project) return undefined;
  return getSourceLeadForProject(project);
}

export async function incrementProjectSessionCount(projectId: string): Promise<void> {
  const project = await db.projects.get(projectId);
  if (!project) return;
  const completedSessions = (project.completedSessions || 0) + 1;
  const updates: Partial<ProjectRecord> = {
    completedSessions,
    updatedAt: Date.now(),
    status: project.status === 'scheduled' || project.status === 'approved' ? 'in_progress' : project.status,
  };
  await db.projects.update(projectId, updates);
}

export type EnrichedAppointment = AppointmentRecord & {
  clientName?: string;
  projectTitle?: string;
  projectBodyPart?: string;
  projectDesignNotes?: string;
  projectDepositAmount?: number;
  projectIdResolved?: string | null;
};

export async function enrichAppointment<T extends StoredAppointmentRecord>(
  appointment: T,
): Promise<T & EnrichedAppointment> {
  return enrichAppointmentDual(appointment);
}

export async function createProjectWithAppointment(input: {
  artistId: string;
  clientId: string;
  title: string;
  sourceLeadId?: string;
  style?: string;
  bodyPart?: string;
  designNotes?: string;
  referenceImages?: string[];
  projectStatus?: ProjectStatus;
  date: string;
  time: string;
  duration: number;
  appointmentType?: string;
  appointmentStatus?: AppointmentRecord['status'];
  waiverCompleted?: boolean;
  walkIn?: boolean;
  depositAmount?: number;
  paymentStatus?: LeadRecord['paymentStatus'];
  paymentMethod?: LeadRecord['paymentMethod'];
  referrerCode?: string;
}): Promise<{ project: ProjectRecord; appointment: AppointmentRecord }> {
  const project = await createProject({
    artistId: input.artistId,
    clientId: input.clientId,
    title: input.title,
    sourceLeadId: input.sourceLeadId,
    style: input.style,
    bodyPart: input.bodyPart,
    designNotes: input.designNotes,
    referenceImages: input.referenceImages,
    status: input.projectStatus ?? 'scheduled',
    depositAmount: input.depositAmount,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    referrerCode: input.referrerCode,
    depositStatus: input.paymentStatus === 'paid' ? 'paid' : 'none',
  });

  const appointment = await createAppointmentForProject({
    projectId: project.id,
    artistId: input.artistId,
    clientId: input.clientId,
    date: input.date,
    time: input.time,
    duration: input.duration,
    type: input.appointmentType,
    status: input.appointmentStatus,
    waiverCompleted: input.waiverCompleted,
    walkIn: input.walkIn,
  });

  return { project, appointment };
}

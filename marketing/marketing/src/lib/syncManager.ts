import { db } from '../db';
import { getBackendUrl, syncArtistData, getCalendarSubscriptionUrl } from './backendApi';
import type { UserRecord, ClientRecord, AppointmentRecord } from '../db';

const LAST_SYNC_KEY = 'inkflow_last_sync_at';
const PENDING_KEY = 'inkflow_pending_sync';

export function getLastSyncTime(): number {
  return Number(localStorage.getItem(LAST_SYNC_KEY) || '0');
}

export function getCalendarUrl(artistId: string): string {
  return getCalendarSubscriptionUrl(artistId);
}

export function getSyncStatus(): { lastSync: number; pending: boolean; backendConfigured: boolean } {
  return {
    lastSync: getLastSyncTime(),
    pending: localStorage.getItem(PENDING_KEY) === '1',
    backendConfigured: !!getBackendUrl(),
  };
}

function markPending() {
  localStorage.setItem(PENDING_KEY, '1');
}

function clearPending() {
  localStorage.removeItem(PENDING_KEY);
}

export function markDataChanged() {
  markPending();
}

function filterAppointmentsForSync(appointments: AppointmentRecord[], artistId: string) {
  return appointments.map(a => ({
    id: a.id,
    projectId: a.projectId,
    artistId,
    clientId: a.clientId,
    clientName: '',
    date: a.date,
    time: a.time,
    duration: a.duration,
    status: a.status,
    type: a.type,
  }));
}

export async function syncAll(user: UserRecord): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = getBackendUrl();
  if (!baseUrl) return { ok: false, error: 'Backend not configured' };

  const artistId = user.artistId || user.id;

  try {
    // Gather data
    const [clients, projects, appointments, portfolio, leads, sessions, posTx, invoices, commLog] = await Promise.all([
      db.clients.where('artistId').equals(artistId).toArray(),
      db.projects.where('artistId').equals(artistId).toArray(),
      db.appointments.where('artistId').equals(artistId).toArray(),
      db.portfolio.where('artistId').equals(artistId).toArray(),
      db.leads.where('artistId').equals(artistId).toArray(),
      db.sessions.where('artistId').equals(artistId).toArray(),
      db.posTransactions.where('artistId').equals(artistId).toArray(),
      db.invoices.where('artistId').equals(artistId).toArray(),
      db.communicationLog.where('artistId').equals(artistId).toArray(),
    ]);

    const settings: Record<string, any> = {
      name: user.name,
      email: user.email,
      studioName: user.studioName,
      artistId,
      createdAt: user.createdAt,
      bioProfile: user.bioProfile,
      bioEvents: user.bioEvents,
      instagramHandle: user.instagramHandle,
      whatsappPhone: user.whatsappPhone,
      workingHoursStart: user.workingHoursStart,
      workingHoursEnd: user.workingHoursEnd,
      daysOff: user.daysOff,
      appointmentRemindersEnabled: user.appointmentRemindersEnabled,
      smsEnabled: user.smsEnabled,
      emailEnabled: user.emailEnabled,
      paymentLinkTemplate: user.paymentLinkTemplate,
      paymentCurrency: user.paymentCurrency,
      depositAmount: user.paymentDefaultDeposit,
      artistEmail: user.emailAddress || user.email,
      reviewLinks: user.reviewLinks,
      stations: user.stations,
      assignedLocationIds: user.assignedLocationIds,
      depositPolicy: user.depositPolicy,
    };

    await syncArtistData({
      artistId,
      appointments: filterAppointmentsForSync(appointments, artistId),
      projects: projects.map(p => ({
        id: p.id,
        clientId: p.clientId,
        title: p.title,
        status: p.status,
        bodyPart: p.bodyPart,
        style: p.style,
        plannedSessions: p.plannedSessions,
        completedSessions: p.completedSessions,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      clients: clients.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        tags: c.tags,
        lastVisitAt: c.lastVisitAt,
        totalSpend: c.totalSpend,
        leadSource: c.leadSource,
        createdAt: c.createdAt,
      })),
      settings,
      portfolio: portfolio.map(p => ({
        id: p.id,
        thumbnailUrl: p.thumbnailUrl || p.imageUrl,
        tags: p.tags,
        createdAt: p.createdAt,
      })),
      leads: leads.map(l => ({
        id: l.id, name: l.name, phone: l.phone, email: l.email,
        source: l.source, status: l.status, paymentStatus: l.paymentStatus,
        bodyPart: l.bodyPart, style: l.style, consultMode: l.consultMode,
        createdAt: l.createdAt,
      })),
      sessions: sessions.map(s => ({
        id: s.id, projectId: s.projectId, appointmentId: s.appointmentId, status: s.status,
        startedAt: s.startedAt, finishedAt: s.finishedAt,
        actualDuration: s.actualDuration, photos: s.photos,
        createdAt: s.startedAt,
      })),
      posTransactions: posTx.map(t => ({
        id: t.id, clientId: t.clientId, total: t.total,
        paymentMethod: t.paymentMethod, paymentStatus: t.paymentStatus,
        locationId: t.locationId, createdAt: t.createdAt,
      })),
      invoices: invoices.map(i => ({
        id: i.id, invoiceNumber: i.invoiceNumber, clientId: i.clientId,
        total: i.total, paymentStatus: i.paymentStatus,
        locationId: i.locationId, createdAt: i.createdAt,
      })),
      communicationLog: commLog.map(l => ({
        id: l.id, clientId: l.clientId, appointmentId: l.appointmentId,
        channel: l.channel, direction: l.direction, message: l.message,
        createdAt: l.createdAt,
      })),
    });

    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    clearPending();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

import { db, type AppointmentRecord, type ClientRecord, type UserRecord } from '../db';

export type ReminderStage = '24h' | '3h' | 'deposit_24h' | 'deposit_48h';

export interface AppointmentReminder {
  appointment: AppointmentRecord & { clientName?: string };
  stage: ReminderStage;
  hoursUntil?: number;
}

export function reminderKey(appointmentId: string, stage: ReminderStage): string {
  return `inkflow_appt_reminder_${appointmentId}_${stage}`;
}

export async function checkAppointmentReminders(artistId: string): Promise<AppointmentReminder[]> {
  const now = Date.now();
  const nowStr = new Date().toISOString();
  const all = await db.appointments
    .where('artistId').equals(artistId)
    .filter(a => a.status !== 'cancelled' && a.status !== 'done')
    .toArray();

  const out: AppointmentReminder[] = [];
  for (const appt of all) {
    const apptTime = new Date(appt.date + 'T' + appt.time + ':00').getTime();
    const hoursUntil = (apptTime - now) / (60 * 60 * 1000);

    if (hoursUntil < 0) continue; // already past

    const client = await db.clients.get(appt.clientId);
    const enriched = { ...appt, clientName: client?.name || 'Unknown' };

    if (hoursUntil <= 3 && !localStorage.getItem(reminderKey(appt.id, '3h'))) {
      out.push({ appointment: enriched, stage: '3h', hoursUntil });
    } else if (hoursUntil <= 24 && !localStorage.getItem(reminderKey(appt.id, '24h'))) {
      out.push({ appointment: enriched, stage: '24h', hoursUntil });
    }
  }

  out.sort((a, b) => (a.hoursUntil || 0) - (b.hoursUntil || 0));
  return out.slice(0, 5);
}

export function markReminderSent(appointmentId: string, stage: ReminderStage): void {
  localStorage.setItem(reminderKey(appointmentId, stage), String(Date.now()));
}

let notificationPermission: NotificationPermission | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (notificationPermission === 'granted') return true;
  const result = await Notification.requestPermission();
  notificationPermission = result;
  return result === 'granted';
}

export function sendBrowserNotification(title: string, body: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png', tag: 'inkflow-reminder' });
  } catch {
    // notification failed silently
  }
}

export function getReminderMessage(
  appointment: AppointmentRecord & { clientName?: string },
  stage: ReminderStage,
): string {
  if (stage === 'deposit_24h' || stage === 'deposit_48h') {
    return getDepositReminderMessage(appointment, stage);
  }
  const dateStr = new Date(appointment.date + 'T00:00:00').toLocaleDateString('en', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  if (stage === '3h') {
    return `Hi ${appointment.clientName || 'there'}, your appointment is in about 3 hours at ${appointment.time} today (${dateStr}). Please arrive 10 minutes early.`;
  }
  return `Reminder: your appointment is tomorrow (${dateStr}) at ${appointment.time}. Please arrive 10 minutes early. Reply if you need to reschedule.`;
}

export function getWhatsAppReminderUrl(
  appointment: AppointmentRecord & { clientName?: string },
  stage: ReminderStage,
  artistWhatsappPhone?: string,
): string | null {
  const phone = artistWhatsappPhone?.replace(/[^\d+]/g, '') || '';
  if (!phone) return null;
  const msg = encodeURIComponent(getReminderMessage(appointment, stage));
  return `https://wa.me/${phone.replace(/^\+/, '')}?text=${msg}`;
}

export async function checkDepositReminders(artistId: string): Promise<AppointmentReminder[]> {
  const now = Date.now();
  const all = await db.appointments
    .where('artistId').equals(artistId)
    .filter(a => a.status === 'unconfirmed' && !a.depositAmount)
    .toArray();

  const out: AppointmentReminder[] = [];
  for (const appt of all) {
    const ageHours = (now - appt.createdAt) / (60 * 60 * 1000);
    const client = await db.clients.get(appt.clientId);
    const enriched = { ...appt, clientName: client?.name || 'Unknown' };

    if (ageHours >= 48 && !localStorage.getItem(reminderKey(appt.id, 'deposit_48h'))) {
      out.push({ appointment: enriched, stage: 'deposit_48h' });
    } else if (ageHours >= 24 && !localStorage.getItem(reminderKey(appt.id, 'deposit_24h'))) {
      out.push({ appointment: enriched, stage: 'deposit_24h' });
    }
  }
  out.sort((a, b) => (b.appointment.createdAt || 0) - (a.appointment.createdAt || 0));
  return out.slice(0, 5);
}

export function getDepositReminderMessage(
  appointment: AppointmentRecord & { clientName?: string },
  stage: ReminderStage,
): string {
  const dateStr = new Date(appointment.date + 'T00:00:00').toLocaleDateString('en', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  if (stage === 'deposit_24h') {
    return `Hi ${appointment.clientName || 'there'}, just a reminder — your appointment on ${dateStr} at ${appointment.time} requires a deposit to confirm. Let me know if you still want this slot!`;
  }
  return `Hi ${appointment.clientName || 'there'}, your appointment on ${dateStr} at ${appointment.time} is still unconfirmed due to unpaid deposit. Please pay the deposit or I may need to release the slot.`;
}

export async function getArtistSocial(artistId: string): Promise<{
  whatsappPhone?: string;
  instagramHandle?: string;
}> {
  const u = await db.users.get(artistId);
  return {
    whatsappPhone: u?.whatsappPhone,
    instagramHandle: u?.instagramHandle,
  };
}

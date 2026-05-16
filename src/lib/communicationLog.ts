// Re-exports from aftercareLogic for convenience
// CommunicationLogRecord is in db.ts
// Client timeline query is in aftercareLogic.ts

export { logCommunication, getClientTimeline, getAftercareWhatsAppUrl, getAftercareMessage, getAftercareSteps } from './aftercareLogic';

import { db, type CommunicationLogRecord } from '../db';

export async function getAppointmentCommunications(appointmentId: string): Promise<CommunicationLogRecord[]> {
  return db.communicationLog
    .where('appointmentId').equals(appointmentId)
    .reverse()
    .sortBy('createdAt');
}

export async function logReminderSent(
  artistId: string,
  clientId: string,
  appointmentId: string,
  channel: 'whatsapp' | 'email' | 'sms',
  message?: string,
): Promise<void> {
  const id = 'comm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  await db.communicationLog.add({
    id,
    artistId,
    clientId,
    appointmentId,
    channel,
    direction: 'auto',
    templateType: 'reminder_sent',
    message,
    createdAt: Date.now(),
  });
}

export function getChannelIcon(channel: CommunicationLogRecord['channel']): string {
  switch (channel) {
    case 'whatsapp': return 'WA';
    case 'instagram': return 'IG';
    case 'phone': return '📞';
    case 'email': return '📧';
    case 'sms': return '💬';
    case 'app_note': return '📝';
    case 'reminder_sent': return '🔔';
  }
}

export function getDirectionBadge(direction: CommunicationLogRecord['direction']): { label: string; color: string } {
  switch (direction) {
    case 'outbound': return { label: 'Sent', color: '#3b82f6' };
    case 'inbound': return { label: 'Received', color: '#22c55e' };
    case 'auto': return { label: 'Auto', color: '#a855f7' };
  }
}

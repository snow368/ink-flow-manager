import { db } from '../db';
import type { AppointmentRecord, SessionRecord, TimelineEvent, ConsumableUsage } from '../db';

export function createSession(appointment: AppointmentRecord): SessionRecord {
  const now = Date.now();
  return {
    id: 'session_' + now + '_' + Math.random().toString(36).slice(2, 6),
    appointmentId: appointment.id,
    artistId: appointment.artistId,
    status: 'active',
    startedAt: now,
    actualDuration: 0,
    timeline: [{ timestamp: now, type: 'start', payload: appointment.type || 'new_tattoo' }],
    photos: [],
    notes: [],
    consumables: [],
  };
}

export function addTimelineEvent(
  session: SessionRecord,
  type: TimelineEvent['type'],
  payload?: string
): SessionRecord {
  return {
    ...session,
    timeline: [...session.timeline, { timestamp: Date.now(), type, payload }],
  };
}

export function addConsumable(
  session: SessionRecord,
  itemId: string,
  quantity: number
): SessionRecord {
  const updated: ConsumableUsage[] = [...session.consumables];
  const existing = updated.find(c => c.itemId === itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    updated.push({ itemId, quantity });
  }
  return { ...session, consumables: updated };
}

export function addPhoto(session: SessionRecord, photoData: string): SessionRecord {
  return {
    ...session,
    photos: [...session.photos, photoData],
    timeline: [...session.timeline, { timestamp: Date.now(), type: 'photo' }],
  };
}

export function addNote(session: SessionRecord, note: string, isAllergy = false): SessionRecord {
  return {
    ...session,
    notes: [...session.notes, note],
    timeline: [...session.timeline, { timestamp: Date.now(), type: isAllergy ? 'allergy' : 'note', payload: note }],
  };
}

export async function finishSession(session: SessionRecord): Promise<SessionRecord> {
  const now = Date.now();
  const actualDuration = Math.round((now - session.startedAt - (session.timeline.filter(t => t.type === 'pause').length * 0)) / 60000);

  const finished: SessionRecord = {
    ...session,
    status: 'completed',
    finishedAt: now,
    actualDuration,
    timeline: [...session.timeline, { timestamp: now, type: 'done', payload: `Total: ${actualDuration}min` }],
  };

  await db.sessions.add(finished);
  await db.appointments.update(session.appointmentId, { status: 'done' });

  // 扣减库存
  for (const c of session.consumables) {
    const item = await db.inventory.get(c.itemId);
    if (item) {
      const newQty = Math.max(0, item.quantity - c.quantity);
      await db.inventory.update(c.itemId, { quantity: newQty });
    }
  }

  return finished;
}

export function getElapsedMinutes(session: SessionRecord): number {
  return Math.round((Date.now() - session.startedAt) / 60000);
}

export function generateSummary(session: SessionRecord): string {
  const mins = session.actualDuration || getElapsedMinutes(session);
  const consumableSummary = session.consumables
    .map(c => `${c.itemId} x${c.quantity}`)
    .join(', ') || 'none';
  const photoCount = session.photos.length;
  const noteCount = session.notes.length;

  return [
    `Session: ${mins} minutes`,
    `Consumables: ${consumableSummary}`,
    `Photos: ${photoCount}`,
    `Notes: ${noteCount}`,
  ].join('\n');
}

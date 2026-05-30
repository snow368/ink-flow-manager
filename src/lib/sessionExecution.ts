import { db } from '../db';
import { logCommunication } from './aftercareLogic';
import type { SessionRecord } from '../db';

// ── Helpers ──

function makeId(): string {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function todayRange(): [number, number] {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const end = start + 86_400_000;
  return [start, end];
}

// ── Timer helpers ──

export function getSessionDuration(session: SessionRecord): number {
  const acc = session.accumulatedDurationMs || 0;
  if (session.sessionState === 'tattooing' && session.timerStartedAt) {
    return acc + (Date.now() - session.timerStartedAt);
  }
  return acc;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Session CRUD ──

export async function startSession(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  const now = Date.now();
  await db.sessions.update(sessionId, {
    status: 'active',
    sessionState: 'tattooing',
    timerStartedAt: now,
    startedAt: session.startedAt || now,
    timeline: [
      ...(session.timeline || []),
      { timestamp: now, type: 'start', payload: 'Session started' },
    ],
  });
  await logCommunication(session.artistId, 'app_note', 'auto', {
    message: 'Session started — tattooing',
    templateType: 'session_started',
  });
}

export async function pauseSession(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session || session.sessionState !== 'tattooing') return;
  const now = Date.now();
  const elapsed = session.timerStartedAt ? now - session.timerStartedAt : 0;
  const newAcc = (session.accumulatedDurationMs || 0) + elapsed;
  await db.sessions.update(sessionId, {
    status: 'paused',
    sessionState: 'break',
    timerPausedAt: now,
    timerStartedAt: undefined,
    accumulatedDurationMs: newAcc,
    breakCount: (session.breakCount || 0) + 1,
    pausedAt: now,
    timeline: [
      ...(session.timeline || []),
      { timestamp: now, type: 'pause', payload: 'Break started' },
    ],
  });
  await logCommunication(session.artistId, 'app_note', 'auto', {
    message: 'Session paused — break',
    templateType: 'session_paused',
  });
}

export async function resumeSession(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session || session.sessionState !== 'break') return;
  const now = Date.now();
  await db.sessions.update(sessionId, {
    status: 'active',
    sessionState: 'tattooing',
    timerStartedAt: now,
    timerPausedAt: undefined,
    timeline: [
      ...(session.timeline || []),
      { timestamp: now, type: 'resume', payload: 'Resumed from break' },
    ],
  });
  await logCommunication(session.artistId, 'app_note', 'auto', {
    message: 'Session resumed',
    templateType: 'session_resumed',
  });
}

export async function markStencilReady(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  const now = Date.now();
  await db.sessions.update(sessionId, {
    sessionState: 'stencil_ready',
    stencilReadyAt: now,
    timeline: [
      ...(session.timeline || []),
      { timestamp: now, type: 'start', payload: 'Stencil ready' },
    ],
  });
  await logCommunication(session.artistId, 'app_note', 'auto', {
    message: 'Stencil ready',
    templateType: 'stencil_ready',
  });
}

export async function completeSession(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  const now = Date.now();
  // Finalize accumulated duration
  let finalAcc = session.accumulatedDurationMs || 0;
  if (session.timerStartedAt) {
    finalAcc += now - session.timerStartedAt;
  }
  await db.sessions.update(sessionId, {
    status: 'completed',
    sessionState: 'completed',
    finishedAt: now,
    completedAt: now,
    timerStartedAt: undefined,
    timerPausedAt: undefined,
    accumulatedDurationMs: finalAcc,
    actualDuration: finalAcc,
    timeline: [
      ...(session.timeline || []),
      { timestamp: now, type: 'done', payload: 'Session completed' },
    ],
  });

  // Update related appointment if exists
  if (session.appointmentId) {
    await db.appointments.update(session.appointmentId, { status: 'done' });
  }

  await logCommunication(session.artistId, 'app_note', 'auto', {
    message: `Session completed — duration: ${formatDuration(finalAcc)}`,
    templateType: 'session_completed',
  });

  // Auto-trigger aftercare schedule
  const { triggerAftercare } = await import('./aftercareEngine');
  await triggerAftercare(session.id);
}

export async function addProgressPhoto(
  sessionId: string,
  url: string,
  label?: string,
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  const now = Date.now();
  const photo = { id: makeId(), url, label, createdAt: now };
  await db.sessions.update(sessionId, {
    progressPhotos: [...(session.progressPhotos || []), photo],
    photos: [...(session.photos || []), url],
    timeline: [
      ...(session.timeline || []),
      { timestamp: now, type: 'photo', payload: label || 'Progress photo' },
    ],
  });
  await logCommunication(session.artistId, 'app_note', 'auto', {
    message: `Progress photo added${label ? `: ${label}` : ''}`,
    templateType: 'progress_photo_added',
  });
}

export async function addSessionNote(
  sessionId: string,
  note: string,
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  const now = Date.now();
  const entry = { id: makeId(), note, createdAt: now };
  await db.sessions.update(sessionId, {
    sessionNotes: [...(session.sessionNotes || []), entry],
    notes: [...(session.notes || []), note],
    timeline: [
      ...(session.timeline || []),
      { timestamp: now, type: 'note', payload: note },
    ],
  });
  await logCommunication(session.artistId, 'app_note', 'auto', {
    message: `Session note: ${note}`,
    templateType: 'session_note_added',
  });
}

// ── Queries ──

export async function getActiveSessionsForToday(artistId: string): Promise<SessionRecord[]> {
  const [dayStart, dayEnd] = todayRange();
  const all = await db.sessions
    .where('artistId').equals(artistId)
    .and(s => s.startedAt >= dayStart && s.startedAt < dayEnd)
    .toArray();
  return all.filter(s => s.sessionState && s.sessionState !== 'completed');
}

export async function getTodaysCompletedSessions(artistId: string): Promise<SessionRecord[]> {
  const [dayStart, dayEnd] = todayRange();
  return db.sessions
    .where('artistId').equals(artistId)
    .and(s => s.startedAt >= dayStart && s.startedAt < dayEnd && s.sessionState === 'completed')
    .toArray();
}

// ── Aftercare trigger ──

export async function markAftercareReady(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;
  await db.sessions.update(sessionId, { aftercareSentAt: Date.now() });
  await logCommunication(session.artistId, 'app_note', 'auto', {
    message: 'Aftercare ready to send',
    templateType: 'aftercare_ready',
  });
}

// ── Preset notes ──

export const PRESET_NOTES = [
  'Client arrived on time',
  'Client arrived late',
  'Pain break',
  'Extra detail work',
  'Shading completed',
  'Outline completed',
  'Client requested changes mid-session',
  'Touch-up needed',
  'Numbing used',
  'Session ran long',
] as const;

export const PHOTO_LABELS = [
  'Outline',
  'Shading',
  'Color',
  'Final',
  'Stencil placement',
  'Progress',
  'Healed',
] as const;

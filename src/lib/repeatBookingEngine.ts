import { db } from '../db';
import { logCommunication } from './aftercareLogic';
import { calculateEngagementScore, buildClientTimeline } from './clientTimeline';
import type { SessionRecord } from '../db';

// ── Unified Engine Output Schema ──

export interface EngineOutput {
  clientId: string;
  score: number;
  level: 'low' | 'medium' | 'high';
  confidence: number;
  timing: 'now' | '7d' | '30d' | '60-180d';
  nextAction: string;
  reason: string;
  warning: string | null;
}

function normalizeRepeatBooking(
  clientId: string,
  raw: RepeatBookingSignal,
): EngineOutput {
  const scoreMap: Record<string, number> = { high: 75, medium: 45, low: 20 };
  const timingMap: Record<string, 'now' | '7d' | '30d' | '60-180d'> = {
    now: 'now', '1_week': '7d', '1_month': '30d',
  };
  const level = raw.likelihood;
  const score = scoreMap[level];
  return {
    clientId,
    score,
    level,
    confidence: level === 'high' ? 80 : level === 'medium' ? 65 : 50,
    timing: timingMap[raw.timing] || '30d',
    nextAction: level === 'high'
      ? 'Send re-engagement message and offer booking'
      : level === 'medium'
        ? 'Schedule gentle check-in in 1 week'
        : 'Add to long-term nurture — no immediate action',
    reason: raw.reasons.join('; ') || 'Insufficient signals',
    warning: level === 'low'
      ? 'Low repeat booking signals — consider gathering more engagement data'
      : null,
  };
}

export async function getRepeatBookingAssessment(clientId: string): Promise<EngineOutput> {
  const raw = await getRepeatBookingSignals(clientId);
  return normalizeRepeatBooking(clientId, raw);
}


// ── Types ──

export interface RepeatBookingSignal {
  likelihood: 'low' | 'medium' | 'high';
  suggestedMessage: string;
  timing: 'now' | '1_week' | '1_month';
  reasons: string[];
}

// ── Signal Detection ──

export async function getRepeatBookingSignals(
  clientId: string,
): Promise<RepeatBookingSignal> {
  const reasons: string[] = [];
  let signalScore = 0;

  // 1. Completed projects with healed tattoos
  const projects = await db.projects.where('clientId').equals(clientId).toArray();
  const completedProjects = projects.filter(p => p.status === 'completed');
  if (completedProjects.length > 0) {
    signalScore += 2;
    reasons.push(`${completedProjects.length} completed project(s)`);
  }

  // 2. Healed status on sessions
  const projectIds = projects.map(p => p.id);
  let healedSessions = 0;
  for (const pid of projectIds) {
    const sessions = await db.sessions.where('projectId').equals(pid).toArray();
    const healed = sessions.filter(
      (s: SessionRecord) => s.healingStatus === 'fully_healed' || s.healingStatus === 'stable',
    );
    healedSessions += healed.length;
  }
  if (healedSessions > 0) {
    signalScore += 2;
    reasons.push(`${healedSessions} healed session(s)`);
  }

  // 3. High engagement score
  const timeline = await buildClientTimeline(clientId);
  const engagement = calculateEngagementScore(timeline);
  if (engagement.score >= 60) {
    signalScore += 2;
    reasons.push(`High engagement score (${engagement.score})`);
  }

  // 4. Positive sentiment in communicationLog
  const commLogs = await db.communicationLog
    .where('clientId')
    .equals(clientId)
    .toArray();
  const positiveKeywords = ['love', 'amazing', 'perfect', 'beautiful', 'great', 'happy', 'thanks', 'thank you', 'excited', 'wonderful'];
  const negativeKeywords = ['bad', 'wrong', 'hate', 'disappointed', 'upset', 'unhappy', 'issue', 'problem'];

  let positiveCount = 0;
  let negativeCount = 0;
  for (const log of commLogs) {
    if (!log.message) continue;
    const msg = log.message.toLowerCase();
    if (positiveKeywords.some(kw => msg.includes(kw))) positiveCount++;
    if (negativeKeywords.some(kw => msg.includes(kw))) negativeCount++;
  }

  if (positiveCount > negativeCount && positiveCount >= 2) {
    signalScore += 1.5;
    reasons.push('Positive client sentiment detected');
  }
  if (negativeCount > positiveCount) {
    signalScore -= 1;
  }

  // 5. Long gap since last booking
  const appointments = await db.appointments
    .where('clientId')
    .equals(clientId)
    .toArray();

  if (appointments.length > 0) {
    const sortedApts = appointments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const lastAptDate = new Date(sortedApts[0].date).getTime();
    const daysSince = (Date.now() - lastAptDate) / 86400000;

    if (daysSince >= 60 && daysSince <= 180) {
      signalScore += 2;
      reasons.push(`No booking in ${Math.round(daysSince)} days — ideal re-engagement window`);
    } else if (daysSince > 180) {
      signalScore += 1;
      reasons.push(`Long gap (${Math.round(daysSince)} days) since last appointment`);
    } else if (daysSince < 30) {
      signalScore -= 0.5; // too soon
    }
  }

  // 6. Client has a review (loyalty signal)
  const reviews = await db.reviews.where('clientId').equals(clientId).toArray();
  if (reviews.length > 0) {
    signalScore += 1;
    reasons.push(`${reviews.length} review(s) submitted`);
  }

  // Determine likelihood and timing
  let likelihood: 'low' | 'medium' | 'high';
  let timing: 'now' | '1_week' | '1_month';
  let suggestedMessage: string;

  if (signalScore >= 6) {
    likelihood = 'high';
    timing = 'now';
    suggestedMessage =
      'Hey! It\'s been a while — would you be interested in planning your next piece? I have some openings coming up.';
  } else if (signalScore >= 3) {
    likelihood = 'medium';
    timing = '1_week';
    suggestedMessage =
      'Hope the tattoo is healing well! When you\'re ready for the next one, let me know — I\'d love to work with you again.';
  } else {
    likelihood = 'low';
    timing = '1_month';
    suggestedMessage =
      'Thanks for being a client! When you\'re ready for your next tattoo, feel free to reach out.';
  }

  // Log
  const firstProject = completedProjects[0] || projects[0];
  if (firstProject) {
    await logCommunication(firstProject.artistId, 'app_note', 'auto', {
      clientId,
      message: `Repeat booking signal: ${likelihood} — ${reasons.join('; ')}`,
      templateType: 'repeat_booking_suggested',
    });
  }

  return { likelihood, suggestedMessage, timing, reasons };
}

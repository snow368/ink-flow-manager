import { db } from '../db';
import { logCommunication } from './aftercareLogic';

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

function normalizeReferral(
  clientId: string,
  raw: ReferralOpportunity,
): EngineOutput {
  const isReady = raw.ready;
  const timingMap: Record<string, 'now' | '7d' | '30d' | '60-180d'> = {
    now: 'now', '1_week': '7d', '1_month': '30d',
  };
  const level = isReady && raw.timing === 'now' ? 'high'
    : isReady ? 'medium'
    : 'low';
  const scoreMap: Record<string, number> = { high: 80, medium: 50, low: 20 };
  const score = scoreMap[level];
  return {
    clientId,
    score,
    level,
    confidence: level === 'high' ? 85 : level === 'medium' ? 65 : 45,
    timing: timingMap[raw.timing] || '30d',
    nextAction: level === 'high'
      ? 'Send referral prompt with discount link'
      : level === 'medium'
        ? 'Queue referral ask for next engagement touchpoint'
        : 'Wait — not enough satisfaction signals yet',
    reason: raw.reason,
    warning: level === 'low'
      ? 'Low referral readiness — consider gathering satisfaction signals first'
      : null,
  };
}

export async function getReferralAssessment(clientId: string): Promise<EngineOutput> {
  const raw = await getReferralOpportunity(clientId);
  return normalizeReferral(clientId, raw);
}

// ── Types ──

export interface ReferralOpportunity {
  ready: boolean;
  reason: string;
  promptMessage: string;
  timing: 'now' | '1_week' | '1_month';
}

// ── Signals ──

const SATISFACTION_KEYWORDS = [
  'love', 'amazing', 'perfect', 'beautiful', 'incredible',
  'best', 'wonderful', 'fantastic', 'stunning', 'masterpiece',
  'obsessed', 'exceeded', 'beyond', 'blown away', 'recommend',
];

const REFERRAL_KEYWORDS = [
  'friend', 'sister', 'brother', 'mom', 'dad', 'cousin',
  'colleague', 'coworker', 'recommend', 'bring',
];

// ── Detection ──

export async function getReferralOpportunity(
  clientId: string,
): Promise<ReferralOpportunity> {
  let readinessScore = 0;
  const reasons: string[] = [];

  // 1. Completed projects
  const projects = await db.projects.where('clientId').equals(clientId).toArray();
  const completedProjects = projects.filter(p => p.status === 'completed');
  if (completedProjects.length > 0) {
    readinessScore += 2;
    reasons.push(`${completedProjects.length} completed project(s)`);
  }

  // 2. Check sessions for fully_healed status
  const projectIds = projects.map(p => p.id);
  let hasHealedTattoo = false;
  for (const pid of projectIds) {
    const sessions = await db.sessions.where('projectId').equals(pid).toArray();
    if (sessions.some(s => s.healingStatus === 'fully_healed' || s.healingStatus === 'stable')) {
      hasHealedTattoo = true;
      break;
    }
  }
  if (hasHealedTattoo) {
    readinessScore += 2;
    reasons.push('Has healed/stable tattoo(s)');
  }

  // 3. Positive sentiment in communicationLog
  const commLogs = await db.communicationLog
    .where('clientId')
    .equals(clientId)
    .toArray();

  let satisfactionCount = 0;
  let referralMentionCount = 0;

  for (const log of commLogs) {
    if (!log.message) continue;
    const msg = log.message.toLowerCase();
    if (SATISFACTION_KEYWORDS.some(kw => msg.includes(kw))) {
      satisfactionCount++;
    }
    if (REFERRAL_KEYWORDS.some(kw => msg.includes(kw))) {
      referralMentionCount++;
    }
  }

  if (satisfactionCount >= 2) {
    readinessScore += 1.5;
    reasons.push('High satisfaction signals in communication');
  }
  if (referralMentionCount > 0) {
    readinessScore += 1;
    reasons.push('Client mentioned friends/family');
  }

  // 4. Has given a review (loyalty signal)
  const reviews = await db.reviews.where('clientId').equals(clientId).toArray();
  if (reviews.length > 0) {
    const highRating = reviews.some(r => r.rating >= 4);
    if (highRating) {
      readinessScore += 1.5;
      reasons.push('High-rated review given');
    }
  }

  // 5. Long gap since last booking (ready for re-engagement)
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

    if (daysSince >= 30 && daysSince <= 180) {
      readinessScore += 1;
      reasons.push('Optimal re-engagement window');
    }
  }

  // Determine readiness
  let ready: boolean;
  let timing: 'now' | '1_week' | '1_month';
  let promptMessage: string;

  if (readinessScore >= 6) {
    ready = true;
    timing = 'now';
    promptMessage =
      'Hey! If you know anyone looking for a tattoo, I\'d really appreciate referrals. ' +
      'I offer a discount for both you and your friends — just send them my way!';
  } else if (readinessScore >= 3) {
    ready = true;
    timing = '1_week';
    promptMessage =
      'Glad you had a great experience! If any friends are considering tattoos, ' +
      'I\'d love to work with them too. Happy to offer a referral discount!';
  } else {
    ready = false;
    timing = '1_month';
    promptMessage =
      'Thanks for your trust! Whenever you\'re ready to refer someone, ' +
      'I offer a referral reward program — just ask!';
  }

  const reason = reasons.length > 0
    ? reasons.join('; ')
    : 'Not enough signals yet';

  // Log
  const firstProject = completedProjects[0] || projects[0];
  if (firstProject) {
    await logCommunication(firstProject.artistId, 'app_note', 'auto', {
      clientId,
      message: `Referral opportunity: ${ready ? 'ready' : 'not ready'} — ${reason}`,
      templateType: 'referral_suggested',
    });
  }

  return { ready, reason, promptMessage, timing };
}

import { db } from '../db';
import { logCommunication } from './aftercareLogic';
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

function normalizeTouchUpRisk(
  clientId: string,
  raw: TouchUpRisk,
): EngineOutput {
  const scoreMap: Record<string, number> = { high: 70, medium: 40, low: 15 };
  const timingMap: Record<string, 'now' | '7d' | '30d' | '60-180d'> = {
    high: 'now', medium: '7d', low: '30d',
  };
  const score = scoreMap[raw.risk];
  return {
    clientId,
    score,
    level: raw.risk,
    confidence: raw.risk === 'high' ? 85 : raw.risk === 'medium' ? 70 : 60,
    timing: timingMap[raw.risk],
    nextAction: raw.suggestedAction,
    reason: raw.reason,
    warning: raw.risk === 'high'
      ? 'High touch-up risk — consider early outreach'
      : raw.risk === 'medium'
        ? 'Monitor healing — request photos at D30'
        : null,
  };
}

// ── Public wrapper (unified schema) ──

export async function getTouchUpAssessment(
  projectId: string,
  clientId?: string,
): Promise<EngineOutput> {
  const project = await db.projects.get(projectId);
  const raw = await detectTouchUpNeed(projectId);
  return normalizeTouchUpRisk(clientId || project?.clientId || projectId, raw);
}

// ── Types ──

export interface TouchUpRisk {
  risk: 'low' | 'medium' | 'high';
  reason: string;
  suggestedAction: string;
}

// ── Risk rules ──

const HIGH_RISK_STYLES = ['realism', 'full_color', 'watercolor', 'portrait', 'biomechanical'];
const MEDIUM_RISK_STYLES = ['blackwork', 'dotwork', 'geometric', 'tribal', 'cover_up', 'trash_polka', 'illustrative', 'woodcut', 'sketch', 'newschool'];
const LARGE_PLACEMENTS = ['full_sleeve', 'half_sleeve', 'full_back', 'full_chest', 'full_leg', 'ribs', 'knee'];

const COMPLAINT_KEYWORDS = [
  'faded', 'fading', 'blur', 'blurry', 'muddy', 'patchy',
  'lost detail', 'not holding', 'disappointed', 'uneven',
  'blowout', 'scaring', 'scarring', 'raised', 'infection',
  'allergic', 'rash', 'not healing',
];

// ── Detector ──

export async function detectTouchUpNeed(
  projectId: string,
): Promise<TouchUpRisk> {
  const project = await db.projects.get(projectId);
  if (!project) {
    return { risk: 'low', reason: 'Project not found', suggestedAction: '—' };
  }

  let riskScore = 0;
  const reasons: string[] = [];

  // 1. Style-based risk
  const style = (project.style || '').toLowerCase();
  if (HIGH_RISK_STYLES.some(s => style.includes(s))) {
    riskScore += 3;
    reasons.push('High-risk style (realism/color/portrait)');
  } else if (MEDIUM_RISK_STYLES.some(s => style.includes(s))) {
    riskScore += 1.5;
    reasons.push('Medium-risk style (blackwork/geometric/illustrative)');
  }

  // 2. Placement-based risk
  const placement = (project.bodyPart || '').toLowerCase();
  if (LARGE_PLACEMENTS.some(p => placement.includes(p))) {
    riskScore += 1.5;
    reasons.push('Large placement area');
  }

  // 3. Healing photos missing
  const sessions = await db.sessions
    .where('projectId')
    .equals(projectId)
    .toArray();
  const completedSessions = sessions.filter(
    (s: SessionRecord) => s.sessionState === 'completed' || s.status === 'completed',
  );
  const hasHealingPhotos = completedSessions.some(
    (s: SessionRecord) => s.healingPhotos && s.healingPhotos.length > 0,
  );

  if (completedSessions.length > 0 && !hasHealingPhotos) {
    riskScore += 1;
    reasons.push('No healing photos submitted');
  }

  // 4. Healing status from sessions
  const hasNeedsTouchup = completedSessions.some(
    (s: SessionRecord) => s.healingStatus === 'needs_touchup',
  );
  if (hasNeedsTouchup) {
    riskScore += 3;
    reasons.push('Session marked as needing touch-up');
  }

  const hasHealingIssues = completedSessions.some(
    (s: SessionRecord) => s.healingStatus === 'healing' && !s.aftercareSentAt,
  );
  if (hasHealingIssues) {
    riskScore += 1;
    reasons.push('Session still in healing without aftercare follow-up');
  }

  // 5. Client complaints in communicationLog
  const clientId = project.clientId;
  if (clientId) {
    const commLogs = await db.communicationLog
      .where('clientId')
      .equals(clientId)
      .toArray();
    const complaints = commLogs.filter(log => {
      if (!log.message) return false;
      const msg = log.message.toLowerCase();
      return COMPLAINT_KEYWORDS.some(kw => msg.includes(kw));
    });
    if (complaints.length > 0) {
      riskScore += 2;
      reasons.push(`Client complaints detected (${complaints.length} mentions)`);
    }
  }

  // 6. Multiple sessions for same project
  if (completedSessions.length >= 2) {
    riskScore -= 0.5; // already addressed in follow-up sessions
  }

  // Determine risk level
  let risk: 'low' | 'medium' | 'high';
  let suggestedAction: string;

  if (riskScore >= 4) {
    risk = 'high';
    suggestedAction = 'Proactively offer a touch-up session. Contact client to schedule a free or discounted touch-up appointment.';
  } else if (riskScore >= 2) {
    risk = 'medium';
    suggestedAction = 'Monitor healing progress. Ask client for healing photos at day 30 check-in and assess.';
  } else {
    risk = 'low';
    suggestedAction = 'Standard aftercare follow-up only. No proactive touch-up needed.';
  }

  const reason = reasons.length > 0 ? reasons.join('; ') : 'No risk factors detected';

  // Log detection
  const artistId = project.artistId;
  await logCommunication(artistId, 'app_note', 'auto', {
    clientId,
    projectId,
    message: `Touch-up risk assessment: ${risk} — ${reason}`,
    templateType: 'touchup_detected',
  });

  return { risk, reason, suggestedAction };
}

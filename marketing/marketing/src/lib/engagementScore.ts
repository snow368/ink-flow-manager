import { db } from '../db';
import { logCommunication } from './aftercareLogic';

// ── Types ──

export interface ProjectEngagementScore {
  score: number;
  level: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  breakdown: {
    communication: number;
    revisionActivity: number;
    depositSpeed: number;
    sessionCompletion: number;
    aftercareInteraction: number;
  };
}

// ── Score Calculation ──

export async function calculateProjectEngagementScore(
  projectId: string,
): Promise<ProjectEngagementScore> {
  let totalScore = 0;
  const breakdown = {
    communication: 0,
    revisionActivity: 0,
    depositSpeed: 0,
    sessionCompletion: 0,
    aftercareInteraction: 0,
  };

  const project = await db.projects.get(projectId);
  if (!project) {
    return { score: 0, level: 'low', riskLevel: 'high', breakdown };
  }

  const clientId = project.clientId;

  // ── 1. Communication frequency (0-25) ──
  if (clientId) {
    const commLogs = await db.communicationLog
      .where('clientId').equals(clientId)
      .filter(l => l.projectId === projectId || !l.projectId)
      .toArray();

    const messageCount = commLogs.filter(l => l.channel !== 'app_note').length;
    if (messageCount >= 10) breakdown.communication = 25;
    else if (messageCount >= 6) breakdown.communication = 20;
    else if (messageCount >= 3) breakdown.communication = 15;
    else if (messageCount >= 1) breakdown.communication = 10;
    else breakdown.communication = 0;

    // Response speed: look for inbound (client) messages within 48h of outbound (artist)
    const sorted = commLogs.sort((a, b) => a.createdAt - b.createdAt);
    let fastResponses = 0;
    let responseOpportunities = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].direction === 'outbound' && sorted[i + 1].direction === 'inbound') {
        responseOpportunities++;
        const gap = sorted[i + 1].createdAt - sorted[i].createdAt;
        if (gap < 48 * 3600_000) fastResponses++;
      }
    }
    if (responseOpportunities > 0) {
      const ratio = fastResponses / responseOpportunities;
      breakdown.communication += Math.round(ratio * 5); // +0-5 bonus
    }
  }

  // ── 2. Revision activity (0-15) ──
  const revisions = await db.projectRevisions
    .where('projectId').equals(projectId)
    .toArray();

  if (revisions.length === 0) {
    breakdown.revisionActivity = 5; // neutral — no revisions yet
  } else if (revisions.length <= 2) {
    breakdown.revisionActivity = 15; // healthy revision cycle
  } else if (revisions.length <= 4) {
    breakdown.revisionActivity = 10; // some friction
  } else {
    breakdown.revisionActivity = 5; // revision overload
  }

  // ── 3. Deposit speed (0-20) ──
  const lead = project.sourceLeadId
    ? await db.leads.get(project.sourceLeadId)
    : null;

  if (lead) {
    const deposits = await db.depositFlow
      .where('leadId').equals(lead.id)
      .toArray();

    const paidDeposit = deposits.find(d => d.depositStatus === 'paid');
    if (paidDeposit && paidDeposit.requestedAt && paidDeposit.paidAt) {
      const daysToPay = (paidDeposit.paidAt - paidDeposit.requestedAt) / 86400000;
      if (daysToPay <= 1) breakdown.depositSpeed = 20;
      else if (daysToPay <= 3) breakdown.depositSpeed = 15;
      else if (daysToPay <= 7) breakdown.depositSpeed = 10;
      else breakdown.depositSpeed = 5;
    } else if (deposits.some(d => d.depositStatus === 'requested' || d.depositStatus === 'viewed')) {
      breakdown.depositSpeed = 8; // pending payment
    } else {
      breakdown.depositSpeed = 0; // no deposit requested
    }
  } else {
    breakdown.depositSpeed = 0;
  }

  // ── 4. Session completion (0-25) ──
  const sessions = await db.sessions
    .where('projectId').equals(projectId)
    .toArray();

  if (sessions.length === 0) {
    breakdown.sessionCompletion = 0;
  } else {
    const completed = sessions.filter(s => s.sessionState === 'completed').length;
    const ratio = completed / sessions.length;
    if (ratio >= 0.8) breakdown.sessionCompletion = 25;
    else if (ratio >= 0.5) breakdown.sessionCompletion = 18;
    else if (ratio >= 0.25) breakdown.sessionCompletion = 10;
    else breakdown.sessionCompletion = 5;
  }

  // ── 5. Aftercare interaction (0-15) ──
  const hasAftercareSent = sessions.some(s => s.aftercareSentAt);
  const hasHealingPhotos = sessions.some(s => s.healingPhotos && s.healingPhotos.length > 0);
  const hasHealedStatus = sessions.some(
    s => s.healingStatus === 'fully_healed' || s.healingStatus === 'stable',
  );

  if (hasHealedStatus && hasHealingPhotos) breakdown.aftercareInteraction = 15;
  else if (hasHealedStatus) breakdown.aftercareInteraction = 12;
  else if (hasAftercareSent && hasHealingPhotos) breakdown.aftercareInteraction = 10;
  else if (hasAftercareSent) breakdown.aftercareInteraction = 7;
  else breakdown.aftercareInteraction = 0;

  // ── Total score ──
  totalScore = Math.min(100,
    breakdown.communication +
    breakdown.revisionActivity +
    breakdown.depositSpeed +
    breakdown.sessionCompletion +
    breakdown.aftercareInteraction,
  );

  let level: 'low' | 'medium' | 'high';
  let riskLevel: 'low' | 'medium' | 'high';

  if (totalScore >= 70) { level = 'high'; riskLevel = 'low'; }
  else if (totalScore >= 40) { level = 'medium'; riskLevel = 'medium'; }
  else { level = 'low'; riskLevel = 'high'; }

  // Log
  await logCommunication(project.artistId, 'app_note', 'auto', {
    clientId: project.clientId,
    projectId,
    message: `Engagement score: ${totalScore}/100 — ${level}`,
    templateType: 'engagement_score_updated',
  });

  return {
    score: totalScore,
    level,
    riskLevel,
    breakdown,
  };
}

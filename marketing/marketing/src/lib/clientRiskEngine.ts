import { db } from '../db';
import { logCommunication } from './aftercareLogic';

// ── Types ──

export interface ClientRiskProfile {
  risk: 'low' | 'medium' | 'high';
  reasons: string[];
  suggestedAction: string;
}

// ── Risk Detection ──

export async function getClientRiskProfile(
  projectId: string,
): Promise<ClientRiskProfile> {
  const reasons: string[] = [];
  let riskScore = 0;

  const project = await db.projects.get(projectId);
  if (!project) {
    return { risk: 'low', reasons: ['Project not found'], suggestedAction: '—' };
  }

  const clientId = project.clientId;

  // ── 1. Ghost risk: no response > 72h ──
  if (clientId) {
    const commLogs = await db.communicationLog
      .where('clientId').equals(clientId)
      .filter(l => l.projectId === projectId || !l.projectId)
      .toArray();

    const lastInbound = commLogs
      .filter(l => l.direction === 'inbound')
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    if (lastInbound) {
      const hoursSince = (Date.now() - lastInbound.createdAt) / 3600_000;
      if (hoursSince > 72) {
        riskScore += 3;
        reasons.push(`No response from client in ${Math.round(hoursSince)}h (ghost risk)`);
      } else if (hoursSince > 48) {
        riskScore += 1.5;
        reasons.push(`No response in ${Math.round(hoursSince)}h — approaching ghost window`);
      }
    } else {
      // No inbound messages at all — check if project is old
      const daysSinceCreation = (Date.now() - project.createdAt) / 86400000;
      if (daysSinceCreation > 7) {
        riskScore += 2;
        reasons.push('Client never responded after project creation');
      }
    }
  }

  // ── 2. Friction risk: revision loop > 2 ──
  const revisions = await db.projectRevisions
    .where('projectId').equals(projectId)
    .toArray();

  const revisionRequestedCount = revisions.filter(r => r.status === 'revision_requested').length;
  if (revisionRequestedCount >= 3) {
    riskScore += 3;
    reasons.push(`${revisionRequestedCount} revision cycles — friction risk`);
  } else if (revisionRequestedCount >= 2) {
    riskScore += 1.5;
    reasons.push(`${revisionRequestedCount} revision cycles — approaching friction threshold`);
  }

  // ── 3. Conversion risk: deposit delay ──
  const lead = project.sourceLeadId
    ? await db.leads.get(project.sourceLeadId)
    : null;

  if (lead) {
    const deposits = await db.depositFlow
      .where('leadId').equals(lead.id)
      .toArray();

    const requestedDeposit = deposits.find(d =>
      d.depositStatus === 'requested' || d.depositStatus === 'viewed' || d.depositStatus === 'expired',
    );
    const paidDeposit = deposits.find(d => d.depositStatus === 'paid');

    if (paidDeposit) {
      // Deposit paid — no conversion risk
    } else if (requestedDeposit) {
      if (requestedDeposit.requestedAt) {
        const daysSince = (Date.now() - requestedDeposit.requestedAt) / 86400000;
        if (daysSince > 7) {
          riskScore += 3;
          reasons.push(`Deposit requested ${Math.round(daysSince)} days ago — not paid (conversion risk)`);
        } else if (daysSince > 3) {
          riskScore += 1.5;
          reasons.push(`Deposit pending for ${Math.round(daysSince)} days — follow up`);
        }
      }
    } else {
      // No deposit requested — check if project needs one
      if (project.status === 'approved' || project.status === 'scheduled') {
        riskScore += 1;
        reasons.push('Design approved but no deposit requested');
      }
    }

    const expiredDeposit = deposits.find(d => d.depositStatus === 'expired');
    if (expiredDeposit) {
      riskScore += 2;
      reasons.push('Previous deposit expired');
    }
  }

  // ── 4. Churn risk: low engagement ──
  const sessions = await db.sessions
    .where('projectId').equals(projectId)
    .toArray();
  const hasCompletedSession = sessions.some(s => s.sessionState === 'completed');
  const hasRecentActivity = sessions.some(s => {
    const lastTime = s.completedAt || s.startedAt;
    return lastTime && (Date.now() - lastTime) < 90 * 86400000;
  });

  if (hasCompletedSession && !hasRecentActivity) {
    riskScore += 1.5;
    reasons.push('Last session was 90+ days ago — churn risk');
  }

  // ── 5. Project status-based risk ──
  if (project.status === 'cancelled') {
    riskScore += 3;
    reasons.push('Project was cancelled');
  }
  if (project.status === 'on_hold') {
    riskScore += 1.5;
    reasons.push('Project is on hold');
  }

  // ── Determine overall risk ──
  let risk: 'low' | 'medium' | 'high';
  let suggestedAction: string;

  if (riskScore >= 5) {
    risk = 'high';
    suggestedAction = 'Immediate attention required. Reach out to client personally. Consider adjusting approach or offering incentive.';
  } else if (riskScore >= 2.5) {
    risk = 'medium';
    suggestedAction = 'Monitor closely. Send a follow-up message and check in on progress within 48h.';
  } else {
    risk = 'low';
    suggestedAction = 'No action needed. Continue standard workflow.';
  }

  // Log
  await logCommunication(project.artistId, 'app_note', 'auto', {
    clientId: project.clientId,
    projectId,
    message: `Risk profile: ${risk} — ${reasons.join('; ') || 'No risk factors'}`,
    templateType: 'client_risk_calculated',
  });

  return { risk, reasons, suggestedAction };
}

import { db } from '../db';
import { logCommunication } from './aftercareLogic';
import type { LeadRecord, LeadConfirmationRecord, CommunicationLogRecord } from '../db';

export interface LeadHealthResult {
  score: number;
  level: 'hot' | 'warm' | 'cold';
  positiveSignals: string[];
  negativeSignals: string[];
  reasoning: string[];
}

export function calculateLeadHealthScore(
  lead: LeadRecord,
  options?: {
    confirmation?: LeadConfirmationRecord | null;
    communicationLogs?: CommunicationLogRecord[];
    projectApprovalState?: {
      pendingApproval?: boolean;
      revisionRequested?: boolean;
      approved?: boolean;
    };
  },
): LeadHealthResult {
  let score = 50; // baseline
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];
  const reasoning: string[] = [];

  const now = Date.now();
  const confirmation = options?.confirmation;
  const logs = options?.communicationLogs || [];
  const approvalState = options?.projectApprovalState;

  const hasPlacement = !!lead.bodyPart && lead.bodyPart.trim().length >= 3;
  const hasStyle = !!lead.style && lead.style.trim().length >= 2;
  const hasBudget = !!lead.budget && lead.budget.trim().length >= 1;
  const hasRefs = !!(lead.referenceImages && lead.referenceImages.length > 0);
  const hasSize = !!lead.size && lead.size.trim().length >= 2;
  const isPaid = lead.paymentStatus === 'paid' || lead.paymentStatus === 'pending_verify';
  const budgetNum = Number(String(lead.budget || '').replace(/[^0-9.]/g, ''));
  const realisticBudget = budgetNum > 0 && budgetNum >= 100;

  // ── Positive signals ──

  if (hasRefs) {
    score += 10;
    positiveSignals.push('Has reference images');
    reasoning.push('+10 references uploaded');
  }

  if (hasPlacement) {
    score += 10;
    positiveSignals.push('Placement confirmed');
    reasoning.push('+10 placement confirmed');
  }

  if (hasStyle) {
    score += 10;
    positiveSignals.push('Style confirmed');
    reasoning.push('+10 style confirmed');
  }

  if (hasBudget) {
    score += 10;
    positiveSignals.push('Budget discussed');
    reasoning.push('+10 budget present');
  }

  if (hasBudget && realisticBudget && hasSize) {
    score += 10;
    positiveSignals.push('Budget realistic for scope');
    reasoning.push('+10 budget realistic');
  }

  if (confirmation) {
    if (confirmation.viewedAt) {
      score += 15;
      positiveSignals.push('Confirmation link viewed');
      reasoning.push('+15 confirmation viewed');
    }
    if (confirmation.status === 'submitted' || confirmation.status === 'completed') {
      score += 20;
      positiveSignals.push('Confirmation submitted');
      reasoning.push('+20 confirmation submitted');
    }
  }

  // Check artist response time (last outbound log vs lead creation)
  const lastOutbound = [...logs].reverse().find(l => l.direction === 'outbound');
  if (lastOutbound && lead.createdAt) {
    const responseTime = lastOutbound.createdAt - lead.createdAt;
    if (responseTime < 24 * 3_600_000) {
      score += 15;
      positiveSignals.push('Artist replied within 24h');
      reasoning.push('+15 artist replied within 24h');
    }
  }

  // Client responsiveness: count inbound messages
  const inboundCount = logs.filter(l => l.direction === 'inbound').length;
  if (inboundCount >= 3) {
    score += 10;
    positiveSignals.push('Client highly responsive');
    reasoning.push('+10 client highly responsive');
  } else if (inboundCount >= 1) {
    score += 5;
    positiveSignals.push('Client responsive');
    reasoning.push('+5 client responsive');
  }

  if (approvalState?.approved) {
    score += 15;
    positiveSignals.push('Design approved');
    reasoning.push('+15 design approved');
  }

  if (isPaid) {
    score += 15;
    positiveSignals.push('Deposit paid');
    reasoning.push('+15 deposit paid');
  }

  // ── Negative signals ──

  // No reply from client for 72h+
  const lastInbound = [...logs].reverse().find(l => l.direction === 'inbound');
  if (lastInbound) {
    const sinceLastReply = now - lastInbound.createdAt;
    if (sinceLastReply >= 72 * 3_600_000) {
      score -= 20;
      negativeSignals.push('No client reply for 72h+');
      reasoning.push('-20 no reply 72h+');
    } else if (sinceLastReply >= 48 * 3_600_000) {
      score -= 10;
      negativeSignals.push('No client reply for 48h+');
      reasoning.push('-10 no reply 48h+');
    }
  } else if (lead.createdAt) {
    // No inbound at all — check lead age
    const age = now - lead.createdAt;
    if (age >= 72 * 3_600_000) {
      score -= 20;
      negativeSignals.push('No contact from client');
      reasoning.push('-20 no client contact');
    }
  }

  // Design approved but no deposit after 72h
  if (approvalState?.approved && !isPaid) {
    // Check if enough time passed since approval
    const approvedConf = confirmation;
    if (approvedConf?.submittedAt) {
      const sinceApproval = now - approvedConf.submittedAt;
      if (sinceApproval >= 72 * 3_600_000) {
        score -= 25;
        negativeSignals.push('Approved design but no deposit after 72h');
        reasoning.push('-25 approved design but no deposit after 72h');
      }
    }
  }

  if (hasPlacement && /arm somewhere|leg maybe|somewhere|undecided|not sure where/i.test(lead.bodyPart || '')) {
    score -= 15;
    negativeSignals.push('Placement is vague');
    reasoning.push('-15 vague placement');
  }

  if (hasStyle && /not sure|something cool|open to ideas|don't know/i.test(lead.style || '')) {
    score -= 15;
    negativeSignals.push('Style is vague');
    reasoning.push('-15 vague style');
  }

  if (hasBudget && budgetNum > 0 && budgetNum < 50) {
    score -= 15;
    negativeSignals.push('Budget unrealistically low');
    reasoning.push('-15 unrealistic budget');
  } else if (hasBudget && budgetNum > 0 && budgetNum < 100) {
    score -= 5;
    negativeSignals.push('Budget on the low side');
    reasoning.push('-5 budget on low side');
  }

  // Ghosting signals: confirmation viewed but not submitted + no follow-up contact
  if (confirmation?.viewedAt && confirmation.status !== 'submitted' && confirmation.status !== 'completed') {
    const sinceViewed = now - confirmation.viewedAt;
    if (sinceViewed >= 72 * 3_600_000) {
      score -= 20;
      negativeSignals.push('Viewed confirmation but did not respond');
      reasoning.push('-20 ghosting: confirmation viewed but abandoned');
    } else if (sinceViewed >= 24 * 3_600_000) {
      score -= 10;
      negativeSignals.push('Viewed confirmation, waiting for response');
      reasoning.push('-10 confirmation viewed, awaiting reply');
    }
  }

  // High revision count
  if (approvalState?.revisionRequested) {
    score -= 10;
    negativeSignals.push('Client requested revision');
    reasoning.push('-10 revision requested');
  }

  // Low confidence from inquiry analyzer — use leadPipelineStatus as heuristic
  if (lead.leadPipelineStatus === 'new_inquiry' && !hasPlacement && !hasStyle) {
    score -= 15;
    negativeSignals.push('Very early stage, missing core info');
    reasoning.push('-15 early stage with no core info');
  }

  // Clamp and level
  score = Math.max(0, Math.min(100, score));
  const level: 'hot' | 'warm' | 'cold' = score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold';

  return { score, level, positiveSignals, negativeSignals, reasoning };
}

export async function logLeadHealthUpdate(
  artistId: string,
  leadId: string,
  result: LeadHealthResult,
): Promise<void> {
  await logCommunication(artistId, 'app_note', 'auto', {
    message: `Lead health: ${result.score}/100 (${result.level}) — ${result.positiveSignals.length} positive, ${result.negativeSignals.length} negative signals`,
    templateType: 'lead_health_update',
  });
}

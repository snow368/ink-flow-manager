import { db } from '../db';
import { logCommunication } from './aftercareLogic';
import type { LeadRecord, LeadConfirmationRecord, DepositFlowRecord } from '../db';

// ── Types ──

export interface DepositReadiness {
  ready: boolean;
  confidence: number;
  reasons: string[];
}

export interface DepositTimingRecommendation {
  timing: 'too_early' | 'ideal' | 'overdue' | 'losing_momentum';
  label: string;
  reasoning: string;
}

export type DepositMessageStyle = 'standard' | 'large_project' | 'gentle_reminder' | 'follow_up';

// ── CRUD Helpers ──

export async function createDepositRequest(
  leadId: string,
  artistId: string,
  options?: {
    quoteRange?: string;
    estimatedSessions?: number;
    depositAmount?: number;
    notes?: string;
  },
): Promise<DepositFlowRecord> {
  const now = Date.now();
  const record: DepositFlowRecord = {
    id: `dep_${now}_${Math.random().toString(36).slice(2, 6)}`,
    leadId,
    artistId,
    quoteRange: options?.quoteRange,
    estimatedSessions: options?.estimatedSessions,
    depositAmount: options?.depositAmount,
    depositStatus: 'requested',
    requestedAt: now,
    reminderCount: 0,
    notes: options?.notes,
    createdAt: now,
    updatedAt: now,
  };
  await db.depositFlow.add(record);
  await db.leads.update(leadId, {
    leadPipelineStatus: 'deposit_requested',
    paymentStatus: 'unpaid',
  });
  await logCommunication(artistId, 'app_note', 'auto', {
    message: `Deposit requested${options?.depositAmount ? ` ($${options.depositAmount})` : ''}`,
    templateType: 'deposit_requested',
  });
  return record;
}

export async function markDepositViewed(leadId: string): Promise<void> {
  const record = await db.depositFlow.where('leadId').equals(leadId).last();
  if (!record) return;
  const now = Date.now();
  await db.depositFlow.update(record.id, {
    depositStatus: 'viewed',
    viewedAt: now,
    updatedAt: now,
  });
  await logCommunication(record.artistId, 'app_note', 'auto', {
    message: 'Deposit link was viewed by client',
    templateType: 'deposit_viewed',
  });
}

export async function markDepositPaid(
  leadId: string,
  options?: {
    paidAt?: number;
    notes?: string;
  },
): Promise<void> {
  const record = await db.depositFlow.where('leadId').equals(leadId).last();
  if (!record) return;
  const now = Date.now();
  const paidAt = options?.paidAt || now;
  await db.depositFlow.update(record.id, {
    depositStatus: 'paid',
    paidAt,
    notes: options?.notes ? `${record.notes || ''}\n${options.notes}`.trim() : record.notes,
    updatedAt: now,
  });
  await db.leads.update(leadId, {
    paymentStatus: 'paid',
    paymentUpdatedAt: paidAt,
    leadPipelineStatus: 'deposit_paid',
  });
  await logCommunication(record.artistId, 'app_note', 'auto', {
    message: 'Deposit marked as paid',
    templateType: 'deposit_paid',
  });
}

export async function markDepositExpired(leadId: string): Promise<void> {
  const record = await db.depositFlow.where('leadId').equals(leadId).last();
  if (!record) return;
  const now = Date.now();
  await db.depositFlow.update(record.id, {
    depositStatus: 'expired',
    notes: record.notes ? `${record.notes}\nExpired at ${new Date(now).toLocaleDateString()}` : `Expired at ${new Date(now).toLocaleDateString()}`,
    updatedAt: now,
  });
  await logCommunication(record.artistId, 'app_note', 'auto', {
    message: 'Deposit request expired',
    templateType: 'deposit_expired',
  });
}

export async function incrementReminder(leadId: string): Promise<void> {
  const record = await db.depositFlow.where('leadId').equals(leadId).last();
  if (!record) return;
  await db.depositFlow.update(record.id, {
    reminderCount: (record.reminderCount || 0) + 1,
    updatedAt: Date.now(),
  });
  await logCommunication(record.artistId, 'app_note', 'auto', {
    message: `Deposit reminder #${(record.reminderCount || 0) + 1} sent`,
    templateType: 'deposit_follow_up',
  });
}

export async function getDepositState(leadId: string): Promise<DepositFlowRecord | undefined> {
  return db.depositFlow.where('leadId').equals(leadId).last();
}

// ── Deposit Readiness Engine ──

export function isLeadReadyForDeposit(
  lead: LeadRecord,
  options?: {
    confirmation?: LeadConfirmationRecord | null;
    projectApprovalState?: {
      approved?: boolean;
    };
  },
): DepositReadiness {
  const reasons: string[] = [];
  let confidence = 0;

  const hasPlacement = !!lead.bodyPart && lead.bodyPart.trim().length >= 3;
  const hasStyle = !!lead.style && lead.style.trim().length >= 2;
  const hasBudget = !!lead.budget && lead.budget.trim().length >= 1;
  const hasRefs = !!(lead.referenceImages && lead.referenceImages.length > 0);
  const isPaid = lead.paymentStatus === 'paid' || lead.paymentStatus === 'pending_verify';
  const isVaguePlacement = /arm somewhere|leg maybe|somewhere|undecided|not sure where/i.test(lead.bodyPart || '');
  const isVagueStyle = /not sure|something cool|open to ideas|don't know/i.test(lead.style || '');

  if (isPaid) {
    return { ready: false, confidence: 0, reasons: ['Already paid'] };
  }

  // Placement check
  if (!hasPlacement) {
    reasons.push('Placement not confirmed');
  } else if (isVaguePlacement) {
    reasons.push('Placement is still vague');
    confidence += 5;
  } else {
    confidence += 25;
    reasons.push('Placement clear');
  }

  // Style check
  if (!hasStyle) {
    reasons.push('Style not discussed');
  } else if (isVagueStyle) {
    reasons.push('Style direction is vague');
    confidence += 5;
  } else {
    confidence += 25;
    reasons.push('Style clear');
  }

  // Budget check
  if (!hasBudget) {
    reasons.push('Budget not discussed');
  } else {
    confidence += 20;
    reasons.push('Budget discussed');
    const budgetNum = Number(String(lead.budget).replace(/[^0-9.]/g, ''));
    if (budgetNum > 0 && budgetNum < 50) {
      reasons.push('Budget below minimum');
      confidence -= 10;
    } else if (budgetNum > 0 && budgetNum >= 100) {
      confidence += 10;
      reasons.push('Budget realistic');
    }
  }

  // References
  if (hasRefs) {
    confidence += 15;
    reasons.push('Reference images provided');
  } else {
    reasons.push('No reference images');
  }

  // Design approved
  if (options?.projectApprovalState?.approved) {
    confidence += 25;
    reasons.push('Design approved');
  }

  // Confirmation submitted
  if (options?.confirmation?.status === 'submitted' || options?.confirmation?.status === 'completed') {
    confidence += 15;
    reasons.push('Confirmation submitted');
  }

  const ready = confidence >= 60 && hasPlacement && hasStyle && hasBudget;
  confidence = Math.max(0, Math.min(100, confidence));

  return { ready, confidence, reasons };
}

// ── Smart Deposit Timing ──

export function getDepositTimingRecommendation(
  lead: LeadRecord,
  depositState?: DepositFlowRecord,
  options?: {
    confirmation?: LeadConfirmationRecord | null;
    projectApprovalState?: {
      approved?: boolean;
    };
  },
): DepositTimingRecommendation {
  const now = Date.now();
  const isPaid = lead.paymentStatus === 'paid' || lead.paymentStatus === 'pending_verify';

  if (isPaid) {
    return { timing: 'ideal', label: 'Deposit paid', reasoning: 'Deposit already received' };
  }

  // Already requested — check how long ago
  if (depositState?.requestedAt) {
    const sinceRequest = now - depositState.requestedAt;
    if (depositState.depositStatus === 'paid') {
      return { timing: 'ideal', label: 'Deposit paid', reasoning: 'Deposit was completed' };
    }
    if (depositState.depositStatus === 'expired' || depositState.depositStatus === 'declined') {
      return { timing: 'losing_momentum', label: 'Deposit expired', reasoning: 'Previous deposit request was not completed — may need to re-engage' };
    }
    if (sinceRequest >= 7 * 86_400_000) {
      return { timing: 'losing_momentum', label: 'Overdue', reasoning: `Deposit requested ${Math.floor(sinceRequest / 86_400_000)}d ago — send a follow-up or check in` };
    }
    if (sinceRequest >= 72 * 3_600_000) {
      return { timing: 'overdue', label: 'Waiting', reasoning: `Deposit pending for ${Math.floor(sinceRequest / 86_400_000)}d — gentle reminder might help` };
    }
    return { timing: 'ideal', label: 'Deposit sent', reasoning: 'Deposit request sent, waiting for client' };
  }

  // Design approved — check time since approval
  if (options?.projectApprovalState?.approved && options?.confirmation?.submittedAt) {
    const sinceApproval = now - options.confirmation.submittedAt;
    if (sinceApproval >= 72 * 3_600_000) {
      return { timing: 'overdue', label: 'Overdue after approval', reasoning: `Design approved ${Math.floor(sinceApproval / 86_400_000)}d ago — recommend sending deposit request now` };
    }
    if (sinceApproval >= 24 * 3_600_000) {
      return { timing: 'ideal', label: 'Ready', reasoning: 'Design approved — good time to request deposit' };
    }
    return { timing: 'ideal', label: 'Ready soon', reasoning: 'Just approved — give it a moment then request deposit' };
  }

  // Check lead readiness
  const readiness = isLeadReadyForDeposit(lead, options);
  if (readiness.ready) {
    return { timing: 'ideal', label: 'Ready for deposit', reasoning: 'All key info collected — ready to request deposit' };
  }

  // Not enough info yet
  if (!lead.bodyPart || !lead.style) {
    return { timing: 'too_early', label: 'Too early', reasoning: 'Core details still missing — clarify scope first' };
  }

  if (!lead.budget) {
    return { timing: 'too_early', label: 'Needs budget', reasoning: 'Budget not discussed yet — confirm before requesting' };
  }

  return { timing: 'too_early', label: 'Not ready', reasoning: 'Missing info needed before deposit request' };
}

// ── Deposit Messages ──

export function getDepositMessage(
  lead: LeadRecord,
  style?: DepositMessageStyle,
): string {
  const name = lead.name;
  const placement = lead.bodyPart || 'this piece';
  const isLarge = /sleeve|full|back|chest|large|大片/.test(lead.bodyPart || '');

  switch (style) {
    case 'large_project':
      return `Hey ${name}, since ${placement} is a larger project I usually secure the booking with a deposit first. Once that's set we can lock in your appointment date.`;

    case 'gentle_reminder':
      return `Hey ${name}, just a quick heads up — the deposit link is still open if you want to lock in your spot. No pressure at all, just want to make sure you don't miss out!`;

    case 'follow_up':
      return `Hey ${name}, checking in on the deposit — happy to answer any questions about the process. Once it's sorted we can get you on the books!`;

    default:
      if (isLarge) {
        return `Hey ${name}, everything looks good on the ${placement} design! I can send over the deposit link whenever you're ready — it secures your booking and we can get started.`;
      }
      return `Hey ${name}, once you're ready we can lock in the appointment with a deposit. Let me know and I'll send the link over!`;
  }
}

// ── Timeline Logging ──

export async function logDepositEvent(
  leadId: string,
  eventType: 'deposit_requested' | 'deposit_viewed' | 'deposit_paid' | 'deposit_follow_up',
  artistId: string,
  extra?: string,
): Promise<void> {
  const labels: Record<string, string> = {
    deposit_requested: 'Deposit request sent to client',
    deposit_viewed: 'Deposit link viewed by client',
    deposit_paid: 'Deposit payment received',
    deposit_follow_up: 'Deposit follow-up sent',
  };
  await logCommunication(artistId, 'app_note', 'auto', {
    message: `${labels[eventType] || eventType}${extra ? ` — ${extra}` : ''}`,
    templateType: eventType,
  });
}

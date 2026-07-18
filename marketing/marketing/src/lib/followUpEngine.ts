import type { LeadRecord, LeadConfirmationRecord } from '../db';
import { logCommunication } from './aftercareLogic';

export interface FollowUpSignal {
  priority: 'low' | 'medium' | 'high';
  reason: string;
  suggestedAction: string;
  hoursWaiting: number;
}

export interface FollowUpResult {
  needsAttention: boolean;
  signals: FollowUpSignal[];
  topPriority: 'low' | 'medium' | 'high';
}

const THRESHOLDS = [
  { hours: 24, priority: 'low' as const },
  { hours: 48, priority: 'medium' as const },
  { hours: 72, priority: 'high' as const },
];

/**
 * Analyze a lead for follow-up signals.
 * @param lead - the lead record
 * @param confirmation - optional LeadConfirmationRecord if one exists
 * @param now - optional timestamp for testing, defaults to Date.now()
 */
export function analyzeLead(
  lead: LeadRecord,
  confirmation?: LeadConfirmationRecord,
  now: number = Date.now(),
): FollowUpResult {
  const signals: FollowUpSignal[] = [];

  // ── 1. No response after threshold ──
  if (lead.lastContactedAt) {
    const elapsed = now - lead.lastContactedAt;
    for (const t of THRESHOLDS) {
      if (elapsed >= t.hours * 3_600_000) {
        const hours = Math.floor(elapsed / 3_600_000);
        signals.push({
          priority: t.priority,
          reason: t.hours === 72
            ? `No response for ${hours}h — may be ghosting`
            : t.hours === 48
              ? `No response for ${hours}h — follow up soon`
              : `No response for ${hours}h — gentle check-in`,
          suggestedAction: 'follow_up',
          hoursWaiting: hours,
        });
        break; // only report the highest threshold reached
      }
    }
  }

  // ── 2. Deposit requested but unpaid ──
  if (
    lead.leadPipelineStatus === 'deposit_requested' &&
    lead.paymentStatus !== 'paid'
  ) {
    const sinceDeposit = lead.paymentUpdatedAt
      ? now - lead.paymentUpdatedAt
      : now - lead.createdAt;
    const hours = Math.floor(sinceDeposit / 3_600_000);
    if (sinceDeposit >= 72 * 3_600_000) {
      signals.push({
        priority: 'high',
        reason: `Deposit unpaid for ${hours}h — consider releasing the slot`,
        suggestedAction: 'follow_up',
        hoursWaiting: hours,
      });
    } else if (sinceDeposit >= 24 * 3_600_000) {
      signals.push({
        priority: 'medium',
        reason: `Deposit unpaid for ${hours}h — send a reminder`,
        suggestedAction: 'follow_up',
        hoursWaiting: hours,
      });
    }
  }

  // ── 3. Viewed confirmation but not submitted ──
  if (confirmation && confirmation.status === 'viewed' && !confirmation.submittedAt) {
    const sinceViewed = now - (confirmation.viewedAt || confirmation.updatedAt);
    const hours = Math.floor(sinceViewed / 3_600_000);
    if (sinceViewed >= 48 * 3_600_000) {
      signals.push({
        priority: 'high',
        reason: `Confirmation viewed ${hours}h ago but not submitted`,
        suggestedAction: 'follow_up',
        hoursWaiting: hours,
      });
    } else if (sinceViewed >= 24 * 3_600_000) {
      signals.push({
        priority: 'medium',
        reason: `Confirmation viewed ${hours}h ago — gentle reminder`,
        suggestedAction: 'follow_up',
        hoursWaiting: hours,
      });
    }
  }

  // ── 4. In reviewing stage for too long (quote sent, no booking) ──
  if (lead.leadPipelineStatus === 'reviewing' && lead.lastContactedAt) {
    const elapsed = now - lead.lastContactedAt;
    const hours = Math.floor(elapsed / 3_600_000);
    if (elapsed >= 72 * 3_600_000) {
      signals.push({
        priority: 'high',
        reason: `Reviewing for ${hours}h — quote sent but no booking yet`,
        suggestedAction: 'follow_up',
        hoursWaiting: hours,
      });
    }
  }

  // ── 5. No contact at all for a new lead ──
  if (!lead.lastContactedAt && lead.leadPipelineStatus === 'new_inquiry') {
    const age = now - lead.createdAt;
    const hours = Math.floor(age / 3_600_000);
    if (age >= 48 * 3_600_000) {
      signals.push({
        priority: 'high',
        reason: `New lead ${hours}h old — no contact made yet`,
        suggestedAction: 'follow_up',
        hoursWaiting: hours,
      });
    } else if (age >= 24 * 3_600_000) {
      signals.push({
        priority: 'medium',
        reason: `New lead ${hours}h old — reach out soon`,
        suggestedAction: 'follow_up',
        hoursWaiting: hours,
      });
    }
  }

  const topPriority = signals.length > 0
    ? signals.reduce((a, b) => priorityRank(a.priority) < priorityRank(b.priority) ? a : b).priority
    : 'low';

  return {
    needsAttention: signals.length > 0,
    signals,
    topPriority,
  };
}

function priorityRank(p: 'low' | 'medium' | 'high'): number {
  return p === 'high' ? 3 : p === 'medium' ? 2 : 1;
}

export async function logFollowUpSignal(
  artistId: string,
  leadId: string,
  signal: FollowUpSignal,
): Promise<void> {
  await logCommunication(artistId, 'app_note', 'auto', {
    message: `Follow-up signal [${signal.priority}]: ${signal.reason}`,
    templateType: 'follow_up_signal',
  });
}

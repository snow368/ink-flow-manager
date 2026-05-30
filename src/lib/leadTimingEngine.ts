import { db } from '../db';
import { logCommunication } from './aftercareLogic';
import type { LeadRecord, LeadConfirmationRecord, CommunicationLogRecord } from '../db';

export type TimingType =
  | 'good_time_for_deposit'
  | 'wait_before_deposit'
  | 'follow_up_now'
  | 'likely_to_ghost'
  | 'highly_engaged'
  | 'needs_clarification'
  | 'waiting_too_long_after_approval';

export interface TimingSuggestion {
  type: TimingType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  reasoning: string;
}

export function getLeadTimingSuggestions(
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
): TimingSuggestion[] {
  const suggestions: TimingSuggestion[] = [];
  const now = Date.now();
  const confirmation = options?.confirmation;
  const logs = options?.communicationLogs || [];
  const approvalState = options?.projectApprovalState;

  const hasPlacement = !!lead.bodyPart && lead.bodyPart.trim().length >= 3;
  const hasStyle = !!lead.style && lead.style.trim().length >= 2;
  const hasBudget = !!lead.budget && lead.budget.trim().length >= 1;
  const hasRefs = !!(lead.referenceImages && lead.referenceImages.length > 0);
  const isPaid = lead.paymentStatus === 'paid' || lead.paymentStatus === 'pending_verify';
  const budgetNum = Number(String(lead.budget || '').replace(/[^0-9.]/g, ''));
  const realisticBudget = budgetNum > 0 && budgetNum >= 100;

  const isVaguePlacement = /arm somewhere|leg maybe|somewhere|undecided|not sure where/i.test(lead.bodyPart || '');
  const isVagueStyle = /not sure|something cool|open to ideas|don't know/i.test(lead.style || '');
  const lastInbound = [...logs].reverse().find(l => l.direction === 'inbound');
  const lastOutbound = [...logs].reverse().find(l => l.direction === 'outbound');
  const inboundCount = logs.filter(l => l.direction === 'inbound').length;

  // ── GOOD TIME FOR DEPOSIT ──
  if (
    (approvalState?.approved || (confirmation?.status === 'submitted' && hasPlacement && hasStyle && hasBudget)) &&
    realisticBudget &&
    hasRefs &&
    !isPaid &&
    !isVaguePlacement &&
    !isVagueStyle
  ) {
    suggestions.push({
      type: 'good_time_for_deposit',
      priority: 'high',
      title: 'Good time for deposit',
      reasoning: 'Design is approved, all key info collected, budget realistic — client is ready',
    });
  }

  // ── WAIT BEFORE DEPOSIT ──
  const unclearScope = !hasPlacement || !hasStyle || !hasRefs;
  const stillExploring = isVaguePlacement || isVagueStyle;
  if (!isPaid && (unclearScope || stillExploring)) {
    suggestions.push({
      type: 'wait_before_deposit',
      priority: 'medium',
      title: 'Wait before deposit',
      reasoning: unclearScope
        ? 'Core details still missing — clarify before asking for deposit'
        : 'Client still exploring — confirm direction first',
    });
  }

  // ── FOLLOW UP NOW ──
  const lastContact = lead.lastContactedAt || lead.createdAt;
  const sinceContact = now - lastContact;
  if (sinceContact >= 48 * 3_600_000 && lead.leadPipelineStatus !== 'ghosted' && lead.leadPipelineStatus !== 'completed') {
    const hours = Math.floor(sinceContact / 3_600_000);
    suggestions.push({
      type: 'follow_up_now',
      priority: sinceContact >= 72 * 3_600_000 ? 'high' : 'medium',
      title: 'Follow up now',
      reasoning: `No contact for ${hours}h — gentle check-in recommended`,
    });
  }

  // ── LIKELY TO GHOST ──
  if (sinceContact >= 72 * 3_600_000 && lead.leadPipelineStatus !== 'ghosted' && lead.leadPipelineStatus !== 'completed') {
    const days = Math.floor(sinceContact / 86_400_000);
    suggestions.push({
      type: 'likely_to_ghost',
      priority: 'high',
      title: 'Likely to ghost',
      reasoning: `No reply in ${days}d — may need re-engagement or mark as ghosted`,
    });
  }

  // ── HIGHLY ENGAGED ──
  if (inboundCount >= 3 && lastInbound && (now - lastInbound.createdAt) < 48 * 3_600_000) {
    suggestions.push({
      type: 'highly_engaged',
      priority: 'low',
      title: 'Highly engaged',
      reasoning: 'Client is responsive and exchanging details actively — keep momentum',
    });
  } else if (confirmation?.status === 'submitted') {
    suggestions.push({
      type: 'highly_engaged',
      priority: 'low',
      title: 'Highly engaged',
      reasoning: 'Confirmation submitted — client is invested',
    });
  }

  // ── NEEDS CLARIFICATION ──
  if (!hasPlacement || !hasStyle || !hasBudget || isVaguePlacement || isVagueStyle) {
    const missing: string[] = [];
    if (!hasPlacement) missing.push('placement');
    if (!hasStyle) missing.push('style');
    if (!hasBudget) missing.push('budget');
    if (isVaguePlacement && hasPlacement) missing.push('specific placement');
    if (isVagueStyle && hasStyle) missing.push('clear style direction');
    suggestions.push({
      type: 'needs_clarification',
      priority: 'medium',
      title: 'Needs clarification',
      reasoning: `Still need: ${missing.join(', ')}`,
    });
  }

  // ── WAITING TOO LONG AFTER APPROVAL ──
  if (approvalState?.approved && !isPaid && confirmation?.submittedAt) {
    const sinceApproval = now - confirmation.submittedAt;
    if (sinceApproval >= 72 * 3_600_000) {
      const days = Math.floor(sinceApproval / 86_400_000);
      suggestions.push({
        type: 'waiting_too_long_after_approval',
        priority: 'high',
        title: 'Waiting too long after approval',
        reasoning: `Design approved ${days}d ago but deposit not yet paid — send a friendly reminder`,
      });
    }
  }

  return suggestions;
}

export async function logTimingSignal(
  artistId: string,
  leadId: string,
  suggestion: TimingSuggestion,
): Promise<void> {
  await logCommunication(artistId, 'app_note', 'auto', {
    message: `Timing signal [${suggestion.type}]: ${suggestion.reasoning}`,
    templateType: 'timing_signal',
  });
}

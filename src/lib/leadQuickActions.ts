import { db } from '../db';
import { logCommunication } from './aftercareLogic';
import type { LeadRecord } from '../db';

export type QuickActionType =
  | 'request_references'
  | 'clarify_placement'
  | 'clarify_style'
  | 'request_budget'
  | 'deposit_request'
  | 'follow_up'
  | 'booking_confirmation'
  | 'pricing_explanation'
  | 'scope_adjustment'
  | 'clarify_scope'
  | 'explain_pricing'
  | 'ask_for_reference_direction'
  | 'placement_confirmation';

export interface QuickAction {
  type: QuickActionType;
  label: string;
  message: string;
  suggestedDelayHours?: number;
  severity?: 'low' | 'medium' | 'high';
}

const TEMPLATES: Record<QuickActionType, (lead: LeadRecord) => QuickAction> = {
  request_references: (lead) => ({
    type: 'request_references',
    label: 'Ask for references',
    severity: 'high',
    message: `Hey ${lead.name}, do you have any reference images or inspo pics for what you have in mind? Even rough sketches or similar tattoos help me nail the design.`,
  }),
  clarify_placement: (lead) => ({
    type: 'clarify_placement',
    label: 'Clarify placement',
    severity: 'high',
    message: `Hey ${lead.name}, where on your body are you thinking of getting this? Exact placement makes a big difference for sizing and flow.`,
  }),
  clarify_style: (lead) => ({
    type: 'clarify_style',
    label: 'Clarify style',
    severity: 'medium',
    message: `Hey ${lead.name}, any particular style you're leaning toward? (fine line, traditional, realism, neo-trad, etc.) Just so I match the vibe you want.`,
  }),
  request_budget: (lead) => ({
    type: 'request_budget',
    label: 'Ask budget',
    severity: 'high',
    message: `Hey ${lead.name}, do you have a budget range in mind for this piece? Helps me tailor the design to fit what you're comfortable with.`,
  }),
  deposit_request: (lead) => ({
    type: 'deposit_request',
    label: 'Request deposit',
    severity: 'high',
    message: `Hey ${lead.name}, I can get you scheduled! I just need a deposit to lock in your spot. I'll send over the payment link — let me know if you have any questions.`,
  }),
  follow_up: (lead) => ({
    type: 'follow_up',
    label: 'Follow up',
    severity: 'medium',
    message: `Hey ${lead.name}, just checking in! Any thoughts on the tattoo idea? Happy to answer questions or adjust the design. No rush!`,
  }),
  booking_confirmation: (lead) => ({
    type: 'booking_confirmation',
    label: 'Confirm booking',
    severity: 'high',
    suggestedDelayHours: 24,
    message: `Hey ${lead.name}, just confirming our appointment. Here's what we discussed — placement: ${lead.bodyPart || 'TBD'}, style: ${lead.style || 'TBD'}. Let me know if anything changed!`,
  }),
  pricing_explanation: (lead) => ({
    type: 'pricing_explanation',
    label: 'Explain pricing',
    severity: 'medium',
    message: `Hey ${lead.name}, just to explain how pricing works — pieces are quoted based on size, detail level, and placement. I'll give you an exact quote once I have the design ready. Typically ${lead.bodyPart ? 'a ' + lead.bodyPart + ' piece' : 'work this size'} starts around [range].`,
  }),
  scope_adjustment: (lead) => ({
    type: 'scope_adjustment',
    label: 'Adjust scope',
    severity: 'medium',
    message: `Hey ${lead.name}, to make this work with your budget, we could adjust the size or details a bit — e.g., simplify the shading or go slightly smaller. Still get a sick piece, just scaled to fit. Want me to sketch up a couple options?`,
  }),
  clarify_scope: (lead) => ({
    type: 'clarify_scope',
    label: 'Clarify scope',
    severity: 'high',
    message: `Hey ${lead.name}, just to make sure I'm on the right track — could you give me a bit more detail on exactly what you're thinking? Size, placement, style — any direction helps me nail the design.`,
  }),
  explain_pricing: (lead) => ({
    type: 'explain_pricing',
    label: 'Explain pricing',
    severity: 'medium',
    message: `Hey ${lead.name}, just a heads up on pricing — for a ${lead.bodyPart || 'tattoo'} with ${lead.style || 'the style you mentioned'}, it typically ranges based on detail and size. I can give you a solid estimate once I know the exact size and complexity.`,
  }),
  ask_for_reference_direction: (lead) => ({
    type: 'ask_for_reference_direction',
    label: 'Ask reference direction',
    severity: 'medium',
    message: `Hey ${lead.name}, do you have any specific tattoos or styles you're drawn to? Even a rough idea or a couple inspo pics would help me understand the direction you want to go.`,
  }),
  placement_confirmation: (lead) => ({
    type: 'placement_confirmation',
    label: 'Confirm placement',
    severity: 'medium',
    message: `Hey ${lead.name}, just to double check — you mentioned ${lead.bodyPart || 'a spot on your body'} for the placement. Want to confirm the exact location? It affects how I lay out the design.`,
  }),
};

export function getQuickAction(type: QuickActionType, lead: LeadRecord): QuickAction {
  return TEMPLATES[type](lead);
}

export function getRelevantActions(lead: LeadRecord): QuickAction[] {
  const actions: QuickAction[] = [];
  const hasPlacement = !!lead.bodyPart && lead.bodyPart.trim().length >= 3;
  const hasStyle = !!lead.style && lead.style.trim().length >= 2;
  const hasBudget = !!lead.budget && lead.budget.trim().length >= 1;
  const hasRefs = !!(lead.referenceImages && lead.referenceImages.length > 0);
  const hasPayment = lead.paymentStatus === 'paid' || lead.paymentStatus === 'pending_verify';

  if (!hasRefs) actions.push(TEMPLATES.request_references(lead));
  if (!hasPlacement) actions.push(TEMPLATES.clarify_placement(lead));
  if (!hasStyle) actions.push(TEMPLATES.clarify_style(lead));
  if (!hasBudget) actions.push(TEMPLATES.request_budget(lead));
  if (hasPlacement && hasStyle && hasBudget && !hasPayment) {
    actions.push(TEMPLATES.deposit_request(lead));
  }
  if (hasBudget && hasPlacement && !hasStyle) {
    actions.push(TEMPLATES.pricing_explanation(lead));
  }
  // New: if everything is vague, suggest clarification
  if (!hasStyle && !hasPlacement && !hasRefs) {
    actions.push(TEMPLATES.clarify_scope(lead));
  }
  // If style exists but is vague, ask for direction
  if (hasStyle && hasPlacement && !hasRefs) {
    actions.push(TEMPLATES.ask_for_reference_direction(lead));
  }
  // If placement exists but seems uncertain
  if (hasPlacement && lead.bodyPart && /arm somewhere|leg maybe|somewhere|undecided/i.test(lead.bodyPart)) {
    actions.push(TEMPLATES.placement_confirmation(lead));
  }
  return actions.slice(0, 3);
}

export async function logQuickActionCopied(
  artistId: string,
  leadId: string,
  actionType: QuickActionType,
): Promise<void> {
  const lead = await db.leads.get(leadId);
  if (!lead) return;
  await logCommunication(artistId, 'app_note', 'outbound', {
    message: `Quick action "${actionType}" message copied to clipboard`,
    templateType: `quick_action_${actionType}`,
  });
  await db.leads.update(leadId, {
    lastMessage: `[Quick action: ${actionType}]`,
    lastContactedAt: Date.now(),
  });
}

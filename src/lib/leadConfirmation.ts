import { db, type LeadConfirmationRecord, type LeadRecord } from '../db';
import { logCommunication } from './aftercareLogic';

// ── Token generation ──

export function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── CRUD ──

export async function createLeadConfirmation(
  artistId: string,
  extractedData: LeadConfirmationRecord['extractedData'],
  leadId?: string,
  projectId?: string,
): Promise<LeadConfirmationRecord> {
  const id = 'lconf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const now = Date.now();
  const missingFields = detectMissingTattooInfo(extractedData);
  const record: LeadConfirmationRecord = {
    id,
    artistId,
    leadId,
    projectId,
    extractedData,
    missingFields,
    status: 'draft',
    confirmationToken: generateToken(),
    createdAt: now,
    updatedAt: now,
  };
  await db.leadConfirmations.add(record);
  return record;
}

export async function getLeadConfirmationByToken(
  token: string,
): Promise<LeadConfirmationRecord | undefined> {
  return db.leadConfirmations
    .where('confirmationToken').equals(token)
    .first();
}

export async function getLeadConfirmationByLeadId(
  leadId: string,
): Promise<LeadConfirmationRecord | undefined> {
  return db.leadConfirmations
    .where('leadId').equals(leadId)
    .reverse()
    .first();
}

export async function markConfirmationViewed(id: string): Promise<void> {
  const now = Date.now();
  await db.leadConfirmations.update(id, {
    status: 'viewed',
    viewedAt: now,
    updatedAt: now,
  });
  const conf = await db.leadConfirmations.get(id);
  if (conf) {
    await logCommunication(
      conf.artistId,
      'app_note',
      'auto',
      {
        message: 'Confirmation link viewed by client',
        templateType: 'confirmation_viewed',
      },
    );
  }
}

export async function submitLeadConfirmation(
  id: string,
  clientEdits: Partial<LeadConfirmationRecord['extractedData']>,
): Promise<void> {
  const now = Date.now();
  const conf = await db.leadConfirmations.get(id);
  if (!conf) throw new Error('LeadConfirmation not found');
  if (conf.status === 'submitted' || conf.status === 'completed') {
    throw new Error('LeadConfirmation already submitted');
  }

  const merged: LeadConfirmationRecord['extractedData'] = {
    ...conf.extractedData,
    ...clientEdits,
  };
  const missingFields = detectMissingTattooInfo(merged);

  await db.leadConfirmations.update(id, {
    extractedData: merged,
    missingFields,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
  });

  await logCommunication(
    conf.artistId,
    'app_note',
    'auto',
    {
      message: `Client submitted lead confirmation. Missing: ${missingFields.join(', ') || 'none'}`,
      templateType: 'confirmation_submitted',
    },
  );
}

// ── Confirmation link helpers ──

export function buildConfirmationLink(token: string): string {
  return `${window.location.origin}/lead-confirm/${token}`;
}

export async function logConfirmationSent(leadId: string): Promise<void> {
  const lead = await db.leads.get(leadId);
  if (!lead) return;
  await logCommunication(
    lead.artistId,
    'app_note',
    'auto',
    {
      message: 'Confirmation link sent to client',
      templateType: 'confirmation_sent',
    },
  );
}

export async function logFollowUp(leadId: string): Promise<void> {
  const lead = await db.leads.get(leadId);
  if (!lead) return;
  await logCommunication(
    lead.artistId,
    'app_note',
    'outbound',
    {
      message: 'Follow-up sent',
      templateType: 'follow_up_sent',
    },
  );
}

export async function logDepositRequested(leadId: string): Promise<void> {
  const lead = await db.leads.get(leadId);
  if (!lead) return;
  await logCommunication(
    lead.artistId,
    'app_note',
    'auto',
    {
      message: 'Deposit requested',
      templateType: 'deposit_requested',
    },
  );
}

// ── Missing info engine ──

export interface MissingInfoWarning {
  severity: 'low' | 'medium' | 'high';
  type: string;
  message: string;
}

export function detectMissingTattooInfo(
  data: LeadConfirmationRecord['extractedData'],
): string[] {
  const missing: string[] = [];
  if (!data.placement || data.placement.trim().length < 3) {
    missing.push('Need clearer placement');
  }
  if (!data.style || data.style.trim().length < 2) {
    missing.push('Need tattoo style');
  }
  if (!data.size || data.size.trim().length < 2) {
    missing.push('Need size estimate');
  }
  if (!data.budget || data.budget.trim().length < 1) {
    missing.push('Need budget range');
  }
  const refs = data.references || [];
  if (refs.length === 0) {
    missing.push('Need reference images or descriptions');
  }
  return missing;
}

export function detectMissingTattooInfoStructured(
  data: LeadConfirmationRecord['extractedData'],
): MissingInfoWarning[] {
  const warnings: MissingInfoWarning[] = [];

  if (!data.placement || data.placement.trim().length < 3) {
    warnings.push({ severity: 'high', type: 'placement', message: 'Need clearer placement' });
  }

  if (!data.style || data.style.trim().length < 2) {
    warnings.push({ severity: 'medium', type: 'style', message: 'Need tattoo style' });
  }

  if (!data.size || data.size.trim().length < 2) {
    warnings.push({ severity: 'high', type: 'size', message: 'Need size estimate' });
  } else {
    const sizeText = data.size.toLowerCase();
    if (/tiny|small|微型/.test(sizeText) && !/\d/.test(sizeText)) {
      warnings.push({ severity: 'low', type: 'size_unclear', message: 'Size description is vague — consider a more specific estimate' });
    }
  }

  if (!data.budget || data.budget.trim().length < 1) {
    warnings.push({ severity: 'high', type: 'budget', message: 'Need budget range' });
  } else {
    const budgetNum = Number(String(data.budget).replace(/[^0-9.]/g, ''));
    if (budgetNum > 0 && budgetNum < 50) {
      warnings.push({ severity: 'medium', type: 'budget_low', message: 'Budget seems very low for a tattoo' });
    }
  }

  const refs = data.references || [];
  if (refs.length === 0) {
    warnings.push({ severity: 'high', type: 'references', message: 'Need reference images or descriptions' });
  }

  if (data.requestedChanges && data.requestedChanges.length > 3) {
    warnings.push({ severity: 'medium', type: 'many_changes', message: 'Many requested changes — may need a revision call' });
  }

  // ── Budget/scope reality heuristics ──
  const placement = (data.placement || '').toLowerCase();
  const styleText = (data.style || '').toLowerCase();
  const sizeText = (data.size || '').toLowerCase();
  const budgetRaw = String(data.budget || '');
  const budgetNum = Number(budgetRaw.replace(/[^0-9.]/g, ''));

  const isLargeArea =
    /full sleeve|half sleeve|full back|back piece|chest piece|full chest|full leg|whole thigh|full arm|sleeve|large piece|大片|大臂|整条/.test(placement + ' ' + sizeText);

  const isDetailedStyle =
    /realism|photoreal|hyper.real|portrait|ornamental|mandala|bio.mech|dotwork|stipple|black.?and.?grey/.test(styleText);

  const isLargeSize =
    /large|sleeve|full|whole|entire|大片|大臂/.test(sizeText) || isLargeArea;

  if (budgetNum > 0 && isLargeArea && budgetNum < 300) {
    warnings.push({
      severity: 'high',
      type: 'budget_scope_mismatch',
      message: `${data.placement || 'Large piece'} with $${budgetNum} budget — may need a smaller design or simplified detail`,
    });
  } else if (budgetNum > 0 && isLargeArea && budgetNum < 600) {
    warnings.push({
      severity: 'medium',
      type: 'budget_scope_mismatch',
      message: `${data.placement || 'Large piece'} with $${budgetNum} — realistic? Consider a simpler approach`,
    });
  }

  if (budgetNum > 0 && isLargeSize && budgetNum < 150) {
    warnings.push({
      severity: 'high',
      type: 'budget_scope_mismatch',
      message: `Size seems large but budget is only $${budgetNum} — that might be too tight`,
    });
  }

  if (budgetNum > 0 && isDetailedStyle && budgetNum < 200) {
    warnings.push({
      severity: 'medium',
      type: 'budget_style_mismatch',
      message: `${data.style || 'Detailed style'} typically runs higher than $${budgetNum} — adjust expectations early`,
    });
  }

  if (budgetNum > 0 && budgetNum < 50) {
    warnings.push({
      severity: 'high',
      type: 'budget_too_low',
      message: `$${budgetNum} is very low for any tattoo — minimums may apply`,
    });
  }

  return warnings;
}

export function isReadyForDepositRequest(
  data: LeadConfirmationRecord['extractedData'],
): boolean {
  if (!data.placement || data.placement.trim().length < 3) return false;
  if (!data.size || data.size.trim().length < 2) return false;
  if (!data.budget || data.budget.trim().length < 1) return false;
  const refs = data.references || [];
  if (refs.length === 0) return false;
  return true;
}

// ── Suggested next actions ──

export interface SuggestedAction {
  label: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export function getSuggestedNextAction(lead: LeadRecord): SuggestedAction {
  const pipeline = lead.leadPipelineStatus || 'new_inquiry';
  const hasPlacement = !!lead.bodyPart && lead.bodyPart.trim().length >= 3;
  const hasStyle = !!lead.style && lead.style.trim().length >= 2;
  const hasSize = !!lead.size && lead.size.trim().length >= 2;
  const hasBudget = !!lead.budget && lead.budget.trim().length >= 1;
  const hasRefs = !!(lead.referenceImages && lead.referenceImages.length > 0);
  const hasPayment = lead.paymentStatus === 'paid' || lead.paymentStatus === 'pending_verify';

  switch (pipeline) {
    case 'new_inquiry':
      if (!hasPlacement || !hasStyle) {
        return { label: 'Ask for design details', action: 'ask_details', priority: 'high' };
      }
      return { label: 'Send confirmation link', action: 'send_confirmation', priority: 'high' };

    case 'waiting_info':
      return { label: 'Follow up — still waiting for info', action: 'follow_up', priority: 'high' };

    case 'waiting_references':
      return { label: 'Ask for reference images', action: 'ask_refs', priority: 'high' };

    case 'reviewing':
      if (!hasBudget) return { label: 'Clarify budget', action: 'clarify_budget', priority: 'medium' };
      if (!hasSize) return { label: 'Get size estimate', action: 'clarify_size', priority: 'medium' };
      return { label: 'Request deposit', action: 'request_deposit', priority: 'high' };

    case 'revision':
      return { label: 'Review changes and follow up', action: 'review_changes', priority: 'high' };

    case 'deposit_requested':
      if (hasPayment) return { label: 'Schedule appointment', action: 'schedule', priority: 'high' };
      return { label: 'Follow up on deposit', action: 'follow_up_deposit', priority: 'medium' };

    case 'deposit_paid':
      return { label: 'Ready to book', action: 'schedule', priority: 'high' };

    case 'scheduled':
      return { label: 'Send appointment reminder', action: 'send_reminder', priority: 'medium' };

    case 'completed':
      return { label: 'Request review', action: 'request_review', priority: 'low' };

    case 'ghosted':
      return { label: 'Send re-engagement message', action: 're_engage', priority: 'low' };

    default:
      return { label: 'Review lead', action: 'review', priority: 'medium' };
  }
}

import type { LeadRecord, UserRecord } from '../db';

type AmountMode = 'fixed' | 'percent';

type PolicyItem = {
  enabled: boolean;
  amountMode: AmountMode;
  amountValue: string;
};

type DepositPolicy = {
  onlineChat: PolicyItem;
  consultBooking: PolicyItem;
  directBooking: PolicyItem;
};

function policyKey(artistId: string) {
  return `inkflow_deposit_policy_${artistId}`;
}

function modeKey(lead: LeadRecord): keyof DepositPolicy {
  if (lead.consultMode === 'consult_booking') return 'consultBooking';
  if (lead.consultMode === 'walk_in_direct') return 'directBooking';
  return 'onlineChat';
}

export function getSuggestedDepositAmount(artistId: string, lead: LeadRecord): number {
  const raw = localStorage.getItem(policyKey(artistId));
  if (!raw) return 0;
  try {
    const policy = JSON.parse(raw) as DepositPolicy;
    const item = policy[modeKey(lead)];
    if (!item?.enabled) return 0;
    const val = Number(item.amountValue || '0');
    if (!Number.isFinite(val) || val <= 0) return 0;
    if (item.amountMode === 'fixed') return Math.round(val * 100) / 100;
    const budget = Number(String(lead.budget || '').replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(budget) || budget <= 0) return 0;
    return Math.round((budget * val) / 10000 * 100) / 100;
  } catch {
    return 0;
  }
}

export function buildDepositLink(user: UserRecord, lead: LeadRecord, amount: number): string | null {
  const template = user.paymentLinkTemplate?.trim();
  if (!template) return null;
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const currency = (user.paymentCurrency || 'USD').toUpperCase();
  return template
    .split('{amount}').join(safeAmount.toFixed(2))
    .split('{currency}').join(currency)
    .split('{leadId}').join(encodeURIComponent(lead.id))
    .split('{client}').join(encodeURIComponent(lead.name || 'client'))
    .split('{artistId}').join(encodeURIComponent(lead.artistId));
}

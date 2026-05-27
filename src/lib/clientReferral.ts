import { db, type ClientReferralRecord } from '../db';

function generateShortCode(artistId: string, clientId: string, nonce: number): string {
  const raw = artistId.slice(-4) + clientId.slice(-4) + nonce.toString(36);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return 'CR' + Math.abs(hash).toString(36).slice(0, 6).toUpperCase();
}

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 4);
  return base + suffix;
}

export async function createClientReferral(
  artistId: string,
  clientId: string,
  discountAmount: number,
  referrerName?: string,
  friendDiscountAmount?: number
): Promise<ClientReferralRecord> {
  const existing = await db.clientReferrals.where({ artistId, clientId }).toArray();
  const nonce = existing.length;
  const code = generateShortCode(artistId, clientId, nonce);
  const slug = generateSlug(referrerName || 'client');

  const id = 'cr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const record: ClientReferralRecord = {
    id, artistId, clientId, code, slug,
    referrerName: referrerName?.trim() || undefined,
    discountAmount,
    friendDiscountAmount: friendDiscountAmount ?? discountAmount,
    status: 'active',
    createdAt: Date.now(),
  };
  await db.clientReferrals.add(record);
  return record;
}

export function getClientReferralLink(code: string, artistSlugOrId?: string, slug?: string): string {
  if (slug) {
    return `${window.location.origin}/r/${slug}`;
  }
  const base = artistSlugOrId
    ? `${window.location.origin}/book/${artistSlugOrId}`
    : `${window.location.origin}/book`;
  return `${base}?ref=${code}`;
}

export async function getReferralBySlug(slug: string): Promise<ClientReferralRecord | null> {
  return (await db.clientReferrals.where('slug').equals(slug).first()) || null;
}

export async function trackClientReferral(refCode: string, leadId: string): Promise<boolean> {
  const ref = await db.clientReferrals.where('code').equals(refCode).first();
  if (!ref || ref.status !== 'active') return false;

  // Just record the lead — don't mark as used yet.
  // Reward triggers after friend's session is paid.
  await db.clientReferrals.update(ref.id, {
    usedByLeadId: leadId,
  });
  return true;
}

export async function markReferralRewarded(code: string): Promise<boolean> {
  const ref = await db.clientReferrals.where('code').equals(code).first();
  if (!ref || ref.status !== 'active') return false;
  await db.clientReferrals.update(ref.id, {
    status: 'used',
    usedAt: Date.now(),
  });
  return true;
}

export async function getFriendDiscountByAppointment(appointmentId: string): Promise<{
  code: string;
  friendDiscount: number;
  referrerName?: string;
} | null> {
  const appt = await db.appointments.get(appointmentId);
  if (!appt?.projectId) return null;
  const lead = await db.leads.get(appt.projectId);
  if (!lead?.referrerCode) return null;
  const ref = await db.clientReferrals.where('code').equals(lead.referrerCode).first();
  if (!ref || ref.status !== 'active') return null;
  return {
    code: ref.code,
    friendDiscount: ref.friendDiscountAmount,
    referrerName: ref.referrerName,
  };
}

export async function getClientReferralStats(artistId: string): Promise<{
  total: number;
  used: number;
  active: number;
  totalDiscount: number;
  recent: ClientReferralRecord[];
}> {
  const all = await db.clientReferrals.where('artistId').equals(artistId).toArray();
  const used = all.filter(r => r.status === 'used');
  return {
    total: all.length,
    used: used.length,
    active: all.filter(r => r.status === 'active').length,
    totalDiscount: used.reduce((s, r) => s + r.discountAmount, 0),
    recent: all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20),
  };
}

export async function getReferralConfig(artistId: string): Promise<{ friendDiscount: number; referrerReward: number }> {
  const user = await db.users.get(artistId);
  if (user?.referralConfig) return user.referralConfig;
  return { friendDiscount: 50, referrerReward: 50 };
}

export async function saveReferralConfig(artistId: string, config: { friendDiscount: number; referrerReward: number }): Promise<void> {
  await db.users.update(artistId, { referralConfig: config });
}

export async function getActiveReferralForAppointment(artistId: string, clientId: string): Promise<ClientReferralRecord | null> {
  const refs = await db.clientReferrals
    .where({ artistId, clientId })
    .filter(r => r.status === 'active')
    .toArray();
  return refs.length > 0 ? refs[0] : null;
}

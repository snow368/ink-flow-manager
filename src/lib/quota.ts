import { db, type UserRecord } from '../db';

type PlanKey = 'free' | 'pro' | 'plus';

type Quota = {
  monthlyMessages: number;
  storageMb: number;
};

const QUOTA_BY_PLAN: Record<PlanKey, Quota> = {
  free: { monthlyMessages: 0, storageMb: 0 },
  pro: { monthlyMessages: 200, storageMb: 50 * 1024 },
  plus: { monthlyMessages: 1500, storageMb: 200 * 1024 },
};

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function messageCounterKey(artistId: string) {
  return `inkflow_msg_usage_${artistId}_${currentMonthKey()}`;
}

function resolvePlan(user?: UserRecord | null): PlanKey {
  if (!user) return 'free';
  if (user.plan === 'plus') return 'plus';
  if (user.plan === 'pro') return 'pro';
  return 'free';
}

export function getQuotaForUser(user?: UserRecord | null): Quota {
  return QUOTA_BY_PLAN[resolvePlan(user)];
}

export function getUsedMessagesThisMonth(artistId: string): number {
  return Number(localStorage.getItem(messageCounterKey(artistId)) || '0');
}

export function canConsumeMessage(user: UserRecord | null, artistId: string, amount = 1): { ok: boolean; quota: number; used: number } {
  const quota = getQuotaForUser(user).monthlyMessages;
  const used = getUsedMessagesThisMonth(artistId);
  if (quota <= 0) return { ok: false, quota, used };
  return { ok: used + amount <= quota, quota, used };
}

export function consumeMessage(user: UserRecord | null, artistId: string, amount = 1) {
  const check = canConsumeMessage(user, artistId, amount);
  if (!check.ok) return false;
  localStorage.setItem(messageCounterKey(artistId), String(check.used + amount));
  return true;
}

function estimateBase64Bytes(dataUrl: string): number {
  const idx = dataUrl.indexOf(',');
  const base64 = idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
  return Math.floor((base64.length * 3) / 4);
}

export async function estimateArtistStorageMb(artistId: string): Promise<number> {
  const leads = await db.leads.where('artistId').equals(artistId).toArray();
  const revisions = await db.leadRevisions.toArray();
  const portfolio = await db.portfolio.where('artistId').equals(artistId).toArray();
  let bytes = 0;
  for (const l of leads) {
    for (const x of l.referenceImages || []) bytes += estimateBase64Bytes(x);
    for (const x of l.paymentProofImages || []) bytes += estimateBase64Bytes(x);
  }
  for (const r of revisions) {
    const lead = leads.find(x => x.id === r.leadId);
    if (!lead || lead.artistId !== artistId) continue;
    for (const x of r.referenceImages || []) bytes += estimateBase64Bytes(x);
  }
  for (const p of portfolio) {
    if (p.imageUrl?.startsWith('data:')) bytes += estimateBase64Bytes(p.imageUrl);
    if (p.thumbnailUrl?.startsWith('data:')) bytes += estimateBase64Bytes(p.thumbnailUrl);
  }
  return bytes / (1024 * 1024);
}

export async function canAddStorage(user: UserRecord | null, artistId: string, incomingBytes: number): Promise<{ ok: boolean; quotaMb: number; usedMb: number }> {
  const quotaMb = getQuotaForUser(user).storageMb;
  const usedMb = await estimateArtistStorageMb(artistId);
  const incomingMb = incomingBytes / (1024 * 1024);
  if (quotaMb <= 0) return { ok: false, quotaMb, usedMb };
  return { ok: usedMb + incomingMb <= quotaMb, quotaMb, usedMb };
}

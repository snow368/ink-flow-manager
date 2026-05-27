import { db, type UserRecord } from '../db';

type PlanKey = 'free' | 'solo' | 'pro' | 'pro_plus';

type Quota = {
  storageMb: number;
};

const QUOTA_BY_PLAN: Record<PlanKey, Quota> = {
  free: { storageMb: 0 },
  solo: { storageMb: 10 * 1024 },
  pro: { storageMb: 50 * 1024 },
  pro_plus: { storageMb: 200 * 1024 },
};

function resolvePlan(user?: UserRecord | null): PlanKey {
  if (!user) return 'free';
  if (user.plan === 'pro_plus') return 'pro_plus';
  if (user.plan === 'pro') return 'pro';
  if (user.plan === 'solo') return 'solo';
  return 'free';
}

export function getQuotaForUser(user?: UserRecord | null): Quota {
  return QUOTA_BY_PLAN[resolvePlan(user)];
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

function estimateBase64Bytes(dataUrl: string): number {
  const idx = dataUrl.indexOf(',');
  const base64 = idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
  return Math.floor((base64.length * 3) / 4);
}

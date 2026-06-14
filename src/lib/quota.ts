import { db, type UserRecord } from '../db';
import { getApiBaseUrl } from './backendApi';

type PlanKey = 'free' | 'solo' | 'pro' | 'pro_plus';

type Quota = {
  storageMb: number;
};

// Fallback quota limits (used when server is unreachable)
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

function getQuotaForUser(user?: UserRecord | null): Quota {
  return QUOTA_BY_PLAN[resolvePlan(user)];
}

function getApiSecret(): string {
  return localStorage.getItem('inkflow_api_secret') || localStorage.getItem('inkflow_backend_secret') || '';
}

function getBaseUrl(): string {
  return getApiBaseUrl();
}

// ── Local fallback: estimate storage from IndexedDB ──

function estimateBase64Bytes(dataUrl: string): number {
  const idx = dataUrl.indexOf(',');
  const base64 = idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
  return Math.floor((base64.length * 3) / 4);
}

async function estimateArtistStorageMbLocal(artistId: string): Promise<number> {
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

// ── Server-side quota API ──

interface QuotaResult {
  ok: boolean;
  quotaMb: number;
  usedMb: number;
  plan?: string;
}

async function fetchQuotaFromServer(artistId: string): Promise<QuotaResult | null> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/quota/${encodeURIComponent(artistId)}`, {
      headers: { 'x-api-secret': getApiSecret() },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      ok: true,
      quotaMb: data.storageLimitMb,
      usedMb: data.storageUsedMb,
      plan: data.plan,
    };
  } catch {
    return null; // server unreachable, fall back to local
  }
}

async function checkQuotaOnServer(artistId: string, incomingBytes: number): Promise<QuotaResult | null> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/quota/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-secret': getApiSecret() },
      body: JSON.stringify({ artistId, incomingBytes }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function reportUsageToServer(artistId: string, plan: PlanKey, deltaBytes: number): Promise<void> {
  try {
    const baseUrl = getBaseUrl();
    await fetch(`${baseUrl}/api/quota/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-secret': getApiSecret() },
      body: JSON.stringify({ artistId, plan, deltaBytes }),
    });
  } catch {
    // silently ignore — server-side tracking will catch up on next check
  }
}

// ── Public API ──

/**
 * Check if adding `incomingBytes` of storage would exceed the artist's quota.
 * Uses server-side check when available, falls back to local estimation.
 */
export async function canAddStorage(
  user: UserRecord | null,
  artistId: string,
  incomingBytes: number,
): Promise<{ ok: boolean; quotaMb: number; usedMb: number }> {
  // Try server-side quota check first
  const serverResult = await checkQuotaOnServer(artistId, incomingBytes);
  if (serverResult) {
    return { ok: serverResult.ok, quotaMb: serverResult.quotaMb, usedMb: serverResult.usedMb };
  }

  // Fall back to local estimation
  const quotaMb = getQuotaForUser(user).storageMb;
  const usedMb = await estimateArtistStorageMbLocal(artistId);
  const incomingMb = incomingBytes / (1024 * 1024);
  if (quotaMb <= 0) return { ok: false, quotaMb, usedMb };
  return { ok: usedMb + incomingMb <= quotaMb, quotaMb, usedMb };
}

/**
 * Report storage usage change to the server after adding/removing images.
 * Safe to call after uploads — errors are silently handled.
 */
export async function reportStorageDelta(
  artistId: string,
  plan: PlanKey,
  deltaBytes: number,
): Promise<void> {
  return reportUsageToServer(artistId, plan, deltaBytes);
}

/**
 * Fetch current storage usage and quota from the server.
 * Falls back to local estimate if server is unreachable.
 */
export async function getStorageUsage(
  user: UserRecord | null,
  artistId: string,
): Promise<{ quotaMb: number; usedMb: number }> {
  const serverResult = await fetchQuotaFromServer(artistId);
  if (serverResult) {
    return { quotaMb: serverResult.quotaMb, usedMb: serverResult.usedMb };
  }

  // Fallback
  const quotaMb = getQuotaForUser(user).storageMb;
  const usedMb = await estimateArtistStorageMbLocal(artistId);
  return { quotaMb, usedMb };
}

/**
 * (Legacy) Directly get quota for a user from local plan data.
 */
export { getQuotaForUser };

import { db, type ReferralRecord, type UserRecord } from '../db';

const PLAN_MONTHLY_PRICE: Record<string, number> = {
  free: 0,
  solo: 9.9,
  pro: 29.9,
  pro_plus: 39.9,
};

/**
 * 获取邀请双方各得的免单月数
 */
export function getRewardMonths(): number {
  return 1;
}

/**
 * 生成邀请码（基于用户ID的短哈希）
 */
export function generateReferralCode(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6).toUpperCase();
}

/**
 * 获取当前用户邀请码
 */
export async function getMyReferralCode(): Promise<string> {
  const userId = localStorage.getItem('inkflow_current_user');
  if (!userId) return '';
  return generateReferralCode(userId);
}

/**
 * 获取邀请链接
 */
export function getReferralLink(code: string): string {
  return `${window.location.origin}/register?ref=${code}`;
}

/**
 * 获取分享文案
 */
export function getReferralShareText(): string {
  return 'Join me on InkFlow — the tattoo studio management app. Use my link and we both get 1 month free!';
}

/**
 * 创建邀请记录
 */
export async function createReferral(
  inviterId: string,
  inviteeId: string,
  code: string
): Promise<void> {
  const now = Date.now();
  const id = 'ref_' + now + '_' + Math.random().toString(36).slice(2, 6);
  await db.referrals.add({
    id,
    inviterId,
    inviteeId,
    status: 'pending',
    rewardGranted: false,
    createdAt: now,
  });
}

/**
 * 完成邀请（被邀请人认证后调用）
 * 双方各得 1 个月免单 credit
 */
export async function completeReferral(inviteeId: string): Promise<void> {
  const referral = await db.referrals.where('inviteeId').equals(inviteeId).first();
  if (!referral) return;

  await db.referrals.update(referral.id, { status: 'verified', rewardGranted: true });

  // 推荐人：+1 个月 credit（按自己当前 plan）
  const inviter = await db.users.get(referral.inviterId);
  if (inviter) {
    grantFreeMonth(inviter);
  }

  // 被推荐人：首月免单（走注册流程时 handled）
}

/**
 * 给用户加 1 个月免单 credit
 */
export async function grantFreeMonth(user: UserRecord): Promise<void> {
  const current = user.b2bCreditMonths || 0;
  await db.users.update(user.id, { b2bCreditMonths: current + 1 });
}

/**
 * 消耗免单 credit（如结算时调用）
 */
export async function consumeFreeMonth(userId: string): Promise<boolean> {
  const user = await db.users.get(userId);
  if (!user) return false;
  const credits = user.b2bCreditMonths || 0;
  const used = user.b2bCreditUsed || 0;
  if (credits <= used) return false;
  await db.users.update(userId, { b2bCreditUsed: used + 1 });
  return true;
}

/**
 * 获取当前用户的邀请统计
 */
export async function getReferralStats(userId: string): Promise<{
  totalInvited: number;
  verifiedCount: number;
  freeMonthsEarned: number;
  freeMonthsUsed: number;
  freeMonthsRemaining: number;
  referrals: ReferralRecord[];
}> {
  const user = await db.users.get(userId);
  const referrals = await db.referrals.where('inviterId').equals(userId).toArray();
  const verifiedCount = referrals.filter(r => r.status === 'verified' || r.status === 'rewarded').length;
  const freeMonthsEarned = user?.b2bCreditMonths || 0;
  const freeMonthsUsed = user?.b2bCreditUsed || 0;

  return {
    totalInvited: referrals.length,
    verifiedCount,
    freeMonthsEarned,
    freeMonthsUsed,
    freeMonthsRemaining: Math.max(0, freeMonthsEarned - freeMonthsUsed),
    referrals,
  };
}

/**
 * 获取本月排行榜（前5名）
 */
export async function getMonthlyLeaderboard(): Promise<
  { name: string; count: number; verified: boolean }[]
> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

  const allReferrals = await db.referrals
    .where('createdAt')
    .between(monthStart, monthEnd)
    .toArray();

  const counts = new Map<string, number>();
  for (const ref of allReferrals) {
    counts.set(ref.inviterId, (counts.get(ref.inviterId) || 0) + 1);
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const result = await Promise.all(
    sorted.map(async ([id, count]) => {
      const user = await db.users.get(id);
      return {
        name: user?.name || 'Unknown',
        count,
        verified: user?.verified || false,
      };
    })
  );

  return result;
}

/**
 * 获取当前用户的 pending referral（被别人邀请，还没验证）
 */
export async function getMyPendingReferral(): Promise<ReferralRecord | null> {
  const userId = localStorage.getItem('inkflow_current_user');
  if (!userId) return null;
  const ref = await db.referrals.where('inviteeId').equals(userId).first();
  if (!ref || ref.status !== 'pending') return null;
  return ref;
}

/**
 * 调用后端验证 Instagram 是否为纹身师账号
 */
const TATTOO_HANDLE_RE = /(shop|studio|tattoo|ink|irezumi|pierc|needle|tat2|tatto|tattooer|tattooartist|tattoos|_ink|ink_|tats_)/i;
const NON_TATTOO_HANDLE_RE = /^(wix|clairesstores|visionexpress|lovisajewellery)$/i;

function isLikelyTattooHandle(raw: string): boolean {
  const h = raw.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '').trim().toLowerCase();
  if (!h || h.length < 2) return false;
  if (NON_TATTOO_HANDLE_RE.test(h)) return false;
  return TATTOO_HANDLE_RE.test(h);
}

export async function verifyInstagramTattooArtist(handle: string): Promise<{ ok: boolean; score: number; verdict: string }> {
  // First try server-side validation
  const backendUrl = localStorage.getItem('inkflow_harvests_url') || 'http://localhost:3000';
  const url = handle.startsWith('http') ? handle : `https://instagram.com/${handle.replace(/^@/, '')}`;
  try {
    const res = await fetch(`${backendUrl}/api/instagram/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, shopType: 'shop' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok) return data;
    }
  } catch { /* fall through to local check */ }

  // Fallback: client-side handle heuristic
  const ok = isLikelyTattooHandle(handle);
  return { ok, score: ok ? 0.5 : 0, verdict: ok ? 'medium' : 'low' };
}

/**
 * 以当前用户身份完成邀请验证（自己是被邀请人）
 */
export async function completeMyReferral(instagramHandle?: string): Promise<void> {
  const userId = localStorage.getItem('inkflow_current_user');
  if (!userId) return;
  if (instagramHandle) {
    await db.users.update(userId, { instagramHandle, verified: true } as any);
  }
  await completeReferral(userId);
}

/**
 * 处理注册时的邀请码
 */
export async function processReferralOnRegister(
  newUserId: string,
  referralCode?: string
): Promise<void> {
  if (!referralCode) return;

  // 查找邀请码对应的用户
  const allUsers = await db.users.toArray();
  const inviter = allUsers.find(u => generateReferralCode(u.id) === referralCode);
  if (!inviter || inviter.id === newUserId) return;

  // 检查是否已被邀请过
  const existing = await db.referrals.where('inviteeId').equals(newUserId).first();
  if (existing) return;

  const now = Date.now();
  const id = 'ref_' + now + '_' + Math.random().toString(36).slice(2, 6);
  await db.referrals.add({
    id,
    inviterId: inviter.id,
    inviteeId: newUserId,
    status: 'pending',
    rewardGranted: false,
    createdAt: now,
  });
}

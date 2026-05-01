import { db, type ReferralRecord } from '../db';

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
 * 判断当前月份是否为双月（2/4/6/8/10/12）
 */
export function isDoubleMonth(): boolean {
  const month = new Date().getMonth() + 1;
  return month % 2 === 0;
}

/**
 * 计算奖励月数
 */
export function getRewardMonths(): number {
  return isDoubleMonth() ? 2 : 1;
}

/**
 * 获取邀请链接
 */
export function getReferralLink(code: string): string {
  return `${window.location.origin}/register?ref=${code}`;
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
 */
export async function completeReferral(inviteeId: string): Promise<void> {
  const referral = await db.referrals.where('inviteeId').equals(inviteeId).first();
  if (!referral) return;

  await db.referrals.update(referral.id, { status: 'verified' });

  const months = getRewardMonths();
  const inviter = await db.users.get(referral.inviterId);
  const invitee = await db.users.get(inviteeId);

  if (inviter) {
    const currentProDays = inviter.proDaysLeft || 0;
    await db.users.update(inviter.id, { proDaysLeft: currentProDays + months * 30 });
  }
  if (invitee) {
    const currentProDays = invitee.proDaysLeft || 0;
    await db.users.update(invitee.id, { proDaysLeft: currentProDays + months * 30 });
  }
}

/**
 * 获取当前用户的邀请统计
 */
export async function getReferralStats(userId: string): Promise<{
  totalInvited: number;
  verifiedCount: number;
  proDaysEarned: number;
  referrals: ReferralRecord[];
}> {
  const user = await db.users.get(userId);
  const referrals = await db.referrals.where('inviterId').equals(userId).toArray();
  const verifiedCount = referrals.filter(r => r.status === 'verified' || r.status === 'rewarded').length;
  const proDaysEarned = verifiedCount * (isDoubleMonth() ? 60 : 30);

  return {
    totalInvited: referrals.length,
    verifiedCount,
    proDaysEarned: user?.proDaysLeft || proDaysEarned,
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

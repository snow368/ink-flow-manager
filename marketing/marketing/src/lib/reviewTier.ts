import { db, type ClientRecord } from '../db';

export type ClientTier = 'vip' | 'regular' | 'new';

export interface TierConfig {
  tier: ClientTier;
  label: string;
  maxFollowUps: number;
  followUpIntervals: number[]; // days between follow-ups, ascending
}

export const TIER_CONFIGS: Record<ClientTier, TierConfig> = {
  vip: {
    tier: 'vip',
    label: 'VIP',
    maxFollowUps: 3,
    followUpIntervals: [3, 7, 14],
  },
  regular: {
    tier: 'regular',
    label: 'Regular',
    maxFollowUps: 2,
    followUpIntervals: [3, 10],
  },
  new: {
    tier: 'new',
    label: 'New',
    maxFollowUps: 1,
    followUpIntervals: [5],
  },
};

export async function getClientTier(clientId: string): Promise<ClientTier> {
  const client = await db.clients.get(clientId);
  if (!client) return 'new';
  return getClientTierFromRecord(client);
}

export function getClientTierFromRecord(client: ClientRecord): ClientTier {
  if (client.tags?.includes('vip') || (client.totalSpend && client.totalSpend >= 500)) {
    return 'vip';
  }
  return 'new';
}

export async function getClientTierWithAppointments(clientId: string): Promise<ClientTier> {
  const client = await db.clients.get(clientId);
  if (!client) return 'new';

  // Check explicit VIP signals
  if (client.tags?.includes('vip') || (client.totalSpend && client.totalSpend >= 500)) {
    return 'vip';
  }

  // Check appointment count for regular tier
  const completedCount = await db.appointments
    .where('clientId').equals(clientId)
    .filter(a => a.status === 'done')
    .count();

  if (completedCount >= 2) return 'regular';
  return 'new';
}

export function getFollowUpDelay(tier: ClientTier, followUpIndex: number): number {
  const config = TIER_CONFIGS[tier];
  if (followUpIndex < 0 || followUpIndex >= config.followUpIntervals.length) {
    return config.followUpIntervals[config.followUpIntervals.length - 1];
  }
  return config.followUpIntervals[followUpIndex];
}

export function canSendFollowUp(tier: ClientTier, currentFollowUpCount: number): boolean {
  return currentFollowUpCount < TIER_CONFIGS[tier].maxFollowUps;
}

export function shouldFollowUp(tier: ClientTier, invitedAt: number, currentFollowUpCount: number): boolean {
  if (!canSendFollowUp(tier, currentFollowUpCount)) return false;
  const delayDays = getFollowUpDelay(tier, currentFollowUpCount);
  const delayMs = delayDays * 24 * 60 * 60 * 1000;
  return Date.now() - invitedAt >= delayMs;
}

import { db } from '../db';

export async function getArtistCommissionRate(artistId: string): Promise<number | undefined> {
  const user = await db.users.get(artistId);
  return user?.commissionRate;
}

export function calculateCommission(total: number, rate: number): { artistShare: number; shopShare: number } {
  const artistShare = Math.round(total * rate / 100);
  const shopShare = total - artistShare;
  return { artistShare, shopShare };
}

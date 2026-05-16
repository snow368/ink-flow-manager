import { db, type WaitingListRecord } from '../db';

export function createWaitingListEntry(data: {
  artistId: string;
  name: string;
  phone?: string;
  email?: string;
  bodyPart?: string;
  style?: string;
  preferredDate?: string;
  preferredTime?: string;
  preferredContact?: WaitingListRecord['preferredContact'];
  note?: string;
}): Promise<string> {
  const id = 'wl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  return db.waitingList.add({
    id,
    artistId: data.artistId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    bodyPart: data.bodyPart,
    style: data.style,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
    preferredContact: data.preferredContact,
    status: 'waiting',
    note: data.note,
    createdAt: Date.now(),
  }).then(() => id);
}

export async function getWaitingList(artistId: string): Promise<WaitingListRecord[]> {
  return db.waitingList
    .where('artistId').equals(artistId)
    .filter(w => w.status === 'waiting' || w.status === 'offered')
    .sortBy('createdAt');
}

export async function getWaitingListCount(artistId: string): Promise<number> {
  return db.waitingList
    .where('artistId').equals(artistId)
    .filter(w => w.status === 'waiting')
    .count();
}

export async function offerSlot(waitingListId: string, date: string, time: string): Promise<void> {
  await db.waitingList.update(waitingListId, {
    status: 'offered',
    offeredDate: date,
    offeredTime: time,
  });
}

export async function acceptOffer(waitingListId: string): Promise<void> {
  await db.waitingList.update(waitingListId, { status: 'accepted' });
}

export async function declineOffer(waitingListId: string): Promise<void> {
  await db.waitingList.update(waitingListId, { status: 'declined' });
}

export async function expireOldEntries(daysThreshold: number = 60): Promise<void> {
  const cutoff = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;
  const old = await db.waitingList
    .filter(w => w.status === 'waiting' && w.createdAt < cutoff)
    .toArray();
  for (const entry of old) {
    await db.waitingList.update(entry.id, { status: 'expired' });
  }
}

export function getWaitingListWhatsAppUrl(entry: WaitingListRecord, artistWhatsappPhone?: string): string | null {
  const phone = artistWhatsappPhone?.replace(/[^\d+]/g, '') || '';
  if (!phone || !entry.phone) return null;
  const msg = encodeURIComponent(
    `Hi ${entry.name}, a slot opened up${entry.offeredDate ? ' on ' + new Date(entry.offeredDate + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}${entry.offeredTime ? ' at ' + entry.offeredTime : ''}. Would you like to book it?`
  );
  return `https://wa.me/${phone.replace(/^\+/, '')}?text=${msg}`;
}

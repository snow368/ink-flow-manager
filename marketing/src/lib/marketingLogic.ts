import { db, type ClientRecord } from '../db';

export async function evaluateAutoTags(artistId: string): Promise<void> {
  const clients = await db.clients.where('artistId').equals(artistId).toArray();
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
  const VIP_THRESHOLD = 100000; // $1000 in cents

  for (const client of clients) {
    const tags = new Set(client.tags || []);
    let changed = false;

    if (client.totalSpend && client.totalSpend >= VIP_THRESHOLD) {
      if (!tags.has('vip')) { tags.add('vip'); changed = true; }
    }
    if (client.createdAt && (now - client.createdAt < THIRTY_DAYS)) {
      if (!tags.has('new')) { tags.add('new'); changed = true; }
    }
    if (client.lastVisitAt && (now - client.lastVisitAt > NINETY_DAYS)) {
      if (!tags.has('at_risk')) { tags.add('at_risk'); changed = true; }
    } else if (tags.has('at_risk')) {
      tags.delete('at_risk'); changed = true;
    }

    if (changed) {
      await db.clients.update(client.id, { tags: Array.from(tags) });
    }
  }
}

export async function getClientsWithBirthdayToday(artistId: string): Promise<ClientRecord[]> {
  const today = new Date().toISOString().slice(5, 10); // "MM-DD"
  const clients = await db.clients.where('artistId').equals(artistId).toArray();
  return clients.filter(c => c.birthday && c.birthday.endsWith(today));
}

export async function getDormantClients(artistId: string, days = 90): Promise<ClientRecord[]> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const clients = await db.clients.where('artistId').equals(artistId).toArray();
  return clients.filter(c => {
    if (!c.lastVisitAt) return false;
    return c.lastVisitAt < cutoff;
  });
}

export async function getYearAwayClients(artistId: string): Promise<{ client: ClientRecord; monthsAway: number }[]> {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const clients = await db.clients.where('artistId').equals(artistId).toArray();
  const results: { client: ClientRecord; monthsAway: number }[] = [];

  for (const c of clients) {
    if (!c.lastVisitAt) continue;
    const daysAway = Math.floor((now - c.lastVisitAt) / DAY);
    if (daysAway >= 330 && daysAway <= 420) {
      results.push({ client: c, monthsAway: Math.round(daysAway / 30) });
    }
  }

  results.sort((a, b) => b.monthsAway - a.monthsAway);
  return results;
}

export async function getUpcomingBirthdays(artistId: string, withinDays = 7): Promise<ClientRecord[]> {
  const now = new Date();
  const clients = await db.clients.where('artistId').equals(artistId).toArray();

  return clients.filter(c => {
    if (!c.birthday) return false;
    const b = new Date(c.birthday);
    const thisYear = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    if (thisYear < now) thisYear.setFullYear(thisYear.getFullYear() + 1);
    const diffDays = Math.ceil((thisYear.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays >= 0 && diffDays <= withinDays;
  }).sort((a, b) => {
    const getDay = (c: ClientRecord) => {
      const bd = new Date(c.birthday!);
      const ty = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      if (ty < now) ty.setFullYear(ty.getFullYear() + 1);
      return Math.ceil((ty.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    };
    return getDay(a) - getDay(b);
  });
}

export function buildBirthdayMessage(client: ClientRecord): string {
  const name = client.name || 'there';
  return `Happy birthday, ${name}! 🎂 Hope you have an amazing day. If you've been thinking about your next piece, let's book it!`;
}

export function buildYearAwayMessage(client: ClientRecord, months: number): string {
  const name = client.name || 'there';
  return `Hey ${name}! It's been about ${months} months since your last visit. Got some new designs lately — come by anytime to check them out!`;
}

export function getWhatsAppLink(client: ClientRecord, message: string): string | null {
  if (!client.phone) return null;
  const clean = client.phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppBirthdayLink(client: ClientRecord): string | null {
  return getWhatsAppLink(client, buildBirthdayMessage(client));
}

export function getWhatsAppYearAwayLink(client: ClientRecord, months: number): string | null {
  return getWhatsAppLink(client, buildYearAwayMessage(client, months));
}

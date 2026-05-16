import { db, type ClientRecord } from '../db';

export interface DuplicateGroup {
  clients: ClientRecord[];
  matchType: 'phone' | 'email' | 'name_phone';
}

export async function findDuplicates(artistId: string): Promise<DuplicateGroup[]> {
  const all = await db.clients.where('artistId').equals(artistId).toArray();
  const groups: DuplicateGroup[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < all.length; i++) {
    if (seen.has(all[i].id)) continue;
    const group: ClientRecord[] = [all[i]];

    for (let j = i + 1; j < all.length; j++) {
      if (seen.has(all[j].id)) continue;
      if (isDuplicate(all[i], all[j])) {
        group.push(all[j]);
        seen.add(all[j].id);
      }
    }

    if (group.length > 1) {
      seen.add(all[i].id);
      groups.push({
        clients: group,
        matchType: getMatchType(all[i], group[1]),
      });
    }
  }

  return groups;
}

function isDuplicate(a: ClientRecord, b: ClientRecord): boolean {
  if (a.phone && b.phone && cleanPhone(a.phone) === cleanPhone(b.phone)) return true;
  if (a.email && b.email && a.email.toLowerCase().trim() === b.email.toLowerCase().trim()) return true;
  if (a.name.toLowerCase().trim() === b.name.toLowerCase().trim() && a.phone && b.phone && cleanPhone(a.phone) === cleanPhone(b.phone)) return true;
  return false;
}

function getMatchType(a: ClientRecord, b: ClientRecord): DuplicateGroup['matchType'] {
  if (a.phone && b.phone && cleanPhone(a.phone) === cleanPhone(b.phone)) return 'phone';
  if (a.email && b.email && a.email.toLowerCase().trim() === b.email.toLowerCase().trim()) return 'email';
  return 'name_phone';
}

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

export async function mergeClients(keepId: string, mergeIds: string[]): Promise<void> {
  const keep = await db.clients.get(keepId);
  if (!keep) return;

  for (const mergeId of mergeIds) {
    const other = await db.clients.get(mergeId);
    if (!other) continue;

    // Merge allergies
    if (other.allergies?.length) {
      const merged = new Set([...(keep.allergies || []), ...other.allergies]);
      keep.allergies = [...merged];
    }

    // Merge tags
    if (other.tags?.length) {
      const merged = new Set([...(keep.tags || []), ...other.tags]);
      keep.tags = [...merged];
    }

    // Merge notes
    if (other.notes) {
      keep.notes = keep.notes ? keep.notes + '\n---\n' + other.notes : other.notes;
    }

    // Take earlier birthday if present
    if (other.birthday && !keep.birthday) keep.birthday = other.birthday;

    // Sum spend
    keep.totalSpend = (keep.totalSpend || 0) + (other.totalSpend || 0);

    // Keep earlier createdAt
    if (other.createdAt < keep.createdAt) keep.createdAt = other.createdAt;

    // Keep most recent visit
    if ((other.lastVisitAt || 0) > (keep.lastVisitAt || 0)) keep.lastVisitAt = other.lastVisitAt;

    // Merge noShowCount
    keep.noShowCount = (keep.noShowCount || 0) + (other.noShowCount || 0);

    // Reassign appointments to kept client
    await db.appointments.where('clientId').equals(mergeId).modify({ clientId: keepId });
    await db.waitingList.where('clientId').equals(mergeId).modify({ clientId: keepId });
    await db.leads.where('name').equals(other.name).modify({ name: keep.name });

    // Delete merged client
    await db.clients.delete(mergeId);
  }

  await db.clients.put(keep);
}

export function checkAndSuggestMerge(
  newName: string,
  newPhone?: string,
  newEmail?: string,
  artistId?: string,
): Promise<ClientRecord[]> {
  return db.clients
    .filter(c => {
      if (artistId && c.artistId !== artistId) return false;
      if (newPhone && c.phone && cleanPhone(newPhone) === cleanPhone(c.phone)) return true;
      if (newEmail && c.email && newEmail.toLowerCase().trim() === c.email.toLowerCase().trim()) return true;
      return false;
    })
    .toArray();
}

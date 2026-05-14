import { db, type UserRecord, type StudioLocationRecord } from '../db';

const CURRENT_LOCATION_KEY = 'inkflow_current_location';

export async function getLocationArtistIds(locationId: string): Promise<string[]> {
  const users = await db.users.where('role').anyOf(['artist', 'pro', 'plus', 'staff']).toArray();
  return users.filter(u => u.assignedLocationIds?.includes(locationId)).map(u => u.id);
}

export async function getLocationsForUser(user: UserRecord): Promise<StudioLocationRecord[]> {
  if (user.role === 'owner') {
    return db.studioLocations.where('ownerId').equals(user.id).toArray();
  }
  const ids = user.assignedLocationIds;
  if (ids && ids.length > 0) {
    return db.studioLocations.where('id').anyOf(ids).toArray();
  }
  return [];
}

export async function getCurrentArtistIds(user: UserRecord | null): Promise<string[]> {
  if (!user) return [];
  const locId = getCurrentLocation();
  if (user.role === 'owner') {
    if (!locId || locId === 'all') return [user.id];
    const ids = await getLocationArtistIds(locId);
    return ids.length > 0 ? ids : [user.id];
  }
  if (user.artistId) return [user.artistId];
  return [user.id];
}

export function switchCurrentLocation(locationId: string): void {
  localStorage.setItem(CURRENT_LOCATION_KEY, locationId);
}

export function getCurrentLocation(): string | null {
  return localStorage.getItem(CURRENT_LOCATION_KEY) || null;
}

export async function getArtistIdsForLocation(locationId: string, ownerId: string): Promise<string[]> {
  const loc = await db.studioLocations.get(locationId);
  if (!loc || loc.ownerId !== ownerId) return [];
  const artistIds = await getLocationArtistIds(locationId);
  return artistIds;
}

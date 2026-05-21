import { db, type UserRecord, type StudioLocationRecord } from '../db';

const CURRENT_LOCATION_KEY = 'inkflow_current_location';

export async function getLocationArtistIds(locationId: string): Promise<string[]> {
  const users = (await db.users.toArray()).filter(u => u.roles?.some(r => ['artist', 'staff'].includes(r)));
  return users.filter(u => u.assignedLocationIds?.includes(locationId)).map(u => u.id);
}

export async function getLocationsForUser(user: UserRecord): Promise<StudioLocationRecord[]> {
  if (user.roles?.includes('owner')) {
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
  if (user.roles?.includes('owner')) {
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

export async function getUserCountry(): Promise<string | null> {
  const userId = localStorage.getItem('inkflow_current_user');
  if (!userId) return null;
  const user = await db.users.get(userId);
  return user?.country || null;
}

export function getUserCountrySync(): string | null {
  // Returns cached country if previously resolved, otherwise null
  const cached = localStorage.getItem('inkflow_user_country');
  return cached || null;
}

export function cacheUserCountry(country: string): void {
  localStorage.setItem('inkflow_user_country', country);
}

export async function getArtistIdsForLocation(locationId: string, ownerId: string): Promise<string[]> {
  const loc = await db.studioLocations.get(locationId);
  if (!loc || loc.ownerId !== ownerId) return [];
  const artistIds = await getLocationArtistIds(locationId);
  return artistIds;
}

/**
 * Consumable recommendation engine.
 * Silently accumulates session consumable data to build per-type recommendations.
 * Ready to surface in UI when enough data exists.
 */
import { db, type ConsumableUsage } from '../db';

interface ConsumableStats {
  itemId: string;
  name: string;
  count: number;         // how many sessions used this
  avgQuantity: number;   // average quantity per session
  lastUsedAt: number;
}

interface TypeProfile {
  stats: ConsumableStats[];
  totalSessions: number;
  updatedAt: number;
}

const PROFILE_KEY = 'inkflow_consumable_profiles';

// Load persisted profiles from localStorage
function loadProfiles(): Map<string, TypeProfile> {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    const map = new Map<string, TypeProfile>();
    for (const [k, v] of Object.entries(obj)) {
      map.set(k, v as TypeProfile);
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveProfiles(profiles: Map<string, TypeProfile>) {
  const obj: Record<string, TypeProfile> = {};
  for (const [k, v] of profiles) {
    obj[k] = v;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(obj));
}

// Normalize appointment type to a key
function typeKey(appointmentType?: string): string {
  return (appointmentType || 'general').toLowerCase().trim();
}

// Build profiles from all session data
export async function rebuildConsumableProfiles(): Promise<void> {
  const profiles = loadProfiles();
  const sessions = await db.sessions.toArray();
  const inventory = await db.inventory.toArray();
  const invMap = new Map(inventory.map(i => [i.id, i.name]));

  // Group sessions by appointment type
  const typeSessions = new Map<string, { consumables: ConsumableUsage[] }[]>();

  for (const s of sessions) {
    if (!s.consumables || s.consumables.length === 0) continue;
    let appType = 'general';
    try {
      const project = await db.projects.get(s.projectId);
      if (project?.style) appType = project.style;
      else if (s.appointmentId) {
        const app = await db.appointments.get(s.appointmentId);
        if (app?.type) appType = app.type;
      }
    } catch { /* use default */ }

    const key = typeKey(appType);
    if (!typeSessions.has(key)) typeSessions.set(key, []);
    typeSessions.get(key)!.push({ consumables: s.consumables });
  }

  // Build stats per type
  for (const [key, sessions] of typeSessions) {
    const itemMap = new Map<string, { count: number; totalQty: number; lastUsed: number }>();

    for (const s of sessions) {
      for (const c of s.consumables) {
        const existing = itemMap.get(c.itemId);
        if (existing) {
          existing.count++;
          existing.totalQty += c.quantity;
          existing.lastUsed = Math.max(existing.lastUsed, Date.now());
        } else {
          itemMap.set(c.itemId, { count: 1, totalQty: c.quantity, lastUsed: Date.now() });
        }
      }
    }

    const stats: ConsumableStats[] = [];
    for (const [itemId, data] of itemMap) {
      stats.push({
        itemId,
        name: invMap.get(itemId) || itemId,
        count: data.count,
        avgQuantity: Math.round(data.totalQty / data.count * 10) / 10,
        lastUsedAt: data.lastUsed,
      });
    }

    stats.sort((a, b) => b.count - a.count);
    profiles.set(key, { stats, totalSessions: sessions.length, updatedAt: Date.now() });
  }

  saveProfiles(profiles);
}

// Get top N recommended consumables for a given appointment type
export function getRecommendations(
  appointmentType?: string,
  limit = 4,
  minConfidence = 2, // need at least this many sessions
): { name: string; confidence: number }[] {
  const profiles = loadProfiles();
  const key = typeKey(appointmentType);
  const profile = profiles.get(key);

  if (!profile || profile.totalSessions < minConfidence) return [];

  return profile.stats
    .slice(0, limit)
    .map(s => ({
      name: s.name,
      confidence: Math.min(1, s.count / profile.totalSessions),
    }));
}

// Get last session consumables for a specific client (fast path)
export async function getClientLastConsumables(
  clientId: string,
  limit = 4,
): Promise<string[]> {
  const pastApps = await db.appointments
    .where('clientId').equals(clientId)
    .and(a => a.status === 'done')
    .toArray();

  if (pastApps.length === 0) return [];

  const pastSessions = await db.sessions
    .where('appointmentId').anyOf(pastApps.map(a => a.id))
    .reverse()
    .sortBy('startedAt');

  for (const s of pastSessions) {
    if (s.consumables && s.consumables.length > 0) {
      const inv = await db.inventory.toArray();
      const invMap = new Map(inv.map(i => [i.id, i.name]));
      return s.consumables.map(c => invMap.get(c.itemId) || c.itemId).slice(0, limit);
    }
  }

  return [];
}

// Check if we have enough data for a type
export function getProfileStats(appointmentType?: string): { totalSessions: number; itemCount: number } | null {
  const profiles = loadProfiles();
  const key = typeKey(appointmentType);
  const profile = profiles.get(key);
  if (!profile) return null;
  return { totalSessions: profile.totalSessions, itemCount: profile.stats.length };
}

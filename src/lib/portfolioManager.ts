import { db, type PortfolioRecord } from '../db';

export async function addSessionPhotosToPortfolio(
  artistId: string,
  clientId: string | undefined,
  sessionId: string,
  projectId: string | undefined,
  photoUrls: string[],
  makePublic = false,
): Promise<number> {
  let added = 0;
  const now = Date.now();
  for (let i = 0; i < photoUrls.length; i++) {
    const url = photoUrls[i];
    if (!url) continue;
    // Skip if already in portfolio (duplicate check by imageUrl + sessionId)
    const existing = await db.portfolio
      .where({ imageUrl: url })
      .filter(r => r.sessionId === sessionId)
      .first();
    if (existing) continue;

    await db.portfolio.add({
      id: `p_${now}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      artistId,
      clientId,
      sessionId,
      projectId,
      imageUrl: url,
      tags: [],
      isPublic: makePublic,
      consentForSocial: false,
      consentForPromotion: false,
      source: 'session',
      createdAt: now + i,
    });
    added++;
  }
  return added;
}

export async function getPortfolioGroupedBySession(artistId: string) {
  const items = await db.portfolio
    .where('artistId')
    .equals(artistId)
    .reverse()
    .sortBy('createdAt');

  // Get all referenced sessions
  const sessionIds = [...new Set(items.filter(i => i.sessionId).map(i => i.sessionId!))];
  const sessions = sessionIds.length > 0
    ? await db.sessions.where('id').anyOf(sessionIds).toArray()
    : [];
  const sessionMap = new Map(sessions.map(s => [s.id, s]));

  // Group by session
  const grouped: { sessionId: string; session: typeof sessions[0] | null; photos: PortfolioRecord[] }[] = [];
  const noSession: PortfolioRecord[] = [];

  for (const item of items) {
    if (item.sessionId) {
      let group = grouped.find(g => g.sessionId === item.sessionId);
      if (!group) {
        group = { sessionId: item.sessionId, session: sessionMap.get(item.sessionId) || null, photos: [] };
        grouped.push(group);
      }
      group.photos.push(item);
    } else {
      noSession.push(item);
    }
  }

  // Sort groups by session start date (newest first)
  grouped.sort((a, b) => (b.session?.startedAt || 0) - (a.session?.startedAt || 0));

  return { grouped, noSession };
}

export async function getPortfolioGroupedByClient(artistId: string) {
  const items = await db.portfolio
    .where('artistId')
    .equals(artistId)
    .reverse()
    .sortBy('createdAt');

  // Get all referenced clients
  const clientIds = [...new Set(items.filter(i => i.clientId).map(i => i.clientId!))];
  const clients = clientIds.length > 0
    ? await db.clients.where('id').anyOf(clientIds).toArray()
    : [];
  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Group by client
  const grouped: { clientId: string; clientName: string; photos: PortfolioRecord[] }[] = [];
  const noClient: PortfolioRecord[] = [];

  for (const item of items) {
    if (item.clientId) {
      let group = grouped.find(g => g.clientId === item.clientId);
      if (!group) {
        const client = clientMap.get(item.clientId);
        group = { clientId: item.clientId, clientName: client?.name || 'Unknown Client', photos: [] };
        grouped.push(group);
      }
      group.photos.push(item);
    } else {
      noClient.push(item);
    }
  }

  return { grouped, noClient };
}

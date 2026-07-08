import { db, type ReviewRecord } from '../db';

const GOOGLE_PLACES_API = 'https://maps.googleapis.com/maps/api/place/details/json';

export async function createReview(review: Omit<ReviewRecord, 'id' | 'createdAt'>): Promise<string> {
  const id = 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  await db.reviews.add({ ...review, id, createdAt: Date.now() });
  return id;
}

export async function getReviewsForArtist(artistId: string): Promise<ReviewRecord[]> {
  return db.reviews.where('artistId').equals(artistId).reverse().sortBy('createdAt');
}

export function getReviewStats(reviews: ReviewRecord[]): { avg: number; total: number; distribution: Record<number, number> } {
  const inkflow = reviews.filter(r => r.source === 'inkflow');
  const total = inkflow.length;
  if (total === 0) return { avg: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const sum = inkflow.reduce((s, r) => s + r.rating, 0);
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  inkflow.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
  return { avg: Math.round((sum / total) * 10) / 10, total, distribution: dist };
}

export async function syncGoogleReviews(artistId: string): Promise<number> {
  const user = await db.users.get(artistId);
  if (!user?.googlePlaceId) return 0;

  const apiKey = localStorage.getItem('inkflow_google_maps_key') || '';
  if (!apiKey) return 0;

  try {
    const url = `${GOOGLE_PLACES_API}?place_id=${user.googlePlaceId}&fields=reviews&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.result?.reviews?.length) return 0;

    const existing = await db.reviews.where({ artistId, source: 'google' }).toArray();
    const existingIds = new Set(existing.map(r => r.googleReviewId).filter(Boolean));

    let added = 0;
    for (const gr of data.result.reviews) {
      const reviewId = `${gr.author_name}_${gr.time}`;
      if (existingIds.has(reviewId)) continue;
      await db.reviews.add({
        id: 'grev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 4),
        artistId,
        clientId: '',
        clientName: gr.author_name || undefined,
        rating: gr.rating,
        text: gr.text || undefined,
        source: 'google',
        googleReviewId: reviewId,
        createdAt: (gr.time || Date.now()) * 1000,
      });
      added++;
    }
    return added;
  } catch {
    return 0;
  }
}

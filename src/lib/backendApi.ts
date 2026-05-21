const BACKEND_URL_KEY = 'inkflow_backend_url';
const API_SECRET_KEY = 'inkflow_backend_secret';

export function getBackendUrl(): string | null {
  return localStorage.getItem(BACKEND_URL_KEY);
}

export function setBackendConfig(url: string, secret: string) {
  localStorage.setItem(BACKEND_URL_KEY, url);
  localStorage.setItem(API_SECRET_KEY, secret);
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-secret': localStorage.getItem(API_SECRET_KEY) || '',
  };
}

function apiFetch(path: string, body: any): Promise<void> {
  const base = getBackendUrl();
  if (!base) return Promise.resolve();
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then(() => {}).catch(() => {});
}

export function syncArtistData(params: {
  artistId: string;
  appointments?: any[];
  clients?: any[];
  settings?: any;
  reminders?: Array<{
    id: string;
    artistId: string;
    clientId: string;
    appointmentId: string;
    to: string;
    body: string;
    sendAt: number;
    sent: boolean;
  }>;
  portfolio?: Array<{
    id: string;
    thumbnailUrl?: string;
    tags: string[];
    createdAt: number;
  }>;
}): Promise<void> {
  return apiFetch('/api/sync', params);
}

export function getCalendarSubscriptionUrl(artistId: string): string {
  const base = getBackendUrl();
  if (!base) return '';
  return `${base}/api/calendar/${artistId}`;
}

export async function getOwnerArtists(): Promise<any[]> {
  const base = getBackendUrl();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/owner/artists`, { headers: authHeaders() });
    const data = await res.json();
    return data.artists || [];
  } catch { return []; }
}

export async function getOwnerArtistData(artistId: string): Promise<any> {
  const base = getBackendUrl();
  if (!base) return {};
  try {
    const res = await fetch(`${base}/api/owner/artist/${artistId}`, { headers: authHeaders() });
    return await res.json();
  } catch { return {}; }
}

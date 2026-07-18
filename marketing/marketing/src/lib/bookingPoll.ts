import { getBackendUrl } from './backendApi';

function authHeaders(): Record<string, string> {
  return {
    'x-api-secret': localStorage.getItem('inkflow_backend_secret') || '',
  };
}

export interface PendingBooking {
  id: string;
  artistId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  idea?: string;
  createdAt: number;
  status: string;
  paymentLink?: string;
  paidAt?: number;
}

export async function pollPendingBookings(artistId: string): Promise<PendingBooking[]> {
  const base = getBackendUrl();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/booking/${artistId}/pending`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function ackBooking(artistId: string, bookingId: string): Promise<void> {
  const base = getBackendUrl();
  if (!base) return;
  try {
    await fetch(`${base}/api/booking/${artistId}/${bookingId}/ack`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch {}
}

export async function acceptBookingApi(artistId: string, bookingId: string): Promise<{ ok: boolean; paymentLink?: string }> {
  const base = getBackendUrl();
  if (!base) return { ok: false };
  try {
    const res = await fetch(`${base}/api/booking/${artistId}/${bookingId}/accept`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export async function getBookingStatus(artistId: string, bookingId: string): Promise<PendingBooking | null> {
  const base = getBackendUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/booking/${artistId}/${bookingId}/status`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getBookingShareUrl(artistId: string): string {
  const base = getBackendUrl();
  return base ? `${base}/book/${artistId}` : '';
}

export function getBookingStatusUrl(artistId: string, bookingId: string): string {
  const base = getBackendUrl();
  return base ? `${base}/book/${artistId}?bid=${bookingId}` : '';
}

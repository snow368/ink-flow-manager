import { getApiBaseUrl } from './backendApi';

function getBaseUrl(): string {
  return getApiBaseUrl();
}

function getApiSecret(): string {
  return localStorage.getItem('inkflow_api_secret') || '';
}

export async function uploadImage(artistId: string, file: File): Promise<string> {
  const baseUrl = getBaseUrl();
  const formData = new FormData();
  formData.append('artistId', artistId);
  formData.append('file', file);

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { 'x-api-secret': getApiSecret() },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }

  const data = await res.json();
  return `${baseUrl}${data.url}`;
}

export async function deleteImage(url: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const prefix = `${baseUrl}/api/media/`;
  if (!url.startsWith(prefix)) return; // not an R2 URL, skip

  const key = url.slice(prefix.length);
  const res = await fetch(`${baseUrl}/api/media/${key}`, {
    method: 'DELETE',
    headers: { 'x-api-secret': getApiSecret() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Delete failed');
  }
}

export async function getStorageUsedBytes(artistId: string): Promise<number> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/storage/usage?artistId=${encodeURIComponent(artistId)}`, {
    headers: { 'x-api-secret': getApiSecret() },
  });

  if (!res.ok) return 0;
  const data = await res.json();
  return data.bytesUsed || 0;
}

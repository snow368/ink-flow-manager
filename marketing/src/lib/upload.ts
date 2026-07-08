// ============================================================
// Image upload helper — R2 via Worker API
// Replaces all readAsDataURL / base64 patterns
// ============================================================

import { getBackendUrl } from './backendApi';

let uploadCache = new Map<string, string>();

/** Upload a file to R2, return public URL */
export async function uploadImage(file: File, artistId?: string): Promise<string> {
  const backendUrl = getBackendUrl();
  const secret = localStorage.getItem('inkflow_api_secret') || '';
  const uid = artistId || localStorage.getItem('inkflow_current_user') || '';

  // Check cache (same file by name+size+lastModified)
  const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
  const cached = uploadCache.get(cacheKey);
  if (cached) return cached;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('artistId', uid);

  const res = await fetch(`${backendUrl}/api/upload`, {
    method: 'POST',
    headers: { 'x-api-secret': secret },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  const { url } = await res.json();
  uploadCache.set(cacheKey, url);
  return url;
}

/** Upload multiple files, return URLs */
export async function uploadImages(files: File[], artistId?: string): Promise<string[]> {
  return Promise.all(Array.from(files).map(f => uploadImage(f, artistId)));
}

/** Get full image URL from a key or partial URL */
export function imageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative path: /api/media/artistId/img.jpg
  const backendUrl = getBackendUrl();
  return `${backendUrl}${path.startsWith('/') ? '' : '/api/media/'}${path}`;
}

/** Clear upload cache (call on logout) */
export function clearUploadCache() {
  uploadCache.clear();
}

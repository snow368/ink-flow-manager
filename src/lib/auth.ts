/**
 * Hash password for local storage / offline auth.
 * Uses crypto.subtle when available (HTTPS), falls back to a simple hash.
 * Server-side auth uses bcrypt/PBKDF2 — this is only for local IndexedDB matching.
 */

export async function hashPassword(password: string): Promise<string> {
  /* Try Web Crypto API (requires HTTPS — Safari private mode may lack this) */
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      /* crypto.subtle failed (Safari HTTP etc.) — fall through */
    }
  }

  /* Fallback: simple non-crypto hash for local-only matching */
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'local_' + Math.abs(hash).toString(16).padStart(8, '0') + '_' + password.length;
}

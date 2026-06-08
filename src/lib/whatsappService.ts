import { db } from '../db';

const KEYS = {
  apiKey: 'inkflow_ycloud_api_key',
  fromNumber: 'inkflow_ycloud_from',
};

/** YCloud API base URL */
const BASE = 'https://api.ycloud.com/v2';

// ── Config ──

export function getYCloudConfig(): { apiKey: string; fromNumber: string } | null {
  try {
    const apiKey = localStorage.getItem(KEYS.apiKey);
    const fromNumber = localStorage.getItem(KEYS.fromNumber);
    if (apiKey && fromNumber) return { apiKey, fromNumber };
  } catch {}
  return null;
}

export function setYCloudConfig(apiKey: string, fromNumber: string) {
  localStorage.setItem(KEYS.apiKey, apiKey);
  localStorage.setItem(KEYS.fromNumber, fromNumber);
}

export function clearYCloudConfig() {
  localStorage.removeItem(KEYS.apiKey);
  localStorage.removeItem(KEYS.fromNumber);
}

/** Check if WhatsApp is configured (global keys exist) */
export function isWhatsAppConfigured(): boolean {
  return getYCloudConfig() !== null;
}

/** Check if a specific artist has WhatsApp enabled */
export async function isWhatsAppEnabledForArtist(artistId: string): Promise<boolean> {
  const user = await db.users.get(artistId);
  return !!(user && (user as any).whatsappEnabled && user.whatsappPhone);
}

// ── Send helpers ──

async function request(method: string, path: string, body?: unknown): Promise<any> {
  const config = getYCloudConfig();
  if (!config) throw new Error('YCloud not configured');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error?.message || err.error || 'YCloud API error');
  }

  return res.json();
}

/**
 * Send a plain text message to a customer.
 * Only works within the 24h conversation window.
 */
export async function sendWhatsAppText(
  to: string,
  text: string,
  context?: { previewUrl?: boolean; externalId?: string },
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const config = getYCloudConfig();
  if (!config) return { ok: false, error: 'YCloud not configured' };

  try {
    const data = await request('POST', '/whatsapp/messages', {
      from: config.fromNumber,
      to,
      type: 'text',
      text: { body: text, preview_url: context?.previewUrl ?? false },
      externalId: context?.externalId,
    });
    return { ok: true, messageId: data.id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Send a template message (for proactive outreach outside 24h window).
 * Template must be pre-approved by Meta.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  langCode: string,
  parameters?: { header?: string[]; body?: string[] },
  externalId?: string,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const config = getYCloudConfig();
  if (!config) return { ok: false, error: 'YCloud not configured' };

  const components: any[] = [];
  if (parameters?.header) {
    components.push({
      type: 'header',
      parameters: parameters.header.map(v => ({ type: 'text', text: v })),
    });
  }
  if (parameters?.body) {
    components.push({
      type: 'body',
      parameters: parameters.body.map(v => ({ type: 'text', text: v })),
    });
  }

  try {
    const data = await request('POST', '/whatsapp/messages', {
      from: config.fromNumber,
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: langCode },
        components: components.length > 0 ? components : undefined,
      },
      externalId,
    });
    return { ok: true, messageId: data.id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// ── Test connection ──

export async function testWhatsAppConnection(): Promise<{ ok: boolean; error?: string }> {
  const config = getYCloudConfig();
  if (!config) return { ok: false, error: 'YCloud not configured' };

  try {
    // List WhatsApp business accounts to verify the API key works
    await request('GET', '/whatsapp/businessAccounts');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

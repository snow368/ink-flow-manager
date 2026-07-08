import { db } from '../db';

const KEYS = {
  key: 'inkflow_sendgrid_key',
  from: 'inkflow_sendgrid_from',
};

export function getSendGridConfig() {
  try {
    const apiKey = localStorage.getItem(KEYS.key);
    const fromEmail = localStorage.getItem(KEYS.from);
    if (apiKey && fromEmail) return { apiKey, fromEmail };
  } catch {}
  return null;
}

export function setSendGridConfig(apiKey: string, fromEmail: string) {
  localStorage.setItem(KEYS.key, apiKey);
  localStorage.setItem(KEYS.from, fromEmail);
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  context: { artistId: string; clientId?: string; appointmentId?: string }
): Promise<{ ok: boolean; error?: string }> {
  const config = getSendGridConfig();
  if (!config) return { ok: false, error: 'SendGrid not configured' };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.fromEmail },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
    });

    if (res.status !== 202) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      const errors = (err as any).errors;
      const msg = errors?.length ? errors.map((e: any) => e.message).join(', ') : `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }

    await db.communicationLog.add({
      id: 'comm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      artistId: context.artistId,
      clientId: context.clientId,
      appointmentId: context.appointmentId,
      channel: 'email',
      direction: 'auto',
      templateType: 'reminder_sent',
      message: `${subject}: ${body}`.slice(0, 500),
      cost: 0,
      createdAt: Date.now(),
    });

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function testEmailConnection(to: string): Promise<{ ok: boolean; error?: string }> {
  const config = getSendGridConfig();
  if (!config) return { ok: false, error: 'SendGrid not configured' };
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.fromEmail },
        subject: 'Ink Flow - Email Test',
        content: [{ type: 'text/plain', value: 'Your SendGrid is working. This is a test from Ink Flow Manager.' }],
      }),
    });
    if (res.status !== 202) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { ok: false, error: (err as any).errors?.[0]?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

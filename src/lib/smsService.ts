import { db } from '../db';
import { getBackendUrl } from './backendApi';

const KEYS = {
  sid: 'inkflow_twilio_sid',
  token: 'inkflow_twilio_token',
  from: 'inkflow_twilio_from',
};

export interface SmsPack {
  id: string;
  amount: number;
  price: number;
  label: string;
}

export interface SmsConfig {
  freeTierLimit: number;
  freeTrialDays: number;
  freeTrialMaxPerDay: number;
  twilioCost: number;
  packs: SmsPack[];
}

const DEFAULT_CONFIG: SmsConfig = {
  freeTierLimit: 5,
  freeTrialDays: 3,
  freeTrialMaxPerDay: 3,
  twilioCost: 0.0075,
  packs: [
    { id: 'sms_30', amount: 30, price: 0.30, label: 'S — 30 SMS / $0.30' },
    { id: 'sms_100', amount: 100, price: 1.00, label: 'M — 100 SMS / $1.00' },
    { id: 'sms_300', amount: 300, price: 3.00, label: 'L — 300 SMS / $3.00' },
    { id: 'sms_1000', amount: 1000, price: 10.00, label: 'XL — 1000 SMS / $10.00' },
  ],
};

let _cachedConfig: SmsConfig | null = null;
let _configPromise: Promise<SmsConfig> | null = null;

export async function getSmsConfig(): Promise<SmsConfig> {
  if (_cachedConfig) return _cachedConfig;
  if (_configPromise) return _configPromise;

  _configPromise = (async () => {
    const base = getBackendUrl();
    if (!base) return DEFAULT_CONFIG;
    try {
      const res = await fetch(`${base}/api/config/sms`);
      if (!res.ok) return DEFAULT_CONFIG;
      const config: SmsConfig = await res.json();
      _cachedConfig = config;
      return config;
    } catch {
      return DEFAULT_CONFIG;
    }
  })();

  const config = await _configPromise;
  _configPromise = null;
  return config;
}

export function getCachedSmsConfig(): SmsConfig {
  return _cachedConfig || DEFAULT_CONFIG;
}

export function getTwilioConfig() {
  try {
    const sid = localStorage.getItem(KEYS.sid);
    const token = localStorage.getItem(KEYS.token);
    const from = localStorage.getItem(KEYS.from);
    if (sid && token && from) return { accountSid: sid, authToken: token, fromNumber: from };
  } catch {}
  return null;
}

export function setTwilioConfig(sid: string, token: string, fromNumber: string) {
  localStorage.setItem(KEYS.sid, sid);
  localStorage.setItem(KEYS.token, token);
  localStorage.setItem(KEYS.from, fromNumber);
}

async function checkCredits(
  user: { id: string; plan?: string; smsFreeUsed?: number; smsCredits?: number; smsFreeUntil?: number; smsUsedToday?: number; smsLastDate?: string }
): Promise<{ ok: boolean; error?: string; creditsLeft?: number }> {
  const config = await getSmsConfig();
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const plan = user.plan || 'free';

  if (plan === 'free') {
    const used = user.smsFreeUsed || 0;
    if (used >= config.freeTierLimit) {
      return { ok: false, error: `${config.freeTierLimit} free messages used. Auto-send saves ~5 hrs/month on manual sends. Upgrade to unlock — $3.50/mo.`, creditsLeft: 0 };
    }
    await db.users.update(user.id, { smsFreeUsed: used + 1 });
  } else {
    const smsUsedToday = user.smsLastDate === today ? (user.smsUsedToday || 0) : 0;
    if (user.smsFreeUntil && now < user.smsFreeUntil) {
      if (smsUsedToday >= config.freeTrialMaxPerDay) {
        const creditsLeft = user.smsCredits || 0;
        return { ok: false, error: `Free trial limit: ${config.freeTrialMaxPerDay}/day. Buy SMS pack to continue.`, creditsLeft };
      }
      await db.users.update(user.id, { smsUsedToday: smsUsedToday + 1, smsLastDate: today });
    } else {
      const credits = user.smsCredits || 0;
      if (credits <= 0) {
        return { ok: false, error: 'No SMS credits left. Buy an SMS pack to continue.', creditsLeft: 0 };
      }
      await db.users.update(user.id, { smsCredits: credits - 1, smsUsedToday: smsUsedToday + 1, smsLastDate: today });
    }
    if (!user.smsFreeUntil && !user.smsCredits) {
      const freeEnd = now + config.freeTrialDays * 24 * 60 * 60 * 1000;
      await db.users.update(user.id, { smsFreeUntil: freeEnd, smsUsedToday: 1, smsLastDate: today });
    }
  }
  return { ok: true };
}

export async function sendSms(
  to: string,
  body: string,
  context: { artistId: string; clientId?: string; appointmentId?: string }
): Promise<{ ok: boolean; error?: string; creditsLeft?: number }> {

  const twilioConfig = getTwilioConfig();
  if (!twilioConfig) return { ok: false, error: 'Twilio not configured' };

  const user = await db.users.get(context.artistId);
  if (!user) return { ok: false, error: 'User not found' };

  const check = await checkCredits(user);
  if (!check.ok) return check;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`;
    const formBody = new URLSearchParams();
    formBody.append('To', to);
    formBody.append('From', twilioConfig.fromNumber);
    formBody.append('Body', body);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioConfig.accountSid}:${twilioConfig.authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { ok: false, error: (err as any).message || `HTTP ${res.status}` };
    }

    const config = getCachedSmsConfig();
    await db.communicationLog.add({
      id: 'comm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      artistId: context.artistId,
      clientId: context.clientId,
      appointmentId: context.appointmentId,
      channel: 'sms',
      direction: 'auto',
      templateType: 'reminder_sent',
      message: body.slice(0, 500),
      cost: config.twilioCost,
      createdAt: Date.now(),
    });

    const fresh = await db.users.get(context.artistId);
    return { ok: true, creditsLeft: fresh?.smsCredits };

  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function sendWhatsApp(
  to: string,
  body: string,
  context: { artistId: string; clientId?: string; appointmentId?: string }
): Promise<{ ok: boolean; error?: string; creditsLeft?: number }> {
  const twilioConfig = getTwilioConfig();
  if (!twilioConfig) return { ok: false, error: 'Twilio not configured' };

  const user = await db.users.get(context.artistId);
  if (!user) return { ok: false, error: 'User not found' };

  const check = await checkCredits(user);
  if (!check.ok) return check;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`;
    const formBody = new URLSearchParams();
    formBody.append('To', `whatsapp:${to.replace(/[^\d+]/g, '')}`);
    formBody.append('From', `whatsapp:${twilioConfig.fromNumber.replace(/[^\d+]/g, '')}`);
    formBody.append('Body', body);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioConfig.accountSid}:${twilioConfig.authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { ok: false, error: (err as any).message || `HTTP ${res.status}` };
    }

    const config = getCachedSmsConfig();
    await db.communicationLog.add({
      id: 'comm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      artistId: context.artistId,
      clientId: context.clientId,
      appointmentId: context.appointmentId,
      channel: 'whatsapp',
      direction: 'auto',
      templateType: 'reminder_sent',
      message: body.slice(0, 500),
      cost: config.twilioCost,
      createdAt: Date.now(),
    });

    const fresh = await db.users.get(context.artistId);
    return { ok: true, creditsLeft: fresh?.smsCredits };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function addSmsCredits(artistId: string, amount: number) {
  const user = await db.users.get(artistId);
  if (!user) return;
  const current = user.smsCredits || 0;
  await db.users.update(artistId, { smsCredits: current + amount });
}

export async function testSmsConnection(to: string): Promise<{ ok: boolean; error?: string }> {
  const twilioConfig = getTwilioConfig();
  if (!twilioConfig) return { ok: false, error: 'Twilio not configured' };
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`;
  const formBody = new URLSearchParams();
  formBody.append('To', to);
  formBody.append('From', twilioConfig.fromNumber);
  formBody.append('Body', 'Ink Flow: SMS test. Your Twilio is working.');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioConfig.accountSid}:${twilioConfig.authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { ok: false, error: (err as any).message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

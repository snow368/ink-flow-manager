import { Hono } from 'hono';
import { cors } from 'hono/cors';
import Stripe from 'stripe';
import { Env, initDB, generateId, now } from './db';

const app = new Hono<{ Bindings: Env }>();

// ---- Middleware ----
app.use('*', cors());
app.use('/api/stripe/webhook', async (c, next) => {
  // Raw body for stripe webhook signature verification
  const raw = await c.req.raw.clone().text();
  c.set('rawBody', raw);
  await next();
});
app.use('*', async (c, next) => {
  if (c.req.method === 'POST' || c.req.method === 'PUT') {
    try { c.req.json(); } catch {}
  }
  await next();
});

// ---- Auth helpers ----
function requireAuth(c: any, env: Env): boolean {
  const requireKey = String(env.REQUIRE_API_KEY || '').toLowerCase() === 'true';
  if (!requireKey) return true;
  const apiKey = env.SERVER_API_KEY;
  if (!apiKey) { c.status(500); c.json({ error: 'SERVER_API_KEY missing on server' }); return false; }
  const header = c.req.header('x-api-secret');
  if (!header || header !== apiKey) { c.status(401); c.json({ error: 'Unauthorized' }); return false; }
  return true;
}

function requireRole(c: any, ...roles: string[]): boolean {
  const role = c.req.header('x-user-role') || '';
  if (!roles.includes(role)) { c.status(403); c.json({ error: `Forbidden: requires role ${roles.join('/')}` }); return false; }
  return true;
}

async function audit(env: Env, action: string, payload: any = {}) {
  await env.DB.prepare(
    'INSERT INTO audit (id, action, payload, createdAt) VALUES (?, ?, ?, ?)'
  ).bind(generateId('audit'), action, JSON.stringify(payload), now()).run();
}

// ---- Health ----
app.get('/api/health', async (c) => {
  await initDB(c.env);
  return c.json({
    ok: true,
    stripeConfigured: Boolean(c.env.STRIPE_SECRET_KEY),
    requireApiKey: String(c.env.REQUIRE_API_KEY || '').toLowerCase() === 'true',
  });
});

app.get('/api/config/check', async (c) => {
  if (!requireAuth(c, c.env)) return;
  return c.json({
    stripeSecretKey: Boolean(c.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: Boolean(c.env.STRIPE_WEBHOOK_SECRET),
    serverApiKey: Boolean(c.env.SERVER_API_KEY),
    requireApiKey: String(c.env.REQUIRE_API_KEY || '').toLowerCase() === 'true',
    platformFeePercent: Number(c.env.STRIPE_PLATFORM_FEE_PERCENT || '0'),
  });
});

// =============================================
// Auth Routes — register & login via D1
// =============================================

app.post('/api/auth/register', async (c) => {
  try {
    const { email, name, passwordHash, studioName, roles, deviceId } = await c.req.json();
    if (!email || !passwordHash) { c.status(400); return c.json({ error: 'Email and password required' }); }
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) { c.status(409); return c.json({ error: 'Email already registered' }); }
    const id = generateId('user');
    const ts = now();
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, name, passwordHash, roles, studioName, deviceId, verified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
    ).bind(id, email, name || '', passwordHash, JSON.stringify(roles || []), studioName || '', deviceId || '', ts, ts).run();
    return c.json({ ok: true, userId: id });
  } catch (e: any) {
    c.status(500);
    return c.json({ error: e.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const { email, passwordHash, deviceId } = await c.req.json();
    if (!email || !passwordHash) { c.status(400); return c.json({ error: 'Email and password required' }); }
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) { c.status(404); return c.json({ error: 'No account found' }); }
    if (user.passwordHash !== passwordHash) { c.status(401); return c.json({ error: 'Wrong password' }); }
    if (deviceId) {
      await c.env.DB.prepare('UPDATE users SET deviceId = ?, updatedAt = ? WHERE id = ?').bind(deviceId, now(), user.id).run();
    }
    return c.json({
      ok: true, userId: user.id, email: user.email, name: user.name,
      roles: JSON.parse(user.roles || '[]'), plan: user.plan, studioName: user.studioName,
    });
  } catch (e: any) {
    c.status(500);
    return c.json({ error: e.message || 'Login failed' });
  }
});


// =============================================
// Stripe Routes
// =============================================

app.get('/api/stripe/payments/:artistId', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const artistId = c.req.param('artistId');
  const since = Number(c.req.query('since') || '0');
  let query = 'SELECT * FROM payments WHERE artistId = ?';
  const params: any[] = [artistId];
  if (since > 0) { query += ' AND createdAt > ?'; params.push(since); }
  query += ' ORDER BY createdAt DESC';
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ items: results || [] });
});

app.get('/api/ledger/:artistId', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'staff', 'artist')) return;
  const artistId = c.req.param('artistId');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM ledger WHERE artistId = ? ORDER BY updatedAt DESC'
  ).bind(artistId).all();
  return c.json({ items: results || [] });
});

app.post('/api/stripe/connect/account-link', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'artist')) return;
  try {
    const { artistId, email, country, refreshUrl, returnUrl } = await c.req.json();
    if (!artistId || !email || !refreshUrl || !returnUrl) {
      c.status(400); return c.json({ error: 'artistId, email, refreshUrl, returnUrl are required' });
    }
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-02-24.acacia', httpClient: Stripe.createFetchHttpClient() });

    // Check existing account
    const existing = await c.env.DB.prepare('SELECT accountId FROM accounts WHERE artistId = ?').bind(artistId).first();
    let accountId = existing?.accountId as string || '';

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: country || 'US',
        email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: 'individual',
        metadata: { artistId },
      });
      accountId = account.id;
      await c.env.DB.prepare(
        'INSERT OR REPLACE INTO accounts (artistId, accountId, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
      ).bind(artistId, accountId, email, now(), now()).run();
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    await audit(c.env, 'stripe_connect_account_link_created', { artistId, accountId });
    return c.json({ accountId, url: accountLink.url, expiresAt: accountLink.expires_at });
  } catch (error: any) {
    console.error('[connect/account-link]', error);
    c.status(500); return c.json({ error: error.message || 'Failed to create Stripe account link' });
  }
});

app.post('/api/stripe/checkout-session', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'staff', 'artist')) return;
  try {
    const { connectedAccountId, amount, currency = 'usd', leadId, clientName, artistId, successUrl, cancelUrl } = await c.req.json();
    if (!connectedAccountId || !amount || !successUrl || !cancelUrl) {
      c.status(400); return c.json({ error: 'connectedAccountId, amount, successUrl, cancelUrl are required' });
    }
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-02-24.acacia', httpClient: Stripe.createFetchHttpClient() });
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) { c.status(400); return c.json({ error: 'amount must be > 0' }); }
    const feePercent = Number(c.env.STRIPE_PLATFORM_FEE_PERCENT || '0');
    const feeAmount = Math.floor(amountCents * (feePercent / 100));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: { currency: String(currency).toLowerCase(), product_data: { name: `Tattoo Deposit${clientName ? ` - ${clientName}` : ''}` }, unit_amount: amountCents },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: { destination: connectedAccountId },
        metadata: { leadId: String(leadId || ''), artistId: String(artistId || ''), connectedAccountId: String(connectedAccountId) },
      },
      metadata: { leadId: String(leadId || ''), artistId: String(artistId || ''), connectedAccountId: String(connectedAccountId) },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    const paymentIntentId = String(session.payment_intent || '');
    await upsertLedger(c.env, { artistId: String(artistId || ''), leadId: String(leadId || ''), paymentIntentId, sessionId: session.id, status: 'checkout_created', amount: amountCents, currency: String(currency).toLowerCase(), channel: 'stripe_connect' });
    await audit(c.env, 'stripe_checkout_created', { artistId, leadId, sessionId: session.id });
    return c.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('[checkout-session]', error);
    c.status(500); return c.json({ error: error.message || 'Failed to create checkout session' });
  }
});

app.post('/api/stripe/client-deposit', async (c) => {
  try {
    const { artistId, amount, currency = 'usd', clientName, leadId, appointmentId, successUrl, cancelUrl } = await c.req.json();
    if (!artistId || !amount || !successUrl || !cancelUrl) { c.status(400); return c.json({ error: 'artistId, amount, successUrl, cancelUrl are required' }); }
    const existing = await c.env.DB.prepare('SELECT accountId FROM accounts WHERE artistId = ?').bind(artistId).first();
    const connectedAccountId = existing?.accountId as string || '';
    if (!connectedAccountId) { c.status(400); return c.json({ error: 'Artist has not connected Stripe yet' }); }
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-02-24.acacia', httpClient: Stripe.createFetchHttpClient() });
    const amountCents = Math.round(Number(amount) * 100);
    const feePercent = Number(c.env.STRIPE_PLATFORM_FEE_PERCENT || '0');
    const feeAmount = Math.floor(amountCents * (feePercent / 100));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: String(currency).toLowerCase(), product_data: { name: `Tattoo Deposit${clientName ? ` - ${clientName}` : ''}` }, unit_amount: amountCents }, quantity: 1 }],
      payment_intent_data: { application_fee_amount: feeAmount, transfer_data: { destination: connectedAccountId }, metadata: { leadId: String(leadId || ''), artistId: String(artistId), appointmentId: String(appointmentId || ''), connectedAccountId: String(connectedAccountId), source: 'client_booking' } },
      metadata: { leadId: String(leadId || ''), artistId: String(artistId), appointmentId: String(appointmentId || ''), connectedAccountId: String(connectedAccountId), source: 'client_booking' },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    const paymentIntentId = String(session.payment_intent || '');
    await upsertLedger(c.env, { artistId: String(artistId), leadId: String(leadId || ''), paymentIntentId, sessionId: session.id, status: 'checkout_created', amount: amountCents, currency: String(currency).toLowerCase(), channel: 'stripe_connect', appointmentId: String(appointmentId || '') });
    await audit(c.env, 'stripe_client_deposit_created', { artistId, leadId, appointmentId, sessionId: session.id });
    return c.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('[client-deposit]', error);
    c.status(500); return c.json({ error: error.message || 'Failed to create deposit session' });
  }
});

app.post('/api/stripe/refund', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner')) return;
  try {
    const { paymentIntentId, amount, reason, actor, leadId, artistId } = await c.req.json();
    if (!paymentIntentId) { c.status(400); return c.json({ error: 'paymentIntentId is required' }); }
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-02-24.acacia', httpClient: Stripe.createFetchHttpClient() });
    const refundPayload: any = { payment_intent: String(paymentIntentId) };
    if (amount && Number(amount) > 0) refundPayload.amount = Math.round(Number(amount) * 100);
    const refund = await stripe.refunds.create(refundPayload);
    await c.env.DB.prepare(
      'INSERT INTO payments (id, type, refundId, paymentIntentId, leadId, artistId, reason, actor, amountTotal, currency, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(generateId('refund_req'), 'refund_requested', refund.id, paymentIntentId, leadId || '', artistId || '', reason || '', actor || '', refund.amount || 0, refund.currency || 'usd', now()).run();
    await upsertLedger(c.env, { artistId: String(artistId || ''), leadId: String(leadId || ''), paymentIntentId: String(paymentIntentId), status: 'refund_requested', refundId: refund.id, refundReason: reason || '', refundedAmount: refund.amount || 0, currency: refund.currency || 'usd' });
    await audit(c.env, 'stripe_refund_requested', { artistId, leadId, paymentIntentId, refundId: refund.id, actor });
    return c.json({ ok: true, refundId: refund.id, status: refund.status });
  } catch (error: any) {
    console.error('[refund]', error);
    c.status(500); return c.json({ error: error.message || 'Failed to create refund' });
  }
});

// Stripe webhook
app.post('/api/stripe/webhook', async (c) => {
  try {
    const sig = c.req.header('stripe-signature');
    const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) { c.status(400); return c.text('Missing stripe signature or webhook secret'); }
    const rawBody = (c as any).get('rawBody') || '';
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-02-24.acacia', httpClient: Stripe.createFetchHttpClient() });
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // Dedup
    const seen = await c.env.DB.prepare('SELECT id FROM webhook_events WHERE id = ?').bind(event.id).first();
    if (seen) return c.json({ received: true, deduped: true });
    await c.env.DB.prepare('INSERT INTO webhook_events (id, createdAt) VALUES (?, ?)').bind(event.id, now()).run();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      await c.env.DB.prepare(
        'INSERT INTO payments (id, type, sessionId, paymentIntentId, leadId, artistId, connectedAccountId, amountTotal, currency, paymentStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(`pay_${session.id}`, 'deposit_paid', session.id, session.payment_intent || '', session.metadata?.leadId || '', session.metadata?.artistId || '', session.metadata?.connectedAccountId || '', session.amount_total || 0, session.currency || 'usd', session.payment_status || '', now()).run();
      await upsertLedger(c.env, { artistId: session.metadata?.artistId || '', leadId: session.metadata?.leadId || '', paymentIntentId: String(session.payment_intent || ''), sessionId: session.id, status: 'paid', amount: session.amount_total || 0, currency: session.currency || 'usd', channel: 'stripe_connect' });
      await audit(c.env, 'stripe_webhook_paid', { eventId: event.id, sessionId: session.id });
    }
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as any;
      await c.env.DB.prepare(
        'INSERT INTO payments (id, type, chargeId, paymentIntentId, leadId, artistId, connectedAccountId, amountTotal, currency, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(`refund_${charge.id}_${now()}`, 'refund', charge.id, charge.payment_intent || '', charge.metadata?.leadId || '', charge.metadata?.artistId || '', charge.metadata?.connectedAccountId || '', charge.amount_refunded || 0, charge.currency || 'usd', now()).run();
      await upsertLedger(c.env, { artistId: charge.metadata?.artistId || '', leadId: charge.metadata?.leadId || '', paymentIntentId: String(charge.payment_intent || ''), status: 'refunded', refundedAmount: charge.amount_refunded || 0, currency: charge.currency || 'usd' });
      await audit(c.env, 'stripe_webhook_refunded', { eventId: event.id, chargeId: charge.id });
    }
    return c.json({ received: true });
  } catch (error: any) {
    console.error('[webhook]', error);
    c.status(400); return c.text('Webhook error');
  }
});

// =============================================
// Push Notification Routes
// =============================================

async function sendPushToArtist(env: Env, artistId: string, payload: any) {
  const { results } = await env.DB.prepare('SELECT * FROM push_subscriptions WHERE artistId = ?').bind(artistId).all();
  if (!results || results.length === 0) return;
  const full = { ...payload, timestamp: now() };
  for (const sub of results) {
    try {
      const keys = JSON.parse(sub.keys as string);
      await sendWebPush(sub.endpoint as string, keys, full, env);
    } catch (err: any) {
      if (err.message?.includes('410') || err.message?.includes('Gone')) {
        await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(sub.endpoint).run();
      }
    }
  }
}

async function sendWebPush(endpoint: string, keys: any, payload: any, env: Env) {
  const vapidPub = env.VAPID_PUBLIC_KEY;
  const vapidPriv = env.VAPID_PRIVATE_KEY;
  if (!vapidPub || !vapidPriv) return;

  const body = JSON.stringify(payload);
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // Generate VAPID JWT
  const header = { typ: 'JWT', alg: 'ES256' };
  const nowSec = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: nowSec + 43200, sub: env.VAPID_SUBJECT || 'mailto:admin@inkflow.app' };

  const encoder = new TextEncoder();
  const headerB64 = btoa(String.fromCharCode(...new Uint8Array(encoder.encode(JSON.stringify(header))))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimsB64 = btoa(String.fromCharCode(...new Uint8Array(encoder.encode(JSON.stringify(claims))))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  // Import private key
  const privKeyRaw = Uint8Array.from(atob(vapidPriv), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    'pkcs8', privKeyRaw, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );

  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, encoder.encode(`${headerB64}.${claimsB64}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const vapidJwt = `${headerB64}.${claimsB64}.${sigB64}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Authorization': `WebPush ${vapidJwt}`,
      'Crypto-Key': `p256ecdsa=${vapidPub.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`,
    },
    body: body,
  });
  if (!response.ok && response.status === 410) throw new Error('Gone');
}

app.get('/api/push/vapid-key', (c) => {
  return c.json({ publicKey: c.env.VAPID_PUBLIC_KEY || '' });
});

app.post('/api/push/subscribe', async (c) => {
  const { artistId, endpoint, keys } = await c.req.json();
  if (!artistId || !endpoint || !keys) { c.status(400); return c.json({ error: 'artistId, endpoint, keys required' }); }
  await c.env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
  await c.env.DB.prepare(
    'INSERT INTO push_subscriptions (endpoint, artistId, keys, createdAt) VALUES (?, ?, ?, ?)'
  ).bind(endpoint, artistId, JSON.stringify(keys), now()).run();
  await audit(c.env, 'push_subscribed', { artistId, endpoint: endpoint.slice(0, 50) });
  return c.json({ ok: true });
});

app.post('/api/push/unsubscribe', async (c) => {
  const { endpoint } = await c.req.json();
  if (!endpoint) { c.status(400); return c.json({ error: 'endpoint required' }); }
  await c.env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
  return c.json({ ok: true });
});

app.post('/api/push/send', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner')) return;
  const { artistId, title, body, tag, url } = await c.req.json();
  if (!artistId) { c.status(400); return c.json({ error: 'artistId required' }); }
  await sendPushToArtist(c.env, artistId, { title: title || 'Test Notification', body: body || 'This is a test push from InkFlow', tag: tag || 'test', url: url || '/today' });
  await audit(c.env, 'push_sent_test', { artistId });
  return c.json({ ok: true });
});

// ---- Notifications ----
app.post('/api/notifications/enqueue', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'staff', 'artist')) return;
  const { artistId, leadId, channel, templateType, payload } = await c.req.json();
  if (!artistId || !leadId || !channel || !templateType) { c.status(400); return c.json({ error: 'artistId, leadId, channel, templateType required' }); }
  const id = generateId('ntf');
  await c.env.DB.prepare(
    'INSERT INTO notifications (id, artistId, leadId, channel, templateType, payload, status, retries, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, artistId, leadId, channel, templateType, JSON.stringify(payload || {}), 'queued', 0, now(), now()).run();
  await audit(c.env, 'notification_enqueued', { artistId, leadId, channel, templateType });
  return c.json({ ok: true, id });
});

app.get('/api/notifications/:artistId', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'staff', 'artist')) return;
  const artistId = c.req.param('artistId');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM notifications WHERE artistId = ? ORDER BY createdAt DESC'
  ).bind(artistId).all();
  return c.json({ items: results || [] });
});

// ---- Booking push ----
app.post('/api/booking/:artistId', async (c) => {
  const artistId = c.req.param('artistId');
  const { name, date, time } = await c.req.json();
  await sendPushToArtist(c.env, artistId, { title: 'New Booking!', body: `${name || 'Someone'} booked for ${date || ''} at ${time || ''}`, tag: 'new_booking', url: '/today' });
  await audit(c.env, 'booking_push_sent', { artistId, clientName: name });
  return c.json({ ok: true });
});

// =============================================
// Waiver Routes
// =============================================

app.get('/api/waiver/public/:appointmentId', async (c) => {
  const appointmentId = c.req.param('appointmentId');
  const signed = await c.env.DB.prepare('SELECT * FROM waivers WHERE appointmentId = ? AND status = ?').bind(appointmentId, 'signed').first();
  if (signed) return c.json({ alreadySigned: true, signedAt: (signed as any).signedAt });
  const stub = await c.env.DB.prepare('SELECT * FROM waivers WHERE appointmentId = ? AND status = ?').bind(appointmentId, 'pending').first();
  if (!stub) { c.status(404); return c.json({ error: 'Waiver not found for this appointment' }); }
  const s = stub as any;
  return c.json({ alreadySigned: false, appointmentId: s.appointmentId, clientName: s.clientName, artistName: s.artistName, shopName: s.shopName, appointmentType: s.appointmentType, waiverText: s.waiverText, country: s.country });
});

app.post('/api/waiver/create-stub', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'staff', 'artist')) return;
  const { appointmentId, clientName, artistName, shopName, appointmentType, country, clientId } = await c.req.json();
  if (!appointmentId || !clientName) { c.status(400); return c.json({ error: 'appointmentId and clientName required' }); }
  const existing = await c.env.DB.prepare('SELECT id FROM waivers WHERE appointmentId = ?').bind(appointmentId).first();
  if (existing) return c.json({ ok: true });
  const typeLabel = appointmentType === 'new_tattoo' ? 'Tattoo' : appointmentType === 'touch_up' ? 'Touch-up' : 'Service';
  const waiverText = [
    `${typeLabel} CONSENT AND RELEASE FORM`, '', `Client: ${clientName}`, `Artist: ${artistName}`, `Studio: ${shopName || artistName}`,
    `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, '',
    'I hereby give my informed consent for the tattoo procedure described below.', 'I understand that the procedure is permanent and results may vary.',
    'I confirm that I am not under the influence of alcohol or drugs.', 'I have read and understand the aftercare instructions provided by the artist.', '',
    'By signing this form, I release the artist and studio from any liability', 'related to allergic reactions, infections, or dissatisfaction with the result,', 'provided standard professional procedures were followed.', '',
    country === 'DE' ? 'This consent does not affect your statutory rights under applicable law.' : '',
    country === 'UK' ? 'You have the right to cancel this service within 14 days under the Consumer Contracts Regulations.' : '',
    country === 'JP' ? 'この同意書は、日本の法律に基づくお客様の権利に影響を与えません。' : '',
  ].filter(Boolean).join('\n');
  await c.env.DB.prepare(
    'INSERT INTO waivers (id, appointmentId, clientId, clientName, artistName, shopName, appointmentType, waiverText, country, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(`waiver_stub_${appointmentId}`, appointmentId, clientId || '', clientName, artistName || '', shopName || '', appointmentType || 'new_tattoo', waiverText, country || '', 'pending', now()).run();
  return c.json({ ok: true });
});

app.post('/api/waiver/sign', async (c) => {
  const { appointmentId, name, email, phone, signature, idPhoto, clientDob, healthAnswers, waiverText: wText } = await c.req.json();
  if (!appointmentId || !signature) { c.status(400); return c.json({ error: 'appointmentId and signature required' }); }
  const existing = await c.env.DB.prepare('SELECT id FROM waivers WHERE appointmentId = ? AND status = ?').bind(appointmentId, 'signed').first();
  if (existing) { c.status(409); return c.json({ error: 'already_signed' }); }
  const idGen = generateId('waiver');
  const ts = now();
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '';

  // Store signature as data URL in DB (same as old approach)
  // For production, consider storing signed PDFs in R2 instead
  await c.env.DB.prepare(
    `INSERT INTO waivers (id, appointmentId, clientName, clientEmail, clientPhone, signature, idPhoto, clientDob, healthAnswers, waiverText, status, signedAt, ip, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(idGen, appointmentId, name || '', email || '', phone || '', signature, idPhoto || null, clientDob || null, JSON.stringify(healthAnswers || []), wText || '', 'signed', ts, ip, c.req.header('user-agent') || '', ts).run();
  await audit(c.env, 'waiver_signed', { appointmentId, clientName: name });
  return c.json({ ok: true, id: idGen });
});

app.get('/api/waiver/:appointmentId', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const appointmentId = c.req.param('appointmentId');
  const waiver = await c.env.DB.prepare('SELECT * FROM waivers WHERE appointmentId = ? AND status = ?').bind(appointmentId, 'signed').first();
  if (!waiver) { c.status(404); return c.json({ error: 'not_found' }); }
  return c.json(waiver);
});

app.get('/api/waivers/:artistId', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'staff', 'artist')) return;
  const { results } = await c.env.DB.prepare('SELECT * FROM waivers WHERE status = ? ORDER BY signedAt DESC').bind('signed').all();
  return c.json({ items: results || [] });
});

app.post('/api/waiver/send-link', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'staff', 'artist')) return;
  const { appointmentId, clientName, clientPhone, clientEmail, artistId } = await c.req.json();
  if (!appointmentId || !artistId) { c.status(400); return c.json({ error: 'appointmentId and artistId required' }); }
  const publicUrl = String(c.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const waiverUrl = `${publicUrl}/public-waiver/${appointmentId}`;
  const id = generateId('ntf');
  await c.env.DB.prepare(
    'INSERT INTO notifications (id, artistId, leadId, channel, templateType, payload, status, retries, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, artistId, appointmentId, clientEmail ? 'email' : 'sms', 'waiver_link', JSON.stringify({ waiverUrl, clientName, appointmentId, to: clientEmail || clientPhone }), 'queued', 0, now(), now()).run();
  await audit(c.env, 'waiver_link_sent', { appointmentId, artistId });
  return c.json({ ok: true, id, waiverUrl });
});

// =============================================
// Quota Routes
// =============================================

const QUOTA_LIMITS: Record<string, number> = { free: 0, solo: 10 * 1024, pro: 50 * 1024, pro_plus: 200 * 1024 };

app.get('/api/quota/:artistId', async (c) => {
  const artistId = c.req.param('artistId');
  const record = await c.env.DB.prepare('SELECT * FROM quotas WHERE artistId = ?').bind(artistId).first();
  if (!record) return c.json({ artistId, plan: 'free', storageLimitMb: 0, storageUsedMb: 0, ok: true });
  const r = record as any;
  return c.json({ artistId: r.artistId, plan: r.plan, storageLimitMb: r.storageLimitMb, storageUsedMb: r.storageUsedMb, ok: true });
});

app.post('/api/quota/check', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const { artistId, incomingBytes = 0 } = await c.req.json();
  if (!artistId) { c.status(400); return c.json({ error: 'artistId required' }); }
  const record = await c.env.DB.prepare('SELECT * FROM quotas WHERE artistId = ?').bind(artistId).first() as any;
  const plan = record?.plan || 'free';
  const limitMb = QUOTA_LIMITS[plan] || 0;
  const usedMb = record?.storageUsedMb || 0;
  const incomingMb = incomingBytes / (1024 * 1024);
  if (limitMb <= 0) return c.json({ ok: false, quotaMb: limitMb, usedMb, plan });
  return c.json({ ok: usedMb + incomingMb <= limitMb, quotaMb: limitMb, usedMb, plan });
});

app.post('/api/quota/report', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const { artistId, plan, deltaBytes = 0 } = await c.req.json();
  if (!artistId) { c.status(400); return c.json({ error: 'artistId required' }); }
  const record = await c.env.DB.prepare('SELECT * FROM quotas WHERE artistId = ?').bind(artistId).first() as any;
  const limitMb = QUOTA_LIMITS[plan || 'free'] || 0;
  const ts = now();
  if (record) {
    await c.env.DB.prepare('UPDATE quotas SET plan = ?, storageLimitMb = ?, storageUsedMb = MAX(0, ? + ?), updatedAt = ? WHERE artistId = ?')
      .bind(plan || 'free', limitMb, record.storageUsedMb || 0, Math.abs(deltaBytes) / (1024 * 1024), ts, artistId).run();
  } else {
    await c.env.DB.prepare('INSERT INTO quotas (artistId, plan, storageLimitMb, storageUsedMb, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(artistId, plan || 'free', limitMb, Math.max(0, Math.abs(deltaBytes) / (1024 * 1024)), ts, ts).run();
  }
  const updated = await c.env.DB.prepare('SELECT * FROM quotas WHERE artistId = ?').bind(artistId).first() as any;
  await audit(c.env, 'quota_reported', { artistId, deltaBytes, plan });
  return c.json({ ok: true, storageUsedMb: updated?.storageUsedMb || 0, storageLimitMb: updated?.storageLimitMb || 0 });
});

app.post('/api/quota/set-plan', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner')) return;
  const { artistId, plan } = await c.req.json();
  if (!artistId || !plan) { c.status(400); return c.json({ error: 'artistId and plan required' }); }
  if (!QUOTA_LIMITS[plan]) { c.status(400); return c.json({ error: `Invalid plan: ${plan}` }); }
  const existing = await c.env.DB.prepare('SELECT * FROM quotas WHERE artistId = ?').bind(artistId).first() as any;
  const ts = now();
  if (existing) {
    await c.env.DB.prepare('UPDATE quotas SET plan = ?, storageLimitMb = ?, updatedAt = ? WHERE artistId = ?').bind(plan, QUOTA_LIMITS[plan], ts, artistId).run();
  } else {
    await c.env.DB.prepare('INSERT INTO quotas (artistId, plan, storageLimitMb, storageUsedMb, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?)').bind(artistId, plan, QUOTA_LIMITS[plan], ts, ts).run();
  }
  await audit(c.env, 'quota_plan_set', { artistId, plan });
  return c.json({ ok: true, plan, storageLimitMb: QUOTA_LIMITS[plan] });
});

// =============================================
// Image Upload Routes (R2)
// =============================================

app.post('/api/upload', async (c) => {
  if (!requireAuth(c, c.env)) return;
  try {
    const formData = await c.req.formData();
    const artistId = formData.get('artistId') as string;
    const file = formData.get('file') as File;
    if (!artistId || !file) { c.status(400); return c.json({ error: 'artistId and file required' }); }

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `${artistId}/${generateId('img')}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    await c.env.INKFLOW_IMAGES.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: { artistId, originalName: file.name },
    });

    const url = `${new URL(c.req.url).origin}/api/media/${key}`;
    return c.json({ url });
  } catch (error: any) {
    console.error('[upload]', error);
    c.status(500); return c.json({ error: error.message || 'Upload failed' });
  }
});

app.delete('/api/media/:key+', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const key = c.req.param('key');
  await c.env.INKFLOW_IMAGES.delete(key);
  return c.json({ ok: true });
});

app.get('/api/media/:key+', async (c) => {
  const key = c.req.param('key');
  const obj = await c.env.INKFLOW_IMAGES.get(key);
  if (!obj) { c.status(404); return c.text('Not found'); }
  const headers = new Headers();
  if (obj.httpMetadata?.contentType) headers.set('Content-Type', obj.httpMetadata.contentType);
  headers.set('Cache-Control', 'public, max-age=31536000');
  return new Response(obj.body, { headers });
});

app.get('/api/storage/usage', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const artistId = c.req.query('artistId');
  if (!artistId) { c.status(400); return c.json({ error: 'artistId required' }); }

  // Estimate R2 usage by listing objects with the artistId prefix
  let bytesUsed = 0;
  let cursor: string | undefined;
  do {
    const list = await c.env.INKFLOW_IMAGES.list({ prefix: `${artistId}/`, cursor, limit: 1000 });
    for (const obj of list.objects) bytesUsed += obj.size;
    cursor = list.cursor;
  } while (cursor);

  return c.json({ bytesUsed });
});

// =============================================
// Ledger helper
// =============================================
async function upsertLedger(env: Env, entry: any) {
  const existing = entry.paymentIntentId ? await env.DB.prepare('SELECT * FROM ledger WHERE paymentIntentId = ?').bind(entry.paymentIntentId).first() as any : null;
  if (existing) {
    await env.DB.prepare(
      'UPDATE ledger SET status=?, amount=?, currency=?, channel=?, appointmentId=?, refundId=?, refundReason=?, refundedAmount=?, updatedAt=? WHERE paymentIntentId=?'
    ).bind(entry.status || existing.status, entry.amount ?? existing.amount, entry.currency || existing.currency, entry.channel || existing.channel, entry.appointmentId || existing.appointmentId, entry.refundId || existing.refundId, entry.refundReason || existing.refundReason, entry.refundedAmount ?? existing.refundedAmount, now(), entry.paymentIntentId).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO ledger (artistId, leadId, paymentIntentId, sessionId, status, amount, currency, channel, appointmentId, refundId, refundReason, refundedAmount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(entry.artistId || '', entry.leadId || '', entry.paymentIntentId || '', entry.sessionId || '', entry.status || '', entry.amount || 0, entry.currency || 'usd', entry.channel || '', entry.appointmentId || '', entry.refundId || '', entry.refundReason || '', entry.refundedAmount || 0, now(), now()).run();
  }
}

export default app;

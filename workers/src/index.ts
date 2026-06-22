import { Hono } from 'hono';
import { cors } from 'hono/cors';
import Stripe from 'stripe';
import { Env, initDB, generateId, now } from './db';
import { renderShopPage, guessTemplate, ShopData } from './templates';

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
    const { email, name, passwordHash, studioName, roles, deviceId, plan } = await c.req.json();
    if (!email || !passwordHash) { c.status(400); return c.json({ error: 'Email and password required' }); }
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) { c.status(409); return c.json({ error: 'Email already registered' }); }
    const id = generateId('user');
    const ts = now();
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, name, passwordHash, roles, studioName, deviceId, plan, verified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
    ).bind(id, email, name || '', passwordHash, JSON.stringify(roles || []), studioName || '', deviceId || '', plan || 'free', ts, ts).run();
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

/** Auth: delete user account (unregister) */
app.delete('/api/auth/unregister', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'artist')) return;
  const { userId } = await c.req.json();
  if (!userId) { c.status(400); return c.json({ error: 'userId required' }); }
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (!existing) { c.status(404); return c.json({ error: 'not_found' }); }
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
  await audit(c.env, 'user_unregistered', { userId });
  return c.json({ ok: true });
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
// Site Config Routes (Auto Website Builder)
// =============================================

/** Public: get site config by slug — no auth needed */
app.get('/api/site-config/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (!slug) { c.status(400); return c.json({ error: 'slug required' }); }
  const config = await c.env.DB.prepare(
    'SELECT * FROM site_configs WHERE slug = ?'
  ).bind(slug).first();
  if (!config) { c.status(404); return c.json({ error: 'site_not_found', slug }); }
  return c.json(config);
});

/** Auth: upsert site config (create or update by artistId) */
app.post('/api/site-config', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'artist')) return;
  const { artistId, slug, template, theme, bio, studioName, customDomain, locations } = await c.req.json();
  if (!artistId || !slug) { c.status(400); return c.json({ error: 'artistId and slug required' }); }
  const ts = now();
  const existing = await c.env.DB.prepare(
    'SELECT id FROM site_configs WHERE artistId = ?'
  ).bind(artistId).first();
  if (existing) {
    await c.env.DB.prepare(
      `UPDATE site_configs SET slug = ?, template = ?, theme = ?, bio = ?, studioName = ?, customDomain = ?, locations = ?, updatedAt = ? WHERE artistId = ?`
    ).bind(slug, template || 'portfolio', theme || 'dark', bio || '', studioName || '', customDomain || '', JSON.stringify(locations || []), ts, artistId).run();
  } else {
    const id = generateId('scfg');
    await c.env.DB.prepare(
      `INSERT INTO site_configs (id, artistId, slug, template, theme, bio, studioName, customDomain, locations, publishedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, artistId, slug, template || 'portfolio', theme || 'dark', bio || '', studioName || '', customDomain || '', JSON.stringify(locations || []), ts, ts).run();
  }
  await audit(c.env, 'site_config_upsert', { artistId, slug });
  return c.json({ ok: true, slug });
});

/** Auth: delete site config by slug */
app.delete('/api/site-config/:slug', async (c) => {
  if (!requireAuth(c, c.env)) return;
  if (!requireRole(c, 'owner', 'artist')) return;
  const slug = c.req.param('slug');
  const artistId = c.req.header('x-user-id') || '';
  const row = await c.env.DB.prepare('SELECT artistId FROM site_configs WHERE slug = ?').bind(slug).first() as any;
  if (!row) { c.status(404); return c.json({ error: 'not_found' }); }
  const role = c.req.header('x-user-role') || '';
  if (role !== 'owner' && row.artistId !== artistId) { c.status(403); return c.json({ error: 'forbidden' }); }
  await c.env.DB.prepare('DELETE FROM site_configs WHERE slug = ?').bind(slug).run();
  await audit(c.env, 'site_config_deleted', { slug });
  return c.json({ ok: true });
});

// =============================================
// Sitemap for auto-built tattoo shop pages
// =============================================

app.get('/sitemap.xml', async (c) => {
  const baseUrl = c.env.PUBLIC_URL || 'https://app.ink-flows.com';
  const { results } = await c.env.DB.prepare(
    'SELECT slug, updatedAt FROM site_configs ORDER BY updatedAt DESC LIMIT 50000'
  ).all();

  const urls = (results || []).map((r: any) => {
    const lastmod = r.updatedAt ? new Date(r.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `  <url><loc>${baseUrl}/s/${r.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
  }).join('\n');

  return c.body(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>',
    200,
    { 'Content-Type': 'application/xml' }
  );
});

// =============================================
// Generic Data API (replaces IndexedDB/Dexie)
// =============================================

const ALLOWED_TYPES = new Set([
  'client', 'appointment', 'project', 'waiver', 'session',
  'inventory', 'portfolio', 'socialDraft', 'referral', 'lead',
  'leadRevision', 'supplyBrand', 'posTransaction', 'studioLocation',
  'invoice', 'competitor', 'supplyReview', 'waitingList',
  'healthChecklist', 'communicationLog', 'affiliateClick',
  'auditLog', 'shift', 'task', 'review', 'clientReferral',
  'leadConfirmation', 'projectAsset', 'projectApprovalToken',
  'depositFlow', 'projectRevision', 'photo',
]);

/** List records by type */
app.get('/api/data/:type', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const type = c.req.param('type');
  if (!ALLOWED_TYPES.has(type)) { c.status(400); return c.json({ error: 'invalid_type' }); }

  const artistId = c.req.query('artistId') || c.req.header('x-user-id') || '';
  const limit = Math.min(Number(c.req.query('limit')) || 100, 500);
  const offset = Number(c.req.query('offset')) || 0;

  let sql = 'SELECT * FROM app_data WHERE type = ?';
  const params: any[] = [type];

  // Auto-filter by artistId if specified
  if (artistId) {
    // Artist-level tables filter by artistId
    const ownerTables = ['client', 'appointment', 'project', 'session', 'lead', 'portfolio', 'socialDraft', 'inventory'];
    if (ownerTables.includes(type)) {
      sql += ' AND artistId = ?';
      params.push(artistId);
    }
  }

  // Additional filters from query params (JSON fields)
  const filterKeys = ['status', 'source', 'category', 'platform'];
  for (const key of filterKeys) {
    const val = c.req.query(key);
    if (val) {
      sql += ' AND json_extract(data, ?) = ?';
      params.push('$.' + key, val);
    }
  }

  // Date range
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  if (startDate) { sql += ' AND createdAt >= ?'; params.push(Number(startDate)); }
  if (endDate) { sql += ' AND createdAt <= ?'; params.push(Number(endDate)); }

  sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  const items = (results || []).map((r: any) => ({ ...JSON.parse(r.data || '{}'), id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt }));
  return c.json({ items, total: items.length });
});

/** Get single record */
app.get('/api/data/:type/:id', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const type = c.req.param('type');
  const id = c.req.param('id');
  if (!ALLOWED_TYPES.has(type)) { c.status(400); return c.json({ error: 'invalid_type' }); }

  const row = await c.env.DB.prepare(
    'SELECT * FROM app_data WHERE type = ? AND id = ?'
  ).bind(type, id).first() as any;

  if (!row) { c.status(404); return c.json({ error: 'not_found' }); }
  return c.json({ id: row.id, ...JSON.parse(row.data || '{}') });
});

/** Create record */
app.post('/api/data/:type', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const type = c.req.param('type');
  if (!ALLOWED_TYPES.has(type)) { c.status(400); return c.json({ error: 'invalid_type' }); }

  const body = await c.req.json();
  const id = body.id || generateId(type);
  const artistId = body.artistId || c.req.header('x-user-id') || '';
  const ts = now();

  // Extract data payload (everything except id/artistId goes into data JSON)
  const { id: _id, artistId: _a, createdAt: _c, ...rest } = body;
  const data = JSON.stringify(rest);

  await c.env.DB.prepare(
    'INSERT OR REPLACE INTO app_data (id, type, artistId, data, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, type, artistId, data, ts, ts).run();

  await audit(c.env, 'data_create', { type, id, artistId });
  return c.json({ ok: true, id });
});

/** Update record */
app.put('/api/data/:type/:id', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const type = c.req.param('type');
  const id = c.req.param('id');
  if (!ALLOWED_TYPES.has(type)) { c.status(400); return c.json({ error: 'invalid_type' }); }

  const existing = await c.env.DB.prepare(
    'SELECT * FROM app_data WHERE type = ? AND id = ?'
  ).bind(type, id).first() as any;

  if (!existing) { c.status(404); return c.json({ error: 'not_found' }); }

  const body = await c.req.json();
  const { id: _id, artistId: _a, createdAt: _c, ...rest } = body;
  const data = JSON.stringify(rest);
  const ts = now();

  await c.env.DB.prepare(
    'UPDATE app_data SET data = ?, updatedAt = ? WHERE id = ? AND type = ?'
  ).bind(data, ts, id, type).run();

  return c.json({ ok: true, id });
});

/** Delete record */
app.delete('/api/data/:type/:id', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const type = c.req.param('type');
  const id = c.req.param('id');
  if (!ALLOWED_TYPES.has(type)) { c.status(400); return c.json({ error: 'invalid_type' }); }

  await c.env.DB.prepare(
    'DELETE FROM app_data WHERE type = ? AND id = ?'
  ).bind(type, id).run();

  await audit(c.env, 'data_delete', { type, id });
  return c.json({ ok: true });
});

// =============================================
// Maps → Auto Website Builder (Batch)
// =============================================

/** Batch create site configs from Maps data — auth via API key only (for server-side scripts) */
app.post('/api/site-config/batch', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const { businesses } = await c.req.json();
  if (!Array.isArray(businesses) || businesses.length === 0) {
    c.status(400); return c.json({ error: 'businesses array required' });
  }
  const ts = now();
  const results: { name: string; slug: string; status: string; error?: string; template?: string; claimToken?: string }[] = [];

  for (const b of businesses) {
    const slug = b.slug || (b.name + '-' + b.city).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 60);
    const studioName = b.name || b.studioName || '';
    const bio = b.bio || `${studioName} — serving ${b.city || ''}, ${b.state || ''}. Call ${b.phone || ''} to book.`;
    const photos = b.photos || b.photoUrls || [];
    const template = b.template || guessTemplate(photos, studioName);
    const claimToken = b.claimToken || generateId('ct');

    try {
      const existing = await c.env.DB.prepare('SELECT id FROM site_configs WHERE slug = ?').bind(slug).first();
      if (existing) {
        results.push({ name: studioName, slug, status: 'skipped (already exists)' });
        continue;
      }
      const id = generateId('scfg');
      await c.env.DB.prepare(
        `INSERT INTO site_configs (id, artistId, slug, template, theme, bio, studioName, phone, address, city, state, rating, reviewCount, photoUrls, services, priceRange, claimToken, data, publishedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, 'maps_batch', slug, template, template, bio, studioName,
        b.phone || '', b.address || '', b.city || '', b.state || '',
        b.rating || 0, b.reviewCount || 0,
        JSON.stringify(photos),
        JSON.stringify(b.services || []),
        b.priceRange || '$$',
        claimToken,
        JSON.stringify(b.data || {}),
        ts, ts
      ).run();
      results.push({ name: studioName, slug, status: 'created', template, claimToken });
    } catch (e: any) {
      results.push({ name: studioName, slug, status: 'error', error: e.message });
    }
  }

  // Return claim URLs for newly created sites
  const baseUrl = c.env.PUBLIC_URL || 'https://app.ink-flows.com';
  await audit(c.env, 'site_config_batch', { count: businesses.length, created: results.filter(r => r.status === 'created').length });
  return c.json({
    ok: true,
    results,
    total: businesses.length,
    created: results.filter(r => r.status === 'created').length,
    claimUrls: results
      .filter(r => r.status === 'created' && r.claimToken)
      .map(r => ({ name: r.name, slug: r.slug, claimUrl: `${baseUrl}/claim?slug=${r.slug}&token=${r.claimToken}` })),
  });
});

// =============================================
// Tattoo Shop Landing Pages (Render + Claim)
// =============================================

/** Render a tattoo shop landing page as full HTML */
app.get('/s/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (!slug) { c.status(400); return c.html('<h1>Missing slug</h1>', 400); }

  const row = await c.env.DB.prepare(
    'SELECT * FROM site_configs WHERE slug = ?'
  ).bind(slug).first() as any;

  if (!row) {
    return c.html(`<!DOCTYPE html><html><head><title>Not Found</title><meta name="robots" content="noindex"></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;"><div style="text-align:center;"><h1>Page Not Found</h1><p>This shop page hasn\'t been created yet.</p></div></body></html>`, 404);
  }

  const photos = safeJson(row.photoUrls, []);
  const services = safeJson(row.services, []);
  const locations = safeJson(row.locations, []);

  const shopData: ShopData = {
    studioName: row.studioName || row.slug,
    city: row.city || '',
    state: row.state || '',
    phone: row.phone || '',
    address: row.address || '',
    rating: row.rating || 0,
    reviewCount: row.reviewCount || 0,
    bio: row.bio || '',
    photos,
    services,
    placeId: (safeJson(row.data, {}) as any)?.placeId || '',
    slug: row.slug,
    template: (row.template as ShopData['template']) || 'minimal',
    claimToken: row.claimToken || '',
    claimed: Boolean(row.claimedBy),
    priceRange: row.priceRange || '$$',
    instagram: row.instagram || '',
  };

  const baseUrl = c.env.PUBLIC_URL || 'https://app.ink-flows.com';
  const html = renderShopPage(shopData, baseUrl);
  return c.html(html);
});

/** Claim a shop page — show form */
app.get('/claim', async (c) => {
  const slug = c.req.query('slug');
  const token = c.req.query('token');
  if (!slug || !token) {
    return c.html(`<!DOCTYPE html><html><head><title>Invalid Claim Link</title><meta name="robots" content="noindex"></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;"><div style="text-align:center;"><h1>Invalid Link</h1><p>This claim link is not valid. Please contact support.</p></div></body></html>`, 400);
  }

  const row = await c.env.DB.prepare(
    'SELECT slug, studioName, claimToken, claimedBy FROM site_configs WHERE slug = ?'
  ).bind(slug).first() as any;

  if (!row || row.claimToken !== token) {
    return c.html(`<!DOCTYPE html><html><head><title>Invalid Token</title><meta name="robots" content="noindex"></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;"><div style="text-align:center;"><h1>Invalid Token</h1><p>This claim link is invalid or expired.</p></div></body></html>`, 400);
  }

  if (row.claimedBy) {
    return c.html(`<!DOCTYPE html><html><head><title>Already Claimed</title><meta name="robots" content="noindex"></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;"><div style="text-align:center;"><h1>Already Claimed</h1><p>This page has already been claimed. <a href="/s/${slug}">Back to page</a></p></div></body></html>`);
  }

  return c.html(claimFormHtml(slug, token, row.studioName));
});

app.post('/claim', async (c) => {
  const { slug, token, email, name } = await c.req.json();
  if (!slug || !token || !email) {
    return c.json({ error: 'slug, token, and email required' }, 400);
  }

  const row = await c.env.DB.prepare(
    'SELECT slug, claimToken, claimedBy FROM site_configs WHERE slug = ?'
  ).bind(slug).first() as any;

  if (!row) return c.json({ error: 'not_found' }, 404);
  if (row.claimToken !== token) return c.json({ error: 'invalid_token' }, 400);
  if (row.claimedBy) return c.json({ error: 'already_claimed' }, 400);

  // Generate verification code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const ts = now();
  const claimId = generateId('clm');

  // Store code in claim_requests
  await c.env.DB.prepare(
    'INSERT INTO claim_requests (id, slug, email, name, status, token, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(claimId, slug, email, name || '', 'code_sent', token, ts).run();

  // Store code in a simple key-value table
  try {
    await c.env.DB.prepare("CREATE TABLE IF NOT EXISTS claim_codes (slug TEXT PRIMARY KEY, code TEXT NOT NULL, expiresAt INTEGER NOT NULL)").run();
  } catch { /* ignore */ }
  await c.env.DB.prepare(
    'INSERT OR REPLACE INTO claim_codes (slug, code, expiresAt) VALUES (?, ?, ?)'
  ).bind(slug, code, ts + 600000).run(); // expires in 10 minutes

  // Send email with verification code + marketing
  const baseUrl = c.env.PUBLIC_URL || 'https://ink-flow-api.snow368.workers.dev';
  const sendgridKey = c.env.SENDGRID_API_KEY || '';
  const emailFrom = c.env.EMAIL_FROM || 'hello@ink-flows.com';
  const shopName = row.studioName || row.slug;

  if (sendgridKey) {
    try {
      const emailHtml = verificationEmailHtml(code, shopName, slug, baseUrl);
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + sendgridKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: emailFrom, name: 'InkFlow' },
          subject: 'Verify your shop page — ' + shopName,
          content: [{ type: 'text/html', value: emailHtml }],
        }),
      });
    } catch { /* email non-critical */ }
  }

  return c.json({ ok: true, needsCode: true, slug, email });
});

/** Verify claim code */
app.post('/claim/verify', async (c) => {
  const { slug, code } = await c.req.json();
  if (!slug || !code) return c.json({ error: 'slug and code required' }, 400);

  const row = await c.env.DB.prepare(
    'SELECT code, expiresAt FROM claim_codes WHERE slug = ?'
  ).bind(slug).first() as any;

  if (!row) return c.json({ error: 'no_code' }, 400);
  if (row.code !== code) return c.json({ error: 'wrong_code' }, 400);
  if (row.expiresAt < now()) return c.json({ error: 'code_expired' }, 400);

  // Get the claim request email
  const claimReq = await c.env.DB.prepare(
    "SELECT email FROM claim_requests WHERE slug = ? AND status = 'code_sent' ORDER BY createdAt DESC LIMIT 1"
  ).bind(slug).first() as any;
  const email = claimReq?.email || '';

  const ts = now();
  await c.env.DB.prepare(
    'UPDATE site_configs SET claimedBy = ?, claimedAt = ?, updatedAt = ? WHERE slug = ?'
  ).bind(email, ts, ts, slug).run();
  await c.env.DB.prepare(
    "UPDATE claim_requests SET status = 'verified' WHERE slug = ? AND status = 'code_sent'"
  ).bind(slug).run();
  await c.env.DB.prepare('DELETE FROM claim_codes WHERE slug = ?').bind(slug).run();
  await audit(c.env, 'site_claimed', { slug, email, via: 'email_code' });

  const baseUrl = c.env.PUBLIC_URL || 'https://ink-flow-api.snow368.workers.dev';
  return c.json({ ok: true, manageUrl: baseUrl + '/manage/' + slug });
});

/** Management page after claiming — enter IG handle etc */
app.get('/manage/:slug', async (c) => {
  const slug = c.req.param('slug');
  const token = c.req.query('token');

  const row = await c.env.DB.prepare(
    'SELECT * FROM site_configs WHERE slug = ?'
  ).bind(slug).first() as any;

  if (!row) return c.html('<h1>Not found</h1>', 404);
  if (!row.claimedBy) return c.html('<h1>Not claimed yet</h1><p><a href="/claim?slug=' + slug + '&token=' + row.claimToken + '">Claim this page first</a></p>');

  const shopData = {
    studioName: row.studioName || '',
    slug: row.slug,
    claimedBy: row.claimedBy || '',
    bio: row.bio || '',
    phone: row.phone || '',
    city: row.city || '',
    state: row.state || '',
    instagram: row.instagram || '',
    services: safeJson(row.services, []),
    photoUrls: safeJson(row.photoUrls, []),
    template: row.template || 'minimal',
  };

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manage — ${safeVal(shopData.studioName)}</title>
  <meta name="robots" content="noindex">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#0d0d0d;color:#f0f0f0;min-height:100vh;padding:2rem}
    .container{max-width:600px;margin:0 auto}
    .card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:2rem;margin-bottom:1.5rem}
    h1{font-size:1.4rem;font-weight:700;margin-bottom:0.5rem}
    .sub{color:#888;font-size:0.9rem;margin-bottom:1.5rem;line-height:1.5}
    .form-group{margin-bottom:1rem}
    label{display:block;font-size:0.85rem;font-weight:600;color:#ccc;margin-bottom:0.35rem}
    input,textarea,select{width:100%;padding:0.75rem 1rem;background:#0d0d0d;border:1px solid #333;border-radius:8px;color:#f0f0f0;font-size:0.95rem;font-family:'Inter',sans-serif}
    input:focus,textarea:focus{outline:none;border-color:#c9a84c}
    textarea{resize:vertical;min-height:80px}
    .badge{display:inline-block;background:#05966920;color:#34d399;font-size:0.75rem;font-weight:700;padding:0.3rem 0.75rem;border-radius:100px;margin-bottom:1rem}
    .btn{width:100%;padding:0.85rem;background:#c9a84c;color:#0d0d0d;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:background .2s}
    .btn:hover{background:#dbb95d}
    .btn:disabled{opacity:0.5;cursor:not-allowed}
    .success-msg{color:#34d399;font-size:0.85rem;display:none;margin-top:0.5rem}
    .preview-link{display:block;text-align:center;color:#c9a84c;font-size:0.9rem;margin-top:1rem;text-decoration:none}
    .preview-link:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Claimed by ${safeVal(shopData.claimedBy)}</div>
    <h1>Manage ${safeVal(shopData.studioName)}</h1>
    <p class="sub">Your page is live. Fill in your Instagram handle to auto-display your work.</p>

    <div class="card">
      <div class="form-group">
        <label>Instagram handle</label>
        <input type="text" id="igHandle" placeholder="e.g. yourstudio" value="${safeVal(shopData.instagram)}">
        <p style="color:#555;font-size:0.8rem;margin-top:0.25rem">Just the username — we'll embed your feed automatically</p>
      </div>
      <div class="form-group">
        <label>About / Bio</label>
        <textarea id="bio" rows="3">${safeVal(shopData.bio)}</textarea>
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input type="text" id="phone" value="${safeVal(shopData.phone)}">
      </div>
      <button class="btn" onclick="saveSettings()">Save</button>
      <div class="success-msg" id="successMsg">Saved! Your page has been updated.</div>
      <a class="preview-link" href="/s/${slug}" target="_blank">Preview your page →</a>
    </div>

    <!-- Booking Requests -->
    <!-- Template Switcher (Pro/Plus) -->
    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;">🎨 Template</h2>
      <p class="sub" style="margin-bottom:1rem;">Switch your page style. Content stays the same.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;" id="templateGrid">
        <p style="color:#555;font-size:0.85rem;">Loading templates...</p>
      </div>
      <p id="templateMsg" style="color:#34d399;font-size:0.8rem;display:none;margin-top:0.5rem;">Template updated!</p>
    </div>

    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem;">📬 Booking Requests</h2>
      <p class="sub" style="margin-bottom:1rem;">When someone fills the booking form on your page, it shows up here.</p>
      <div id="bookingList"><p style="color:#555;font-size:0.85rem;">Loading...</p></div>
    </div>
  </div>
  <script>
    // Load booking requests
    async function loadBookings() {
      const el = document.getElementById('bookingList');
      try {
        const res = await fetch('/api/booking-requests/${slug}');
        const data = await res.json();
        if (!data.items || data.items.length === 0) {
          el.innerHTML = '<p style="color:#555;font-size:0.85rem;">No booking requests yet.</p>';
          return;
        }
        el.innerHTML = data.items.map(b => {
          const date = b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '';
          const status = b.status || 'new';
          const statusColor = status === 'new' ? '#f59e0b' : status === 'contacted' ? '#3b82f6' : '#34d399';
          return '<div style="background:#0d0d0d;border:1px solid #2a2a2a;border-radius:10px;padding:1rem;margin-bottom:0.75rem;">' +
            '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">' +
            '<div><p style="font-weight:600;font-size:0.95rem;">' + esc(b.name) + '</p>' +
            '<p style="color:#94a3b8;font-size:0.8rem;">' + esc(b.phone) + (b.email ? ' · ' + esc(b.email) : '') + '</p></div>' +
            '<span style="font-size:0.7rem;padding:2px 8px;border-radius:100px;background:' + statusColor + '20;color:' + statusColor + ';font-weight:600;">' + status + '</span></div>' +
            (b.message ? '<p style="color:#94a3b8;font-size:0.85rem;line-height:1.4;margin-bottom:0.5rem;">"' + esc(b.message) + '"</p>' : '') +
            '<div style="display:flex;gap:0.5rem;align-items:center;">' +
            '<span style="color:#555;font-size:0.75rem;">' + date + '</span>' +
            (status === 'new' ? '<button onclick="markContacted(\'' + b.id + '\')" style="margin-left:auto;padding:4px 12px;border-radius:6px;border:1px solid #3b82f6;background:transparent;color:#60a5fa;font-size:0.75rem;cursor:pointer;">Mark contacted</button>' : '') +
            '<a href="tel:' + b.phone + '" style="margin-left:' + (status === 'new' ? '0.25rem' : 'auto') + ';padding:4px 12px;border-radius:6px;border:1px solid #22c55e;background:transparent;color:#4ade80;font-size:0.75rem;cursor:pointer;text-decoration:none;">📞 Call</a>' +
            (b.email ? '<a href="mailto:' + b.email + '" style="padding:4px 12px;border-radius:6px;border:1px solid #a855f7;background:transparent;color:#c084fc;font-size:0.75rem;cursor:pointer;text-decoration:none;">✉️ Email</a>' : '') +
            '</div></div>';
        }).join('');
      } catch(e) {
        el.innerHTML = '<p style="color:#ef4444;font-size:0.85rem;">Failed to load booking requests.</p>';
      }
    }

    async function markContacted(id) {
      try {
        await fetch('/api/booking-requests/${slug}/' + id + '/contacted', { method: 'PUT' });
        loadBookings();
      } catch(e) {
        alert('Failed to update');
      }
    }

    function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    loadBookings();

    // Load templates
    async function loadTemplates() {
      const grid = document.getElementById('templateGrid');
      const msg = document.getElementById('templateMsg');
      const currentTemplate = '${shopData.template}';
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        grid.innerHTML = data.templates.map(t => {
          const isCurrent = t.id === currentTemplate;
          return '<div onclick="switchTemplate(\'' + t.id + '\')" style="cursor:pointer;padding:10px;border-radius:8px;border:2px solid ' + (isCurrent ? '#c9a84c' : '#2a2a2a') + ';background:' + (isCurrent ? '#c9a84c20' : '#0d0d0d') + ';text-align:center;">' +
            '<p style="font-weight:600;font-size:0.85rem;color:#f0f0f0;">' + t.name + '</p>' +
            (isCurrent ? '<p style="font-size:0.65rem;color:#c9a84c;margin-top:2px;">ACTIVE</p>' : '<p style="font-size:0.65rem;color:#555;">' + t.tier + '</p>') +
            '</div>';
        }).join('');
      } catch(e) {
        grid.innerHTML = '<p style="color:#555;font-size:0.85rem;">Failed to load templates.</p>';
      }
    }

    window.switchTemplate = async function(id) {
      try {
        const res = await fetch('/api/site-config/' + '${slug}' + '/template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: id }),
        });
        if (res.ok) {
          document.getElementById('templateMsg').style.display = 'block';
          setTimeout(() => document.getElementById('templateMsg').style.display = 'none', 2000);
          loadTemplates();
        }
      } catch(e) {
        alert('Failed to switch template');
      }
    };

    loadTemplates();

    async function saveSettings() {
      const btn = document.querySelector('.btn');
      const msg = document.getElementById('successMsg');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      msg.style.display = 'none';
      try {
        const data = {
          instagram: document.getElementById('igHandle').value.replace(/^@/,'').trim(),
          bio: document.getElementById('bio').value.trim(),
          phone: document.getElementById('phone').value.trim(),
        };
        const res = await fetch('/api/site-config/' + '${slug}', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          msg.style.display = 'block';
          setTimeout(() => msg.style.display = 'none', 3000);
        }
      } catch(e) {
        alert('Save failed: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save';
      }
    }
  </script>
</body>
</html>`);
});

/** API to update site_config settings (bio, phone, instagram etc) */
app.put('/api/site-config/:slug', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const slug = c.req.param('slug');
  const row = await c.env.DB.prepare('SELECT * FROM site_configs WHERE slug = ?').bind(slug).first() as any;
  if (!row) { c.status(404); return c.json({ error: 'not_found' }); }

  const body = await c.req.json();
  const ts = now();
  const updates: string[] = [];
  const params: any[] = [];

  for (const key of ['bio', 'phone', 'studioName', 'instagram', 'priceRange']) {
    if (body[key] !== undefined) {
      updates.push(key + ' = ?');
      params.push(String(body[key]));
    }
  }
  // Handle services array
  if (body.services) {
    updates.push('services = ?');
    params.push(JSON.stringify(body.services));
  }

  if (updates.length === 0) { c.status(400); return c.json({ error: 'no_fields' }); }
  updates.push('updatedAt = ?');
  params.push(ts);
  params.push(slug);

  await c.env.DB.prepare(
    'UPDATE site_configs SET ' + updates.join(', ') + ' WHERE slug = ?'
  ).bind(...params).run();

  return c.json({ ok: true, slug });
});

/** Booking request from shop page — stores lead in D1 */
app.post('/api/booking-request', async (c) => {
  try {
    const { slug, name, phone, email, message } = await c.req.json();
    if (!slug || !name || !phone) {
      return c.json({ error: 'slug, name, and phone required' }, 400);
    }

    // Store as booking lead
    const id = generateId('blead');
    const ts = now();
    await c.env.DB.prepare(
      `INSERT INTO app_data (id, type, artistId, data, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      id, 'booking_lead', slug,
      JSON.stringify({ slug, name, phone, email: email || '', message: message || '', shopSlug: slug }),
      ts, ts
    ).run();

    await audit(c.env, 'booking_request', { slug, name, phone: phone.slice(0, 4) + '****' });

    // Notify shop owner (non-blocking)
    try {
      const shop = await c.env.DB.prepare('SELECT claimedBy, phone FROM site_configs WHERE slug = ?').bind(slug).first() as any;
      if (shop?.claimedBy) {
        console.log('[booking] New lead for ' + slug + ': ' + name);
      }
    } catch { /* silent */ }

    return c.json({ ok: true, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

/** Get booking requests for a shop (public) */
app.get('/api/booking-requests/:slug', async (c) => {
  const slug = c.req.param('slug');
  const { results } = await c.env.DB.prepare("SELECT * FROM app_data WHERE type = 'booking_lead' AND artistId = ? ORDER BY createdAt DESC LIMIT 50").bind(slug).all();
  const items = (results || []).map((r: any) => {
    const d = JSON.parse(r.data || '{}');
    return { id: r.id, name: d.name, phone: d.phone, email: d.email || '', message: d.message || '', status: d.status || 'new', createdAt: r.createdAt };
  });
  return c.json({ items });
});

/** Mark booking request as contacted */
app.put('/api/booking-requests/:slug/:id/contacted', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare("SELECT * FROM app_data WHERE id = ? AND type = 'booking_lead'").bind(id).first() as any;
  if (!row) { c.status(404); return c.json({ error: 'not_found' }); }
  const data = JSON.parse(row.data || '{}');
  data.status = 'contacted';
  await c.env.DB.prepare('UPDATE app_data SET data = ?, updatedAt = ? WHERE id = ?').bind(JSON.stringify(data), now(), id).run();
  return c.json({ ok: true });
});

/** Template management: list available + switch */
const TEMPLATES_META = [
  { id: 'minimal', name: 'Minimal', tier: 'free', desc: 'Clean white, timeless' },
  { id: 'traditional', name: 'Traditional', tier: 'free', desc: 'Bold American red' },
  { id: 'vintage', name: 'Vintage', tier: 'free', desc: 'Warm retro feel' },
  { id: 'moody', name: 'Moody', tier: 'free', desc: 'Dark with gold accents' },
  { id: 'edgy', name: 'Edgy', tier: 'pro', desc: 'Neon pink on black' },
  { id: 'studio', name: 'Studio', tier: 'pro', desc: 'Gallery warm tones' },
  { id: 'brutalist', name: 'Brutalist', tier: 'pro', desc: 'Heavy black & white' },
  { id: 'nature', name: 'Nature', tier: 'pro', desc: 'Forest green' },
  { id: 'royal', name: 'Royal', tier: 'pro', desc: 'Deep purple & gold' },
  { id: 'neon', name: 'Neon', tier: 'pro', desc: 'Cyan glow on dark' },
  { id: 'industrial', name: 'Industrial', tier: 'plus', desc: 'Steel & concrete' },
  { id: 'woodcut', name: 'Woodcut', tier: 'plus', desc: 'Dark print-like' },
  { id: 'watercolor', name: 'Watercolor', tier: 'plus', desc: 'Soft pastels' },
  { id: 'gothic', name: 'Gothic', tier: 'plus', desc: 'Ornate dark' },
  { id: 'coastal', name: 'Coastal', tier: 'plus', desc: 'Light & breezy' },
  { id: 'urban', name: 'Urban', tier: 'plus', desc: 'Graffiti bold' },
];

app.get('/api/templates', async (c) => {
  if (!requireAuth(c, c.env)) return;
  return c.json({ templates: TEMPLATES_META });
});

app.post('/api/site-config/:slug/template', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const slug = c.req.param('slug');
  const { template: newTemplate } = await c.req.json();
  if (!TEMPLATES_META.find(t => t.id === newTemplate)) {
    return c.json({ error: 'invalid_template' }, 400);
  }
  await c.env.DB.prepare('UPDATE site_configs SET template = ?, theme = ?, updatedAt = ? WHERE slug = ?')
    .bind(newTemplate, newTemplate, now(), slug).run();
  return c.json({ ok: true, template: newTemplate });
});

/** Plan management: get current plan + available plans */
app.get('/api/plan', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const userId = c.req.header('x-user-id') || '';
  if (!userId) { c.status(401); return c.json({ error: 'unauthorized' }); }
  const user = await c.env.DB.prepare('SELECT id, plan, email FROM users WHERE id = ?').bind(userId).first() as any;
  if (!user) { c.status(404); return c.json({ error: 'user_not_found' }); }
  return c.json({ currentPlan: user.plan || 'free', availablePlans: ['free', 'starter', 'pro', 'plus'] });
});

/** Plan management: change plan */
app.post('/api/plan/change', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const userId = c.req.header('x-user-id') || '';
  const { plan: newPlan } = await c.req.json();
  if (!userId) { c.status(401); return c.json({ error: 'unauthorized' }); }
  if (!['free', 'starter', 'pro', 'plus'].includes(newPlan)) { c.status(400); return c.json({ error: 'invalid_plan' }); }
  const user = await c.env.DB.prepare('SELECT id, plan FROM users WHERE id = ?').bind(userId).first() as any;
  if (!user) { c.status(404); return c.json({ error: 'user_not_found' }); }
  const ts = now();
  await c.env.DB.prepare('UPDATE users SET plan = ?, updatedAt = ? WHERE id = ?').bind(newPlan, ts, userId).run();
  await audit(c.env, 'plan_change', { userId, from: user.plan, to: newPlan });
  return c.json({ ok: true, plan: newPlan });
});

// ---- Helpers for template routes ----

function safeJson(val: string | undefined, fallback: any): any {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function claimFormHtml(slug: string, token: string, studioName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim — ${studioName}</title>
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0d0d0d; color: #f0f0f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; }
    .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 2.5rem; max-width: 480px; width: 100%; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #888; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.85rem; font-weight: 600; color: #ccc; margin-bottom: 0.35rem; }
    input { width: 100%; padding: 0.75rem 1rem; background: #0d0d0d; border: 1px solid #333; border-radius: 8px; color: #f0f0f0; font-size: 1rem; font-family: 'Inter', sans-serif; }
    input:focus { outline: none; border-color: #c9a84c; }
    button { width: 100%; padding: 0.85rem; background: #c9a84c; color: #0d0d0d; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; margin-top: 0.5rem; }
    button:hover { background: #dbb95d; }
    .error { color: #e63946; font-size: 0.85rem; margin-top: 0.5rem; display: none; }
    .success { color: #2ecc71; font-size: 0.95rem; text-align: center; display: none; }
    .spinner { display: none; }
    button.loading .spinner { display: inline-block; }
    button.loading .btn-text { display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:inline-block;background:#c9a84c20;color:#c9a84c;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;padding:0.3rem 0.75rem;border-radius:100px;margin-bottom:1rem;">Free — No credit card needed</div>
    <h1 style="font-size:1.6rem;font-weight:700;margin-bottom:0.75rem;line-height:1.3;">Claim <span style="color:#c9a84c;">${safe(studioName)}</span></h1>
    <p style="color:#999;font-size:0.95rem;margin-bottom:1.5rem;line-height:1.6;">It's your shop, you should own your online presence. This page is already on Google — claim it for free in 30 seconds. No tech skills, no hidden fees.</p>
    <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.75rem;">
      <div style="display:flex;align-items:flex-start;gap:0.75rem;">
        <span style="flex-shrink:0;">🔓</span>
        <span style="font-size:0.9rem;color:#ccc;line-height:1.4;"><strong>Free, period.</strong> — No credit card, no trial, no upsell. Yours to keep.</span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:0.75rem;">
        <span style="flex-shrink:0;">✏️</span>
        <span style="font-size:0.9rem;color:#ccc;line-height:1.4;"><strong>No tech skills needed</strong> — Update hours, photos, services in one click. Like Google My Business but better.</span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:0.75rem;">
        <span style="flex-shrink:0;">🔍</span>
        <span style="font-size:0.9rem;color:#ccc;line-height:1.4;"><strong>Get found on Google</strong> — Your page is already indexed. Control what customers see when they search.</span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:0.75rem;">
        <span style="flex-shrink:0;">📈</span>
        <span style="font-size:0.9rem;color:#ccc;line-height:1.4;"><strong>Grow from zero</strong> — Add booking, payments, gallery when you're ready. Upgrade only if you want.</span>
      </div>
    </div>
    <div style="height:1px;background:#2a2a2a;margin:1.5rem 0;"></div>
    <form id="claimForm">
      <input type="hidden" name="slug" value="${slug}">
      <input type="hidden" name="token" value="${token}">
      <div class="form-group">
        <label for="email">Your Email *</label>
        <input type="email" id="email" name="email" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label for="name">Your Name <span style="color:#555;">(optional)</span></label>
        <input type="text" id="name" name="name" placeholder="e.g. Jake">
      </div>
      <button type="submit" id="submitBtn">
        <span class="btn-text">Claim My Free Page →</span>
        <span class="spinner">⏳</span>
      </button>
      <div class="error" id="errorMsg"></div>
      <div class="success" id="successMsg">
        <span style="font-size:2rem;display:block;margin-bottom:0.5rem;">✅</span>
        <strong>You're all set!</strong><br>
        <span style="color:#999;font-size:0.85rem;">We'll send you an email to verify and get started.</span>
      </div>
    </form>
    <p style="text-align:center;color:#555;font-size:0.8rem;margin-top:1.25rem;">Powered by <a href="https://ink-flows.com" style="color:#888;">InkFlow</a> — trusted by tattoo studios across the US</p>
  </div>
  <p style="text-align:center;margin-top:2rem;color:#555;font-size:0.85rem;">Not ${safe(studioName)}? <a href="https://app.ink-flows.com" style="color:#888;">Learn how InkFlow works</a></p>
  <script>
    document.getElementById('claimForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const error = document.getElementById('errorMsg');
      const success = document.getElementById('successMsg');
      error.style.display = 'none';
      success.style.display = 'none';
      btn.classList.add('loading');
      btn.disabled = true;
      try {
        const data = { slug: '${slug}', token: '${token}', email: document.getElementById('email').value, name: document.getElementById('name').value };
        const res = await fetch('/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const json = await res.json();
        if (json.ok) {
          success.style.display = 'block';
          btn.style.display = 'none';
          document.querySelectorAll('.form-group').forEach(el => el.style.display = 'none');
          document.querySelector('.sub').style.display = 'none';
          document.querySelector('.benefits').style.display = 'none';
          document.querySelector('.divider').style.display = 'none';
        } else {
          error.textContent = json.error || 'Something went wrong';
          error.style.display = 'block';
        }
      } catch (err) {
        error.textContent = 'Network error. Please try again.';
        error.style.display = 'block';
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}

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

// =============================================
// Photo Metadata API
// =============================================

app.post('/api/photos', async (c) => {
  if (!requireAuth(c, c.env)) return;
  try {
    const { clientId, artistId, imageUrl, bodyPart, step, note, source } = await c.req.json();
    if (!clientId || !imageUrl) { c.status(400); return c.json({ error: 'clientId and imageUrl required' }); }
    const id = generateId('photo');
    const now = Date.now();
    await c.env.DB.prepare(
      'INSERT INTO photo_metadata (id, clientId, artistId, imageUrl, bodyPart, step, note, source, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, clientId, artistId || '', imageUrl, bodyPart || 'other', step || 5, note || '', source || 'gallery_import', now).run();
    return c.json({ ok: true, id, imageUrl });
  } catch (e: any) { c.status(500); return c.json({ error: e.message }); }
});

app.get('/api/photos/:clientId', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const clientId = c.req.param('clientId');
  const res = await c.env.DB.prepare('SELECT * FROM photo_metadata WHERE clientId = ? ORDER BY createdAt DESC').bind(clientId).all();
  return c.json({ photos: res.results });
});

app.get('/api/photos/artist/:artistId', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const artistId = c.req.param('artistId');
  const step = c.req.query('step');
  let sql = 'SELECT * FROM photo_metadata WHERE artistId = ?';
  const params: any[] = [artistId];
  if (step) { sql += ' AND step = ?'; params.push(parseInt(step)); }
  sql += ' ORDER BY createdAt DESC';
  const res = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ photos: res.results });
});

app.delete('/api/photos/:id', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const { id } = c.req.param();
  await c.env.DB.prepare('DELETE FROM photo_metadata WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
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
// Social Content Studio V2 Routes
// =============================================

/** AI caption + hashtag generation with local SEO */
app.post('/api/content/generate', async (c) => {
  if (!requireAuth(c, c.env)) return;
  try {
    const { imageUrls, platform, tone, captionHints, city, state, studioName } = await c.req.json();
    const platformLabel: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', pinterest: 'Pinterest', tiktok: 'TikTok' };
    const platformStr = platformLabel[platform as string] || 'Instagram';
    const toneLabel: Record<string, string> = { professional: 'professional & polished', casual: 'casual & friendly', hype: 'exciting & hype', educational: 'educational & informative' };
    const toneStr = toneLabel[tone as string] || 'professional';

    // Build location context for local SEO
    const locationStr = city ? ` in ${city}${state ? `, ${state}` : ''}` : '';
    const localHashtagHint = city ? `\nInclude local hashtags like #tattoo${city} #[city]tattoo #${city} and general tattoo hashtags.` : '';

    const prompt = `You are a tattoo studio's social media marketing assistant. Write a ${toneStr} caption and 10 relevant hashtags for a ${platformStr} post about tattoo artwork${locationStr}.

The photos show completed tattoo work${imageUrls?.length ? ` (${imageUrls.length} photos)` : ''}.
${captionHints ? `Additional context: ${captionHints}` : ''}
${studioName ? `Studio name: ${studioName}` : ''}
${localHashtagHint}

LOCAL SEO RULES:
- If a city is provided, naturally mention the city in the caption
- Use service+city keyword combinations (e.g., "fine line tattoo in ${city || 'your city'}")
- Include a call-to-action encouraging local bookings
- ${city ? `Include 3-4 local hashtags like #${city}tattoo #tattoo${city} #${city}` : 'Include location-based hashtags if relevant'}

Respond in JSON format:
{
  "caption": "the caption text (2-4 sentences, include emojis)",
  "hashtags": ["tag1", "tag2", ...]
}

Keep the caption under 200 characters for ${platformStr}.`;

    let result: { caption: string; hashtags: string[] } | null = null;

    // Try Workers AI
    if (c.env.AI) {
      try {
        const aiResp = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });
        const text = typeof aiResp === 'string' ? aiResp : (aiResp as any).response || '';
        const parsed = JSON.parse(text);
        if (parsed.caption) result = parsed;
      } catch (e: any) {
        console.error('[AI] Workers AI failed, falling back:', e.message);
      }
    }

    // Fallback: template-based generation with local SEO
    if (!result) {
      const locTag = city ? ` in ${city}` : '';
      const localLine = city ? `\n\n📍 Serving ${city}${state ? `, ${state}` : ''} — DM to book!` : '';

      const templates: Record<string, string[]> = {
        professional: [
          `Fresh work fresh off the needle 🖤\n\nPrecision linework meets smooth shading in this latest piece${locTag}.${localLine}\n\nBook your consultation today — link in bio.`,
          `Another satisfied client walking out with art they'll treasure forever${locTag}.\n\nAttention to detail is everything.${localLine}\n\nDM to book your session.`,
        ],
        casual: [
          `New ink alert 🔥\n\nThis one came together so nicely${locTag}. Love when a design just flows.\n\nWhat are you getting next? 👇`,
          `Friday flash vibes ⚡️\n\nGot some openings next week${locTag}. First come first served.\n\nDrop a 🔥 if you're ready to book.`,
        ],
        hype: [
          `ABSOLUTELY OBSESSED with how this turned out 😮‍💨🔥\n\nThis is why I love what I do.${localLine}\n\nWho's next?! Drop a comment 👇`,
          `SHEEEESH 🔥🔥🔥\n\nThis piece hit different${locTag}. The details, the shading, everything.\n\nBook your spot NOW.`,
        ],
        educational: [
          `Ever wondered how a tattoo heals? Here's the breakdown 🧵\n\nDay 1-3: Keep clean & moisturized\nDay 4-7: Peeling starts — DON'T pick it\nDay 8-14: Almost healed${locTag}\n\nSave this for later!`,
          `3 things every first-timer${locTag} should know:\n\n1️⃣ Hydrate before your appointment\n2️⃣ Eat a good meal beforehand\n3️⃣ Trust the process\n\nAnything else? Drop it below 👇`,
        ],
      };
      const pool = templates[tone] || templates.professional;
      const caption = pool[Math.floor(Math.random() * pool.length)];

      // Local-aware hashtags
      const cityTag = city ? [`#${city}tattoo`, `#tattoo${city}`, `#${city}`] : [];
      const coreTags: Record<string, string[]> = {
        instagram: ['#tattoo', '#inked', '#tattooart', '#tattooartist', '#newtattoo', '#bodyart'],
        facebook: ['#tattoo', '#tattooartist', '#inked', '#bodyart', '#tattoocommunity', '#tattoodesign'],
        pinterest: ['#tattoo', '#tattooideas', '#tattoodesign', '#inked', '#bodyart', '#tattooinspiration'],
      };
      const tags = [...(coreTags[platform] || coreTags.instagram), ...cityTag].sort(() => Math.random() - 0.5);

      result = { caption, hashtags: tags };
    }

    return c.json(result);
  } catch (e: any) {
    console.error('[content/generate]', e);
    c.status(500);
    return c.json({ error: e.message || 'Generation failed' });
  }
});

/** List content drafts (cloud) */
app.get('/api/content/drafts', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const artistId = c.req.query('artistId');
  const status = c.req.query('status');
  if (!artistId) { c.status(400); return c.json({ error: 'artistId required' }); }
  let sql = 'SELECT * FROM content_drafts WHERE artistId = ?';
  const params: any[] = [artistId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY updatedAt DESC';
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ items: results || [] });
});

/** Create a content draft */
app.post('/api/content/drafts', async (c) => {
  if (!requireAuth(c, c.env)) return;
  try {
    const { artistId, platform, caption, hashtags, imageUrls, gridDataUrl, watermarkText, layout, backgroundColor, tone, status, scheduledAt } = await c.req.json();
    if (!artistId) { c.status(400); return c.json({ error: 'artistId required' }); }
    const id = generateId('cd');
    const ts = now();
    await c.env.DB.prepare(
      `INSERT INTO content_drafts (id, artistId, platform, caption, hashtags, imageUrls, gridDataUrl, watermarkText, layout, backgroundColor, tone, status, scheduledAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, artistId, platform || 'instagram', caption || '', hashtags || '', JSON.stringify(imageUrls || []), gridDataUrl || '', watermarkText || '', layout || '3x3', backgroundColor || '#000000', tone || 'professional', status || 'draft', scheduledAt || null, ts, ts).run();
    await audit(c.env, 'content_draft_created', { artistId, draftId: id });
    return c.json({ ok: true, id });
  } catch (e: any) { c.status(500); return c.json({ error: e.message }); }
});

/** Update a content draft */
app.put('/api/content/drafts/:id', async (c) => {
  if (!requireAuth(c, c.env)) return;
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await c.env.DB.prepare('SELECT * FROM content_drafts WHERE id = ?').bind(id).first() as any;
    if (!existing) { c.status(404); return c.json({ error: 'not_found' }); }

    const fields = ['platform', 'caption', 'hashtags', 'imageUrls', 'gridDataUrl', 'watermarkText', 'layout', 'backgroundColor', 'tone', 'status', 'scheduledAt'];
    const setClauses: string[] = [];
    const values: any[] = [];
    for (const f of fields) {
      if (updates[f] !== undefined) {
        setClauses.push(`${f} = ?`);
        if (f === 'imageUrls') {
          values.push(JSON.stringify(updates[f]));
        } else {
          values.push(updates[f]);
        }
      }
    }
    if (setClauses.length === 0) { return c.json({ ok: true }); }
    setClauses.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await c.env.DB.prepare(`UPDATE content_drafts SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run();
    await audit(c.env, 'content_draft_updated', { draftId: id });
    return c.json({ ok: true });
  } catch (e: any) { c.status(500); return c.json({ error: e.message }); }
});

/** Delete a content draft */
app.delete('/api/content/drafts/:id', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT id FROM content_drafts WHERE id = ?').bind(id).first();
  if (!existing) { c.status(404); return c.json({ error: 'not_found' }); }
  await c.env.DB.prepare('DELETE FROM content_drafts WHERE id = ?').bind(id).run();
  await audit(c.env, 'content_draft_deleted', { draftId: id });
  return c.json({ ok: true });
});

/** Calendar: get scheduled posts by date range */
app.get('/api/content/calendar', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const artistId = c.req.query('artistId');
  const from = c.req.query('from');
  const to = c.req.query('to');
  if (!artistId) { c.status(400); return c.json({ error: 'artistId required' }); }
  let sql = 'SELECT * FROM content_drafts WHERE artistId = ? AND status = ?';
  const params: any[] = [artistId, 'scheduled'];
  if (from) { sql += ' AND scheduledAt >= ?'; params.push(parseInt(from)); }
  if (to) { sql += ' AND scheduledAt <= ?'; params.push(parseInt(to)); }
  sql += ' ORDER BY scheduledAt ASC';
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ items: results || [] });
});

/** Record analytics event */
app.post('/api/content/analytics', async (c) => {
  if (!requireAuth(c, c.env)) return;
  try {
    const { draftId, artistId, platform, caption, impressions, likes, comments, shares, saves, clicks, source } = await c.req.json();
    if (!draftId || !artistId) { c.status(400); return c.json({ error: 'draftId and artistId required' }); }
    const id = generateId('ca');
    await c.env.DB.prepare(
      `INSERT INTO content_analytics (id, draftId, artistId, platform, caption, impressionCount, likeCount, commentCount, shareCount, saveCount, clickCount, source, recordedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, draftId, artistId, platform || 'instagram', caption || '', impressions || 0, likes || 0, comments || 0, shares || 0, saves || 0, clicks || 0, source || 'manual', now()).run();
    return c.json({ ok: true, id });
  } catch (e: any) { c.status(500); return c.json({ error: e.message }); }
});

/** Get analytics (aggregated) */
app.get('/api/content/analytics', async (c) => {
  if (!requireAuth(c, c.env)) return;
  const artistId = c.req.query('artistId');
  const period = c.req.query('period') || 'week';
  if (!artistId) { c.status(400); return c.json({ error: 'artistId required' }); }

  const periodMs: Record<string, number> = {
    week: 7 * 86400 * 1000,
    month: 30 * 86400 * 1000,
    all: 0,
  };
  const since = periodMs[period] ? now() - periodMs[period] : 0;

  let sql = 'SELECT * FROM content_analytics WHERE artistId = ?';
  const params: any[] = [artistId];
  if (since > 0) { sql += ' AND recordedAt >= ?'; params.push(since); }
  sql += ' ORDER BY recordedAt DESC';

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  const rows = results || [];

  // Aggregate
  const total: any = { posts: rows.length, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 };
  for (const r of rows) {
    total.impressions += (r as any).impressionCount || 0;
    total.likes += (r as any).likeCount || 0;
    total.comments += (r as any).commentCount || 0;
    total.shares += (r as any).shareCount || 0;
    total.saves += (r as any).saveCount || 0;
    total.clicks += (r as any).clickCount || 0;
  }

  // By platform
  const byPlatform: Record<string, any> = {};
  for (const r of rows) {
    const p = (r as any).platform || 'unknown';
    if (!byPlatform[p]) byPlatform[p] = { posts: 0, impressions: 0, likes: 0 };
    byPlatform[p].posts++;
    byPlatform[p].impressions += (r as any).impressionCount || 0;
    byPlatform[p].likes += (r as any).likeCount || 0;
  }

  return c.json({ items: rows, total, byPlatform });
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

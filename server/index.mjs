import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import webpush from 'web-push';

const app = express();
const port = Number(process.env.PORT || 8787);
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const platformFeePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || '0');
const serverApiKey = process.env.SERVER_API_KEY || '';
const requireApiKey = String(process.env.REQUIRE_API_KEY || '').toLowerCase() === 'true';
const publicUrl = String(process.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/+$/, '');

// ---- VAPID for push notifications ----
const vapidKeys = (() => {
  const envPub = process.env.VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) return { publicKey: envPub, privateKey: envPriv };
  const generated = webpush.generateVAPIDKeys();
  console.log('[push] VAPID keys generated (not persisted). Set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env to reuse.');
  return generated;
})();
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@inkflow.app',
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const files = {
  payments: path.join(dataDir, 'payments.json'),
  ledger: path.join(dataDir, 'ledger.json'),
  accounts: path.join(dataDir, 'accounts.json'),
  notifications: path.join(dataDir, 'notifications.json'),
  audit: path.join(dataDir, 'audit.json'),
  webhookEvents: path.join(dataDir, 'webhook_events.json'),
  pushSubscriptions: path.join(dataDir, 'push_subscriptions.json'),
  waivers: path.join(dataDir, 'waivers.json'),
};

if (!stripeSecretKey) {
  console.warn('[stripe] STRIPE_SECRET_KEY is missing. Stripe API calls will fail.');
}

const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder');

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  for (const f of Object.values(files)) {
    if (!fs.existsSync(f)) fs.writeFileSync(f, '[]', 'utf8');
  }
}

function readJsonArray(filePath) {
  ensureDataFiles();
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function writeJsonArray(filePath, items) {
  ensureDataFiles();
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
}

function appendJsonItem(filePath, item) {
  const all = readJsonArray(filePath);
  all.push(item);
  writeJsonArray(filePath, all);
}

function upsertLedgerByPaymentIntent(entry) {
  const all = readJsonArray(files.ledger);
  const idx = all.findIndex(x => x.paymentIntentId && x.paymentIntentId === entry.paymentIntentId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...entry, updatedAt: Date.now() };
  } else {
    all.push({ ...entry, createdAt: Date.now(), updatedAt: Date.now() });
  }
  writeJsonArray(files.ledger, all);
}

function requireAuth(req, res, next) {
  if (!requireApiKey) return next();
  if (!serverApiKey) return res.status(500).json({ error: 'SERVER_API_KEY missing on server' });
  const header = req.headers['x-api-key'];
  if (!header || String(header) !== serverApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!requireApiKey) return next();
    const role = String(req.headers['x-user-role'] || '');
    if (!roles.includes(role)) {
      return res.status(403).json({ error: `Forbidden: requires role ${roles.join('/')}` });
    }
    return next();
  };
}

function audit(action, payload = {}) {
  appendJsonItem(files.audit, {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    payload,
    createdAt: Date.now(),
  });
}

function getConnectedAccount(artistId) {
  const all = readJsonArray(files.accounts);
  return all.find(x => x.artistId === artistId)?.accountId || '';
}

function setConnectedAccount(artistId, accountId, email) {
  const all = readJsonArray(files.accounts);
  const idx = all.findIndex(x => x.artistId === artistId);
  const entry = { artistId, accountId, email, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = { ...all[idx], ...entry };
  else all.push({ ...entry, createdAt: Date.now() });
  writeJsonArray(files.accounts, all);
}

app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  ensureDataFiles();
  res.json({
    ok: true,
    stripeConfigured: Boolean(stripeSecretKey),
    requireApiKey,
    dataDir,
  });
});

app.get('/api/config/check', requireAuth, (_req, res) => {
  res.json({
    stripeSecretKey: Boolean(stripeSecretKey),
    stripeWebhookSecret: Boolean(webhookSecret),
    serverApiKey: Boolean(serverApiKey),
    requireApiKey,
    platformFeePercent,
  });
});

app.get('/api/stripe/payments/:artistId', requireAuth, (req, res) => {
  const artistId = req.params.artistId;
  const since = Number(req.query.since || '0');
  const items = readJsonArray(files.payments)
    .filter((x) => x.artistId === artistId && (!since || x.createdAt > since))
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json({ items });
});

app.get('/api/ledger/:artistId', requireAuth, requireRole('owner', 'staff', 'artist'), (req, res) => {
  const artistId = req.params.artistId;
  const items = readJsonArray(files.ledger).filter(x => x.artistId === artistId).sort((a, b) => b.updatedAt - a.updatedAt);
  res.json({ items });
});

app.post('/api/stripe/connect/account-link', requireAuth, requireRole('owner', 'artist'), async (req, res) => {
  try {
    const { artistId, email, country, refreshUrl, returnUrl } = req.body || {};
    if (!artistId || !email || !refreshUrl || !returnUrl) {
      return res.status(400).json({ error: 'artistId, email, refreshUrl, returnUrl are required' });
    }

    let accountId = getConnectedAccount(artistId);
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
      setConnectedAccount(artistId, accountId, email);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    audit('stripe_connect_account_link_created', { artistId, accountId });
    return res.json({ accountId, url: accountLink.url, expiresAt: accountLink.expires_at });
  } catch (error) {
    console.error('[connect/account-link]', error);
    return res.status(500).json({ error: 'Failed to create Stripe account link' });
  }
});

app.post('/api/stripe/checkout-session', requireAuth, requireRole('owner', 'staff', 'artist'), async (req, res) => {
  try {
    const { connectedAccountId, amount, currency = 'usd', leadId, clientName, artistId, successUrl, cancelUrl } = req.body || {};
    if (!connectedAccountId || !amount || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'connectedAccountId, amount, successUrl, cancelUrl are required' });
    }

    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'amount must be > 0' });
    }

    const feeAmount = Math.floor(amountCents * (platformFeePercent / 100));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: String(currency).toLowerCase(),
          product_data: { name: `Tattoo Deposit${clientName ? ` - ${clientName}` : ''}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: { destination: connectedAccountId },
        metadata: {
          leadId: String(leadId || ''),
          artistId: String(artistId || ''),
          connectedAccountId: String(connectedAccountId),
        },
      },
      metadata: {
        leadId: String(leadId || ''),
        artistId: String(artistId || ''),
        connectedAccountId: String(connectedAccountId),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    upsertLedgerByPaymentIntent({
      artistId: String(artistId || ''),
      leadId: String(leadId || ''),
      paymentIntentId: String(session.payment_intent || ''),
      sessionId: session.id,
      status: 'checkout_created',
      amount: amountCents,
      currency: String(currency).toLowerCase(),
      channel: 'stripe_connect',
    });
    audit('stripe_checkout_created', { artistId, leadId, sessionId: session.id });
    return res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[checkout-session]', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Public endpoint — client self-booking deposit payment (no auth required)
app.post('/api/stripe/client-deposit', async (req, res) => {
  try {
    const { artistId, amount, currency = 'usd', clientName, leadId, appointmentId, successUrl, cancelUrl } = req.body || {};
    if (!artistId || !amount || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'artistId, amount, successUrl, cancelUrl are required' });
    }
    const connectedAccountId = getConnectedAccount(artistId);
    if (!connectedAccountId) {
      return res.status(400).json({ error: 'Artist has not connected Stripe yet' });
    }
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'amount must be > 0' });
    }
    const feeAmount = Math.floor(amountCents * (platformFeePercent / 100));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: String(currency).toLowerCase(),
          product_data: { name: `Tattoo Deposit${clientName ? ` - ${clientName}` : ''}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: { destination: connectedAccountId },
        metadata: {
          leadId: String(leadId || ''),
          artistId: String(artistId),
          appointmentId: String(appointmentId || ''),
          connectedAccountId: String(connectedAccountId),
          source: 'client_booking',
        },
      },
      metadata: {
        leadId: String(leadId || ''),
        artistId: String(artistId),
        appointmentId: String(appointmentId || ''),
        connectedAccountId: String(connectedAccountId),
        source: 'client_booking',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    upsertLedgerByPaymentIntent({
      artistId: String(artistId),
      leadId: String(leadId || ''),
      paymentIntentId: String(session.payment_intent || ''),
      sessionId: session.id,
      status: 'checkout_created',
      amount: amountCents,
      currency: String(currency).toLowerCase(),
      channel: 'stripe_connect',
      appointmentId: String(appointmentId || ''),
    });
    audit('stripe_client_deposit_created', { artistId, leadId, appointmentId, sessionId: session.id });
    return res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[client-deposit]', error);
    return res.status(500).json({ error: 'Failed to create deposit session' });
  }
});

app.post('/api/stripe/refund', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { paymentIntentId, amount, reason, actor, leadId, artistId } = req.body || {};
    if (!paymentIntentId) return res.status(400).json({ error: 'paymentIntentId is required' });
    const refundPayload = { payment_intent: String(paymentIntentId) };
    if (amount && Number(amount) > 0) refundPayload.amount = Math.round(Number(amount) * 100);
    const refund = await stripe.refunds.create(refundPayload);

    appendJsonItem(files.payments, {
      id: `refund_req_${refund.id}_${Date.now()}`,
      type: 'refund_requested',
      refundId: refund.id,
      paymentIntentId,
      leadId: leadId || '',
      artistId: artistId || '',
      reason: reason || '',
      actor: actor || '',
      amount: refund.amount || 0,
      currency: refund.currency || 'usd',
      createdAt: Date.now(),
    });
    upsertLedgerByPaymentIntent({
      artistId: String(artistId || ''),
      leadId: String(leadId || ''),
      paymentIntentId: String(paymentIntentId),
      status: 'refund_requested',
      refundId: refund.id,
      refundReason: reason || '',
      refundedAmount: refund.amount || 0,
      currency: refund.currency || 'usd',
    });
    audit('stripe_refund_requested', { artistId, leadId, paymentIntentId, refundId: refund.id, actor });
    return res.json({ ok: true, refundId: refund.id, status: refund.status });
  } catch (error) {
    console.error('[refund]', error);
    return res.status(500).json({ error: 'Failed to create refund' });
  }
});

app.post('/api/notifications/enqueue', requireAuth, requireRole('owner', 'staff', 'artist'), (req, res) => {
  const { artistId, leadId, channel, templateType, payload } = req.body || {};
  if (!artistId || !leadId || !channel || !templateType) {
    return res.status(400).json({ error: 'artistId, leadId, channel, templateType required' });
  }
  const item = {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    artistId,
    leadId,
    channel,
    templateType,
    payload: payload || {},
    status: 'queued',
    retries: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  appendJsonItem(files.notifications, item);
  audit('notification_enqueued', { artistId, leadId, channel, templateType });
  res.json({ ok: true, id: item.id });
});

app.get('/api/notifications/:artistId', requireAuth, requireRole('owner', 'staff', 'artist'), (req, res) => {
  const artistId = req.params.artistId;
  const items = readJsonArray(files.notifications).filter(x => x.artistId === artistId).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ items });
});

app.post('/api/stripe/webhook', (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig || !webhookSecret) return res.status(400).send('Missing stripe signature or webhook secret');
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    const seen = readJsonArray(files.webhookEvents);
    if (seen.includes(event.id)) return res.json({ received: true, deduped: true });
    seen.push(event.id);
    writeJsonArray(files.webhookEvents, seen);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      appendJsonItem(files.payments, {
        id: `pay_${session.id}`,
        type: 'deposit_paid',
        sessionId: session.id,
        paymentIntentId: session.payment_intent || '',
        leadId: session.metadata?.leadId || '',
        artistId: session.metadata?.artistId || '',
        connectedAccountId: session.metadata?.connectedAccountId || '',
        amountTotal: session.amount_total || 0,
        currency: session.currency || 'usd',
        paymentStatus: session.payment_status || '',
        createdAt: Date.now(),
      });
      upsertLedgerByPaymentIntent({
        artistId: session.metadata?.artistId || '',
        leadId: session.metadata?.leadId || '',
        paymentIntentId: String(session.payment_intent || ''),
        sessionId: session.id,
        status: 'paid',
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        channel: 'stripe_connect',
      });
      audit('stripe_webhook_paid', { eventId: event.id, sessionId: session.id });
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      appendJsonItem(files.payments, {
        id: `refund_${charge.id}_${Date.now()}`,
        type: 'refund',
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent || '',
        leadId: charge.metadata?.leadId || '',
        artistId: charge.metadata?.artistId || '',
        connectedAccountId: charge.metadata?.connectedAccountId || '',
        amountRefunded: charge.amount_refunded || 0,
        currency: charge.currency || 'usd',
        createdAt: Date.now(),
      });
      upsertLedgerByPaymentIntent({
        artistId: charge.metadata?.artistId || '',
        leadId: charge.metadata?.leadId || '',
        paymentIntentId: String(charge.payment_intent || ''),
        status: 'refunded',
        refundedAmount: charge.amount_refunded || 0,
        currency: charge.currency || 'usd',
      });
      audit('stripe_webhook_refunded', { eventId: event.id, chargeId: charge.id });
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[webhook]', error);
    return res.status(400).send('Webhook error');
  }
});

// =============================================
// Push Notification Endpoints
// =============================================

function sendPushToArtist(artistId, payload) {
  const subs = readJsonArray(files.pushSubscriptions).filter(s => s.artistId === artistId);
  if (subs.length === 0) return;
  const full = { ...payload, timestamp: Date.now() };
  for (const sub of subs) {
    webpush.sendNotification(sub, JSON.stringify(full)).catch(err => {
      // 410 Gone = subscription expired; remove it
      if (err.statusCode === 410) {
        const remaining = readJsonArray(files.pushSubscriptions).filter(s => s.endpoint !== sub.endpoint);
        writeJsonArray(files.pushSubscriptions, remaining);
      }
    });
  }
}

// GET VAPID public key (no auth — needed before subscribing)
app.get('/api/push/vapid-key', (_req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// POST subscribe (no auth — called from browser PushManager)
app.post('/api/push/subscribe', (req, res) => {
  const { artistId, endpoint, keys } = req.body || {};
  if (!artistId || !endpoint || !keys) {
    return res.status(400).json({ error: 'artistId, endpoint, keys required' });
  }
  const all = readJsonArray(files.pushSubscriptions);
  // Remove old subscription for this endpoint if exists
  const filtered = all.filter(s => s.endpoint !== endpoint);
  filtered.push({
    artistId,
    endpoint,
    keys,
    createdAt: Date.now(),
  });
  writeJsonArray(files.pushSubscriptions, filtered);
  audit('push_subscribed', { artistId, endpoint: endpoint.slice(0, 50) });
  res.json({ ok: true });
});

// POST unsubscribe
app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
  const all = readJsonArray(files.pushSubscriptions);
  writeJsonArray(files.pushSubscriptions, all.filter(s => s.endpoint !== endpoint));
  res.json({ ok: true });
});

// POST send test push (auth required)
app.post('/api/push/send', requireAuth, requireRole('owner'), (req, res) => {
  const { artistId, title, body, tag, url } = req.body || {};
  if (!artistId) return res.status(400).json({ error: 'artistId required' });
  sendPushToArtist(artistId, {
    title: title || 'Test Notification',
    body: body || 'This is a test push from InkFlow',
    tag: tag || 'test',
    url: url || '/today',
  });
  audit('push_sent_test', { artistId });
  res.json({ ok: true });
});

// POST booking — triggers push notification to artist
app.post('/api/booking/:artistId', (req, res) => {
  const { artistId } = req.params;
  const { name, date, time } = req.body || {};
  sendPushToArtist(artistId, {
    title: 'New Booking!',
    body: `${name || 'Someone'} booked for ${date || ''} at ${time || ''}`,
    tag: 'new_booking',
    url: '/today',
  });
  audit('booking_push_sent', { artistId, clientName: name });
  res.json({ ok: true });
});

// =============================================
// Waiver API Endpoints
// =============================================

// GET public waiver info — returns appointment client name, artist info, waiver text (no auth)
app.get('/api/waiver/public/:appointmentId', (req, res) => {
  const { appointmentId } = req.params;
  const waivers = readJsonArray(files.waivers);
  // Check for signed waiver first
  const signed = waivers.find(w => w.appointmentId === appointmentId && w.status === 'signed');
  if (signed) {
    return res.json({ alreadySigned: true, signedAt: signed.signedAt });
  }
  // Then check for a pending stub
  const stub = waivers.find(w => w.appointmentId === appointmentId && w.status === 'pending');
  if (!stub) {
    return res.status(404).json({ error: 'Waiver not found for this appointment' });
  }
  res.json({
    alreadySigned: false,
    appointmentId: stub.appointmentId,
    clientName: stub.clientName,
    artistName: stub.artistName,
    shopName: stub.shopName,
    appointmentType: stub.appointmentType,
    waiverText: stub.waiverText,
    country: stub.country,
  });
});

// POST create waiver stub (called when a booking is created, auth required)
app.post('/api/waiver/create-stub', requireAuth, requireRole('owner', 'staff', 'artist'), (req, res) => {
  const { appointmentId, clientName, artistName, shopName, appointmentType, country, clientId } = req.body || {};
  if (!appointmentId || !clientName) {
    return res.status(400).json({ error: 'appointmentId and clientName required' });
  }
  const all = readJsonArray(files.waivers);
  // Don't create stub if already exists
  if (all.some(w => w.appointmentId === appointmentId)) {
    return res.json({ ok: true });
  }
  // Build waiver text server-side using simple template
  const typeLabel = appointmentType === 'new_tattoo' ? 'Tattoo' : appointmentType === 'touch_up' ? 'Touch-up' : 'Service';
  const waiverText = [
    `${typeLabel} CONSENT AND RELEASE FORM`,
    '',
    `Client: ${clientName}`,
    `Artist: ${artistName}`,
    `Studio: ${shopName || artistName}`,
    `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    'I hereby give my informed consent for the tattoo procedure described below.',
    'I understand that the procedure is permanent and results may vary.',
    'I confirm that I am not under the influence of alcohol or drugs.',
    'I have read and understand the aftercare instructions provided by the artist.',
    '',
    'By signing this form, I release the artist and studio from any liability',
    'related to allergic reactions, infections, or dissatisfaction with the result,',
    'provided standard professional procedures were followed.',
    '',
    country === 'DE' ? 'This consent does not affect your statutory rights under applicable law.' : '',
    country === 'UK' ? 'You have the right to cancel this service within 14 days under the Consumer Contracts Regulations.' : '',
    country === 'JP' ? 'この同意書は、日本の法律に基づくお客様の権利に影響を与えません。' : '',
  ].filter(Boolean).join('\n');

  all.push({
    id: `waiver_stub_${appointmentId}`,
    appointmentId,
    clientId: clientId || '',
    clientName,
    artistName,
    shopName,
    appointmentType: appointmentType || 'new_tattoo',
    waiverText,
    country: country || '',
    status: 'pending',
    createdAt: Date.now(),
  });
  writeJsonArray(files.waivers, all);
  res.json({ ok: true });
});

// POST sign waiver (public — called from public waiver page)
app.post('/api/waiver/sign', (req, res) => {
  const { appointmentId, name, email, phone, signature, idPhoto, clientDob, healthAnswers, waiverText } = req.body || {};
  if (!appointmentId || !signature) {
    return res.status(400).json({ error: 'appointmentId and signature required' });
  }
  const all = readJsonArray(files.waivers);
  // Check if already signed
  if (all.some(w => w.appointmentId === appointmentId && w.status === 'signed')) {
    return res.status(409).json({ error: 'already_signed' });
  }
  const now = Date.now();
  const record = {
    id: `waiver_${appointmentId}_${now}`,
    appointmentId,
    clientName: name || '',
    clientEmail: email || '',
    clientPhone: phone || '',
    signature,
    idPhoto: idPhoto || null,
    clientDob: clientDob || null,
    healthAnswers: healthAnswers || [],
    waiverText: waiverText || '',
    status: 'signed',
    signedAt: now,
    createdAt: now,
    ip: req.ip || req.socket?.remoteAddress || '',
    userAgent: req.headers['user-agent'] || '',
  };
  all.push(record);
  writeJsonArray(files.waivers, all);
  audit('waiver_signed', { appointmentId, clientName: name });
  res.json({ ok: true, id: record.id });
});

// GET waiver record (auth required — for artist/owner to view)
app.get('/api/waiver/:appointmentId', requireAuth, (req, res) => {
  const { appointmentId } = req.params;
  const all = readJsonArray(files.waivers);
  const waiver = all.find(w => w.appointmentId === appointmentId && w.status === 'signed');
  if (!waiver) return res.status(404).json({ error: 'not_found' });
  res.json(waiver);
});

// GET list waivers for an artist (auth required)
app.get('/api/waivers/:artistId', requireAuth, requireRole('owner', 'staff', 'artist'), (req, res) => {
  const { artistId } = req.params;
  // Waivers aren't indexed by artistId directly; return all signed waivers (client can filter on frontend)
  const all = readJsonArray(files.waivers).filter(w => w.status === 'signed').sort((a, b) => b.signedAt - a.signedAt);
  res.json({ items: all });
});

// POST send waiver signing link (auth required — queues notification)
app.post('/api/waiver/send-link', requireAuth, requireRole('owner', 'staff', 'artist'), (req, res) => {
  const { appointmentId, clientName, clientPhone, clientEmail, artistId } = req.body || {};
  if (!appointmentId || !artistId) {
    return res.status(400).json({ error: 'appointmentId and artistId required' });
  }
  const waiverUrl = `${publicUrl}/public-waiver/${appointmentId}`;
  // Enqueue notification
  const ntfItem = {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    artistId,
    leadId: appointmentId,
    channel: clientEmail ? 'email' : 'sms',
    templateType: 'waiver_link',
    payload: { waiverUrl, clientName, appointmentId, to: clientEmail || clientPhone },
    status: 'queued',
    retries: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  appendJsonItem(files.notifications, ntfItem);
  audit('waiver_link_sent', { appointmentId, artistId });
  res.json({ ok: true, id: ntfItem.id, waiverUrl });
});

// =============================================

app.listen(port, () => {
  ensureDataFiles();
  console.log(`[server] running at http://localhost:${port}`);
});

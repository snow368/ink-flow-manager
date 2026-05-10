import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 8787);
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const platformFeePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || '5');
const serverApiKey = process.env.SERVER_API_KEY || '';
const requireApiKey = String(process.env.REQUIRE_API_KEY || '').toLowerCase() === 'true';

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

app.listen(port, () => {
  ensureDataFiles();
  console.log(`[server] running at http://localhost:${port}`);
});

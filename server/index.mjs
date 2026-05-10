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

if (!stripeSecretKey) {
  console.warn('[stripe] STRIPE_SECRET_KEY is missing. Stripe API calls will fail.');
}

const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const paymentsFile = path.join(dataDir, 'payments.json');

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(paymentsFile)) fs.writeFileSync(paymentsFile, '[]', 'utf8');
}

function readPayments() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
  } catch {
    return [];
  }
}

function writePayments(items) {
  ensureDataFile();
  fs.writeFileSync(paymentsFile, JSON.stringify(items, null, 2), 'utf8');
}

app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

const connectedAccountsByArtist = new Map();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, stripeConfigured: Boolean(stripeSecretKey) });
});

app.get('/api/stripe/payments/:artistId', (req, res) => {
  const artistId = req.params.artistId;
  const items = readPayments()
    .filter((x) => x.artistId === artistId)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json({ items });
});

app.post('/api/stripe/connect/account-link', async (req, res) => {
  try {
    const { artistId, email, country, refreshUrl, returnUrl } = req.body || {};
    if (!artistId || !email || !refreshUrl || !returnUrl) {
      return res.status(400).json({ error: 'artistId, email, refreshUrl, returnUrl are required' });
    }

    let accountId = connectedAccountsByArtist.get(artistId);
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
      connectedAccountsByArtist.set(artistId, accountId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return res.json({ accountId, url: accountLink.url, expiresAt: accountLink.expires_at });
  } catch (error) {
    console.error('[connect/account-link]', error);
    return res.status(500).json({ error: 'Failed to create Stripe account link' });
  }
});

app.post('/api/stripe/checkout-session', async (req, res) => {
  try {
    const {
      connectedAccountId,
      amount,
      currency = 'usd',
      leadId,
      clientName,
      artistId,
      successUrl,
      cancelUrl,
    } = req.body || {};

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
      line_items: [
        {
          price_data: {
            currency: String(currency).toLowerCase(),
            product_data: { name: `Tattoo Deposit${clientName ? ` - ${clientName}` : ''}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
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

    return res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[checkout-session]', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/stripe/webhook', (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig || !webhookSecret) {
      return res.status(400).send('Missing stripe signature or webhook secret');
    }
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const all = readPayments();
      all.push({
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
      writePayments(all);
      console.log('[webhook] checkout.session.completed', {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        metadata: session.metadata,
      });
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const all = readPayments();
      all.push({
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
      writePayments(all);
      console.log('[webhook] charge.refunded', {
        chargeId: charge.id,
        metadata: charge.metadata,
        amountRefunded: charge.amount_refunded,
      });
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[webhook]', error);
    return res.status(400).send('Webhook error');
  }
});

app.listen(port, () => {
  console.log(`[server] running at http://localhost:${port}`);
});

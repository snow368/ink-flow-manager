# Stripe Connect Setup (Current Project)

## 1) Install and run

1. Frontend:
```bash
npm run dev
```

2. API server:
```bash
npm run server
```

Server default URL: `http://localhost:8787`

## 2) Environment

Copy `server/.env.example` to `.env` (project root), then fill:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PLATFORM_FEE_PERCENT` (default 5)

## 3) Stripe webhook (local)

Use Stripe CLI to forward:

```bash
stripe listen --forward-to localhost:8787/api/stripe/webhook
```

Take the generated signing secret and set `STRIPE_WEBHOOK_SECRET`.

## 4) Product flow now

1. Go to `Me -> Payment Settings`
2. Select `Stripe Connect Express`
3. Click `Connect Stripe Express` to create onboarding link
4. Finish onboarding in Stripe
5. In Leads, click `Copy Deposit Link` to generate Stripe Checkout URL
6. Send URL to client
7. After payment/refund webhook is received, click `Sync Payments` in Leads (or reload page) to update lead status

## 5) Implemented API endpoints

- `POST /api/stripe/connect/account-link`
- `POST /api/stripe/checkout-session`
- `POST /api/stripe/webhook`
- `GET /api/health`
- `GET /api/stripe/payments/:artistId`

## 6) Current limits (next step)

- Connected account mapping is in-memory on server restart
- Webhook events are persisted in `server/data/payments.json`; frontend syncs lead status from this feed
- Country/currency matrix not yet expanded for non-US flows

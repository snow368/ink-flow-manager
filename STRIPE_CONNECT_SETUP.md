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
- `REQUIRE_API_KEY` (`true/false`)
- `SERVER_API_KEY` (required when `REQUIRE_API_KEY=true`)

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
- `POST /api/stripe/refund`
- `GET /api/health`
- `GET /api/stripe/payments/:artistId`
- `GET /api/ledger/:artistId`
- `POST /api/notifications/enqueue`
- `GET /api/notifications/:artistId`
- `GET /api/config/check`

## 6) Current limits (next step)

- Connected account mapping is persisted in `server/data/accounts.json`
- Payment ledger is persisted in `server/data/ledger.json`
- Notification queue is persisted in `server/data/notifications.json`
- Webhook idempotency is persisted in `server/data/webhook_events.json`

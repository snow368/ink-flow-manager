# Ink Flow Manager Launch Checklist

## A. Core Flow Regression (P0)

- [x] Intake link creates lead correctly (`/intake/:artistId`)
- [x] Lead payment methods supported: `stripe_connect / manual_link / bank_transfer / cash`
- [x] Client payment portal works (`/pay/:leadId`)
- [x] Client payment status page works (`/pay/status/:leadId`)
- [x] Payment review queue in `Payment History` supports approve/reject
- [x] Refund flow implemented (Stripe API + local/offline handling)
- [x] Auto follow-up after refund (48h) implemented
- [x] Auto reminders for unpaid leads (24h/48h) implemented
- [x] Today page shows deposit reminder cards
- [x] CSV export available in `Payment History`

## B. Build & Runtime

- [x] Frontend production build passes (`npm run build`)
- [ ] Backend server starts and health check passes (`npm run server`, `GET /api/health`)
- [ ] Stripe webhook forwarding active (Stripe CLI -> `/api/stripe/webhook`)
- [ ] Verify `server/data/payments.json` writable in deployment environment

## C. Stripe & Payments Config

- [ ] `.env` prepared with:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PLATFORM_FEE_PERCENT`
  - `PORT`
- [ ] At least one artist completed Stripe Connect onboarding
- [ ] Stripe checkout end-to-end tested with test card
- [ ] Refund endpoint tested with a real test payment intent

## D. Data & Safety

- [ ] Backup/restore tested from Me page
- [ ] Verify no PII leaks in logs before production
- [ ] Confirm retention policy for uploaded payment proofs
- [ ] Confirm who can access payment review and refund actions

## E. UX Final Pass

- [x] i18n connected for core client payment flow (EN/ZH + fallback)
- [ ] Optional: extend new payment strings to ES/PT/FR/DE/TH/JP
- [ ] Optional: replace remaining alert popups with in-app toasts

## F. Release Ops

- [ ] Push local commits to GitHub main (network currently unstable in this environment)
- [ ] Tag release (example: `v0.3.0-launch`)
- [ ] Record rollback plan (previous stable commit hash)
- [ ] Publish internal runbook for support (payment failed / refund / proof reject)

## G. Post-Launch Day-1 Monitoring

- [ ] Monitor:
  - checkout success rate
  - pending_verify backlog
  - refund rate
  - unpaid > 48h count
- [ ] Verify first 10 live payment records manually
- [ ] Verify reminder actions are being used by artists

# Pricing Playbook

This file defines how to maintain messaging and storage pricing with near-zero margin surprises.

## 1) Free Plan Rules

- Free includes local data + user-owned drive only.
- Free does **not** include platform cloud storage.
- Free does **not** include platform message quota (manual copy is allowed).

## 2) Region Pricing Source of Truth

- Code config: `src/lib/pricing.ts`
- Regions:
  - `US`
  - `EU`
  - `SEA`
  - `LATAM`
  - `OTHER` (fallback)

## 3) Current Suggested Price Baseline

### Messaging packs

- US: 200 `$4.99`, 500 `$9.99`, 1500 `$24.99`, overage `$0.06`
- EU: 200 `€5.99`, 500 `€11.99`, 1500 `€29.99`, overage `€0.08`
- SEA: 200 `$4.99`, 500 `$9.99`, 1500 `$24.99`, overage `$0.06`
- LATAM: 200 `$5.99`, 500 `$12.99`, 1500 `$29.99`, overage `$0.09`

### Storage tiers

- Pro 50GB: `$9.9`
- Plus 200GB: `$19.99`
- Plus 500GB: `$29.99`
- Extra 50GB: `$4.99`
- Extra 200GB: `$14.99`

## 4) Monthly Update Procedure

1. Export previous month:
   - total sent (SMS / WhatsApp)
   - delivery success / failed
   - average provider cost by country
2. Recalculate target price:
   - SMS target = real unit cost × `2.5 ~ 4.0`
   - Storage target = real per-GB cost × `3 ~ 5`
3. Update `src/lib/pricing.ts`
4. Release note with effective date.

## 5) Provider Strategy

- US first route: Twilio
- EU/SEA/LATAM: prefer multi-provider routing (Infobip/MessageBird/Twilio fallback)
- Keep a fallback provider per region to reduce outage risk.

## 6) Guardrails

- Never hardcode one global message price.
- Price by destination region/country.
- Keep overage visible in UI before send.

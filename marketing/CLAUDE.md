# Ink Flow Manager

Tattoo studio management PWA SaaS. Solo founder project.

## Stack
- React 18 + TypeScript + Vite 5 (PWA with workbox, injectManifest strategy)
- Dexie.js (IndexedDB, currently at v19)
- React Router v6
- Express server (Stripe Connect payments)
- 7 languages (EN/ZH/ES/PT/FR/DE/JP)

## Key rules
- Everything prioritized for tattoo artist convenience (一切以纹身师便利为主)
- Work in D:\ink-flow-manager, never C:\Users\snow3
- Run `npx tsc --noEmit` before committing
- Git proxy: http://127.0.0.1:10808 (v2rayN)
- No comments unless the WHY is non-obvious
- No emojis unless user asks

## Architecture
- `src/db.ts` — Dexie DB schema, migrations (v1→v19), 25 tables
- `src/pages/` — 47 pages, one per route, all `React.lazy()` code-split
- `src/lib/` — 47 business logic modules (no React)
- `src/components/` — 5 shared UI components
- `server/` — Express backend for Stripe Connect
- `src/sw.ts` — Custom service worker (push notifications)
- `e2e/` — Playwright E2E tests (desktop + mobile + tablet)

## Testing
- `npm test` — vitest watch mode (unit tests)
- `npm run test:run` — vitest single run
- `npm run test:e2e` — Playwright all projects
- `npm run test:e2e:desktop` — Chrome 1280×800
- `npm run test:e2e:mobile` — Pixel 5 viewport with touch
- `npm run test:e2e:tablet` — iPad-like 1024×1366 with touch
- `npm run test:all` — unit + E2E (desktop + mobile)
- Unit tests: `src/**/__tests__/*.test.ts`
- E2E tests: `e2e/*.spec.ts`
- Tests seed IndexedDB via `page.evaluate()` for clean state
- No `beforeinstallprompt` or push notification tests yet

## Route Map

### Auth
| Route | Page | Description |
|-------|------|-------------|
| `/register` | Register | Register or login with email, role selection |
| `/verification` | Verification | Social verification (IG/FB/TT) |

### Core (TabBar: Today / Clients / Me)
| Route | Page | Description |
|-------|------|-------------|
| `/today` | Today | Dashboard: day/week/multi view, appointments, leads, reminders, reviews |
| `/clients` | Clients | Client list with search, filter, sort, import |
| `/client/new` | NewClientForm | Create new client |
| `/client/:id` | ClientDetail | Client detail: info, tags, invoices, merge |
| `/me` | Me | Profile, language, navigation hub to all settings |

### Appointments & Booking
| Route | Page | Description |
|-------|------|-------------|
| `/appointment/new` | AppointmentForm | Create appointment with conflict detection |
| `/waiver/:appointmentId` | WaiverSign | Health waiver with digital signature |
| `/session/:appointmentId` | SessionPage | Session timer, consumables tracking |
| `/respond/:id` | AppointmentRespondPage | Client booking response (confirm/reschedule/cancel) |
| `/book/:artistId` | ClientBookingPage | Multi-step public booking form |
| `/embed/:artistId` | EmbedBookingPage | Simplified embeddable booking form |
| `/checkin/:appointmentId` | CheckinPage | QR check-in |

### Clients & Portal
| Route | Page | Description |
|-------|------|-------------|
| `/intake/:artistId` | IntakePage | Lead intake form (6 sections) |
| `/intake/revise/:leadId` | LeadRevisePage | Lead revision submission |
| `/portal/:clientId` | ClientPortalPage | Client portal: appointments + timeline |
| `/pay/:leadId` | ClientPaymentPage | Payment form with proof upload |
| `/pay/status/:leadId` | ClientPaymentStatusPage | Payment status display |

### Leads & Marketing
| Route | Page | Description |
|-------|------|-------------|
| `/leads` | LeadsPage | Full lead pipeline with payments, follow-ups, conversion tracking |
| `/referral` | Referral | Referral link & share |
| `/outreach` | Outreach | Multi-channel outreach (WA/SMS/IG/FB/TT) |
| `/content-strategy` | ContentStrategyPage | AI content strategy engine (dev-only) |

### Business Operations
| Route | Page | Description |
|-------|------|-------------|
| `/pos` | PosPage | Point of sale with cart, tips, refund |
| `/pos-settings` | PosSettingsPage | POS tax rate, receipt, service presets |
| `/invoices` | Invoices | Invoice list + creation (split payments) |
| `/invoice/:id` | InvoiceDetail | Invoice view, mark paid, partial payments, share |
| `/invoice-settings` | InvoiceSettingsPage | Invoice config: presets, defaults, tax |
| `/payment-settings` | PaymentSettingsPage | Stripe Connect, payment methods, templates |
| `/payment-history` | PaymentHistoryPage | Payment records with approve/reject |

### Inventory & Supplies
| Route | Page | Description |
|-------|------|-------------|
| `/inventory` | InventoryPage | Inventory management with barcode scan |
| `/supply-brands` | SupplyBrandsPage | Supply brand directory with affiliate links |
| `/supply-brands/admin` | SupplyBrandsAdmin | Supply brand CRUD (dev-only) |
| `/supply-reviews` | SupplyReviewsPage | Product reviews with search, upvote |

### Competitors & Marketing
| Route | Page | Description |
|-------|------|-------------|
| `/competitors` | CompetitorsPage | Competitor tracking with features analysis |
| `/competitors/admin` | CompetitorsAdmin | Competitor CRUD (dev-only) |

### Settings
| Route | Page | Description |
|-------|------|-------------|
| `/availability-settings` | AvailabilitySettingsPage | Working hours, days off, reminders toggle |
| `/notification-settings` | NotificationSettings | Twilio/SendGrid/Web Push config |
| `/deposit-policy` | DepositPolicyPage | Per-scenario deposit rules |
| `/artist-profile` | ArtistProfilePage | Public profile: bio, links, events, portfolio |
| `/events` | EventsPage | Convention/guest spot management |
| `/portfolio` | Portfolio | Image management, upload, tagging |
| `/review-invites` | ReviewInvitesPage | Tier-based review invite system |
| `/locations` | LocationsPage | Multi-location management |
| `/health-checklist` | HealthChecklistPage | Inspection checklists |

### Other
| Route | Page | Description |
|-------|------|-------------|
| `/analytics` | AnalyticsPage | Dashboard with 7d/30d/90d metrics |

## DB Schema (v19) — 25 Tables
```
users, clients, appointments, projects, waivers, sessions,
inventory, portfolio, socialDrafts, referrals, leads, leadRevisions,
supplyBrands, posTransactions, studioLocations, invoices, competitors,
supplyReviews, waitingList, healthChecklists, communicationLog, affiliateClicks
```

### Key Record Extensions
- **UserRecord**: roles, plan, stations[], reviewLinks, bioProfile, bioEvents[], SMS/email config, payment config
- **AppointmentRecord**: rescheduleRequest, reviewInvitedAt, reviewFollowUpCount, station, seriesId
- **InvoiceRecord**: payments[] (split payment support)
- **LeadRecord**: full payment tracking, consultMode, revision tracking, follow-up scheduling

## Lib Modules (src/lib/)

### API & Integration
- `backendApi.ts` — Cloudflare Worker API (sync, calendar, owner)
- `bookingPoll.ts` — Pending booking polling from Worker
- `push.ts` — Web Push subscription management
- `emailService.ts` — Brevo email sending
- `smsService.ts` — Twilio SMS integration
- `reminders.ts` — Reminder scheduling and sending
- `calendarSync.ts` — ICS file generation + Google Calendar URL

### Business Logic
- `payments.ts` — Payment processing, Stripe, proof handling
- `commissionLogic.ts` — Commission split, tipping by country
- `reviewInvite.ts` / `reviewTier.ts` — Review invite scheduling & tier logic
- `referralLogic.ts` — Referral tracking
- `affiliateTracking.ts` — Supply brand affiliate click tracking
- `supplyShipsTo.ts` — Shipping country validation
- `waiverLogic.ts` — Waiver document generation
- `sessionManager.ts` — Session timer, timeline, consumables
- `appointmentLogic.ts` — Appointment CRUD, conflict detection
- `availability.ts` — Slot generation and availability checking

### Content & Marketing
- `contentStrategy.ts` — Competitor gap analysis + AI prompt generation
- `competitorData.ts` — Competitor check scheduling
- `marketingLogic.ts` — Campaign tracking

### Data & Utilities
- `i18n.ts` — 7-language translation system with fallback
- `theme.ts` — Design tokens (dark theme)
- `pricing.ts` — Plan pricing + quota config
- `quota.ts` — Usage quota enforcement
- `fingerprint.ts` — Device fingerprinting

### Inventory & POS
- `posLogic.ts` — POS transaction processing
- `inventoryAlerts.ts` — Low stock alerts
- `inventoryCamera.ts` — Camera/barcode scanning

### Health & Compliance
- `healthChecklist.ts` — Health inspection templates
- `consentTemplates.ts` — Consent form templates

### Other
- `reviewLogic.ts` / `reviewRequest.ts` — Google review request
- `aftercareLogic.ts` — Aftercare instruction generation
- `videoMaker.ts` — Video content creation helper
- `voiceCommands.ts` — Voice recognition for sessions
- `consumableRecommend.ts` — Consumable recommendations
- `clientMerge.ts` — Duplicate client merge
- `communicationLog.ts` — Communication history logging
- `seedDev.ts` — Development seed data
- `devTools.ts` — Development utilities
- `locationLogic.ts` — Studio location logic
- `invoiceConfig.ts` / `invoiceSettings.ts` — Invoice configuration
- `waitingList.ts` — Waiting list management
- `qrCheckin.ts` — QR check-in code generation
- `googleDrive.ts` — Google Drive backup
- `bookingPoll.ts` — External booking polling
- `fingerprint.ts` — Device fingerprinting

## Components (src/components/)
- **TabBar** — Bottom tab navigation (Today/Clients/Me), uses `navigate()`
- **ErrorBoundary** — React error boundary with retry and stack trace
- **OfflineBanner** — Shows when `navigator.onLine === false`
- **LocationSelector** — Multi-location switcher
- **Loading** — Spinner component

## Audit bot
- 用户说「审核」时，加载 `.claude/audit-standards.md` 逐条检查
- 按 `.claude/instructions/audit-bot.md` 中的流程执行
- 报告分级：🔴严重 / 🟡警告 / 🔵建议 / ✅通过

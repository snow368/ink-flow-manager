// D1 database helpers — replaces JSON file operations from server/index.mjs

export interface Env {
  DB: D1Database;
  INKFLOW_IMAGES: R2Bucket;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SERVER_API_KEY?: string;
  REQUIRE_API_KEY?: string;
  STRIPE_PLATFORM_FEE_PERCENT?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  PUBLIC_URL?: string;
}

// ---- Init tables ----
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  artistId TEXT NOT NULL DEFAULT '',
  leadId TEXT NOT NULL DEFAULT '',
  sessionId TEXT NOT NULL DEFAULT '',
  paymentIntentId TEXT NOT NULL DEFAULT '',
  connectedAccountId TEXT NOT NULL DEFAULT '',
  amountTotal INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  paymentStatus TEXT DEFAULT '',
  refundId TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  actor TEXT DEFAULT '',
  amountRefunded INTEGER DEFAULT 0,
  chargeId TEXT DEFAULT '',
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artistId TEXT NOT NULL DEFAULT '',
  leadId TEXT NOT NULL DEFAULT '',
  paymentIntentId TEXT NOT NULL DEFAULT '',
  sessionId TEXT DEFAULT '',
  status TEXT DEFAULT '',
  amount INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  channel TEXT DEFAULT '',
  appointmentId TEXT DEFAULT '',
  refundId TEXT DEFAULT '',
  refundReason TEXT DEFAULT '',
  refundedAmount INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE IF NOT EXISTS accounts (
  artistId TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  email TEXT DEFAULT '',
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  artistId TEXT NOT NULL,
  leadId TEXT DEFAULT '',
  channel TEXT DEFAULT '',
  templateType TEXT DEFAULT '',
  payload TEXT DEFAULT '{}',
  status TEXT DEFAULT 'queued',
  retries INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  payload TEXT DEFAULT '{}',
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  artistId TEXT NOT NULL,
  keys TEXT NOT NULL DEFAULT '{}',
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS waivers (
  id TEXT PRIMARY KEY,
  appointmentId TEXT NOT NULL,
  clientId TEXT DEFAULT '',
  clientName TEXT DEFAULT '',
  clientEmail TEXT DEFAULT '',
  clientPhone TEXT DEFAULT '',
  artistName TEXT DEFAULT '',
  shopName TEXT DEFAULT '',
  appointmentType TEXT DEFAULT 'new_tattoo',
  waiverText TEXT DEFAULT '',
  country TEXT DEFAULT '',
  signature TEXT DEFAULT '',
  idPhoto TEXT DEFAULT '',
  clientDob TEXT DEFAULT '',
  healthAnswers TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  signedAt INTEGER,
  ip TEXT DEFAULT '',
  userAgent TEXT DEFAULT '',
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  passwordHash TEXT DEFAULT '',
  roles TEXT DEFAULT '[]',
  plan TEXT DEFAULT 'free',
  studioName TEXT DEFAULT '',
  deviceId TEXT DEFAULT '',
  verified INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS quotas (
  artistId TEXT PRIMARY KEY,
  plan TEXT DEFAULT 'free',
  storageLimitMb REAL DEFAULT 0,
  storageUsedMb REAL DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ledger_artistId ON ledger(artistId);
CREATE INDEX IF NOT EXISTS idx_notifications_artistId ON notifications(artistId);
CREATE INDEX IF NOT EXISTS idx_payments_artistId ON payments(artistId);
CREATE INDEX IF NOT EXISTS idx_waivers_appointmentId ON waivers(appointmentId);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_artistId ON push_subscriptions(artistId);

CREATE TABLE IF NOT EXISTS site_configs (
  id TEXT PRIMARY KEY,
  artistId TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  template TEXT NOT NULL DEFAULT 'portfolio',
  theme TEXT NOT NULL DEFAULT 'dark',
  bio TEXT DEFAULT '',
  studioName TEXT DEFAULT '',
  customDomain TEXT DEFAULT '',
  locations TEXT DEFAULT '[]',
  publishedAt INTEGER,
  updatedAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_site_configs_slug ON site_configs(slug);
CREATE INDEX IF NOT EXISTS idx_site_configs_artistId ON site_configs(artistId);

CREATE TABLE IF NOT EXISTS photo_metadata (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  artistId TEXT DEFAULT '',
  imageUrl TEXT NOT NULL,
  bodyPart TEXT DEFAULT 'other',
  step INTEGER DEFAULT 5,
  note TEXT DEFAULT '',
  source TEXT DEFAULT 'gallery_import',
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_photos_clientId ON photo_metadata(clientId);
`;

export async function initDB(env: Env): Promise<void> {
  await env.DB.exec(INIT_SQL);
}

// ---- Generic helpers ----
export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function now(): number {
  return Date.now();
}

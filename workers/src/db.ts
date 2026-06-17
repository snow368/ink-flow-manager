// D1 database helpers — replaces JSON file operations from server/index.mjs

export interface Env {
  DB: D1Database;
  INKFLOW_IMAGES: R2Bucket;
  AI: any; // Cloudflare Workers AI binding
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
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  rating REAL DEFAULT 0,
  reviewCount INTEGER DEFAULT 0,
  photoUrls TEXT DEFAULT '[]',
  services TEXT DEFAULT '[]',
  priceRange TEXT DEFAULT '$$',
  claimToken TEXT DEFAULT '',
  claimedBy TEXT DEFAULT '',
  claimedAt INTEGER,
  data TEXT DEFAULT '{}',
  publishedAt INTEGER,
  updatedAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_site_configs_slug ON site_configs(slug);
CREATE INDEX IF NOT EXISTS idx_site_configs_artistId ON site_configs(artistId);
CREATE INDEX IF NOT EXISTS idx_site_configs_claimToken ON site_configs(claimToken);

CREATE TABLE IF NOT EXISTS claim_requests (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  token TEXT NOT NULL,
  createdAt INTEGER,
  verifiedAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_claim_requests_slug ON claim_requests(slug);
CREATE INDEX IF NOT EXISTS idx_claim_requests_token ON claim_requests(token);

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

CREATE TABLE IF NOT EXISTS app_data (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  artistId TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL DEFAULT '{}',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_data_type ON app_data(type);
CREATE INDEX IF NOT EXISTS idx_app_data_artist ON app_data(artistId);
CREATE INDEX IF NOT EXISTS idx_app_data_type_artist ON app_data(type, artistId);
CREATE INDEX IF NOT EXISTS idx_app_data_created ON app_data(createdAt);

CREATE TABLE IF NOT EXISTS content_drafts (
  id TEXT PRIMARY KEY,
  artistId TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  caption TEXT DEFAULT '',
  hashtags TEXT DEFAULT '',
  imageUrls TEXT DEFAULT '[]',
  gridDataUrl TEXT DEFAULT '',
  watermarkText TEXT DEFAULT '',
  layout TEXT DEFAULT '3x3',
  backgroundColor TEXT DEFAULT '#000000',
  tone TEXT DEFAULT 'professional',
  status TEXT DEFAULT 'draft',
  scheduledAt INTEGER,
  publishedAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_content_drafts_artistId ON content_drafts(artistId);
CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_content_drafts_scheduledAt ON content_drafts(scheduledAt);

CREATE TABLE IF NOT EXISTS content_analytics (
  id TEXT PRIMARY KEY,
  draftId TEXT NOT NULL,
  artistId TEXT NOT NULL,
  platform TEXT NOT NULL,
  caption TEXT DEFAULT '',
  impressionCount INTEGER DEFAULT 0,
  likeCount INTEGER DEFAULT 0,
  commentCount INTEGER DEFAULT 0,
  shareCount INTEGER DEFAULT 0,
  saveCount INTEGER DEFAULT 0,
  clickCount INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  recordedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_content_analytics_draftId ON content_analytics(draftId);
`;

export async function initDB(env: Env): Promise<void> {
  await env.DB.exec(INIT_SQL);
  await migrateSiteConfigs(env);
}

/** Add columns that may not exist on older D1 instances */
async function migrateSiteConfigs(env: Env): Promise<void> {
  const newCols = [
    'phone TEXT DEFAULT \'\'',
    'address TEXT DEFAULT \'\'',
    'city TEXT DEFAULT \'\'',
    'state TEXT DEFAULT \'\'',
    'rating REAL DEFAULT 0',
    'reviewCount INTEGER DEFAULT 0',
    'photoUrls TEXT DEFAULT \'[]\'',
    'services TEXT DEFAULT \'[]\'',
    'priceRange TEXT DEFAULT \'$$\'',
    'claimToken TEXT DEFAULT \'\'',
    'claimedBy TEXT DEFAULT \'\'',
    'claimedAt INTEGER',
    'data TEXT DEFAULT \'{}\'',
  ];
  for (const col of newCols) {
    try {
      await env.DB.exec(`ALTER TABLE site_configs ADD COLUMN ${col}`);
    } catch {
      // Column already exists — ignore
    }
  }
  // Create app_data table for older deploys
  try {
    await env.DB.exec(`CREATE TABLE IF NOT EXISTS app_data (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      artistId TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL DEFAULT '{}',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )`);
    await env.DB.exec(`CREATE INDEX IF NOT EXISTS idx_app_data_type ON app_data(type)`);
    await env.DB.exec(`CREATE INDEX IF NOT EXISTS idx_app_data_artist ON app_data(artistId)`);
    await env.DB.exec(`CREATE INDEX IF NOT EXISTS idx_app_data_type_artist ON app_data(type, artistId)`);
    await env.DB.exec(`CREATE INDEX IF NOT EXISTS idx_app_data_created ON app_data(createdAt)`);
  } catch { /* ignore */ }

  // Create claim_requests table if it doesn't exist (handled by INIT_SQL now, but keep for older deploys)
  try {
    await env.DB.exec(`CREATE TABLE IF NOT EXISTS claim_requests (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      token TEXT NOT NULL,
      createdAt INTEGER,
      verifiedAt INTEGER
    )`);
    await env.DB.exec(`CREATE INDEX IF NOT EXISTS idx_claim_requests_slug ON claim_requests(slug)`);
    await env.DB.exec(`CREATE INDEX IF NOT EXISTS idx_claim_requests_token ON claim_requests(token)`);
  } catch {
    // ignore
  }
}

// ---- Generic helpers ----
export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function now(): number {
  return Date.now();
}

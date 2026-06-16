import type { UserRecord } from '../db';

type PlanTier = 'free' | 'solo' | 'pro' | 'pro_plus' | 'plus';
type Feature =
  // Solo+
  | 'inventory'
  | 'stations'
  | 'conflict_detection'
  | 'whatsapp'
  | 'email_reminders'
  | 'series_appointments'
  | 'qr_checkin'
  | 'data_export'
  | 'cloud_sync'
  | 'b2b_referral'
  | 'client_referral'
  | 'content_strategy_ai'
  | 'caption_ai'
  | 'lead_analytics'
  // Pro+
  | 'shift_scheduling'
  | 'daily_closeout'
  | 'commission_tracking'
  | 'health_checklist'
  | 'auto_review_followup'
  | 'google_review_sync'
  | 'advanced_analytics'
  | 'priority_support'
  // Pro+ only
  | 'multi_studio'
  | 'owner_dashboard'
  | 'staff_management'
  | 'audit_log';

const FEATURE_PLAN: Record<Feature, PlanTier> = {
  // Solo+
  inventory: 'solo',
  stations: 'solo',
  conflict_detection: 'solo',
  whatsapp: 'solo',
  email_reminders: 'solo',
  series_appointments: 'solo',
  qr_checkin: 'solo',
  data_export: 'solo',
  cloud_sync: 'solo',
  b2b_referral: 'solo',
  client_referral: 'solo',
  content_strategy_ai: 'solo',
  caption_ai: 'solo',
  lead_analytics: 'solo',
  // Pro+
  shift_scheduling: 'pro',
  daily_closeout: 'pro',
  commission_tracking: 'pro',
  health_checklist: 'pro',
  auto_review_followup: 'pro',
  google_review_sync: 'pro',
  advanced_analytics: 'pro',
  priority_support: 'pro',
  // Pro+ only
  multi_studio: 'pro_plus',
  owner_dashboard: 'pro_plus',
  staff_management: 'pro_plus',
  audit_log: 'pro_plus',
};

const TIER_ORDER: PlanTier[] = ['free', 'solo', 'pro', 'pro_plus'];

function getPlanTier(user: UserRecord | null | undefined): PlanTier {
  if (!user?.plan || user.plan === 'free') return 'free';
  return user.plan;
}

export function canAccess(user: UserRecord | null | undefined, feature: Feature): boolean {
  const required = FEATURE_PLAN[feature];
  const actual = getPlanTier(user);
  return TIER_ORDER.indexOf(actual) >= TIER_ORDER.indexOf(required);
}

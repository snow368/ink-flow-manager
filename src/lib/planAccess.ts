// Plan feature checking — supports new plan names + old names for backward compat
import type { UserRecord } from '../db';

export type PlanId = 'free' | 'starter' | 'solo' | 'pro' | 'pro_plus' | 'plus';

// Map old plan names → new plan IDs
const PLAN_MAP: Record<string, PlanId> = {
  free: 'free', starter: 'starter', solo: 'starter', pro: 'pro', pro_plus: 'plus', plus: 'plus',
};

const TIER_ORDER: PlanId[] = ['free', 'starter', 'pro', 'plus'];

type Feature =
  | 'inventory' | 'stations' | 'conflict_detection' | 'whatsapp'
  | 'email_reminders' | 'series_appointments' | 'qr_checkin' | 'data_export'
  | 'cloud_sync' | 'b2b_referral' | 'client_referral' | 'content_strategy_ai'
  | 'caption_ai' | 'lead_analytics'
  | 'shift_scheduling' | 'daily_closeout' | 'commission_tracking'
  | 'health_checklist' | 'auto_review_followup' | 'google_review_sync'
  | 'advanced_analytics' | 'priority_support'
  | 'multi_studio' | 'owner_dashboard' | 'staff_management' | 'audit_log';

const FEATURE_PLAN: Record<Feature, PlanId> = {
  inventory: 'starter', stations: 'starter', conflict_detection: 'starter',
  whatsapp: 'starter', email_reminders: 'starter', series_appointments: 'starter',
  qr_checkin: 'starter', data_export: 'starter', cloud_sync: 'starter',
  b2b_referral: 'starter', client_referral: 'starter', content_strategy_ai: 'starter',
  caption_ai: 'starter', lead_analytics: 'starter',
  shift_scheduling: 'pro', daily_closeout: 'pro', commission_tracking: 'pro',
  health_checklist: 'pro', auto_review_followup: 'pro', google_review_sync: 'pro',
  advanced_analytics: 'pro', priority_support: 'pro',
  multi_studio: 'plus', owner_dashboard: 'plus', staff_management: 'plus', audit_log: 'plus',
};

export function resolvePlan(user?: UserRecord | null): PlanId {
  const raw = user?.plan || 'free';
  return PLAN_MAP[raw] || 'free';
}

export function canAccess(user: UserRecord | null | undefined, feature: Feature): boolean {
  const required = FEATURE_PLAN[feature];
  const actual = resolvePlan(user);
  return TIER_ORDER.indexOf(actual) >= TIER_ORDER.indexOf(required);
}

export function isAtLeast(user: UserRecord | null | undefined, minPlan: PlanId): boolean {
  return TIER_ORDER.indexOf(resolvePlan(user)) >= TIER_ORDER.indexOf(minPlan);
}

export function planLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: 'Free', starter: 'Starter', solo: 'Starter', pro: 'Pro', pro_plus: 'Plus', plus: 'Plus',
  };
  return labels[plan] || 'Free';
}

export function planColor(plan: string): string {
  const colors: Record<string, string> = {
    free: '#64748b', starter: '#6366f1', solo: '#6366f1',
    pro: '#2563eb', pro_plus: '#a855f7', plus: '#a855f7',
  };
  return colors[plan] || colors.free;
}

export function isFree(user?: UserRecord | null): boolean {
  return resolvePlan(user) === 'free';
}

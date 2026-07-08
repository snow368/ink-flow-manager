/**
 * Tattoo Studio Front Desk Work Queue Engine
 *
 * Merges all engine outputs → classify → dedup per client → sort → max 10 items
 *
 * Sort: category priority > score desc > timing asc > confidence desc
 * Dedup: highest category wins; if same, higher score → timing now → higher confidence
 */

import type { EngineOutput as AftercareOutput } from './aftercareEngine';
import type { EngineOutput as TouchUpOutput } from './touchupDetector';
import type { EngineOutput as RepeatOutput } from './repeatBookingEngine';
import type { EngineOutput as ReferralOutput } from './referralEngine';

// ── Types ──

export type ActionType = 'aftercare' | 'touchup' | 'repeat_booking' | 'referral';
export type Category = 'critical_risk' | 'revenue' | 'retention' | 'maintenance';

export interface WorkQueueItem {
  clientId: string;
  actionType: ActionType;
  category: Category;
  title: string;
  score: number;
  level: string;
  confidence: number;
  timing: 'now' | '7d' | '30d' | '60-180d';
  nextAction: string;
  reason: string;
  sourceEngine: string;
}

// ── Category classification ──

function classifyAftercare(level: string, reason: string, timing: string): Category {
  const isD1 = reason.includes('D1');
  const isD3 = reason.includes('D3');
  const isD7 = reason.includes('D7');
  const isD30 = reason.includes('D30');
  const overdue = reason.includes('Overdue');

  if ((isD1 || isD3) && overdue && level === 'high') return 'critical_risk';
  if (isD1 && level !== 'low') return 'critical_risk';
  if (isD3 && timing === 'now') return 'critical_risk';
  if (isD7) return 'maintenance';
  if (isD30) return 'retention';
  return 'maintenance';
}

function classifyTouchUp(level: string): Category {
  return level === 'high' ? 'revenue' : 'retention';
}

function classifyRepeatBooking(): Category {
  return 'revenue';
}

function classifyReferral(): Category {
  return 'retention';
}

// ── Category priority (lower = higher priority) ──

const CATEGORY_PRIORITY: Record<Category, number> = {
  critical_risk: 0,
  revenue: 1,
  retention: 2,
  maintenance: 3,
};

const TIMING_ORDER: Record<string, number> = {
  now: 0,
  '7d': 1,
  '30d': 2,
  '60-180d': 3,
};

// ── Title builder ──

function buildTitle(type: ActionType, level: string): string {
  const titles: Record<ActionType, Record<string, string>> = {
    aftercare: {
      high: 'Aftercare critical — safety instructions pending',
      medium: 'Aftercare check-in due',
      low: 'Aftercare follow-up ready',
    },
    touchup: {
      high: 'Touch-up likely needed — reach out',
      medium: 'Monitor for touch-up',
      low: 'Touch-up unlikely',
    },
    repeat_booking: {
      high: 'Ready to re-book',
      medium: 'Re-engagement opportunity',
      low: 'Long-term nurture',
    },
    referral: {
      high: 'Ready to ask for referral',
      medium: 'Referral opportunity warming',
      low: 'Not ready for referral',
    },
  };
  return titles[type]?.[level] || `${type} action`;
}

// ── Filter ──

function shouldKeep(level: string, score: number, timing: string): boolean {
  return level !== 'low' || score >= 70 || timing === 'now';
}

// ── Dedup compare (returns true if `a` should replace `b`) ──

function isHigherPriority(a: WorkQueueItem, b: WorkQueueItem): boolean {
  const ca = CATEGORY_PRIORITY[a.category];
  const cb = CATEGORY_PRIORITY[b.category];
  if (ca !== cb) return ca < cb;

  if (a.score !== b.score) return a.score > b.score;

  if ((a.timing === 'now') !== (b.timing === 'now')) {
    return a.timing === 'now';
  }

  return a.confidence > b.confidence;
}

// ── Engine ──

export interface WorkQueueInput {
  aftercare: AftercareOutput[];
  touchup: TouchUpOutput[];
  referral: ReferralOutput[];
  repeatBooking: RepeatOutput[];
}

export interface WorkQueueResult {
  items: WorkQueueItem[];
  totalCandidates: number;
  maxAllowed: number;
}

function buildItems(input: WorkQueueInput): WorkQueueItem[] {
  const items: WorkQueueItem[] = [];

  // Each source maps with its own classify + filter
  const addSource = (
    source: (AftercareOutput | TouchUpOutput | RepeatOutput | ReferralOutput)[],
    actionType: ActionType,
    classify: (level: string, reason: string, timing: string) => Category,
    engineName: string,
  ) => {
    for (const e of source) {
      if (!shouldKeep(e.level, e.score, e.timing)) continue;
      const category = classify(e.level, e.reason, e.timing);
      items.push({
        clientId: e.clientId,
        actionType,
        category,
        title: buildTitle(actionType, e.level),
        score: e.score,
        level: e.level,
        confidence: e.confidence,
        timing: e.timing,
        nextAction: e.nextAction,
        reason: e.reason,
        sourceEngine: engineName,
      });
    }
  };

  addSource(input.touchup, 'touchup', classifyTouchUp, 'Touch-up Detection');
  addSource(input.repeatBooking, 'repeat_booking', classifyRepeatBooking, 'Repeat Booking');
  addSource(input.referral, 'referral', classifyReferral, 'Referral Engine');
  addSource(input.aftercare, 'aftercare', classifyAftercare, 'Aftercare Engine');

  return items;
}

function deduplicate(items: WorkQueueItem[]): WorkQueueItem[] {
  const best = new Map<string, WorkQueueItem>();
  for (const item of items) {
    const existing = best.get(item.clientId);
    if (!existing || isHigherPriority(item, existing)) {
      best.set(item.clientId, item);
    }
  }
  return [...best.values()];
}

export function buildWorkQueue(input: WorkQueueInput): WorkQueueResult {
  const all = buildItems(input);
  const totalCandidates = all.length;

  const deduped = deduplicate(all);

  deduped.sort((a, b) => {
    // 1. Category priority
    const ca = CATEGORY_PRIORITY[a.category];
    const cb = CATEGORY_PRIORITY[b.category];
    if (ca !== cb) return ca - cb;

    // 2. Score descending
    if (b.score !== a.score) return b.score - a.score;

    // 3. Timing urgency
    const ta = TIMING_ORDER[a.timing] ?? 99;
    const tb = TIMING_ORDER[b.timing] ?? 99;
    if (ta !== tb) return ta - tb;

    // 4. Confidence descending
    return b.confidence - a.confidence;
  });

  return {
    items: deduped.slice(0, 10),
    totalCandidates,
    maxAllowed: 10,
  };
}

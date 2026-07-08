/**
 * Front Desk Queue — Human-readable Presentation Layer
 *
 * Transforms AI engine output into natural language for tattoo artists.
 *
 * Rules:
 * - No AI terms (no "score", "confidence", "engine", "level")
 * - No analytics/dashboard wording
 * - 3 seconds to understand
 * - Sounds like a real front desk assistant
 */

import type { WorkQueueItem, Category, ActionType } from './workQueueEngine';

// ── Types ──

export type Tone = 'urgent' | 'opportunity' | 'friendly' | 'soft';

export interface QueuePresentation {
  title: string;
  subtitle: string;
  actionLabel: string;
  tone: Tone;
  icon: string;
}

// ── Tone mapping ──

const TONE_BY_CATEGORY: Record<Category, Tone> = {
  critical_risk: 'urgent',
  revenue: 'opportunity',
  retention: 'friendly',
  maintenance: 'soft',
};

// ── Icon mapping ──

const ICON_BY_CATEGORY: Record<Category, string> = {
  critical_risk: '⚠️',
  revenue: '🔥',
  retention: '💡',
  maintenance: '📌',
};

// ── Action labels ──

const ACTION_LABEL: Record<ActionType, string> = {
  aftercare: 'Send WhatsApp',
  touchup: 'Check In',
  repeat_booking: 'Suggest Idea',
  referral: 'Ask Client',
};

// ── Title generator ──

function generateTitle(
  actionType: ActionType,
  category: Category,
  level: string,
  reason: string,
  name: string,
): string {
  // critical_risk: D1/D3 overdue
  if (category === 'critical_risk') {
    if (reason.includes('D1')) {
      return `${name} hasn't received healing instructions`;
    }
    if (reason.includes('D3')) {
      return `${name}'s healing check-in is overdue`;
    }
    return `${name} needs urgent aftercare`;
  }

  // Touch-up revenue
  if (actionType === 'touchup') {
    if (level === 'high') {
      return `${name}'s tattoo may need a touch-up`;
    }
    return `Check if ${name} needs a touch-up`;
  }

  // Repeat booking
  if (actionType === 'repeat_booking') {
    if (level === 'high') {
      return `Good time to suggest a new piece to ${name}`;
    }
    return `${name} might be ready for their next tattoo`;
  }

  // Referral
  if (actionType === 'referral') {
    if (level === 'high') {
      return `${name} loved their experience — ask about referrals`;
    }
    return `See if ${name} knows anyone for their next tattoo`;
  }

  // Aftercare maintenance (D7)
  if (actionType === 'aftercare' && category === 'maintenance') {
    return `Time to check ${name}'s healing progress`;
  }

  // Aftercare retention (D30)
  if (actionType === 'aftercare' && category === 'retention') {
    return `How did ${name}'s tattoo heal?`;
  }

  // Fallback
  return `Follow up with ${name}`;
}

// ── Subtitle generator ──

function generateSubtitle(
  actionType: ActionType,
  category: Category,
  level: string,
  reason: string,
  timing: string,
): string {
  // Extract readable reason from engine output
  const r = reason.toLowerCase();

  if (category === 'critical_risk') {
    if (r.includes('overdue')) return 'Healing follow-up is overdue — send now';
    return 'First 24h are critical for proper healing';
  }

  if (actionType === 'touchup' && level === 'high') {
    if (r.includes('high-risk') || r.includes('realism') || r.includes('color') || r.includes('portrait')) {
      return 'Large or detailed piece — higher touch-up risk';
    }
    if (r.includes('healing photo')) return 'No healing photos submitted yet';
    if (r.includes('complaint')) return 'Client mentioned concerns about the tattoo';
    return 'Touch-up likely needed based on project type';
  }

  if (actionType === 'touchup') {
    return 'Medium-risk style — worth monitoring healing';
  }

  if (actionType === 'repeat_booking') {
    if (r.includes('healed')) return 'Last session healed — ready for next project';
    if (r.includes('engagement')) return 'Engagement is warming up — gentle check-in';
    if (r.includes('days')) {
      const match = reason.match(/(\d+)\s*days/);
      if (match) return `No booking in ${match[1]} days — ideal time to reach out`;
    }
    if (r.includes('review')) return 'Loyal client with good review history';
    return 'Good window for re-engagement';
  }

  if (actionType === 'referral') {
    if (r.includes('satisfaction') || r.includes('positive')) return 'Client is happy with their work — good timing';
    if (r.includes('healed')) return 'Healed tattoo + satisfied client = referral ready';
    if (r.includes('friend') || r.includes('family')) return 'Client has mentioned friends or family before';
    return 'Positive experience — worth bringing up referrals';
  }

  if (actionType === 'aftercare') {
    if (r.includes('d7')) return 'One week mark — most healing issues appear now';
    if (r.includes('d30')) return 'Ask for a healed photo and check in';
    if (r.includes('immediate') || r.includes('critical')) return 'First 24h guide the entire healing outcome';
    return 'Regular aftercare check-in';
  }

  // Timing-based
  if (timing === 'now') return 'Needs attention today';
  if (timing === '7d') return 'Can wait a few days — worth planning';
  if (timing === '30d') return 'Add to this month\'s priority list';

  return 'Keep on your radar';
}

// ── Public function ──

export function generateQueuePresentation(
  item: WorkQueueItem,
  clientName?: string,
): QueuePresentation {
  const name = clientName || 'This client';
  const tone = TONE_BY_CATEGORY[item.category];

  return {
    title: generateTitle(item.actionType, item.category, item.level, item.reason, name),
    subtitle: generateSubtitle(item.actionType, item.category, item.level, item.reason, item.timing),
    actionLabel: ACTION_LABEL[item.actionType],
    tone,
    icon: ICON_BY_CATEGORY[item.category],
  };
}

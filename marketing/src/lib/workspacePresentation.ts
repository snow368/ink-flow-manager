/**
 * Workspace Presentation Bridge
 *
 * Converts WorkspaceItem (from workspaceAggregator) into QueuePresentation
 * so the existing WorkspaceActionCard can render natural-language titles.
 *
 * This is a standalone mapping — it does NOT replace the workspaceAggregator
 * pipeline, only enhances its output for display.
 */

import type { WorkspaceItem } from './workspaceAggregator';
import type { QueuePresentation, Tone } from './queuePresentation';

const CATEGORY_TONE: Record<string, Tone> = {
  deposit_overdue: 'urgent',
  ghost_risk: 'urgent',
  aftercare: 'urgent',
  revision_waiting: 'opportunity',
  ready_for_deposit: 'opportunity',
  missing_intake_info: 'friendly',
  session_today: 'opportunity',
  repeat_booking: 'friendly',
};

const CATEGORY_ICON: Record<string, string> = {
  deposit_overdue: '\u{1F525}',
  ghost_risk: '\u{26A0}\u{FE0F}',
  aftercare: '\u{1F4A1}',
  revision_waiting: '\u{1F3A8}',
  ready_for_deposit: '\u{1F4B0}',
  missing_intake_info: '\u{1F4CB}',
  session_today: '\u{270F}\u{FE0F}',
  repeat_booking: '\u{1F504}',
};

export function generateWorkspacePresentation(item: WorkspaceItem): QueuePresentation {
  const tone = CATEGORY_TONE[item.category] || 'soft';
  const icon = CATEGORY_ICON[item.category] || '\u{1F4CC}';

  let title = item.title;
  let subtitle = item.businessImpact;
  let actionLabel = item.primaryLabel;

  // Override with natural language for key categories
  switch (item.category) {
    case 'deposit_overdue':
      title = `${item.clientName}'s deposit is overdue`;
      subtitle = `${item.businessImpact} — send a reminder now`;
      actionLabel = 'Send Reminder';
      break;
    case 'ghost_risk':
      title = `${item.clientName} hasn't replied`;
      subtitle = item.businessImpact;
      actionLabel = item.instagramHandle ? 'DM Now' : 'Follow Up';
      break;
    case 'aftercare':
      title = `${item.clientName}'s healing check-in`;
      subtitle = item.businessImpact;
      actionLabel = item.primaryLabel;
      break;
    case 'session_today':
      title = item.title.includes('Started') ? `${item.clientName} is here` : `${item.clientName} at ${item.timeIndicator}`;
      subtitle = item.businessImpact;
      actionLabel = item.primaryLabel;
      break;
    case 'repeat_booking':
      title = `${item.clientName} is due back`;
      subtitle = `${Math.round(parseInt(item.timeIndicator) || 0)} months — good time to check in`;
      actionLabel = 'Send Message';
      break;
    case 'revision_waiting':
      title = `${item.clientName}'s design is waiting`;
      subtitle = "Client hasn't reviewed the latest design yet";
      actionLabel = 'View Design';
      break;
    case 'ready_for_deposit':
      title = `Ready to lock in ${item.clientName}`;
      subtitle = 'All info collected — time for deposit';
      actionLabel = 'Request Deposit';
      break;
    case 'missing_intake_info':
      title = `Missing info from ${item.clientName}`;
      subtitle = "Can't proceed without placement/references";
      actionLabel = 'Message Client';
      break;
  }

  return { title, subtitle, actionLabel, tone, icon };
}

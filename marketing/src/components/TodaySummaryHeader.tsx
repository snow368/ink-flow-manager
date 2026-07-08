import React from 'react';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';
import type { WorkspaceItem } from '../lib/workspaceAggregator';

interface Props {
  items: WorkspaceItem[];
}

export default function TodaySummaryHeader({ items }: Props) {
  const lang = detectInitialLanguage();
  const depositsReady = items.filter(i => i.category === 'ready_for_deposit').length;
  const depositsOverdue = items.filter(i => i.category === 'deposit_overdue').length;
  const waitingReplies = items.filter(i => i.category === 'ghost_risk').length;
  const designFeedback = items.filter(i => i.category === 'revision_waiting' || i.category === 'missing_intake_info').length;
  const aftercareCount = items.filter(i => i.category === 'aftercare').length;
  const repeatBooking = items.filter(i => i.category === 'repeat_booking').length;

  const totalMoney = depositsReady + depositsOverdue;
  const totalFollowUps = waitingReplies + designFeedback;
  const totalMaintenance = aftercareCount + repeatBooking;

  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: THEME.spacing.xl, flexWrap: 'wrap' }}>
      {totalMoney > 0 && (
        <div style={{ flex: 1, minWidth: 100, background: THEME.bg.panel, borderRadius: THEME.radius.xl, border: `1px solid ${THEME.border.default}`, padding: '10px 14px' }}>
          <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, display: 'block', marginBottom: 2 }}>🔥 {t(lang, 'sum_money')}</span>
          <span style={{ fontSize: THEME.fontSize.xs, color: '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
            {depositsReady > 0 && `${depositsReady} ${t(lang, 'sum_ready')}`}
            {depositsReady > 0 && depositsOverdue > 0 && ' · '}
            {depositsOverdue > 0 && `${depositsOverdue} ${t(lang, 'sum_overdue')}`}
          </span>
        </div>
      )}
      {totalFollowUps > 0 && (
        <div style={{ flex: 1, minWidth: 100, background: THEME.bg.panel, borderRadius: THEME.radius.xl, border: `1px solid ${THEME.border.default}`, padding: '10px 14px' }}>
          <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, display: 'block', marginBottom: 2 }}>🟡 {t(lang, 'sum_followups')}</span>
          <span style={{ fontSize: THEME.fontSize.xs, color: '#f59e0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
            {waitingReplies > 0 && `${waitingReplies} ${t(lang, 'sum_waiting')}`}
            {waitingReplies > 0 && designFeedback > 0 && ' · '}
            {designFeedback > 0 && `${designFeedback} ${t(lang, 'sum_feedback')}`}
          </span>
        </div>
      )}
      {totalMaintenance > 0 && (
        <div style={{ flex: 1, minWidth: 100, background: THEME.bg.panel, borderRadius: THEME.radius.xl, border: `1px solid ${THEME.border.default}`, padding: '10px 14px' }}>
          <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, display: 'block', marginBottom: 2 }}>⚪ {t(lang, 'sum_maintenance')}</span>
          <span style={{ fontSize: THEME.fontSize.xs, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
            {aftercareCount > 0 && `${aftercareCount} ${t(lang, 'sum_aftercare')}`}
            {aftercareCount > 0 && repeatBooking > 0 && ' · '}
            {repeatBooking > 0 && `${repeatBooking} ${t(lang, 'sum_rebook')}`}
          </span>
        </div>
      )}
    </div>
  );
}

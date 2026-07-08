import React from 'react';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';

interface Props {
  completedSessions?: number;
  depositsCollected?: number;
}

export default function TodayEmptyState({ completedSessions = 0, depositsCollected = 0 }: Props) {
  const lang = detectInitialLanguage();
  const motIndex = React.useMemo(() => Math.floor(Math.random() * 5) + 1, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: THEME.fontSize.xl, fontWeight: THEME.fontWeight.bold, color: THEME.text.primary, marginBottom: 8 }}>
        {t(lang, 'emp_handled')}
      </p>
      <p style={{ fontSize: THEME.fontSize.base, color: THEME.text.muted, marginBottom: THEME.spacing['3xl'], lineHeight: 1.5 }}>
        {t(lang, 'emp_no_tasks')}
      </p>

      {(completedSessions > 0 || depositsCollected > 0) && (
        <div style={{ display: 'flex', gap: THEME.spacing.xl }}>
          {completedSessions > 0 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: THEME.fontSize['2xl'], fontWeight: THEME.fontWeight.bold, color: '#22c55e' }}>
                {completedSessions}
              </p>
              <p style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>
                {t(lang, 'emp_sessions')}
              </p>
            </div>
          )}
          {depositsCollected > 0 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: THEME.fontSize['2xl'], fontWeight: THEME.fontWeight.bold, color: '#22c55e' }}>
                ${depositsCollected}
              </p>
              <p style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>
                {t(lang, 'emp_deposits')}
              </p>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: THEME.fontSize.sm, color: THEME.text.subtle, marginTop: THEME.spacing['3xl'], fontStyle: 'italic' }}>
        {t(lang, `mot_${motIndex}`)}
      </p>
    </div>
  );
}

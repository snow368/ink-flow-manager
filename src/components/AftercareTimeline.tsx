import React, { useState, useEffect } from 'react';
import { THEME, btn } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';
import type { SessionRecord } from '../db';
import { getAftercareStatus, markCheckpointSent, type AftercareStatus } from '../lib/aftercareEngine';
import { openWhatsApp, copyMessage } from '../lib/workspaceActions';

interface Props {
  session: SessionRecord;
  artistWhatsApp?: string;
  lang?: string;
  onUpdate?: () => void;
}

const DAY_LABELS: Record<number, string> = {
  1: 'D1 — Immediate Care',
  3: 'D3 — Healing Check-in',
  7: 'D7 — Progress Check',
  30: 'D30 — Final Result',
};

const DAY_ICONS: Record<number, string> = ['🩹', '👀', '✅', '🎉'];

const STATUS_COL: Record<string, string> = {
  pending: '#f59e0b',
  sent: '#22c55e',
  overdue: '#ef4444',
};

export default function AftercareTimeline({ session, artistWhatsApp, lang, onUpdate }: Props) {
  const l = (lang || detectInitialLanguage()) as any;
  const [status, setStatus] = useState<AftercareStatus | null>(null);
  const [sendingDay, setSendingDay] = useState<number | null>(null);

  const loadStatus = async () => {
    const st = await getAftercareStatus(session.id);
    setStatus(st);
  };

  useEffect(() => { loadStatus(); }, [session.id]);

  if (!status) {
    return <p style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>Loading...</p>;
  }

  if (!status.hasSchedule) {
    return (
      <div style={{ padding: THEME.spacing.xl, textAlign: 'center' }}>
        <p style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>
          No aftercare schedule for this session.
        </p>
      </div>
    );
  }

  const allDays = [1, 3, 7, 30];
  const clientPhone = session.clientId
    ? undefined // phone would need to be loaded
    : undefined;

  const handleSend = async (day: number) => {
    setSendingDay(day);
    try {
      const { generateAftercareSchedule } = await import('../lib/aftercareEngine');
      const checkpoints = await generateAftercareSchedule(session, {
        autoAftercare: false,
        whatsappPhone: artistWhatsApp,
        language: l,
        artistId: session.artistId,
      });
      const cp = checkpoints.find(c => Number(c.day.slice(1)) === day);
      if (!cp) return;

      await markCheckpointSent(session.id, day, cp.channel, cp.message, cp.mode);

      if (cp.channel === 'whatsapp' && clientPhone) {
        openWhatsApp(clientPhone, cp.message);
      } else {
        await copyMessage(cp.message);
      }

      await loadStatus();
      onUpdate?.();
    } catch { /* best effort */ }
    setSendingDay(null);
  };

  return (
    <div style={{
      background: THEME.bg.panel,
      borderRadius: THEME.radius['2xl'],
      border: `1px solid ${THEME.border.default}`,
      padding: THEME.spacing.xl,
    }}>
      <p style={{ fontSize: THEME.fontSize.sm, fontWeight: THEME.fontWeight.bold, color: THEME.text.primary, marginBottom: THEME.spacing.xl }}>
        Aftercare Timeline
      </p>

      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 10, top: 8, bottom: 8, width: 2,
          background: THEME.border.default,
        }} />

        {allDays.map((day, i) => {
          const sent = status.sentDays.find(s => s.day === day);
          const isPending = status.pendingDays.includes(day);
          const isOverdue = isPending && day <= 3; // D1/D3 overdue if pending
          const dayStatus = sent ? 'sent' : isOverdue ? 'overdue' : 'pending';

          return (
            <div
              key={day}
              style={{
                position: 'relative',
                paddingBottom: i < allDays.length - 1 ? THEME.spacing.xl : 0,
              }}
            >
              {/* Dot on timeline */}
              <div style={{
                position: 'absolute', left: -22, top: 2, width: 16, height: 16,
                borderRadius: '50%',
                background: STATUS_COL[dayStatus],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8,
              }}>
                {sent ? '✓' : ''}
              </div>

              {/* Card */}
              <div style={{
                background: THEME.bg.panelAlt,
                borderRadius: THEME.radius.lg,
                border: `1px solid ${THEME.border.soft}`,
                padding: THEME.spacing.md,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: THEME.fontSize.sm, fontWeight: THEME.fontWeight.semibold, color: THEME.text.primary }}>
                    {DAY_ICONS[i]} {DAY_LABELS[day]}
                  </span>
                  <span style={{
                    fontSize: THEME.fontSize.xs, fontWeight: 600,
                    color: STATUS_COL[dayStatus],
                    background: `${STATUS_COL[dayStatus]}18`,
                    padding: '1px 8px', borderRadius: 999,
                  }}>
                    {sent ? 'Sent' : isOverdue ? 'Overdue' : 'Pending'}
                  </span>
                </div>

                {sent && (
                  <p style={{ fontSize: THEME.fontSize.xs, color: THEME.text.muted }}>
                    Sent {new Date(sent.sentAt).toLocaleDateString()}
                  </p>
                )}

                {isPending && (
                  <button
                    onClick={() => handleSend(day)}
                    disabled={sendingDay === day}
                    style={{
                      marginTop: 6,
                      padding: '8px 16px',
                      borderRadius: THEME.radius.md,
                      border: 'none',
                      background: sendingDay === day ? THEME.border.default : STATUS_COL[dayStatus],
                      color: '#fff',
                      fontSize: THEME.fontSize.xs,
                      fontWeight: 600,
                      cursor: sendingDay === day ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {sendingDay === day ? 'Sending...' : artistWhatsApp ? 'Send via WhatsApp' : 'Copy Message'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status.allSent && (
        <div style={{ marginTop: THEME.spacing.xl, padding: THEME.spacing.md, background: '#16653444', borderRadius: THEME.radius.lg, textAlign: 'center' }}>
          <p style={{ fontSize: THEME.fontSize.xs, color: '#4ade80', fontWeight: 600 }}>
            All aftercare checkpoints completed ✓
          </p>
        </div>
      )}
    </div>
  );
}

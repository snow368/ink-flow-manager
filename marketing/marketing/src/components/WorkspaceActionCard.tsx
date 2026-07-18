import React, { useState, useCallback } from 'react';
import { THEME, btn } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';
import type { WorkspaceItem } from '../lib/workspaceAggregator';
import type { QueuePresentation } from '../lib/queuePresentation';
import {
  openInstagramDM, openWhatsApp, copyDepositMessage,
  copyMessage, openClientDetail, openProjectBoard, startSession,
} from '../lib/workspaceActions';

const CATEGORY_COLORS: Record<string, string> = {
  deposit_overdue: '#ef4444',
  ghost_risk: '#ef4444',
  revision_waiting: '#f59e0b',
  missing_intake_info: '#f59e0b',
  ready_for_deposit: '#22c55e',
  session_today: '#22c55e',
  aftercare: '#6b7280',
  repeat_booking: '#6b7280',
};

const ACTION_TO_KEY: Record<string, string> = {
  open_instagram_dm: 'act_instagram_dm',
  open_whatsapp: 'act_whatsapp',
  copy_deposit_message: 'act_copy_reminder',
  copy_followup_message: 'act_copy_message',
  open_client_detail: 'act_view_client',
  open_project_board: 'act_view_design',
  start_session: 'act_start_session',
};

// Card types where DM contact makes sense
const DM_CATEGORIES = new Set(['ghost_risk', 'deposit_overdue', 'ready_for_deposit', 'missing_intake_info', 'repeat_booking']);

interface Props {
  item: WorkspaceItem;
  navigate: (path: string) => void;
  onDismiss?: (id: string) => void;
  lang?: string;
  onIgSaved?: (clientId: string, handle: string) => void;
  presentation?: QueuePresentation;
}

export default function WorkspaceActionCard({ item, navigate, onDismiss, lang, onIgSaved, presentation }: Props) {
  const l = (lang || detectInitialLanguage()) as any;
  const dotColor = CATEGORY_COLORS[item.category] || '#6b7280';
  const [showIgInput, setShowIgInput] = useState(false);
  const [igInput, setIgInput] = useState('');
  const [savingIg, setSavingIg] = useState(false);

  const handleSaveIg = useCallback(async () => {
    const handle = igInput.trim().replace('@', '');
    if (!handle || savingIg) return;
    setSavingIg(true);
    try {
      const { db } = await import('../db');
      // Save to both client and lead records
      await db.clients.update(item.clientId, { instagram: handle });
      if (item.leadId) {
        await db.leads.update(item.leadId, { source: 'instagram' });
      }
      onIgSaved?.(item.clientId, handle);
      setShowIgInput(false);
      setIgInput('');
    } catch { /* best effort */ }
    setSavingIg(false);
  }, [igInput, item.clientId, item.leadId, savingIg, onIgSaved]);

  const handlePrimary = () => {
    switch (item.primaryAction) {
      case 'open_instagram_dm':
        if (item.instagramHandle) {
          openInstagramDM(item.instagramHandle);
        } else if (DM_CATEGORIES.has(item.category)) {
          setShowIgInput(true);
        }
        break;
      case 'open_whatsapp':
        openWhatsApp(item.phone, item.message);
        break;
      case 'copy_deposit_message':
        if (item.leadId && item.message) {
          copyDepositMessage(item.leadId, item.message);
        }
        break;
      case 'copy_followup_message':
        if (item.message) copyMessage(item.message);
        break;
      case 'open_client_detail':
        openClientDetail(item.clientId, navigate);
        break;
      case 'open_project_board':
        if (item.projectId) openProjectBoard(item.projectId, navigate);
        break;
      case 'start_session':
        if (item.appointmentId) startSession(item.appointmentId, item.projectId, navigate);
        break;
    }
  };

  const handleSecondary = () => {
    if (item.secondaryAction === 'copy_message' && item.message) {
      copyMessage(item.message);
    } else if (item.secondaryAction === 'dismiss') {
      onDismiss?.(item.id);
    }
  };

  return (
    <div
      style={{
        background: THEME.bg.panel,
        borderRadius: THEME.radius['2xl'],
        border: `1px solid ${THEME.border.default}`,
        padding: THEME.spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: THEME.spacing.md,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: dotColor, flexShrink: 0,
            }}
          />
          {presentation?.icon && (
            <span style={{ fontSize: 14, lineHeight: 1 }}>{presentation.icon}</span>
          )}
          <span style={{ fontSize: THEME.fontSize.md, fontWeight: THEME.fontWeight.bold, color: THEME.text.primary }}>
            {item.clientName}
          </span>
          {item.instagramHandle ? (
            <a
              href={`https://instagram.com/${item.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: THEME.fontSize.xs,
                color: '#a78bfa',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              @{item.instagramHandle}
            </a>
          ) : DM_CATEGORIES.has(item.category) && (
            <button
              onClick={() => setShowIgInput(!showIgInput)}
              style={{
                background: 'none',
                border: `1px dashed ${THEME.border.default}`,
                color: '#a78bfa',
                fontSize: THEME.fontSize.xs,
                padding: '2px 8px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              + IG
            </button>
          )}
        </div>
        <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, whiteSpace: 'nowrap' }}>
          {item.timeIndicator}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: THEME.fontSize.base, fontWeight: THEME.fontWeight.semibold, color: THEME.text.primary }}>
          {presentation?.title || item.title}
        </span>
        <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.muted, lineHeight: 1.4 }}>
          {presentation?.subtitle || item.businessImpact}
        </span>
      </div>

      {showIgInput && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, whiteSpace: 'nowrap' }}>@</span>
          <input
            autoFocus
            value={igInput}
            onChange={e => setIgInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveIg(); }}
            placeholder="instagram_handle"
            style={{
              flex: 1,
              background: THEME.bg.panelAlt,
              border: `1px solid ${THEME.border.default}`,
              borderRadius: THEME.radius.md,
              padding: '8px 10px',
              color: THEME.text.primary,
              fontSize: THEME.fontSize.base,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSaveIg}
            disabled={savingIg || !igInput.trim()}
            style={{
              ...btn.small,
              background: '#a855f7',
              color: '#fff',
              border: 'none',
              opacity: savingIg || !igInput.trim() ? 0.5 : 1,
              fontWeight: 600,
            }}
          >
            {savingIg ? '...' : 'Save'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: THEME.spacing.md, alignItems: 'center' }}>
        <button
          onClick={handlePrimary}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: THEME.radius.xl,
            border: 'none',
            background: dotColor,
            color: '#fff',
            fontSize: THEME.fontSize.md,
            fontWeight: THEME.fontWeight.bold,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onPointerEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onPointerLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {presentation?.actionLabel || t(l, ACTION_TO_KEY[item.primaryAction] || 'act_whatsapp')}
        </button>
        {item.secondaryAction && (
          <button
            onClick={handleSecondary}
            style={{
              ...btn.small,
              whiteSpace: 'nowrap',
              fontSize: THEME.fontSize.xs,
            }}
          >
            {item.secondaryAction === 'copy_message' ? t(l, 'act_copy_message') : 'Dismiss'}
          </button>
        )}
      </div>
    </div>
  );
}

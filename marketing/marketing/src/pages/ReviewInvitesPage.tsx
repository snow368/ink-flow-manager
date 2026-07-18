import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';
import {
  getAppointmentsNeedingReviewInvite,
  getAppointmentsNeedingFollowUp,
  getInviteHistory,
  getReviewInviteMessage,
  getReviewFollowUpMessage,
  markReviewInvited,
  markReviewFollowedUp,
  type EnhancedAppointment,
} from '../lib/reviewInvite';
import { TIER_CONFIGS, type ClientTier } from '../lib/reviewTier';

type Tab = 'invite' | 'followup' | 'history';
type DateRange = 'all' | '7d' | '30d' | '90d';

const TIER_COLORS: Record<ClientTier, string> = {
  vip: '#fbbf24',
  regular: '#60a5fa',
  new: '#94a3b8',
};

export default function ReviewInvitesPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [tab, setTab] = useState<Tab>('invite');
  const [invites, setInvites] = useState<EnhancedAppointment[]>([]);
  const [followUps, setFollowUps] = useState<EnhancedAppointment[]>([]);
  const [history, setHistory] = useState<EnhancedAppointment[]>([]);
  const [copiedMsg, setCopiedMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadAll(u);
    });
  }, [navigate]);

  async function loadAll(u: UserRecord) {
    setLoading(true);
    const [inv, fup, hist] = await Promise.all([
      getAppointmentsNeedingReviewInvite(u.id),
      getAppointmentsNeedingFollowUp(u.id),
      getInviteHistory(u.id),
    ]);
    setInvites(inv);
    setFollowUps(fup);
    setHistory(hist);
    setLoading(false);
  }

  async function handleCopyInvite(appt: EnhancedAppointment) {
    if (!user?.reviewLinks?.google && !user?.reviewLinks?.platform2Url && !user?.reviewLinks?.platform3Url) {
      setCopiedMsg('Please add your review links in Me → Review Links settings first.');
      return;
    }
    const msg = getReviewInviteMessage(lang, user?.studioName || user?.name || 'the studio', user?.reviewLinks);
    const text = `${msg.subject}\n\n${msg.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedMsg(text);
    await markReviewInvited(appt.id);
    setTimeout(() => loadAll(user!), 500);
  }

  async function handleCopyFollowUp(appt: EnhancedAppointment) {
    const msg = getReviewFollowUpMessage(lang, user?.studioName || user?.name || 'the studio', user?.reviewLinks);
    const text = `${msg.subject}\n\n${msg.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedMsg(text);
    await markReviewFollowedUp(appt.id);
    setTimeout(() => loadAll(user!), 500);
  }

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  const tabs: { key: Tab; labelKey: string; count: number }[] = [
    { key: 'invite', labelKey: 'review_invites_tab_invite', count: invites.length },
    { key: 'followup', labelKey: 'review_invites_tab_followup', count: followUps.length },
    { key: 'history', labelKey: 'review_invites_tab_history', count: history.length },
  ];

  const activeList = tab === 'invite' ? invites : tab === 'followup' ? followUps : history;

  // Filter history by date range and search
  const filteredHistory = useMemo(() => {
    if (tab !== 'history') return [];
    let list = history;
    if (dateRange !== 'all') {
      const cutoff = Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000;
      list = list.filter(a => a.createdAt >= cutoff);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => (a.clientName || '').toLowerCase().includes(q));
    }
    return list;
  }, [tab, history, dateRange, search]);

  const displayedList = tab === 'history' ? filteredHistory : activeList;

  return (
    <div style={{ padding: 20, color: THEME.text.primary, maxWidth: 780, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 0 }}
        >
          ←
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>{t(lang, 'review_invites_page_title')}</h2>
      </div>

      {/* Copied message preview */}
      {copiedMsg && (
        <div
          onClick={() => setCopiedMsg('')}
          style={{ background: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 14, border: '1px solid #334155', cursor: 'pointer' }}
        >
          <p style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, marginBottom: 6 }}>{t(lang, 'review_invites_copied')}</p>
          <pre style={{ fontSize: 11, color: '#e2e8f0', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>{copiedMsg}</pre>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', background: THEME.bg.panel, borderRadius: 10, padding: 2, marginBottom: 16 }}>
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => { setTab(tb.key); setCopiedMsg(''); setSearch(''); setDateRange('all'); }}
            style={{
              flex: 1,
              border: 'none',
              background: tab === tb.key ? '#e11d48' : 'transparent',
              color: 'white',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t(lang, tb.labelKey)}
            {tb.count > 0 && (
              <span style={{
                background: tab === tb.key ? 'rgba(255,255,255,0.25)' : '#334155',
                color: 'white',
                borderRadius: 99,
                padding: '1px 7px',
                fontSize: 11,
                fontWeight: 700,
              }}>
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter bar — only on History tab */}
      {tab === 'history' && history.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t(lang, 'review_invites_search')}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155',
              background: '#0f172a', color: 'white', fontSize: 13, outline: 'none',
            }}
          />
          {(['all', '7d', '30d', '90d'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: dateRange === r ? '1px solid #e11d48' : '1px solid #334155',
                background: dateRange === r ? '#e11d4822' : 'transparent',
                color: dateRange === r ? '#f87171' : '#94a3b8',
                fontSize: 11,
                fontWeight: dateRange === r ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading...</p>
        </div>
      )}

      {/* Empty states */}
      {!loading && displayedList.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 6 }}>
            {tab === 'invite' && t(lang, 'review_invites_no_invites')}
            {tab === 'followup' && t(lang, 'review_invites_no_followups')}
            {tab === 'history' && !search && dateRange === 'all' && t(lang, 'review_invites_no_history')}
            {tab === 'history' && (search || dateRange !== 'all') && 'No results match your filters.'}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && displayedList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayedList.map(a => (
            <AppointmentRow
              key={a.id}
              appt={a}
              tab={tab}
              onCopyInvite={() => handleCopyInvite(a)}
              onCopyFollowUp={() => handleCopyFollowUp(a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({
  appt,
  tab,
  onCopyInvite,
  onCopyFollowUp,
}: {
  appt: EnhancedAppointment;
  tab: Tab;
  onCopyInvite: () => void;
  onCopyFollowUp: () => void;
}) {
  const lang = detectInitialLanguage();
  const tier = appt.clientTier || TIER_CONFIGS.new.tier;
  const tierLabelKey = `review_invites_tier_${tier}`;
  const tierColor = TIER_COLORS[tier];
  const daysSinceInvite = appt.reviewInvitedAt
    ? Math.floor((Date.now() - appt.reviewInvitedAt) / 86400000)
    : 0;

  return (
    <div style={{ background: THEME.bg.panel, border: '1px solid #334155', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{appt.clientName || 'Client'}</span>
            <span style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              background: tierColor + '22',
              color: tierColor,
              fontWeight: 600,
            }}>
              {t(lang, tierLabelKey) || tier.toUpperCase()}
            </span>
            {tab === 'followup' && appt.remainingFollowUps != null && (
              <span style={{ fontSize: 10, color: '#fbbf24', fontWeight: 600 }}>
                {t(lang, 'review_invites_remaining').replace('{n}', String(appt.remainingFollowUps))}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>
            {appt.date} · {appt.type || 'Tattoo'}
            {appt.reviewInvitedAt && ` · ${t(lang, 'review_invites_invited_days').replace('{n}', String(daysSinceInvite))}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
          {tab === 'invite' && (
            <button onClick={onCopyInvite} style={actionBtn('#f59e0b')}>
              {t(lang, 'review_invites_copy_invite')}
            </button>
          )}
          {tab === 'followup' && (
            <button onClick={onCopyFollowUp} style={actionBtn('#3b82f6')}>
              {t(lang, 'review_invites_copy_followup')}
            </button>
          )}
          {tab === 'history' && appt.reviewFollowedUpAt && (
            <span style={{ fontSize: 10, color: '#64748b', alignSelf: 'center' }}>
              Followed up {new Date(appt.reviewFollowedUpAt).toLocaleDateString()}
            </span>
          )}
          {tab === 'history' && !appt.reviewFollowedUpAt && (
            <span style={{ fontSize: 10, color: '#64748b', alignSelf: 'center' }}>
              Invited {appt.reviewInvitedAt ? new Date(appt.reviewInvitedAt).toLocaleDateString() : '—'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function actionBtn(color: string): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${color}`,
    background: color + '22',
    color,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

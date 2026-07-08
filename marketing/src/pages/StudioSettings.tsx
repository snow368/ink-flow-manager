import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';
import { getClickStats } from '../lib/affiliateTracking';
import { BookingLinkShare, StationsSection } from '../components/MeComponents';
import { canAccess } from '../lib/planAccess';

const THEME = {
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  border: { default: '#334155' },
  bg: { card: '#1e293b', surface: '#0f172a' },
};

export default function StudioSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [studioName, setStudioName] = useState('');
  const [lang, setLang] = useState<AppLanguage>(detectInitialLanguage());
  const [affiliateStats, setAffiliateStats] = useState({ total: 0, today: 0 });

  useEffect(() => {
    getClickStats().then(s => setAffiliateStats({ total: s.total, today: s.today }));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(u => {
        setUser(u || null);
        setStudioName(u?.studioName || '');
      });
    }
  }, []);

  const handleSaveStudioName = async () => {
    if (!user) return;
    await db.users.update(user.id, { studioName: studioName.trim() || undefined });
    const updated = await db.users.get(user.id);
    setUser(updated || null);
    setEditing(false);
  };

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Please log in</div>;

  return (
    <div style={{ padding: 24, color: THEME.text.primary }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 15, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Me
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>🏪 Studio</h2>
      </div>

      {/* Studio Name */}
      <div style={{ background: THEME.bg.card, padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Studio Name</p>
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={studioName} onChange={e => setStudioName(e.target.value)} placeholder="Your studio or brand name"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 14, outline: 'none' }} />
            <button onClick={handleSaveStudioName} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save</button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 14, color: THEME.text.secondary }}>{user.studioName || 'Not set'}</p>
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', padding: '10px 14px' }}>Edit</button>
          </div>
        )}
      </div>

      {/* Booking Link */}
      <BookingLinkShare artistId={user.id} user={user} />

      {/* Stations */}
      <StationsSection lang={lang} user={user} onUserUpdate={setUser} />

      {/* Studio Ops */}
      <SectionHeader label="Studio Ops" />
      <Grid2>{[
        ['/pos', t(lang, 'pos_register'), 'New', '#14532d'],
        ['/close-out', t(lang, 'daily_closeout'), 'New', ''],
        ['/shifts', t(lang, 'shift_scheduling'), 'New', ''],
        ['/tasks', t(lang, 'task_manager'), 'New', ''],
        ['/health-checklist', 'Health & Safety', 'New', '#0f766e'],
        ['/analytics', 'Analytics', 'New', '#1e3a5f'],
      ].filter(([to]) => {
        if (to === '/close-out' || to === '/shifts' || to === '/health-checklist' || to === '/analytics') return canAccess(user, 'daily_closeout');
        return true;
      }).map(([to, label, sub, accent]) => renderNavButton(navigate, to as string, label as string, sub as string, accent as string))}</Grid2>

      {/* Marketing & Portfolio */}
      <SectionHeader label="Marketing & Portfolio" />
      <Grid2>{[
        ['/portfolio', t(lang, 'portfolio'), '', ''],
        ['/artist-profile', 'Profile Page', '', ''],
        ['/events', 'Events & Guest Spots', '', ''],
        ['/communication-log', t(lang, 'communication_log'), '', ''],
      ].map(([to, label, sub, accent]) => renderNavButton(navigate, to as string, label as string, sub as string, accent as string))}</Grid2>

      {/* Supplies */}
      <SectionHeader label="Supplies" />
      <Grid2>{[
        ['/inventory', t(lang, 'inventory_management'), '', ''],
        ['/supply-brands', t(lang, 'supply_brands'), affiliateStats.total > 0 ? `${affiliateStats.total} clicks` : 'New', '#312e81'],
        ['/supply-reviews', t(lang, 'supply_reviews'), 'New', '#7c2d12'],
        ['/availability-settings', t(lang, 'studio_availability'), 'Hours & days off', ''],
      ].filter(([to]) => {
        if (to === '/inventory') return canAccess(user, 'inventory');
        return true;
      }).map(([to, label, sub, accent]) => renderNavButton(navigate, to as string, label as string, sub as string, accent as string))}</Grid2>

      {/* Team (Pro+ only) */}
      {canAccess(user, 'multi_studio') && <>
        <SectionHeader label="Team" />
        <Grid2>{[
          ['/owner-dashboard', t(lang, 'owner_dashboard'), 'New', '#1e3a5f'],
          ['/staff-management', t(lang, 'staff_management'), 'New', ''],
          ['/audit-log', t(lang, 'audit_log'), 'New', ''],
          ['/locations', t(lang, 'locations'), '', ''],
        ].map(([to, label, sub, accent]) => renderNavButton(navigate, to as string, label as string, sub as string, accent as string))}</Grid2>
      </>}

      {/* Dev-only */}
      {user.roles?.includes('dev') && <>
        <SectionHeader label="Dev Tools" />
        <Grid2>{[
          ['/competitors', 'Competitor Monitor', '', '#0f766e'],
          ['/content-strategy', 'Content Strategy', '', '#4c1d95'],
        ].map(([to, label, sub, accent]) => renderNavButton(navigate, to as string, label as string, sub as string, accent as string))}</Grid2>
      </>}

      <div style={{ height: 32 }} />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>{children}</div>;
}

function renderNavButton(navigate: ReturnType<typeof import('react-router-dom').useNavigate>, to: string, label: string, sub: string, accent: string) {
  const bg = accent ? `linear-gradient(135deg, #1e293b 0%, ${accent} 100%)` : '#1e293b';
  return (
    <button key={to} onClick={() => navigate(to)}
      style={{ padding: 14, borderRadius: 12, border: '1px solid #334155', background: bg, color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>
      <div>{label}</div>
      {sub ? <div style={{ fontSize: 10, color: sub.includes('click') ? '#4ade80' : sub.includes('pending') ? '#fbbf24' : '#64748b', marginTop: 2 }}>{sub}</div> : null}
    </button>
  );
}

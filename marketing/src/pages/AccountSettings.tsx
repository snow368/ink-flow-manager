import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { detectInitialLanguage, setStoredLanguage, t, type AppLanguage } from '../lib/i18n';
import { getSupportedCountries } from '../lib/invoiceConfig';
import { getAppointmentsNeedingReviewInvite, getAppointmentsNeedingFollowUp } from '../lib/reviewInvite';
import { getClientReferralStats } from '../lib/clientReferral';
import { syncAll, getSyncStatus as getSync } from '../lib/syncManager';
import { getBackendUrl } from '../lib/backendApi';
import { seedDemoData, resetDatabase } from '../lib/devTools';
import { seedMultiLocationTest } from '../lib/seedDev';
import { ConsumablePresets } from '../components/MeComponents';

const THEME = {
  bg: { app: '#0f172a', card: '#1e293b', surface: '#0f172a' },
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  border: { default: '#334155', soft: '#27272a' },
  brand: { primary: '#e11d48', accent: '#7e22ce', success: '#22c55e' },
};
const BACK_ICON = '←';

export default function AccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [lang, setLang] = useState<AppLanguage>(detectInitialLanguage());
  const [country, setCountry] = useState('US');
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({});
  const [editingReview, setEditingReview] = useState(false);
  const [reviewInviteCount, setReviewInviteCount] = useState(0);
  const [reviewFollowUpCount, setReviewFollowUpCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(getSync());
  const [syncing, setSyncing] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [devMessage, setDevMessage] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(async u => {
        setUser(u || null);
        setLang(detectInitialLanguage());
        setCountry(u?.country || 'US');
        if (u) {
          setReviewLinks(u.reviewLinks || {});
          getAppointmentsNeedingReviewInvite(u.id).then(apps => setReviewInviteCount(apps.length));
          getAppointmentsNeedingFollowUp(u.id).then(apps => setReviewFollowUpCount(apps.length));
        }
      });
    }
  }, []);

  const handleSaveReviewLinks = async () => {
    if (!user) return;
    await db.users.update(user.id, { reviewLinks });
    const fresh = await db.users.get(user.id);
    if (fresh) setUser(fresh);
    setEditingReview(false);
  };

  const handleExport = async () => {
    try {
      const data = {
        version: 1, exportedAt: new Date().toISOString(),
        clients: await db.clients.toArray(), appointments: await db.appointments.toArray(),
        waivers: await db.waivers.toArray(), sessions: await db.sessions.toArray(),
        inventory: await db.inventory.toArray(), portfolio: await db.portfolio.toArray(),
        referrals: await db.referrals.toArray(), leads: await db.leads.toArray(),
        posTransactions: await db.posTransactions.toArray(), invoices: await db.invoices.toArray(),
        studioLocations: await db.studioLocations.toArray(),
        communicationLog: await db.communicationLog.toArray(),
        clientReferrals: await db.clientReferrals.toArray(),
        reviews: await db.reviews.toArray(),
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inkflow_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Data exported!');
    } catch { setMessage('Export failed'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Importing will overwrite all existing data. Continue?')) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.clients) { await db.clients.clear(); for (const c of data.clients) await db.clients.add(c); }
      if (data.appointments) { await db.appointments.clear(); for (const a of data.appointments) await db.appointments.add(a); }
      if (data.waivers) { await db.waivers.clear(); for (const w of data.waivers) await db.waivers.add(w); }
      if (data.sessions) { await db.sessions.clear(); for (const s of data.sessions) await db.sessions.add(s); }
      if (data.inventory) { await db.inventory.clear(); for (const i of data.inventory) await db.inventory.add(i); }
      if (data.leads) { await db.leads.clear(); for (const l of data.leads) await db.leads.add(l); }
      if (data.posTransactions) { await db.posTransactions.clear(); for (const t of data.posTransactions) await db.posTransactions.add(t); }
      if (data.invoices) { await db.invoices.clear(); for (const i of data.invoices) await db.invoices.add(i); }
      if (data.studioLocations) { await db.studioLocations.clear(); for (const l of data.studioLocations) await db.studioLocations.add(l); }
      if (data.communicationLog) { await db.communicationLog.clear(); for (const l of data.communicationLog) await db.communicationLog.add(l); }
      setMessage('Data imported!');
    } catch { setMessage('Import failed'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('inkflow_current_user');
    navigate('/register');
  };

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Please log in</div>;

  return (
    <div style={{ padding: 24, color: THEME.text.primary }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 15, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          {BACK_ICON} Me
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>Account & Settings</h2>
      </div>

      {/* Language + Country */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: THEME.bg.card, padding: 12, borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: THEME.text.muted, marginBottom: 4 }}>{t(lang, 'language')}</p>
          <select value={lang} onChange={e => { const v = e.target.value as AppLanguage; setLang(v); setStoredLanguage(v); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 13, outline: 'none' }}>
            {(['en', 'es', 'pt', 'fr', 'de', 'th', 'jp'] as const).map(l => (<option key={l} value={l}>{l.toUpperCase()}</option>))}
          </select>
        </div>
        <div style={{ background: THEME.bg.card, padding: 12, borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: THEME.text.muted, marginBottom: 4 }}>Country</p>
          <select value={country} onChange={e => { const v = e.target.value; setCountry(v); if (user) db.users.update(user.id, { country: v }); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 13, outline: 'none' }}>
            {getSupportedCountries().map((c: any) => (<option key={c.code} value={c.code}>{c.label}</option>))}
          </select>
        </div>
      </div>

      {/* Auto Aftercare */}
      <div style={{ background: THEME.bg.card, padding: 14, borderRadius: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text.primary }}>Auto Aftercare</p>
            <p style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
              Auto-send D1 & D3 aftercare messages via WhatsApp (safety only, never marketing)
            </p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={user?.autoAftercare ?? false}
              onChange={async () => {
                if (!user) return;
                const next = !user.autoAftercare;
                await db.users.update(user.id, { autoAftercare: next });
                setUser(prev => prev ? { ...prev, autoAftercare: next } : prev);
              }}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 12,
              background: user?.autoAftercare ? '#22c55e' : '#334155',
              transition: 'background 0.2s',
            }}>
              <span style={{
                position: 'absolute', left: user?.autoAftercare ? 22 : 2, top: 2,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </span>
          </label>
        </div>
      </div>

      {/* Plan */}
      <PlanSection user={user} setUser={setUser} lang={lang} navigate={navigate} />


      {/* Consumable Presets */}
      <ConsumablePresets lang={lang} />

      {/* Notifications & Reviews */}
      <SectionHeader label="Notifications & Reviews" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <button onClick={() => navigate('/notification-settings')}
          style={{ gridColumn: '1 / -1', padding: 14, borderRadius: 12, border: `1px solid ${THEME.border.default}`, background: THEME.bg.card, color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>
          <div>{t(lang, 'notification_settings')}</div>
          <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>SMS / Email / Push</div>
        </button>
        <button onClick={() => handleExport()}
          style={{ padding: 14, borderRadius: 12, border: `1px solid ${THEME.border.default}`, background: THEME.bg.card, color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>
          Export Data
        </button>
        <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e: any) => handleImport(e); input.click(); }}
          style={{ padding: 14, borderRadius: 12, border: `1px solid ${THEME.border.default}`, background: THEME.bg.card, color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>
          Import Data
        </button>
      </div>

      {/* Review Links */}
      <div style={{ background: THEME.bg.card, padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <p style={{ fontWeight: 600, fontSize: 13 }}>Review Links</p>
          <button onClick={() => setEditingReview(!editingReview)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 13, cursor: 'pointer' }}>
            {editingReview ? 'Close' : 'Edit'}
          </button>
        </div>
        {editingReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <input value={reviewLinks.google || ''} onChange={e => setReviewLinks(p => ({ ...p, google: e.target.value }))} placeholder="Google Review link"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            <input value={reviewLinks.platform2Name || ''} onChange={e => setReviewLinks(p => ({ ...p, platform2Name: e.target.value }))} placeholder="Platform 2 name"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            <input value={reviewLinks.platform2Url || ''} onChange={e => setReviewLinks(p => ({ ...p, platform2Url: e.target.value }))} placeholder="Platform 2 URL"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={handleSaveReviewLinks} style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
          </div>
        )}
      </div>

      {/* Review Invites + Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <button onClick={() => navigate('/review-invites')}
          style={{ padding: 14, borderRadius: 12, border: `1px solid ${THEME.border.default}`, background: THEME.bg.card, color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>
          <div>Review Invites</div>
          <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 2 }}>
            {reviewInviteCount > 0 ? `${reviewInviteCount} pending` : reviewFollowUpCount > 0 ? `${reviewFollowUpCount} follow-up` : 'View'}
          </div>
        </button>
      </div>

      {/* Cloud Sync */}
      <SectionHeader label="Data & Sync" />
      <div style={{ background: THEME.bg.card, padding: 14, borderRadius: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Cloud Sync</p>
          {syncStatus.backendConfigured
            ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#22c55e20', color: '#4ade80' }}>Configured</span>
            : <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#f59e0b20', color: '#fbbf24' }}>Not configured</span>}
        </div>
        <p style={{ fontSize: 11, color: THEME.text.muted, marginBottom: 12, lineHeight: 1.5 }}>
          Sync your data to the backend for calendar subscriptions, multi-device access, and owner oversight.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, fontSize: 13, color: THEME.text.secondary }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Last sync</span>
            <span style={{ color: syncStatus.lastSync > 0 ? '#4ade80' : THEME.text.muted }}>
              {syncStatus.lastSync > 0 ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pending</span>
            <span style={{ color: syncStatus.pending ? '#fbbf24' : '#4ade80' }}>{syncStatus.pending ? 'Yes' : 'Up to date'}</span>
          </div>
        </div>
        <button onClick={async () => { if (!user || syncing) return; setSyncing(true); const r = await syncAll(user); setSyncStatus(getSync()); setSyncing(false); if (r.ok) setMessage('Sync complete!'); else setMessage('Sync failed'); }}
          disabled={syncing || !syncStatus.backendConfigured}
          style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: syncing || !syncStatus.backendConfigured ? '#334155' : '#2563eb', color: 'white', fontSize: 15, fontWeight: 600, cursor: syncing || !syncStatus.backendConfigured ? 'not-allowed' : 'pointer' }}>
          {syncing ? 'Syncing...' : syncStatus.pending ? 'Sync Now (pending)' : 'Sync Now'}
        </button>
        {getBackendUrl() && (
          <div style={{ marginTop: 8, background: THEME.bg.card, borderRadius: 6, padding: '6px 10px' }}>
            <p style={{ fontSize: 10, color: THEME.text.muted }}>Backend URL</p>
            <p style={{ fontSize: 11, color: '#60a5fa', wordBreak: 'break-all' }}>{getBackendUrl()}</p>
          </div>
        )}
      </div>

      {/* Dev Tools */}
      <SectionHeader label="Developer" />
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowDevTools(!showDevTools)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px dashed #475569', background: 'transparent', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>
          {showDevTools ? 'Hide Dev Tools' : 'Dev Tools'}
        </button>
        {showDevTools && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={async () => { await seedDemoData(); setDevMessage('Demo data filled'); }} style={{ padding: 14, borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Fill Demo Data</button>
            <button onClick={async () => { await seedMultiLocationTest(); setDevMessage('Multi-location seeded'); }} style={{ padding: 14, borderRadius: 10, border: 'none', background: '#4338ca', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Seed Multi-Location Test</button>
            <button onClick={async () => { await resetDatabase(); setDevMessage('Database reset'); }} style={{ padding: 14, borderRadius: 10, border: 'none', background: '#7f1d1d', color: '#fca5a5', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Reset All Data</button>
            <DeleteAccountButton userId={user?.id} />
            {user.roles?.includes('dev') && (
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, border: '1px solid #a855f780' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#c084fc', marginBottom: 6 }}>Plan Override</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['free', 'solo', 'pro', 'pro_plus'].map(plan => (
                    <button key={plan} onClick={async () => { if (!user) return; await db.users.update(user.id, { plan: plan as any }); const f = await db.users.get(user.id); if (f) setUser(f); }}
                      style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: user.plan === plan ? '#7e22ce' : '#1e293b', color: user.plan === plan ? 'white' : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                      {plan === 'pro_plus' ? 'Pro+' : plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: '#7f1d1d', color: '#fca5a5', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 32 }}>
        {t(lang, 'logout')}
      </button>
    </div>
  );
}

function DeleteAccountButton({ userId }: { userId?: string }) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle');
  const deleting = useRef(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!userId || deleting.current) return;
    deleting.current = true;
    try {
      const apiSecret = localStorage.getItem('inkflow_api_secret') || '';
      const backendUrl = getBackendUrl();
      if (backendUrl && apiSecret) {
        await fetch(`${backendUrl}/api/auth/unregister`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret, 'x-user-role': 'owner' },
          body: JSON.stringify({ userId }),
        }).catch(() => {});
      }
      localStorage.clear();
      setStep('done');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch { setStep('idle'); }
  };

  if (step === 'done') return <p style={{ fontSize: 13, color: '#4ade80', textAlign: 'center', marginTop: 8 }}>Account deleted. Redirecting...</p>;

  if (step === 'confirm') return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 12, color: '#f87171', marginBottom: 6 }}>Delete account permanently? All data will be lost.</p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={handleDelete}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Yes, Delete
        </button>
        <button onClick={() => setStep('idle')}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <button onClick={() => setStep('confirm')}
      style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: '#7f1d1d', color: '#fca5a5', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
      Delete My Account
    </button>
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

const PLAN_COLORS: Record<string, string> = { free: '#64748b', starter: '#6366f1', solo: '#6366f1', pro: '#2563eb', pro_plus: '#a855f7', plus: '#a855f7' };
const PLAN_LABELS: Record<string, string> = { free: 'Free', starter: 'Starter', solo: 'Starter', pro: 'Pro', pro_plus: 'Plus', plus: 'Plus' };

const ALL_PLANS = [
  { id: 'free', name: 'Free', price: '$0', color: '#64748b', features: ['Manual client management', 'Local-only (no cloud)', 'Basic appointment booking'] },
  { id: 'starter', name: 'Starter', price: '$9.99/mo', color: '#6366f1', features: ['Online booking widget', 'Digital waivers', 'Cloud sync', 'SMS/email reminders', '1 free website page', 'Payment links'] },
  { id: 'pro', name: 'Pro', price: '$29.99/mo', color: '#2563eb', features: ['Everything in Starter', 'Up to 5 artists', 'Commission splitting', 'Aftercare automation', 'Inventory tracking', 'Enhanced website (10 pages)'], popular: true },
  { id: 'plus', name: 'Plus', price: '$49.99/mo', color: '#a855f7', features: ['Everything in Pro', 'Multi-location', 'Unlimited artists', 'Custom domain', 'Priority support', 'No InkFlow branding'] },
];

function PlanSection({ user, setUser, lang, navigate }: { user: any; setUser: (u: any) => void; lang: any; navigate: any }) {
  const currentPlan = user?.plan || 'free';
  const [changing, setChanging] = useState(false);

  async function changePlan(target: string) {
    if (target === currentPlan) return;
    setChanging(true);
    try {
      const backendUrl = getBackendUrl();
      const secret = localStorage.getItem('inkflow_api_secret') || '';
      const uid = localStorage.getItem('inkflow_current_user') || '';

      const res = await fetch(`${backendUrl}/api/plan/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': secret, 'x-user-id': uid },
        body: JSON.stringify({ plan: target }),
      });
      if (res.ok) {
        setUser({ ...user, plan: target });
        localStorage.setItem('inkflow_current_user_data', JSON.stringify({ ...JSON.parse(localStorage.getItem('inkflow_current_user_data') || '{}'), plan: target }));
      } else {
        const err = await res.json();
        alert(err.error || 'Plan change failed');
      }
    } catch (e: any) {
      alert('Failed to change plan: ' + e.message);
    }
    setChanging(false);
  }

  return (
    <div style={{ background: '#1e293b', borderRadius: 10, marginBottom: 12, padding: 14 }}>
      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Plan</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ALL_PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan || (plan.id === 'starter' && (currentPlan === 'solo'));
          const isUpgrade = ['free', 'starter', 'solo'].indexOf(currentPlan) < ['free', 'starter', 'solo'].indexOf(plan.id);
          return (
            <div key={plan.id} onClick={() => !isCurrent && !changing && changePlan(plan.id)}
              style={{
                flex: '1 1 140px', padding: 12, borderRadius: 10, cursor: isCurrent ? 'default' : 'pointer',
                border: `2px solid ${isCurrent ? plan.color : '#334155'}`,
                background: isCurrent ? `${plan.color}15` : '#0f172a',
                opacity: changing ? 0.5 : 1,
                position: 'relative',
              }}>
              {plan.popular && <div style={{ position: 'absolute', top: -8, right: 8, background: plan.color, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>POPULAR</div>}
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0', marginBottom: 2 }}>{plan.name}</p>
              <p style={{ fontSize: 11, color: plan.color, fontWeight: 600, marginBottom: 4 }}>{plan.price}</p>
              {plan.features.slice(0, 3).map((f, i) => (
                <p key={i} style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4 }}>✓ {f}</p>
              ))}
              {isCurrent && <p style={{ fontSize: 9, color: plan.color, marginTop: 4, fontWeight: 600 }}>CURRENT</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

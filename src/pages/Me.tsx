import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { seedDemoData, resetDatabase } from '../lib/devTools';
import { seedMultiLocationTest } from '../lib/seedDev';
import { getReferralStats } from '../lib/referralLogic';
import { detectInitialLanguage, setStoredLanguage, t, type AppLanguage } from '../lib/i18n';
import { getSupportedCountries } from '../lib/invoiceConfig';
import { getClickStats } from '../lib/affiliateTracking';
import { getAppointmentsNeedingReviewInvite, getAppointmentsNeedingFollowUp } from '../lib/reviewInvite';
import { syncAll, getSyncStatus, getLastSyncTime } from '../lib/syncManager';
import { getBackendUrl } from '../lib/backendApi';

export default function Me() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [studioName, setStudioName] = useState('');
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionRate, setCommissionRate] = useState<number | undefined>();
  const [showDevTools, setShowDevTools] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [devMessage, setDevMessage] = useState('');
  const [message, setMessage] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [proDays, setProDays] = useState(0);
  const [lang, setLang] = useState<AppLanguage>(detectInitialLanguage());
  const [country, setCountry] = useState('US');
  const [affiliateStats, setAffiliateStats] = useState({ total: 0, today: 0 });
  const [reviewLinks, setReviewLinks] = useState<{ google?: string; platform2Name?: string; platform2Url?: string; platform3Name?: string; platform3Url?: string }>({});
  const [editingReview, setEditingReview] = useState(false);
  const [reviewInviteCount, setReviewInviteCount] = useState(0);
  const [reviewFollowUpCount, setReviewFollowUpCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getClickStats().then(s => setAffiliateStats({ total: s.total, today: s.today }));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(async u => {
        setUser(u || null);
        setStudioName(u?.studioName || '');
        setCountry(u?.country || 'US');
        setCommissionRate(u?.commissionRate);
        setReviewLinks(u?.reviewLinks || {});
        if (u) {
          const stats = await getReferralStats(u.id);
          setReferralCount(stats.verifiedCount);
          setProDays(stats.proDaysEarned);
          getAppointmentsNeedingReviewInvite(u.id).then(apps => setReviewInviteCount(apps.length));
          getAppointmentsNeedingFollowUp(u.id).then(apps => setReviewFollowUpCount(apps.length));
        }
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

  const handleSaveCommissionRate = async () => {
    if (!user) return;
    await db.users.update(user.id, { commissionRate });
    const updated = await db.users.get(user.id);
    setUser(updated || null);
    setEditingCommission(false);
  };

  const handleSaveReviewLinks = async () => {
    if (!user) return;
    await db.users.update(user.id, { reviewLinks });
    const updated = await db.users.get(user.id);
    setUser(updated || null);
    setEditingReview(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('inkflow_current_user');
    navigate('/register');
  };

  const handleExport = async () => {
    try {
      const data = {
        version: 1, exportedAt: new Date().toISOString(),
        clients: await db.clients.toArray(), appointments: await db.appointments.toArray(),
        waivers: await db.waivers.toArray(), sessions: await db.sessions.toArray(),
        inventory: await db.inventory.toArray(), portfolio: await db.portfolio.toArray(),
        referrals: await db.referrals.toArray(),
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inkflow_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Data exported!');
    } catch (e: any) { setMessage('Export failed'); }
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
      setMessage('Data imported!');
    } catch (e: any) { setMessage('Import failed'); }
  };

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Please log in</div>;

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'me')}</h2>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{t(lang, 'language')}</p>
        <select
          value={lang}
          onChange={e => {
            const next = e.target.value as AppLanguage;
            setLang(next);
            setStoredLanguage(next);
          }}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white' }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="pt">Português</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="th">ไทย</option>
          <option value="jp">日本語</option>
        </select>
      </div>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Country / Region</p>
        <select
          value={country}
          onChange={async e => {
            const next = e.target.value;
            setCountry(next);
            await db.users.update(user!.id, { country: next });
          }}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white' }}>
          {getSupportedCountries().map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>Determines invoice format, currency, and tax labels</p>
      </div>

      {/* Consumable Presets */}
      <ConsumablePresets lang={lang} />

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>{user.name}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>{user.email}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>
          {user.roles?.map(r => r === 'artist' ? 'Artist' : r === 'owner' ? 'Owner' : r === 'staff' ? 'Staff' : 'Dev').join(' + ') || 'Artist'}
          {user.plan === 'pro' ? ' · Pro' : user.plan === 'plus' ? ' · Plus' : ' · Free'}
        </p>
        {(!user.plan || user.plan === 'free') && (
          <button onClick={() => setShowUpgrade(true)}
            style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1px solid #4338ca', background: '#312e8120', color: '#a5b4fc', fontSize: 12, cursor: 'pointer' }}>
            Upgrade to Pro / Plus →
          </button>
        )}
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div onClick={() => setShowUpgrade(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, border: '1px solid #334155' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Upgrade Plan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {([
                { plan: 'pro' as const, name: 'Pro', price: '$9.99/mo', msgs: '200', storage: '50 GB', color: '#4338ca' },
                { plan: 'plus' as const, name: 'Plus', price: '$19.99/mo', msgs: '1500', storage: '200 GB', color: '#7e22ce' },
              ]).map(p => (
                <button key={p.plan} onClick={async () => {
                  await db.users.update(user!.id, { plan: p.plan });
                  const updated = await db.users.get(user!.id);
                  setUser(updated || null);
                  setShowUpgrade(false);
                  setMessage(`Upgraded to ${p.name}!`);
                }}
                style={{ padding: 14, borderRadius: 12, border: `2px solid ${user.plan === p.plan ? p.color : '#334155'}`, background: '#0f172a', color: 'white', cursor: 'pointer', textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: p.color }}>{p.name}</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{p.price}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{p.msgs} msgs/mo</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>{p.storage} storage</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowUpgrade(false)}
              style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Referral Entry */}
      {user.verified && (
        <button onClick={() => navigate('/referral')}
          style={{
            width: '100%', padding: 14, borderRadius: 14, marginBottom: 16,
            border: 'none', background: 'linear-gradient(135deg, #312e81 0%, #7e22ce 100%)',
            color: 'white', fontSize: 16, fontWeight: 700, textAlign: 'left',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
          <div>
            <p style={{ fontSize: 15 }}>Invite Friends, Get Free Pro</p>
            <p style={{ fontSize: 12, color: '#c4b5fd', marginTop: 2 }}>
              {referralCount} verified - {proDays}d Pro earned
            </p>
          </div>
          <span style={{ fontSize: 18 }}>{'>'}</span>
        </button>
      )}

      {/* ── Studio ── */}
      <SectionHeader label="Studio" />

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Studio Name</p>
        {editing ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={studioName} onChange={e => setStudioName(e.target.value)} placeholder="Your studio or brand name"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14 }} />
            <button onClick={handleSaveStudioName} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 14 }}>Save</button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>{user.studioName || 'Not set'}</p>
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14 }}>Edit</button>
          </div>
        )}
      </div>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Artist Commission Rate</p>
        {editingCommission ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <input type="number" value={commissionRate ?? ''} onChange={e => setCommissionRate(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 50" min="0" max="100"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14 }} />
            <span style={{ color: '#94a3b8', fontSize: 14 }}>%</span>
            <button onClick={handleSaveCommissionRate} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 14 }}>Save</button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 14, color: commissionRate ? '#22c55e' : '#94a3b8' }}>
              {commissionRate != null ? `${commissionRate}% — artist gets ${commissionRate}%, shop keeps ${100 - commissionRate}%` : 'Not set'}
            </p>
            <button onClick={() => setEditingCommission(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14 }}>Edit</button>
          </div>
        )}
        <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>Applied at session checkout. Artist gets this % of session revenue before tips.</p>
      </div>

      {/* Station Management */}
      <StationsSection lang={lang} user={user} onUserUpdate={setUser} />

      {/* Review Invites */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/review-invites')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #f59e0b80', background: 'linear-gradient(135deg, #1e293b 0%, #78350f 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Review Invites</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {reviewInviteCount > 0 && <span style={{ fontSize: 11, background: '#f59e0b20', color: '#fbbf24', padding: '2px 8px', borderRadius: 4 }}>{reviewInviteCount} to invite</span>}
            {reviewFollowUpCount > 0 && <span style={{ fontSize: 11, background: '#3b82f620', color: '#60a5fa', padding: '2px 8px', borderRadius: 4 }}>{reviewFollowUpCount} follow up</span>}
            {reviewInviteCount === 0 && reviewFollowUpCount === 0 && <span style={{ fontSize: 11, color: '#64748b' }}>View All</span>}
          </span>
        </button>
      </div>

      {/* Review Links */}
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{t(lang, 'review_links')}</p>
        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{t(lang, 'review_links_desc')}</p>
        {editingReview ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={reviewLinks.google || ''}
              onChange={e => setReviewLinks(prev => ({ ...prev, google: e.target.value }))}
              placeholder="Google Review link (g.page/...)"
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={reviewLinks.platform2Name || ''}
                onChange={e => setReviewLinks(prev => ({ ...prev, platform2Name: e.target.value }))}
                placeholder="Platform name (e.g. Yelp)"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none' }}
              />
              <input
                value={reviewLinks.platform2Url || ''}
                onChange={e => setReviewLinks(prev => ({ ...prev, platform2Url: e.target.value }))}
                placeholder="URL"
                style={{ flex: 2, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={reviewLinks.platform3Name || ''}
                onChange={e => setReviewLinks(prev => ({ ...prev, platform3Name: e.target.value }))}
                placeholder="Platform name (e.g. Facebook)"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none' }}
              />
              <input
                value={reviewLinks.platform3Url || ''}
                onChange={e => setReviewLinks(prev => ({ ...prev, platform3Url: e.target.value }))}
                placeholder="URL"
                style={{ flex: 2, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none' }}
              />
            </div>
            <button onClick={handleSaveReviewLinks} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start' }}>Save</button>
          </div>
        ) : (
          <div>
            {(reviewLinks.google || reviewLinks.platform2Url || reviewLinks.platform3Url) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {reviewLinks.google && <p style={{ fontSize: 13, color: '#4ade80' }}>Google: {reviewLinks.google}</p>}
                {reviewLinks.platform2Name && reviewLinks.platform2Url && <p style={{ fontSize: 13, color: '#f87171' }}>{reviewLinks.platform2Name}: {reviewLinks.platform2Url}</p>}
                {reviewLinks.platform3Name && reviewLinks.platform3Url && <p style={{ fontSize: 13, color: '#60a5fa' }}>{reviewLinks.platform3Name}: {reviewLinks.platform3Url}</p>}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Not set</p>
            )}
            <button onClick={() => setEditingReview(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 13, cursor: 'pointer', marginTop: 4 }}>Edit</button>
          </div>
        )}
      </div>

      {user.roles?.includes('owner') && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => navigate('/locations')}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
            {t(lang, 'locations')}
          </button>
        </div>
      )}

      {/* ── Team ── */}
      {user.roles?.includes('owner') && (
        <>
          <SectionHeader label="Team" />
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => navigate('/owner-dashboard')}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e293b 0%, #1e3a5f 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t(lang, 'owner_dashboard')}</span>
              <span style={{ fontSize: 11, background: '#3b82f620', color: '#60a5fa', padding: '2px 8px', borderRadius: 4 }}>New</span>
            </button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => navigate('/staff-management')}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t(lang, 'staff_management')}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>New</span>
            </button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => navigate('/audit-log')}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t(lang, 'audit_log')}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>New</span>
            </button>
          </div>
        </>
      )}

      {/* ── Operations ── */}
      <SectionHeader label="Operations" />

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/notification-settings')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'notification_settings')}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>SMS / Email</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/pos')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e293b 0%, #14532d 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'pos_register')}</span>
          <span style={{ fontSize: 11, background: '#22c55e20', color: '#4ade80', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/artist-profile')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Profile Page</span>
          <span style={{ fontSize: 11, background: '#818cf820', color: '#a5b4fc', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/events')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e293b 0%, #7c2d12 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Events & Guest Spots</span>
          <span style={{ fontSize: 11, background: '#f9731620', color: '#fdba74', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/tasks')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'task_manager')}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/shifts')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'shift_scheduling')}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/close-out')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'daily_closeout')}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/communication-log')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'communication_log')}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <BookingLinkShare artistId={user?.id || localStorage.getItem('inkflow_current_user') || ''} user={user} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/portfolio')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Portfolio</span>
          <span style={{ fontSize: 11, background: '#fbbf2420', color: '#fbbf24', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/invoices')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e293b 0%, #7e22ce 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Invoices</span>
          <span style={{ fontSize: 11, background: '#a855f720', color: '#c084fc', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/invoice-settings')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          Invoice Studio Settings
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/health-checklist')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e293b 0%, #0f766e 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Health & Safety Checklist</span>
          <span style={{ fontSize: 11, background: '#14b8a620', color: '#5eead4', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/analytics')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e293b 0%, #1e3a5f 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Analytics</span>
          <span style={{ fontSize: 11, background: '#3b82f620', color: '#60a5fa', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/leads')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          {t(lang, 'lead_capture')}
        </button>
      </div>

      {/* ── Financial ── */}
      <SectionHeader label="Financial" />

      {(!user.roles?.includes('owner') && !user.roles?.includes('dev') && !user.paymentLinkTemplate) && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #3b82f680' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 6 }}>Set up your payment method</p>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
            Go to <strong style={{ color: '#cbd5e1' }}>Payment Settings</strong> below to add your own PayPal, Venmo, Wise, or bank transfer link.
            Clients will use this to pay deposits and invoices.
          </p>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/payment-settings')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          Payment Settings
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/payment-history')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          Payment History
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/availability-settings')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          {t(lang, 'studio_availability')}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/deposit-policy')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          {t(lang, 'deposit_rules')}
        </button>
      </div>

      {/* ── Supplies ── */}
      <SectionHeader label="Supplies" />

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/inventory')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          {t(lang, 'inventory_management')}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/supply-brands')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'supply_brands')}</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {affiliateStats.total > 0 && (
              <>
                <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>{affiliateStats.today} today</span>
                <span style={{ fontSize: 11, background: '#22c55e20', color: '#4ade80', padding: '2px 8px', borderRadius: 4 }}>{affiliateStats.total} clicks</span>
              </>
            )}
            {affiliateStats.total === 0 && (
              <span style={{ fontSize: 11, background: '#fbbf2420', color: '#fbbf24', padding: '2px 8px', borderRadius: 4 }}>New</span>
            )}
          </span>
        </button>
        <button onClick={() => navigate('/supply-reviews')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #ea580c80', background: 'linear-gradient(135deg, #1e293b 0%, #7c2d12 100%)', color: 'white', fontSize: 14, fontWeight: 600, textAlign: 'left', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'supply_reviews')}</span>
          <span style={{ fontSize: 10, background: '#ea580c20', color: '#fdba74', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      {user.roles?.includes('owner') && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => navigate('/supply-brands/admin')}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #fbbf2480', background: '#1e293b', color: '#fbbf24', fontSize: 14, fontWeight: 600, textAlign: 'left' }}>
            {t(lang, 'supply_brands_admin')} <span style={{ fontSize: 10, color: '#64748b' }}>({t(lang, 'owner_only')})</span>
          </button>
        </div>
      )}

      {user.roles?.includes('dev') && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => navigate('/competitors')}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #14b8a680', background: 'linear-gradient(135deg, #1e293b 0%, #0f766e 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>竞争市场监控</span>
            <span style={{ fontSize: 10, background: '#14b8a620', color: '#5eead4', padding: '2px 8px', borderRadius: 4 }}>Dev</span>
          </button>
          <button onClick={() => navigate('/competitors/admin')}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #14b8a680', background: '#1e293b', color: '#5eead4', fontSize: 14, fontWeight: 600, textAlign: 'left', marginTop: 8 }}>
            管理竞争对手 <span style={{ fontSize: 10, color: '#64748b' }}>(Dev Only)</span>
          </button>
          <button onClick={() => navigate('/content-strategy')}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #a855f780', background: 'linear-gradient(135deg, #1e293b 0%, #4c1d95 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>内容策略引擎</span>
            <span style={{ fontSize: 10, background: '#a855f720', color: '#c4b5fd', padding: '2px 8px', borderRadius: 4 }}>Dev</span>
          </button>
        </div>
      )}

      {/* ── Data ── */}
      <SectionHeader label="Data & Backup" />

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #6366f180' }}>
        <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#818cf8' }}>收款方式设置 / Payment Setup</p>
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
          每个纹身师需要设置自己的收款链接。支持 PayPal / Venmo / Wise / Revolut / 银行卡转账等。
          去 <strong style={{ color: '#cbd5e1' }}>Payment Settings</strong> 配置你的收款方式。
          Client 付款后会上传凭证，你在 Payment History 里确认到账。
        </p>
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginTop: 6 }}>
          示例: <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>https://paypal.me/YourStudio/&#123;amount&#125;</code>
        </p>
      </div>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Manual Backup</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={handleExport} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 13, fontWeight: 600 }}>Export</button>
          <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#334155', color: 'white', fontSize: 13, fontWeight: 600 }}>Import</button>
          <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      {/* ── Cloud Sync ── */}
      <SectionHeader label="Cloud Sync" />

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Sync to Backend</p>
          {syncStatus.backendConfigured ? (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#22c55e20', color: '#4ade80' }}>Configured</span>
          ) : (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#f59e0b20', color: '#fbbf24' }}>Not configured</span>
          )}
        </div>

        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>
          Sync your data to the Cloudflare Worker backend for calendar subscriptions, multi-device access, and owner oversight.
          {!syncStatus.backendConfigured && (
            <span> Go to <span onClick={() => navigate('/notification-settings')} style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }}>Notification Settings</span> to set the backend URL.</span>
          )}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, fontSize: 13, color: '#94a3b8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Last sync</span>
            <span style={{ color: syncStatus.lastSync > 0 ? '#4ade80' : '#64748b' }}>
              {syncStatus.lastSync > 0 ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pending changes</span>
            <span style={{ color: syncStatus.pending ? '#fbbf24' : '#4ade80' }}>
              {syncStatus.pending ? 'Yes - sync needed' : 'Up to date'}
            </span>
          </div>
        </div>

        <button
          onClick={async () => {
            if (!user || syncing) return;
            setSyncing(true);
            const result = await syncAll(user);
            setSyncStatus(getSyncStatus());
            setSyncing(false);
            if (result.ok) setMessage(`Sync complete! ${new Date().toLocaleTimeString()}`);
            else setMessage(`Sync failed: ${result.error || 'unknown error'}`);
          }}
          disabled={syncing || !syncStatus.backendConfigured}
          style={{
            width: '100%', padding: 12, borderRadius: 10, border: 'none',
            background: syncing || !syncStatus.backendConfigured ? '#334155' : '#2563eb',
            color: 'white', fontSize: 14, fontWeight: 600, cursor: syncing || !syncStatus.backendConfigured ? 'not-allowed' : 'pointer',
          }}
        >
          {syncing ? 'Syncing...' : syncStatus.pending ? 'Sync Now (pending changes)' : 'Sync Now'}
        </button>

        {getBackendUrl() && (
          <div style={{ marginTop: 8, background: '#0f172a', borderRadius: 6, padding: '6px 10px' }}>
            <p style={{ fontSize: 10, color: '#475569' }}>Backend URL</p>
            <p style={{ fontSize: 11, color: '#60a5fa', wordBreak: 'break-all' }}>{getBackendUrl()}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowDevTools(!showDevTools)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px dashed #475569', background: 'transparent', color: '#64748b', fontSize: 13 }}>
          {showDevTools ? 'Hide Dev Tools' : 'Dev Tools'}
        </button>
        {showDevTools && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={async () => { await seedDemoData(); }} style={{ padding: 12, borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 14, fontWeight: 600 }}>Fill Demo Data</button>
            <button onClick={async () => { await seedMultiLocationTest(); }} style={{ padding: 12, borderRadius: 10, border: 'none', background: '#4338ca', color: 'white', fontSize: 14, fontWeight: 600 }}>Seed Multi-Location Test</button>
            <button onClick={async () => { await resetDatabase(); }} style={{ padding: 12, borderRadius: 10, border: 'none', background: '#7f1d1d', color: '#fca5a5', fontSize: 14, fontWeight: 600 }}>Reset All Data</button>
          </div>
        )}
      </div>

      <button onClick={handleLogout} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>
        {t(lang, 'log_out')}
      </button>
    </div>
  );
}

function BookingLinkShare({ artistId, user }: { artistId: string; user: UserRecord | null }) {
  const [copied, setCopied] = useState(false);
  const [deposit, setDeposit] = useState(() => {
    try { return localStorage.getItem('inkflow_booking_deposit') || ''; } catch { return ''; }
  });
  const slug = (user as any)?.bioProfile?.slug || user?.instagramHandle?.replace(/^@/, '') || '';
  const shortUrl = slug ? `${window.location.origin}/${slug}` : `${window.location.origin}/bio/${artistId}`;
  const displayUrl = slug ? `${window.location.origin.replace(/^https?:\/\//, '')}/${slug}` : `book/${artistId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Book a tattoo with me: ${shortUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Book an Appointment', text, url: shortUrl }); return; } catch {}
    }
    handleCopy();
  };

  const handleDepositChange = (val: string) => {
    setDeposit(val);
    localStorage.setItem('inkflow_booking_deposit', val);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e293b 100%)', border: '1px solid #4338ca', borderRadius: 12, padding: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 4 }}>Your Link</p>
      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Share your page — clients see your work, links, and can book.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={displayUrl} readOnly
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #4338ca', background: '#0f172a', color: '#a5b4fc', fontSize: 12, outline: 'none' }}
          onFocus={e => e.target.select()} />
        <button onClick={handleCopy}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: copied ? '#166534' : '#7e22ce', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={handleShare}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #4338ca', background: 'transparent', color: '#c084fc', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Share
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Deposit ($):</span>
        <input type="number" placeholder="0 = no deposit" value={deposit} onChange={e => handleDepositChange(e.target.value)}
          style={{ width: 100, padding: '6px 10px', borderRadius: 8, border: '1px solid #4338ca', background: '#0f172a', color: 'white', fontSize: 12, outline: 'none' }} step="0.01" min="0" />
        <span style={{ fontSize: 10, color: '#64748b' }}>0 = skip payment step</span>
      </div>
    </div>
  );
}

const STATION_COLORS = [
  '#e11d48', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#78716c',
];

function StationsSection({ lang, user, onUserUpdate }: { lang: AppLanguage; user: UserRecord | null; onUserUpdate: (u: UserRecord) => void }) {
  const [editing, setEditing] = useState(false);
  const [stations, setStations] = useState<{ name: string; color: string }[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setStations(user?.stations || []);
  }, [user?.stations]);

  const save = async (updated: { name: string; color: string }[]) => {
    if (!user) return;
    await db.users.update(user.id, { stations: updated.length > 0 ? updated : undefined });
    const fresh = await db.users.get(user.id);
    if (fresh) onUserUpdate(fresh);
  };

  const addStation = () => {
    const name = newName.trim();
    if (!name || stations.some(s => s.name.toLowerCase() === name.toLowerCase())) return;
    const color = STATION_COLORS[stations.length % STATION_COLORS.length];
    const updated = [...stations, { name, color }];
    setStations(updated);
    setNewName('');
    save(updated);
  };

  const removeStation = (idx: number) => {
    const updated = stations.filter((_, i) => i !== idx);
    setStations(updated);
    save(updated);
  };

  const changeColor = (idx: number, color: string) => {
    const updated = stations.map((s, i) => i === idx ? { ...s, color } : s);
    setStations(updated);
    save(updated);
  };

  return (
    <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontWeight: 600 }}>{t(lang, 'stations')}</p>
        <button onClick={() => setEditing(!editing)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 13, cursor: 'pointer' }}>
          {editing ? t(lang, 'close') : t(lang, 'edit')}
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{t(lang, 'stations_desc')}</p>

      {stations.length === 0 && !editing && (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>No stations added yet. Tap Edit to set up your rooms.</p>
      )}

      {stations.map((s, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: '#0f172a', borderRadius: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: s.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, flex: 1 }}>{s.name}</span>
          {editing && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {STATION_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => changeColor(idx, c)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, background: c, cursor: 'pointer',
                    border: s.color === c ? '2px solid white' : '2px solid transparent',
                  }}
                />
              ))}
              <button onClick={() => removeStation(idx)}
                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>
                ×
              </button>
            </div>
          )}
        </div>
      ))}

      {editing && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            placeholder={t(lang, 'station_name')}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStation()}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none' }}
          />
          <button onClick={addStation} disabled={!newName.trim()}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: newName.trim() ? '#e11d48' : '#334155', color: 'white', fontSize: 13, cursor: 'pointer' }}>
            Add
          </button>
        </div>
      )}
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

const PRESETS_KEY = 'inkflow_consumable_presets';
type Preset = { type: string; items: string[] };

function ConsumablePresets({ lang }: { lang: AppLanguage }) {
  const [presets, setPresets] = useState<Preset[]>(() => {
    try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]'); } catch { return []; }
  });
  const [newType, setNewType] = useState('');
  const [newItem, setNewItem] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const save = (p: Preset[]) => {
    setPresets(p);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(p));
  };

  const addPreset = () => {
    const type = newType.trim();
    if (!type || presets.some(p => p.type === type)) return;
    save([...presets, { type, items: [] }]);
    setNewType('');
  };

  const addItem = (idx: number) => {
    const item = newItem.trim();
    if (!item) return;
    const next = [...presets];
    if (!next[idx].items.includes(item)) {
      next[idx] = { ...next[idx], items: [...next[idx].items, item] };
      save(next);
    }
    setNewItem('');
  };

  const removeItem = (presetIdx: number, itemIdx: number) => {
    const next = [...presets];
    next[presetIdx] = { ...next[presetIdx], items: next[presetIdx].items.filter((_, i) => i !== itemIdx) };
    save(next);
  };

  const removePreset = (idx: number) => {
    save(presets.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const commonTypes = ['Sleeve', 'Cover-up', 'Black & Grey', 'Color', 'Geometric', 'Lettering', 'Watercolor', 'Realism'];

  return (
    <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t(lang, 'consumable_presets')}</p>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
        {t(lang, 'consumable_presets_desc')}
      </p>

      {presets.map((p, idx) => (
        <div key={idx} style={{ marginBottom: 8, padding: 8, background: '#0f172a', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#c084fc' }}>{p.type}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
                {editingIdx === idx ? t(lang, 'close') : t(lang, 'edit')}
              </button>
              <button onClick={() => removePreset(idx)}
                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>{t(lang, 'del')}</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {p.items.map((item, i) => (
              <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#312e81', color: '#c4b5fd', cursor: editingIdx === idx ? 'pointer' : 'default' }}
                onClick={() => editingIdx === idx && removeItem(idx, i)}>
                {item} {editingIdx === idx ? '✕' : ''}
              </span>
            ))}
            {p.items.length === 0 && <span style={{ fontSize: 10, color: '#475569' }}>{t(lang, 'no_items_yet')}</span>}
          </div>
          {editingIdx === idx && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <input placeholder={t(lang, 'add_item')} value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem(idx)}
                style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 12 }} />
              <button onClick={() => addItem(idx)}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#7e22ce', color: 'white', fontSize: 11, cursor: 'pointer' }}>{t(lang, 'add')}</button>
            </div>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {commonTypes.filter(t => !presets.some(p => p.type === t)).slice(0, 4).map(t => (
          <button key={t} onClick={() => { save([...presets, { type: t, items: [] }]); }}
            style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
            + {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <input placeholder={t(lang, 'custom_type')} value={newType} onChange={e => setNewType(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPreset()}
          style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12 }} />
        <button onClick={addPreset} disabled={!newType.trim()}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: newType.trim() ? '#7e22ce' : '#334155', color: 'white', fontSize: 12, cursor: 'pointer' }}>
          {t(lang, 'create')}
        </button>
      </div>
    </div>
  );
}


import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { seedDemoData, resetDatabase } from '../lib/devTools';
import { seedMultiLocationTest } from '../lib/seedDev';
import { getReferralStats } from '../lib/referralLogic';
import { detectInitialLanguage, setStoredLanguage, t, type AppLanguage } from '../lib/i18n';
import { getSupportedCountries } from '../lib/invoiceConfig';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(async u => {
        setUser(u || null);
        setStudioName(u?.studioName || '');
        setCountry(u?.country || 'US');
        setCommissionRate(u?.commissionRate);
        if (u) {
          const stats = await getReferralStats(u.id);
          setReferralCount(stats.verifiedCount);
          setProDays(stats.proDaysEarned);
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
          <option value="zh">中文</option>
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

      {user.roles?.includes('owner') && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => navigate('/locations')}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
            {t(lang, 'locations')}
          </button>
        </div>
      )}

      {/* ── Operations ── */}
      <SectionHeader label="Operations" />

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/pos')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'linear-gradient(135deg, #1e293b 0%, #14532d 100%)', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t(lang, 'pos_register')}</span>
          <span style={{ fontSize: 11, background: '#22c55e20', color: '#4ade80', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <BookingLinkShare artistId={user?.id || localStorage.getItem('inkflow_current_user') || ''} />
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
        <button onClick={() => navigate('/leads')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          {t(lang, 'lead_capture')}
        </button>
      </div>

      {/* ── Financial ── */}
      <SectionHeader label="Financial" />

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
          <span style={{ fontSize: 11, background: '#fbbf2420', color: '#fbbf24', padding: '2px 8px', borderRadius: 4 }}>New</span>
        </button>
        <button onClick={() => navigate('/supply-reviews')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #ea580c80', background: 'linear-gradient(135deg, #1e293b 0%, #7c2d12 100%)', color: 'white', fontSize: 14, fontWeight: 600, textAlign: 'left', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>耗材真话墙</span>
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

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Payment Tips</p>
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
          For manual_link: paste your PayPal.me, Zelle, Venmo (US), Wise, Revolut, or SEPA bank link (EU). Use {'{'}amount{'}'} as placeholder. System generates a payment link with the correct amount. Client pays → uploads proof → you verify in Payment History.
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

function BookingLinkShare({ artistId }: { artistId: string }) {
  const [copied, setCopied] = useState(false);
  const [deposit, setDeposit] = useState(() => {
    try { return localStorage.getItem('inkflow_booking_deposit') || ''; } catch { return ''; }
  });
  const bookingUrl = `${window.location.origin}/book/${artistId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Book a tattoo appointment: ${bookingUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Book an Appointment', text, url: bookingUrl }); return; } catch {}
    }
    handleCopy();
  };

  const handleDepositChange = (val: string) => {
    setDeposit(val);
    localStorage.setItem('inkflow_booking_deposit', val);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e293b 100%)', border: '1px solid #4338ca', borderRadius: 12, padding: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 4 }}>Client Booking Link</p>
      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Share this link so clients can book directly.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={bookingUrl} readOnly
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

function ConsumablePresets({ lang }: { lang: string }) {
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

  const commonTypes = ['花臂 Sleeve', '遮盖 Cover-up', '黑灰 Black & Grey', '彩色 Color', '几何 Geometric', '字体 Lettering', '水彩 Watercolor', '写实 Realism'];

  return (
    <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Consumable Presets</p>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
        Define what you always prepare for each tattoo type. Shows on Today appointments.
      </p>

      {presets.map((p, idx) => (
        <div key={idx} style={{ marginBottom: 8, padding: 8, background: '#0f172a', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#c084fc' }}>{p.type}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
                {editingIdx === idx ? 'Close' : 'Edit'}
              </button>
              <button onClick={() => removePreset(idx)}
                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>Del</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {p.items.map((item, i) => (
              <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#312e81', color: '#c4b5fd', cursor: editingIdx === idx ? 'pointer' : 'default' }}
                onClick={() => editingIdx === idx && removeItem(idx, i)}>
                {item} {editingIdx === idx ? '✕' : ''}
              </span>
            ))}
            {p.items.length === 0 && <span style={{ fontSize: 10, color: '#475569' }}>No items yet</span>}
          </div>
          {editingIdx === idx && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <input placeholder="Add item..." value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem(idx)}
                style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 12 }} />
              <button onClick={() => addItem(idx)}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#7e22ce', color: 'white', fontSize: 11, cursor: 'pointer' }}>Add</button>
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
        <input placeholder="Custom type..." value={newType} onChange={e => setNewType(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPreset()}
          style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12 }} />
        <button onClick={addPreset} disabled={!newType.trim()}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: newType.trim() ? '#7e22ce' : '#334155', color: 'white', fontSize: 12, cursor: 'pointer' }}>
          Create
        </button>
      </div>
    </div>
  );
}


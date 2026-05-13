import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { seedDemoData, resetDatabase } from '../lib/devTools';
import { getReferralStats } from '../lib/referralLogic';
import { detectInitialLanguage, setStoredLanguage, t, type AppLanguage } from '../lib/i18n';

export default function Me() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [studioName, setStudioName] = useState('');
  const [showDevTools, setShowDevTools] = useState(false);
  const [devMessage, setDevMessage] = useState('');
  const [message, setMessage] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [proDays, setProDays] = useState(0);
  const [lang, setLang] = useState<AppLanguage>(detectInitialLanguage());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(async u => {
        setUser(u || null);
        setStudioName(u?.studioName || '');
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
        <p style={{ fontSize: 18, fontWeight: 600 }}>{user.name}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>{user.email}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>Role: {user.role === 'artist' ? 'Artist (Free)' : user.role === 'owner' ? 'Owner' : user.role === 'pro' ? 'Pro' : user.role === 'plus' ? 'Plus' : 'Staff'}</p>
      </div>

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

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/leads')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          {t(lang, 'lead_capture')}
        </button>
      </div>

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
        <button onClick={() => navigate('/deposit-policy')}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
          {t(lang, 'deposit_rules')}
        </button>
      </div>

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
      </div>

      {user.role === 'owner' && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => navigate('/supply-brands/admin')}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #fbbf2480', background: '#1e293b', color: '#fbbf24', fontSize: 14, fontWeight: 600, textAlign: 'left' }}>
            {t(lang, 'supply_brands_admin')} <span style={{ fontSize: 10, color: '#64748b' }}>({t(lang, 'owner_only')})</span>
          </button>
        </div>
      )}

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



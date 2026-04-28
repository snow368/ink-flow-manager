import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { seedDemoData, resetDatabase } from '../lib/devTools';
import { getGoogleAuthUrl, setAccessToken, loadAccessToken, clearAccessToken, backupToDrive, restoreFromDrive } from '../lib/googleDrive';

export default function Me() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [studioName, setStudioName] = useState('');
  const [showDevTools, setShowDevTools] = useState(false);
  const [devMessage, setDevMessage] = useState('');
  const [message, setMessage] = useState('');
  const [driveStatus, setDriveStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backupBusy, setBackupBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(u => {
        setUser(u || null);
        setStudioName(u?.studioName || '');
        const token = loadAccessToken();
        if (token && u?.googleDriveConnected) {
          setDriveStatus('connected');
        } else {
          setDriveStatus('disconnected');
        }
      });
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        setAccessToken(token);
        setDriveStatus('connected');
        setMessage('Google Drive connected! Backups will run automatically.');
        if (user) {
          db.users.update(user.id, { googleDriveConnected: true, lastBackupAt: Date.now() });
        }
        window.location.hash = '';
      }
    }
  }, [user]);

  const handleConnectDrive = () => { window.location.href = getGoogleAuthUrl(); };
  const handleDisconnectDrive = () => {
    if (confirm('Disconnect Google Drive? Manual export will still be available.')) {
      clearAccessToken();
      setDriveStatus('disconnected');
      if (user) db.users.update(user.id, { googleDriveConnected: false });
      setMessage('Google Drive disconnected.');
    }
  };

  const handleBackupNow = async () => {
    setBackupBusy(true);
    const result = await backupToDrive();
    setMessage(result.message);
    setBackupBusy(false);
  };

  const handleRestoreFromDrive = async () => {
    if (!confirm('Restore data from Google Drive? Current data will be overwritten.')) return;
    setBackupBusy(true);
    const result = await restoreFromDrive();
    setMessage(result.message);
    setBackupBusy(false);
    if (result.success && user) {
      const updated = await db.users.get(user.id);
      setUser(updated || null);
    }
  };

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

  const handleSeedData = async () => {
    try { const msg = await seedDemoData(); setDevMessage(msg); }
    catch (e: any) { setDevMessage('Error: ' + (e?.message || 'unknown')); }
  };

  const handleResetDB = async () => {
    if (!confirm('This will delete ALL data. Are you sure?')) return;
    try { const msg = await resetDatabase(); setDevMessage(msg); }
    catch (e: any) { setDevMessage('Error: ' + (e?.message || 'unknown')); }
  };

  const handleExport = async () => {
    try {
      const data = {
        version: 1, exportedAt: new Date().toISOString(),
        clients: await db.clients.toArray(), appointments: await db.appointments.toArray(),
        waivers: await db.waivers.toArray(), sessions: await db.sessions.toArray(),
        inventory: await db.inventory.toArray(), portfolio: await db.portfolio.toArray(),
        socialDrafts: await db.socialDrafts.toArray(), referrals: await db.referrals.toArray(),
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inkflow_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Data exported!');
    } catch (e: any) { setMessage('Export failed: ' + (e?.message || 'unknown')); }
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
      setMessage('Data imported! Refresh to see changes.');
    } catch (e: any) { setMessage('Import failed: ' + (e?.message || 'unknown')); }
  };

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Please log in</div>;

  const isProOrPlus = user.role === 'pro' || user.role === 'plus';

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Me</h2>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>{user.name}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>{user.email}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>
          Role: {user.role === 'artist' ? 'Artist (Free)' : user.role === 'owner' ? 'Owner' : user.role === 'pro' ? 'Pro' : user.role === 'plus' ? 'Plus' : 'Staff'}
        </p>
      </div>

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

      {/* Pro/Plus 用户 - 已连接 Google Drive */}
      {isProOrPlus && driveStatus === 'connected' && (
        <div style={{
          background: 'linear-gradient(135deg, #14532d 0%, #1e3a5f 100%)',
          padding: 20, borderRadius: 16, marginBottom: 16,
          border: '2px solid #22c55e', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>☁️</span>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700 }}>Auto-Backup Active</p>
              <p style={{ fontSize: 12, color: '#86efac' }}>Encrypted hourly backup to your Google Drive</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleBackupNow} disabled={backupBusy}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontSize: 13, fontWeight: 600 }}>
              {backupBusy ? 'Backing up...' : 'Backup Now'}
            </button>
            <button onClick={handleRestoreFromDrive} disabled={backupBusy}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#3b82f6', color: 'white', fontSize: 13, fontWeight: 600 }}>
              Restore
            </button>
          </div>
          <button onClick={handleDisconnectDrive}
            style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#fca5a5', fontSize: 12 }}>
            Disconnect
          </button>
          {user.lastBackupAt && (
            <p style={{ fontSize: 11, color: '#86efac', marginTop: 8 }}>
              Last backup to your Drive: {new Date(user.lastBackupAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Pro/Plus 用户 - 未连接 Google Drive */}
      {isProOrPlus && driveStatus !== 'connected' && (
        <div style={{
          background: 'linear-gradient(135deg, #312e81 0%, #7e22ce 100%)',
          padding: 20, borderRadius: 16, marginBottom: 16,
          border: '2px solid #a78bfa', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>🔐</span>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700 }}>Auto-Backup Included</p>
              <p style={{ fontSize: 12, color: '#c4b5fd', lineHeight: 1.5 }}>
                One-tap setup. Your data is encrypted and saved directly to your own Google Drive — we never see it, never store it. No more manual exports.
              </p>
            </div>
          </div>
          <button onClick={handleConnectDrive}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#ffffff', color: '#1e293b', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Connect Your Google Drive
          </button>
        </div>
      )}

      {/* 免费用户 - 手动备份 + 升级引导 */}
      {!isProOrPlus && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 10 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>📤 Manual Backup</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
              Export a backup file. You'll need to manually upload it to your cloud or save it somewhere safe.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleExport} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#334155', color: 'white', fontSize: 13, fontWeight: 600 }}>
                Export JSON
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#334155', color: 'white', fontSize: 13, fontWeight: 600 }}>
                Import JSON
              </button>
              <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)',
            padding: 16, borderRadius: 14, border: '2px dashed #7e22ce',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#c4b5fd' }}>
              ⚡ Upgrade for Auto-Backup
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              One-tap Google Drive setup. Your data is encrypted on your own Drive — we never see it. No more manual exports.
            </p>
            <button onClick={() => navigate('/upgrade')}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 15, fontWeight: 700 }}>
              Upgrade to Pro - $9.99/mo
            </button>
          </div>
        </div>
      )}

      {!user.verified && (
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Complete your profile to unlock:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <div><p style={{ fontWeight: 600, fontSize: 14 }}>Auto-fill Waivers</p><p style={{ fontSize: 12, color: '#a5b4fc' }}>Studio name, license, and artist info filled automatically</p></div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>👥</span>
              <div><p style={{ fontWeight: 600, fontSize: 14 }}>Invite Friends, Get Free Pro</p><p style={{ fontSize: 12, color: '#a5b4fc' }}>Each verified artist you invite gives you +1 month of Pro</p></div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <div><p style={{ fontWeight: 600, fontSize: 14 }}>Build Client Trust</p><p style={{ fontSize: 12, color: '#a5b4fc' }}>Clients see your verified badge when booking</p></div>
            </div>
          </div>
          <button onClick={() => navigate('/verification?userId=' + user.id)}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600 }}>
            Upload License (1 min)
          </button>
        </div>
      )}

      {message && (
        <div style={{ background: '#1e293b', padding: 12, borderRadius: 10, marginBottom: 16, border: '1px solid #22c55e' }}>
          <p style={{ fontSize: 13, color: '#34d399' }}>{message}</p>
        </div>
      )}

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Device Info</p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Device ID: {user.deviceId?.slice(0, 16) || 'N/A'}</p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowDevTools(!showDevTools)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px dashed #475569', background: 'transparent', color: '#64748b', fontSize: 13 }}>
          {showDevTools ? 'Hide Dev Tools' : '🛠 Dev Tools'}
        </button>
        {showDevTools && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleSeedData} style={{ padding: 12, borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 14, fontWeight: 600 }}>
              📦 Fill Demo Data
            </button>
            <button onClick={handleResetDB} style={{ padding: 12, borderRadius: 10, border: 'none', background: '#7f1d1d', color: '#fca5a5', fontSize: 14, fontWeight: 600 }}>
              🔥 Reset All Data
            </button>
            {devMessage && <div style={{ padding: 10, borderRadius: 8, background: '#1e293b', marginTop: 4 }}><p style={{ fontSize: 12, color: '#34d399' }}>{devMessage}</p></div>}
          </div>
        )}
      </div>

      <button onClick={handleLogout} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>
        Log Out
      </button>
    </div>
  );
}

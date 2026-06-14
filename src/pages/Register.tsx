import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collectDeviceFingerprint, checkDeviceBinding, checkIPRegistrationLimit, incrementIPRegistrationCount } from '../lib/fingerprint';
import { db, type StudioLocationRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { processReferralOnRegister } from '../lib/referralLogic';
import { hashPassword } from '../lib/auth';
import { getBackendUrl } from '../lib/backendApi';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const upgradePlan = searchParams.get('upgrade') || '';
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<Array<'artist' | 'owner' | 'staff'>>(['artist']);
  const [studioName, setStudioName] = useState('');
  const [studioAddress, setStudioAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const lang = detectInitialLanguage();

  useEffect(() => {
    async function check() {
      const fp = await collectDeviceFingerprint();
      setDeviceId(fp.hash);

      if (localStorage.getItem('inkflow_current_user')) return;

      if (mode === 'register') {
        const bound = await checkDeviceBinding(fp.hash);
        if (bound) {
          setError('This device already has an account. Switch to login.');
          return;
        }
        const ipCheck = checkIPRegistrationLimit();
        if (!ipCheck.allowed) {
          setError('Registration limit reached on this network.');
        }
      }
    }

    check();
  }, [mode, navigate]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    setError('');
    try {
      const pwHash = await hashPassword(password);

      // Try D1 (Cloudflare) first
      const backendUrl = getBackendUrl();
      let loggedInUser: any = null;
      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, passwordHash: pwHash, deviceId }),
          });
          if (res.ok) {
            const data = await res.json();
            loggedInUser = data;
          } else if (res.status === 404) {
            setError('No account found with this email.');
            setSubmitting(false);
            return;
          } else if (res.status === 401) {
            setError('Wrong password.');
            setSubmitting(false);
            return;
          }
          // Other statuses = try local fallback
        } catch {
          // Backend unreachable, fall through to local
        }
      }

      // Fall back to IndexedDB
      if (!loggedInUser) {
        const localUser = await db.users.where('email').equals(email).first();
        if (!localUser) { setError('No account found with this email.'); setSubmitting(false); return; }
        if (localUser.passwordHash && localUser.passwordHash !== pwHash) { setError('Wrong password.'); setSubmitting(false); return; }
        if (!localUser.passwordHash) {
          await db.users.update(localUser.id, { passwordHash: pwHash, deviceId });
        } else {
          await db.users.update(localUser.id, { deviceId });
        }
        localStorage.setItem('inkflow_current_user', localUser.id);
        loggedInUser = localUser;
      } else {
        localStorage.setItem('inkflow_current_user', loggedInUser.userId);
        // Also sync to local IndexedDB so offline works
        const existing = await db.users.where('email').equals(email).first();
        if (!existing) {
          await db.users.add({
            id: loggedInUser.userId,
            email: loggedInUser.email,
            name: loggedInUser.name || '',
            roles: loggedInUser.roles || [],
            passwordHash: pwHash,
            deviceId,
            verified: false,
            createdAt: Date.now(),
          } as any);
        }
      }

      if (upgradePlan === 'pro_plus') {
        await db.users.update(loggedInUser.id || loggedInUser.userId, { plan: 'pro_plus' as any });
        window.location.href = '/pro-plus-setup';
      } else {
        window.location.href = '/today';
      }
    } catch {
      setError('Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !name || !password || !studioName.trim() || roles.length === 0 || submittingRef.current) return;
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    // Check duplicate email
    const existing = await db.users.where('email').equals(email).first();
    if (existing) { setError('Email already registered.'); return; }
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const now = Date.now();
      const userId = 'user_' + now + '_' + Math.random().toString(36).slice(2, 8);
      const passwordHash = await hashPassword(password);
      await db.users.add({
        id: userId,
        email,
        name,
        roles,
        passwordHash,
        deviceId,
        verified: false,
        createdAt: now,
      });
      localStorage.setItem('inkflow_current_user', userId);
      incrementIPRegistrationCount();

      // Sync to Cloudflare D1 (unconditional — all registrations go to cloud)
      try {
        const backendUrl = getBackendUrl();
        if (backendUrl) {
          await fetch(`${backendUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, passwordHash, studioName, roles, deviceId }),
          });
        }
      } catch {
        // Cloud sync is best-effort during registration
      }

      if (refCode) {
        await processReferralOnRegister(userId, refCode);
      }

      const backendUrl = localStorage.getItem('inkflow_backend_url') || 'http://localhost:8787';
      const apiSecret = localStorage.getItem('inkflow_api_secret') || '';
      if (roles.includes('artist')) {
        try {
          await fetch(`${backendUrl}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
            body: JSON.stringify({
              artistId: userId,
              settings: {
                name,
                email,
                createdAt: now,
              },
            }),
          });
        } catch { /* silent */ }
      }

      // Auto-join existing studio if name+address match
      let assignedLocationIds: string[] | undefined;
      if (studioName.trim()) {
        const allLocs = await db.studioLocations.toArray();
        const match = allLocs.find(l =>
          l.name.toLowerCase() === studioName.trim().toLowerCase() &&
          (!studioAddress.trim() || l.address?.toLowerCase() === studioAddress.trim().toLowerCase())
        );
        if (match) {
          assignedLocationIds = [match.id];
        } else if (roles.includes('owner')) {
          const locId = 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
          const newLoc: StudioLocationRecord = {
            id: locId, ownerId: userId, name: studioName.trim(),
            address: studioAddress.trim() || undefined,
            createdAt: Date.now(),
          };
          await db.studioLocations.add(newLoc);
          assignedLocationIds = [locId];
        }
      }
      if (assignedLocationIds || studioName.trim()) {
        await db.users.update(userId, {
          ...(assignedLocationIds ? { assignedLocationIds } : {}),
          studioName: studioName.trim() || undefined,
        });
      }

      // Force full reload so App reads fresh auth state
      if (upgradePlan === 'pro_plus') {
        await db.users.update(userId, { plan: 'pro_plus' });
        window.location.href = '/pro-plus-setup';
      } else {
        window.location.href = '/today?welcome=1';
      }
    } catch {
      setError('Registration failed.');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>
        {mode === 'register' ? 'Register InkFlow' : t(lang, 'login')}
      </h2>

      {refCode && mode === 'register' && (
        <div style={{ background: '#14532d', padding: 10, borderRadius: 10, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#86efac' }}>
            You were invited. Both accounts receive free Pro time after verification.
          </p>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
        Device ID: {deviceId || 'Collecting...'}
      </p>

      {error && (
        <div style={{ background: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 16 }}>
          <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>
        </div>
      )}

      {mode === 'register' && (
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      )}

      <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />

      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />

      {mode === 'register' && (
        <input placeholder="Confirm password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
      )}

      {mode === 'register' && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>What's your role? (select all that apply)</p>
          {([
            { value: 'artist' as const, title: 'I\'m a Tattoo Artist', desc: 'I tattoo clients — manage my appointments, sessions, portfolio, and invoices.', color: '#e11d48' },
            { value: 'owner' as const, title: 'I Own a Studio', desc: 'I run the business — manage locations, artists, finances, and see all bookings.', color: '#7e22ce' },
            { value: 'staff' as const, title: 'I\'m Staff / Front Desk', desc: 'I support the studio — check-ins, inventory, POS, and scheduling.', color: '#2563eb' },
          ]).map(item => {
            const checked = roles.includes(item.value);
            return (
              <button
                key={item.value}
                onClick={() => setRoles(prev => checked ? prev.filter(r => r !== item.value) : [...prev, item.value])}
                style={{
                  width: '100%', padding: '14px 16px', marginBottom: 8, borderRadius: 12,
                  border: checked ? `2px solid ${item.color}` : '2px solid #334155',
                  background: checked ? `${item.color}15` : '#1e293b',
                  color: 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: checked ? `2px solid ${item.color}` : '2px solid #475569',
                  background: checked ? item.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                }}>
                  {checked ? '✓' : ''}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              </button>
            );
          })}
          {roles.length === 0 && (
            <p style={{ fontSize: 11, color: '#fca5a5' }}>Select at least one role.</p>
          )}
        </div>
      )}

      {mode === 'register' && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Studio <span style={{ color: '#ef4444' }}>*</span></p>
          <input placeholder="Studio name *" value={studioName} onChange={e => setStudioName(e.target.value)} style={inputStyle} />
          <input placeholder="Studio address (city, country) *" value={studioAddress} onChange={e => setStudioAddress(e.target.value)} style={inputStyle} />
        </div>
      )}

      <button
        onClick={mode === 'register' ? handleRegister : handleLogin}
        disabled={submitting || !email || !password || (mode === 'register' && (!name || !studioName.trim() || !confirmPassword || roles.length === 0))}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 12,
          border: 'none',
          background: (!email || !password || (mode === 'register' && (!name || !studioName.trim() || !confirmPassword || roles.length === 0))) ? '#4b5563' : '#e11d48',
          color: 'white',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {submitting ? t(lang, 'processing') : mode === 'register' ? t(lang, 'register') : t(lang, 'login')}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#94a3b8' }}>
        {mode === 'register' ? (
          <>Already have an account? <span onClick={() => { setMode('login'); setError(''); }} style={{ color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer' }}>Login</span></>
        ) : (
          <>No account? <span onClick={() => { setMode('register'); setError(''); }} style={{ color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer' }}>Register</span></>
        )}
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  marginBottom: 12,
  borderRadius: 12,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
};

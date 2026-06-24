import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collectDeviceFingerprint, checkDeviceBinding, checkIPRegistrationLimit, incrementIPRegistrationCount } from '../lib/fingerprint';
import { db, type StudioLocationRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { hashPassword } from '../lib/auth';
import { getBackendUrl } from '../lib/backendApi';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const upgradePlan = searchParams.get('upgrade') || '';
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [deviceId, setDeviceId] = useState('');

  // 从 URL 参数读取 ?type=website&plan=website_basic
  useEffect(() => {
    const type = searchParams.get('type');
    const plan = searchParams.get('plan');
    if (type === 'website') setRegisterType('website');
    if (plan) setSelectedPlan(plan);
  }, []);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<Array<'artist' | 'owner' | 'staff'>>(['artist']);
  const [studioName, setStudioName] = useState('');
  const [studioAddress, setStudioAddress] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [registerType, setRegisterType] = useState<'app' | 'website'>('app');
  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const navigatedRef = useRef(false);  /* prevent button flash on redirect */
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
        localStorage.setItem('inkflow_current_user_data', JSON.stringify(localUser));
        loggedInUser = localUser;
      } else {
        localStorage.setItem('inkflow_current_user', loggedInUser.userId);
        localStorage.setItem('inkflow_current_user_data', JSON.stringify(loggedInUser));
        // Also sync to local IndexedDB so offline works
        try {
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
        } catch { /* IndexedDB may be unavailable (Safari private) — non-critical */ }
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
    submittingRef.current = true;
    setSubmitting(true);
    setError('');

    /* Timeout: if registration takes >20s, unlock the button so user can retry */
    const timeout = setTimeout(() => {
      if (!navigatedRef.current) {
        setError('Registration is taking longer than expected. You can try again.');
        setSubmitting(false);
        submittingRef.current = false;
      }
    }, 20000);

    try {
      const now = Date.now();
      let userId = 'user_' + now + '_' + Math.random().toString(36).slice(2, 8);
      const passwordHash = await hashPassword(password);

      /* Try server-side registration first (important for Safari where IndexedDB may be blocked) */
      const backendUrl = getBackendUrl();
      let serverOk = false;
      if (backendUrl) {
        try {
          const serverRes = await fetch(`${backendUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, passwordHash, studioName, roles, deviceId, plan: selectedPlan, registerType, siteTemplate: registerType === 'website' ? selectedTheme : undefined }),
          });
          if (serverRes.ok) {
            serverOk = true;
            const data = await serverRes.json();
            /* Use server-assigned userId if returned */
            if (data?.userId) userId = data.userId;
          }
        } catch { /* server unreachable, fall through to local */ }
      }

      /* Use server-recommended userId if available */
      if (serverOk) {
        localStorage.setItem('inkflow_current_user', userId);
        try {
          localStorage.setItem('inkflow_current_user_data', JSON.stringify({
            id: userId, email, name, roles, plan: selectedPlan, registerType,
            siteTheme: selectedTheme, studioName: studioName.trim() || '', createdAt: now,
          }));
        } catch { /* ok */ }
      }

      /* 🚀 REDIRECT FIRST — before any IndexedDB ops (Safari may hang on IndexedDB) */
      clearTimeout(timeout);
      navigatedRef.current = true;
      const targetUrl = registerType === 'website' ? '/website-wizard?welcome=1' : (upgradePlan === 'pro_plus' ? '/pro-plus-setup' : '/today?welcome=1');
      window.location.href = targetUrl;
    } catch (err) {
      clearTimeout(timeout);
      setError('Registration failed. Please try again.');
      setSubmitting(false);
      submittingRef.current = false;
    }
    /* On success try block ends with window.location.href — no reset needed */
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

      {mode === 'register' && (
        <>
        {/* Product type toggle: App vs Website Only */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>I want</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={() => setRegisterType('app')} style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
              border: `2px solid ${registerType === 'app' ? '#6366f1' : '#334155'}`,
              background: registerType === 'app' ? '#6366f115' : '#1e293b',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#f0f0f0' }}>Studio App</p>
              <p style={{ fontSize: 9, color: '#94a3b8' }}>Booking, CRM, payments</p>
            </div>
            <div onClick={() => setRegisterType('website')} style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
              border: `2px solid ${registerType === 'website' ? '#6366f1' : '#334155'}`,
              background: registerType === 'website' ? '#6366f115' : '#1e293b',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#f0f0f0' }}>Website Only</p>
              <p style={{ fontSize: 9, color: '#94a3b8' }}>Tattoo shop landing page</p>
            </div>
          </div>
        </div>

        {/* App plans */}
        {registerType === 'app' && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Choose your plan</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'free', name: 'Free', price: '$0', color: '#64748b', desc: 'Basic app tools, local-only' },
                { id: 'starter', name: 'Starter', price: '$9.99/mo', color: '#6366f1', desc: 'Full app + 1 website page' },
                { id: 'pro', name: 'Pro', price: '$29.99/mo', color: '#2563eb', desc: 'Up to 5 artists + website', popular: true },
                { id: 'plus', name: 'Plus', price: '$49.99/mo', color: '#a855f7', desc: 'Unlimited everything' },
              ].map(p => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div key={p.id} onClick={() => setSelectedPlan(p.id)}
                    style={{
                      flex: '1 1 110px', padding: 10, borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${isSelected ? p.color : '#334155'}`,
                      background: isSelected ? `${p.color}15` : '#1e293b',
                      position: 'relative', textAlign: 'center',
                    }}>
                    {p.popular && <div style={{ position: 'absolute', top: -8, right: 6, background: p.color, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>POPULAR</div>}
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#f0f0f0' }}>{p.name}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.price}</p>
                    <p style={{ fontSize: 9, color: '#94a3b8' }}>{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Website Only plans */}
        {registerType === 'website' && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Choose website plan</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'website_basic', name: 'Website Basic', price: '$9.99/yr', color: '#64748b', desc: 'Single page, free templates' },
                { id: 'website_pro', name: 'Website Pro', price: '$19.99/yr', color: '#a855f7', desc: 'Multi-page, all 41 templates', popular: true },
              ].map(p => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div key={p.id} onClick={() => setSelectedPlan(p.id)}
                    style={{
                      flex: 1, padding: 10, borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${isSelected ? p.color : '#334155'}`,
                      background: isSelected ? `${p.color}15` : '#1e293b',
                      position: 'relative', textAlign: 'center',
                    }}>
                    {p.popular && <div style={{ position: 'absolute', top: -8, right: 6, background: p.color, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>POPULAR</div>}
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#f0f0f0' }}>{p.name}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.price}</p>
                    <p style={{ fontSize: 9, color: '#94a3b8' }}>{p.desc}</p>
                  </div>
                );
              })}
            </div>
            {/* Namecheap domain recommendation */}
            <div style={{ background: '#1e2a4a', borderRadius: 8, padding: 10, marginTop: 8, border: '1px solid #2563eb44' }}>
              <p style={{ fontSize: 11, color: '#93c5fd', margin: 0 }}>
                💡 Need a custom domain? <a href="https://www.namecheap.com/?aff=138601" target="_blank" rel="noopener" style={{ color: '#60a5fa', fontWeight: 600 }}>Search Namecheap</a> — domains from $5.98/yr.
              </p>
            </div>
          </div>
        )}
        </>
      )}

      {mode === 'register' && registerType === 'website' ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.open('https://ink-flows.com/pricing', '_blank')}
            style={{
              flex: 1, padding: 14, borderRadius: 12, border: '2px solid #6366f1',
              background: '#6366f115', color: '#a5b4fc', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            👁️ 查看模板
          </button>
          <button
            onClick={handleRegister}
            disabled={submitting || !email || !password || !name || !studioName.trim() || !confirmPassword || roles.length === 0}
            style={{
              flex: 2, padding: 14, borderRadius: 12, border: 'none',
              background: (!email || !password || !name || !studioName.trim() || !confirmPassword || roles.length === 0) ? '#4b5563' : '#e11d48',
              color: 'white', fontSize: 15, fontWeight: 600, cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? '注册中...' : '注册并建站 →'}
          </button>
        </div>
      ) : (
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
      )}

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

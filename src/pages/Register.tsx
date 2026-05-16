import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collectDeviceFingerprint, checkDeviceBinding, checkIPRegistrationLimit, incrementIPRegistrationCount } from '../lib/fingerprint';
import { db } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { processReferralOnRegister } from '../lib/referralLogic';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<Array<'artist' | 'owner' | 'staff'>>(['artist']);
  const [submitting, setSubmitting] = useState(false);
  const lang = detectInitialLanguage();

  useEffect(() => {
    async function check() {
      const fp = await collectDeviceFingerprint();
      setDeviceId(fp.hash);

      if (mode === 'login') {
        const boundUser = await checkDeviceBinding(fp.hash);
        if (boundUser) {
          localStorage.setItem('inkflow_current_user', boundUser);
          navigate('/today', { replace: true });
          return;
        }
      }

      if (mode === 'register') {
        const bound = await checkDeviceBinding(fp.hash);
        if (bound) {
          setError('This device is already registered. Switch to login.');
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
    if (!email) return;
    setSubmitting(true);
    try {
      const user = await db.users.where('email').equals(email).first();
      if (user) {
        await db.users.update(user.id, { deviceId });
        localStorage.setItem('inkflow_current_user', user.id);
        navigate('/today', { replace: true });
      } else {
        setError('No account found with this email.');
      }
    } catch {
      setError('Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !name || roles.length === 0) return;
    setSubmitting(true);
    try {
      const now = Date.now();
      const userId = 'user_' + now + '_' + Math.random().toString(36).slice(2, 8);
      await db.users.add({
        id: userId,
        email,
        name,
        roles,
        deviceId,
        verified: false,
        createdAt: now,
      });
      localStorage.setItem('inkflow_current_user', userId);
      incrementIPRegistrationCount();

      if (refCode) {
        await processReferralOnRegister(userId, refCode);
      }

      navigate('/today?welcome=1', { replace: true });
    } catch {
      setError('Registration failed.');
    } finally {
      setSubmitting(false);
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

      <button
        onClick={mode === 'register' ? handleRegister : handleLogin}
        disabled={submitting || !email || (mode === 'register' && (!name || roles.length === 0))}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 12,
          border: 'none',
          background: (!email || (mode === 'register' && (!name || roles.length === 0))) ? '#4b5563' : '#e11d48',
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


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectDeviceFingerprint, checkDeviceBinding, checkIPRegistrationLimit, incrementIPRegistrationCount } from '../lib/fingerprint';
import { db } from '../db';

export default function Register() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'artist' | 'owner' | 'staff' | 'pro' | 'plus'>('artist');
  const [submitting, setSubmitting] = useState(false);

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
        if (bound) { setError('This device is already registered. Switch to login.'); return; }
        const ipCheck = checkIPRegistrationLimit();
        if (!ipCheck.allowed) { setError('Registration limit reached on this network'); }
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
      } else { setError('No account found with this email'); }
    } catch { setError('Login failed'); }
    finally { setSubmitting(false); }
  };

  const handleRegister = async () => {
    if (!email || !name) return;
    setSubmitting(true);
    try {
      const now = Date.now();
      const userId = 'user_' + now + '_' + Math.random().toString(36).slice(2, 8);
      await db.users.add({ id: userId, email, name, role, deviceId, verified: false, createdAt: now });
      localStorage.setItem('inkflow_current_user', userId);
      incrementIPRegistrationCount();
      navigate('/today?welcome=1', { replace: true });
    } catch { setError('Registration failed'); }
    finally { setSubmitting(false); }
  };

  if (error && mode === 'register' && error.includes('already registered')) {
    return (
      <div style={{ padding: 24, color: 'white' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Device Already Registered</h2>
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}><p style={{ color: '#94a3b8' }}>{error}</p></div>
        <button onClick={() => { setError(''); setMode('login'); }} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>Switch to Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>{mode === 'register' ? 'Register InkFlow' : 'Login'}</h2>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Device ID: {deviceId || 'Collecting...'}</p>
      {error && <div style={{ background: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 16 }}><p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p></div>}
      {mode === 'register' && <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />}
      <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      {mode === 'register' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, color: '#94a3b8' }}>Role</label>
          <select value={role} onChange={e => setRole(e.target.value as any)} style={{ ...inputStyle, marginTop: 4 }}>
            <option value="artist">Artist (Free)</option>
            <option value="pro">Pro - $9.99/mo</option>
            <option value="plus">Plus - $19.99/mo</option>
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      )}
      <button onClick={mode === 'register' ? handleRegister : handleLogin} disabled={submitting || !email || (mode === 'register' && !name)}
        style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: (!email || (mode === 'register' && !name)) ? '#4b5563' : '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>
        {submitting ? 'Processing...' : mode === 'register' ? 'Register' : 'Login'}
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
  width: '100%', padding: '12px 16px', marginBottom: 12,
  borderRadius: 12, border: '1px solid #334155', background: '#1e293b',
  color: 'white', fontSize: 16, outline: 'none', boxSizing: 'border-box',
};

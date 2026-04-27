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
  const [role, setRole] = useState<'artist'|'owner'|'staff'>('artist');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function check() {
      const fp = await collectDeviceFingerprint();
      setDeviceId(fp.hash);
      
      // 登录模式：检查设备是否已绑定
      if (mode === 'login') {
        const boundUser = await checkDeviceBinding(fp.hash);
        if (boundUser) {
          // 设备已绑定，直接登录
          localStorage.setItem('inkflow_current_user', boundUser);
          navigate('/today', { replace: true });
          return;
        }
      }
      
      // 注册模式：检查设备和 IP 限制
      if (mode === 'register') {
        const bound = await checkDeviceBinding(fp.hash);
        if (bound) {
          setError('此设备已绑定账号。请切换到"登录"模式。');
          return;
        }
        const ipCheck = checkIPRegistrationLimit();
        if (!ipCheck.allowed) {
          setError('此网络注册已达上限（5个账号）');
        }
      }
    }
    check();
  }, [mode, navigate]);

  // 登录：通过邮箱查找用户
  const handleLogin = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      const user = await db.users.where('email').equals(email).first();
      if (user) {
        // 更新设备绑定
        await db.users.update(user.id, { deviceId });
        localStorage.setItem('inkflow_current_user', user.id);
        navigate('/today', { replace: true });
      } else {
        setError('未找到该邮箱的账号，请先注册');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 注册
  const handleRegister = async () => {
    if (!email || !name) return;
    setSubmitting(true);
    try {
      const now = Date.now();
      const userId = `user_${now}_${Math.random().toString(36).slice(2, 8)}`;
      await db.users.add({
        id: userId,
        email,
        name,
        role,
        deviceId,
        verified: false,
        createdAt: now,
      });
      localStorage.setItem('inkflow_current_user', userId);
      incrementIPRegistrationCount();
      navigate('/today?welcome=1', { replace: true });
    } catch {
      setError('注册失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && mode === 'register' && error.includes('已绑定账号')) {
    // 设备已绑定，引导登录
    return (
      <div style={{ padding: 24, color: 'white' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>此设备已绑定账号</h2>
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <p style={{ color: '#94a3b8' }}>{error}</p>
        </div>
        <button
          onClick={() => { setError(''); setMode('login'); }}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}
        >
          切换到登录
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>
        {mode === 'register' ? '注册 InkFlow' : '登录 InkFlow'}
      </h2>
      
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>设备 ID: {deviceId || '采集中...'}</p>
      
      {error && (
        <div style={{ background: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 16 }}>
          <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>
        </div>
      )}

      {mode === 'register' && (
        <input placeholder="名字" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      )}
      
      <input placeholder="邮箱" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      
      {mode === 'register' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, color: '#94a3b8' }}>身份</label>
          <select value={role} onChange={e => setRole(e.target.value as any)} style={{ ...inputStyle, marginTop: 4 }}>
            <option value="artist">纹身师 (Artist)</option>
            <option value="owner">店主 (Owner)</option>
            <option value="staff">前台 (Staff)</option>
          </select>
        </div>
      )}

      <button
        onClick={mode === 'register' ? handleRegister : handleLogin}
        disabled={submitting || !email || (mode === 'register' && !name)}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none',
          background: (!email || (mode === 'register' && !name)) ? '#4b5563' : '#e11d48',
          color: 'white', fontSize: 16, fontWeight: 600,
        }}
      >
        {submitting ? '处理中...' : mode === 'register' ? '注册' : '登录'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#94a3b8' }}>
        {mode === 'register' ? (
          <>已有账号？{' '}
            <span
              onClick={() => { setMode('login'); setError(''); }}
              style={{ color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer' }}
            >
              去登录
            </span>
          </>
        ) : (
          <>没有账号？{' '}
            <span
              onClick={() => { setMode('register'); setError(''); }}
              style={{ color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer' }}
            >
              去注册
            </span>
          </>
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

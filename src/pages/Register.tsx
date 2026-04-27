import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectDeviceFingerprint, checkDeviceBinding, checkIPRegistrationLimit, incrementIPRegistrationCount } from '../lib/fingerprint';
import { db } from '../db';

export default function Register() {
  const navigate = useNavigate();
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
      const bound = await checkDeviceBinding(fp.hash);
      if (bound) {
        setError('此设备已绑定账号，请直接登录');
        return;
      }
      const ipCheck = checkIPRegistrationLimit();
      if (!ipCheck.allowed) {
        setError('此网络注册已达上限');
      }
    }
    check();
  }, []);

  const handleRegister = async () => {
    if (!email || !name) return;
    setSubmitting(true);
    try {
      const now = Date.now();
      const userId = `user_${now}_${Math.random().toString(36).slice(2,8)}`;
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
    } catch (e) {
      setError('注册失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: 24, color: 'white' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>无法注册</h2>
        <div style={{ background: '#7f1d1d', padding: 16, borderRadius: 12, marginBottom: 16 }}>{error}</div>
        <button onClick={() => navigate('/today')} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>返回首页</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>注册 InkFlow</h2>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>设备 ID: {deviceId || '采集中...'}</p>
      <input placeholder="名字" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px 16px', marginBottom: 12, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 16, outline: 'none' }} />
      <input placeholder="邮箱" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 16px', marginBottom: 12, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 16, outline: 'none' }} />
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 14, color: '#94a3b8' }}>身份</label>
        <select value={role} onChange={e => setRole(e.target.value as any)} style={{ width: '100%', padding: '12px 16px', marginTop: 4, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 16, outline: 'none' }}>
          <option value="artist">纹身师 (Artist)</option>
          <option value="owner">店主 (Owner)</option>
          <option value="staff">前台 (Staff)</option>
        </select>
      </div>
      <button onClick={handleRegister} disabled={submitting || !email || !name} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: (!email||!name) ? '#4b5563' : '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>{submitting ? '注册中...' : '注册'}</button>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>已有账号？<span onClick={() => navigate('/today')} style={{ color: '#e11d48', cursor: 'pointer' }}>去登录</span></p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';

export default function Today() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) {
      navigate('/register');
      return;
    }
    db.users.get(stored).then(u => {
      if (u) setUser(u);
      else navigate('/register');
    });
  }, [navigate]);

  if (!user) {
    return (
      <div style={{ padding: 24, color: 'white' }}>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>你好, {user.name}</h2>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
        {user.verified ? '✅ 已认证' : '⚠️ 未认证'} · {user.role === 'artist' ? '纹身师' : user.role === 'owner' ? '店主' : '前台'}
      </p>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>今日预约</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>暂无预约</p>
      </div>
      {!user.verified && (
        <button onClick={() => navigate('/verification?userId=' + user.id)} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>
          完成认证，解锁全部功能
        </button>
      )}
    </div>
  );
}

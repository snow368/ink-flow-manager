import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';

export default function Me() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) db.users.get(stored).then(u => setUser(u || null));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('inkflow_current_user');
    navigate('/register');
  };

  if (!user) return <div style={{ padding: 24, color: 'white' }}>请先登录</div>;

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>我的</h2>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>{user.name}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>{user.email}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>身份：{user.role === 'artist' ? '纹身师' : user.role === 'owner' ? '店主' : '前台'}</p>
      </div>
      <div style={{ background: user.verified ? '#14532d' : '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{user.verified ? '✅ 已认证' : '⚠️ 未认证'}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>
          {user.verified ? '认证方式：' + (user.verificationType === 'social' ? 'Instagram 快速验证' : user.verificationType === 'shop' ? '店铺/作品认证' : '参赛认证') : '完成认证解锁邀请奖励和Pro功能'}
        </p>
        {!user.verified && (
          <button onClick={() => navigate('/verification?userId=' + user.id)} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600 }}>去认证</button>
        )}
      </div>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>设备信息</p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>设备ID: {user.deviceId?.slice(0,16) || '无'}</p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>注册时间: {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
      <button onClick={handleLogout} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>退出登录</button>
    </div>
  );
}

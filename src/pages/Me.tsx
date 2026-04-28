import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';

export default function Me() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [studioName, setStudioName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(u => {
        setUser(u || null);
        setStudioName(u?.studioName || '');
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

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Please log in</div>;

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Me</h2>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>{user.name}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>{user.email}</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>
          Role: {user.role === 'artist' ? 'Artist' : user.role === 'owner' ? 'Owner' : 'Staff'}
        </p>
      </div>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Studio Name</p>
        {editing ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={studioName}
              onChange={e => setStudioName(e.target.value)}
              placeholder="Your studio or brand name"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14 }}
            />
            <button onClick={handleSaveStudioName} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 14 }}>Save</button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>{user.studioName || 'Not set'}</p>
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14 }}>Edit</button>
          </div>
        )}
      </div>

      {!user.verified ? (
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Complete your profile to unlock:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>Auto-fill Waivers</p>
                <p style={{ fontSize: 12, color: '#a5b4fc' }}>Studio name, license, and artist info filled automatically on every legal form</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>👥</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>Invite Friends, Get Free Pro</p>
                <p style={{ fontSize: 12, color: '#a5b4fc' }}>Each verified artist you invite gives you +1 month of Pro for free</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>Build Client Trust</p>
                <p style={{ fontSize: 12, color: '#a5b4fc' }}>Clients see your verified badge when booking — more trust, more bookings</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/verification?userId=' + user.id)}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600 }}
          >
            Upload License (1 min)
          </button>
        </div>
      ) : (
        <div style={{ background: '#14532d', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>✅ Verified Artist</p>
          <p style={{ fontSize: 14, color: '#86efac' }}>Waivers auto-fill · Invites unlocked · Trust badge active</p>
        </div>
      )}

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Device Info</p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Device ID: {user.deviceId?.slice(0, 16) || 'N/A'}</p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>

      <button onClick={handleLogout} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>
        Log Out
      </button>
    </div>
  );
}

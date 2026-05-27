import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { UserRecord, StaffPermission } from '../db';
import { can, STAFF_PERMISSION_LABELS } from '../lib/staffPermissions';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';
import { canAccess } from '../lib/planAccess';
import { hashPassword } from '../lib/auth';

export default function StaffManagementPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [staff, setStaff] = useState<UserRecord[]>([]);
  const [artists, setArtists] = useState<UserRecord[]>([]);
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) { navigate('/register'); return; }
    db.users.get(uid).then(u => {
      if (!u || !canAccess(u, 'staff_management')) { navigate('/me'); return; }
      db.users.toArray().then(all => {
        setStaff(all.filter(u => u.roles?.includes('staff')));
        setArtists(all.filter(u => u.roles?.includes('artist')));
      });
    });
  }, []);

  const toggleRole = async (userId: string, role: 'artist' | 'staff') => {
    const u = staff.find(s => s.id === userId) || artists.find(a => a.id === userId);
    if (!u) return;
    const roles = u.roles || [];
    const updated = roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role];
    await db.users.update(userId, { roles: updated.length > 0 ? updated : undefined });
    setMessage(`Updated roles for ${u.name}`);
    setTimeout(() => setMessage(''), 2000);
    // Refresh
    const all = await db.users.toArray();
    setStaff(all.filter(u => u.roles?.includes('staff')));
    setArtists(all.filter(u => u.roles?.includes('artist')));
  };

  const togglePermission = async (userId: string, perm: StaffPermission) => {
    const u = staff.find(s => s.id === userId);
    if (!u) return;
    const perms = u.permissions || [];
    const updated = perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
    await db.users.update(userId, { permissions: updated.length > 0 ? updated : undefined });
    const all = await db.users.toArray();
    setStaff(all.filter(u => u.roles?.includes('staff')));
  };

  const resetAddForm = () => { setShowAdd(false); setNewName(''); setNewEmail(''); setNewPassword(''); };

  const handleAddStaff = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword) return;
    if (newPassword.length < 6) { setMessage('Password must be at least 6 characters.'); return; }
    const existing = await db.users.where('email').equals(newEmail.trim()).first();
    if (existing) { setMessage('Email already in use.'); return; }
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const passwordHash = await hashPassword(newPassword);
    await db.users.add({
      id,
      name: newName.trim(),
      email: newEmail.trim(),
      roles: ['staff'],
      passwordHash,
      verified: true,
      createdAt: Date.now(),
    });
    const all = await db.users.toArray();
    setStaff(all.filter(u => u.roles?.includes('staff')));
    setMessage(`Added ${newName.trim()} as staff.`);
    resetAddForm();
    setTimeout(() => setMessage(''), 3000);
  };

  const permKeys = Object.keys(STAFF_PERMISSION_LABELS) as StaffPermission[];

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 80 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← {t(lang, 'back')}</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>{t(lang, 'staff_management')}</h2>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Staff</button>
      </div>

      {message && <div style={{ padding: 10, borderRadius: 8, background: '#166534', marginBottom: 12, fontSize: 13, color: '#4ade80' }}>{message}</div>}

      {staff.map(u => (
        <div key={u.id} style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{u.name}</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>{u.email}</p>
            </div>
            <button onClick={() => toggleRole(u.id, 'artist')}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #22c55e44', background: 'transparent', color: '#4ade80', fontSize: 11, cursor: 'pointer' }}>
              {u.roles?.includes('artist') ? 'Also Artist' : 'Make Artist'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{t(lang, 'staff_permissions')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {permKeys.map(pk => {
              const enabled = u.permissions?.includes(pk) ?? false;
              const info = STAFF_PERMISSION_LABELS[pk];
              return (
                <button key={pk} onClick={() => togglePermission(u.id, pk)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: enabled ? '#2563eb' : 'transparent', color: enabled ? 'white' : '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                  {info.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {staff.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>No staff members yet</p>
          <p style={{ fontSize: 13 }}>Tap "Add Staff" to create a staff account</p>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360 }}>
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Add Staff Member</p>
            <input placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} autoFocus />
            <input placeholder="Email *" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} />
            <input placeholder="Password * (min 6 chars)" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleAddStaff} disabled={!newName.trim() || !newEmail.trim() || !newPassword}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: (!newName.trim() || !newEmail.trim() || !newPassword) ? '#4b5563' : '#e11d48', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Add
              </button>
              <button onClick={resetAddForm}
                style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: 8,
  borderRadius: 10, border: '1px solid #334155', background: '#0f172a',
  color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

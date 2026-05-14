import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type StudioLocationRecord, type UserRecord } from '../db';
import { getLocationArtistIds } from '../lib/locationLogic';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';

export default function LocationsPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [locations, setLocations] = useState<(StudioLocationRecord & { artistCount?: number })[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerId, setManagerId] = useState('');
  const [artists, setArtists] = useState<UserRecord[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadLocations(u);
      db.users.where('role').anyOf(['artist', 'pro', 'plus', 'staff']).toArray().then(setArtists);
    });
  }, []);

  const loadLocations = async (u: UserRecord) => {
    const locs = u.role === 'owner'
      ? await db.studioLocations.where('ownerId').equals(u.id).toArray()
      : u.assignedLocationIds?.length
        ? await db.studioLocations.where('id').anyOf(u.assignedLocationIds).toArray()
        : [];
    const withCounts = await Promise.all(locs.map(async loc => {
      const ids = await getLocationArtistIds(loc.id);
      return { ...loc, artistCount: ids.length };
    }));
    setLocations(withCounts);
  };

  const resetForm = () => {
    setName(''); setAddress(''); setPhone(''); setManagerId(''); setEditId(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    try {
      if (editId) {
        await db.studioLocations.update(editId, {
          name: name.trim(), address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          managerId: managerId || undefined,
        });
        setMessage('Location updated.');
      } else {
        const id = 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        await db.studioLocations.add({
          id, ownerId: user.id, name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          managerId: managerId || undefined,
          createdAt: Date.now(),
        });
        setMessage('Location created.');
      }
      resetForm();
      loadLocations(user);
    } catch (e: any) { setMessage('Failed: ' + (e?.message || 'unknown')); }
  };

  const handleEdit = (loc: StudioLocationRecord) => {
    setEditId(loc.id);
    setName(loc.name);
    setAddress(loc.address || '');
    setPhone(loc.phone || '');
    setManagerId(loc.managerId || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location? All artists will be unassigned.')) return;
    await db.studioLocations.delete(id);
    if (user) loadLocations(user);
  };

  return (
    <div style={{ padding: 24, color: THEME.text.primary, paddingBottom: 100 }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        {t(lang, 'locations')}
      </h2>

      {message && (
        <div style={{ background: '#14532d', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#86efac' }}>{message}</p>
        </div>
      )}

      {/* Location List */}
      {locations.map(loc => (
        <div key={loc.id} style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{loc.name}</p>
              {loc.address && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{loc.address}</p>}
              {loc.phone && <p style={{ fontSize: 12, color: '#94a3b8' }}>{loc.phone}</p>}
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {loc.artistCount ?? 0} {t(lang, 'artists')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleEdit(loc)} style={editBtn}>Edit</button>
              <button onClick={() => handleDelete(loc.id)} style={{ ...editBtn, color: '#f87171' }}>Del</button>
            </div>
          </div>
        </div>
      ))}

      {locations.length === 0 && (
        <p style={{ color: '#64748b', textAlign: 'center', margin: '32px 0' }}>
          {t(lang, 'no_locations')}
        </p>
      )}

      {/* Add/Edit Form */}
      <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginTop: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
          {editId ? t(lang, 'edit_location') : t(lang, 'add_location')}
        </p>
        <input placeholder={t(lang, 'location_name')} value={name} onChange={e => setName(e.target.value)}
          style={inputStyle} />
        <input placeholder={t(lang, 'location_address')} value={address} onChange={e => setAddress(e.target.value)}
          style={inputStyle} />
        <input placeholder={t(lang, 'location_phone')} value={phone} onChange={e => setPhone(e.target.value)}
          style={inputStyle} />
        <select value={managerId} onChange={e => setManagerId(e.target.value)} style={selectStyle}>
          <option value="">{t(lang, 'select_manager')}</option>
          {artists.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={!name.trim()}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: name.trim() ? '#e11d48' : '#4b5563', color: 'white', fontSize: 14, fontWeight: 600 }}>
            {editId ? t(lang, 'update') : t(lang, 'create')}
          </button>
          {editId && (
            <button onClick={resetForm}
              style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Artist Assignment */}
      {locations.length > 0 && user?.role === 'owner' && (
        <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginTop: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{t(lang, 'assign_artists')}</p>
          {artists.map(artist => (
            <ArtistAssignmentRow key={artist.id} artist={artist} locations={locations}
              onUpdate={() => { db.users.toArray().then(setArtists); loadLocations(user!); }} />
          ))}
        </div>
      )}

      <button onClick={() => navigate('/me')}
        style={{ marginTop: 16, width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>
        ← {t(lang, 'back')}
      </button>
    </div>
  );
}

function ArtistAssignmentRow({ artist, locations, onUpdate }: {
  artist: UserRecord;
  locations: StudioLocationRecord[];
  onUpdate: () => void;
}) {
  const assigned = artist.assignedLocationIds || [];
  const toggle = async (locId: string) => {
    const next = assigned.includes(locId)
      ? assigned.filter(id => id !== locId)
      : [...assigned, locId];
    await db.users.update(artist.id, { assignedLocationIds: next });
    onUpdate();
  };

  return (
    <div style={{ padding: '6px 0', borderBottom: '1px solid #1a2332' }}>
      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{artist.name}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {locations.map(loc => (
          <button key={loc.id} onClick={() => toggle(loc.id)}
            style={{
              padding: '3px 10px', borderRadius: 6, border: '1px solid',
              borderColor: assigned.includes(loc.id) ? '#22c55e' : '#334155',
              background: assigned.includes(loc.id) ? '#14532d' : 'transparent',
              color: assigned.includes(loc.id) ? '#4ade80' : '#64748b',
              fontSize: 11, cursor: 'pointer',
            }}>
            {assigned.includes(loc.id) ? '✓ ' : ''}{loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: 8,
  borderRadius: 10, border: '1px solid #334155', background: '#0f172a',
  color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, marginBottom: 8, appearance: 'auto' };
const editBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, border: '1px solid #334155',
  background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
};

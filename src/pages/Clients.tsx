import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type ClientRecord } from '../db';
import { getCurrentArtistIds } from '../lib/locationLogic';
import { findDuplicates, mergeClients, type DuplicateGroup } from '../lib/clientMerge';

export default function Clients() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'lastVisit' | 'totalSpend'>('createdAt');
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showMerge, setShowMerge] = useState(false);
  const [merging, setMerging] = useState(false);
  const [artistMap, setArtistMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadClients(u);
      // Build artist name map
      db.users.where('roles').anyOf(['artist', 'staff', 'owner']).toArray().then(users => {
        const map: Record<string, string> = {};
        users.forEach(u => { map[u.id] = u.name; });
        setArtistMap(map);
      });
    });
  }, [navigate]);

  async function loadClients(u: UserRecord) {
    const artistIds = await getCurrentArtistIds(u);
    if (u.roles?.includes('artist') && u.artistId) {
      setClients(await db.clients.orderBy('createdAt').reverse().filter(c => c.artistId === u.artistId).toArray());
    } else if (u.roles?.includes('owner') && artistIds.length > 1) {
      setClients(await db.clients.orderBy('createdAt').reverse().filter(c => artistIds.includes(c.artistId || '')).toArray());
    } else {
      setClients(await db.clients.orderBy('createdAt').reverse().toArray());
    }
  }

  const handleFindDuplicates = async () => {
    if (!user) return;
    const artistId = user.artistId || user.id;
    const groups = await findDuplicates(artistId);
    setDuplicateGroups(groups);
    setShowMerge(true);
  };

  const handleMerge = async (keepId: string, mergeIds: string[]) => {
    setMerging(true);
    await mergeClients(keepId, mergeIds);
    if (user) await loadClients(user);
    const artistId = user?.artistId || user?.id || '';
    const groups = await findDuplicates(artistId);
    setDuplicateGroups(groups);
    if (groups.length === 0) setShowMerge(false);
    setMerging(false);
  };

  const filtered = clients
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search));
      const matchTag = !tagFilter || (c.tags || []).includes(tagFilter);
      const matchArtist = !artistFilter || c.artistId === artistFilter || c.assignToArtistId === artistFilter;
      return matchSearch && matchTag && matchArtist;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'lastVisit') return (b.lastVisitAt || 0) - (a.lastVisitAt || 0);
      if (sortBy === 'totalSpend') return (b.totalSpend || 0) - (a.totalSpend || 0);
      return b.createdAt - a.createdAt;
    });

  const TAG_LIST = ['vip', 'new', 'at_risk'];
  const TAG_COLORS: Record<string, string> = { vip: '#fbbf24', new: '#4ade80', at_risk: '#f87171' };

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>Clients</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const text = await file.text();
                  const lines = text.split('\n').filter(l => l.trim());
                  const headers = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim().replace(/"/g, ''));
                  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nombre') || h.includes('nome'));
                  const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('telefono'));
                  const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail') || h.includes('correo'));

                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(/[,;]/).map(c => c.trim().replace(/"/g, ''));
                    if (cols[nameIdx]) {
                      const now = Date.now();
                      const id = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);
                      await db.clients.add({
                        id,
                        name: cols[nameIdx],
                        phone: cols[phoneIdx] || undefined,
                        email: cols[emailIdx] || undefined,
                        createdAt: now,
                      });
                    }
                  }
                  loadClients(user!);
                } catch (err) {
                  console.error('Import failed', err);
                  alert('Import failed. Please check the file format.');
                }
              }
            }}
          />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#334155', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Import
          </button>
          <button onClick={handleFindDuplicates} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#7c3aed', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Find Duplicates
          </button>
          <button onClick={() => navigate('/client/new')} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: '#e11d48', color: 'white', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            +
          </button>
        </div>
      </div>

      <input
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setTagFilter('')}
          style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: !tagFilter ? '#e11d48' : '#334155', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>All</button>
        {TAG_LIST.map(tag => (
          <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: tagFilter === tag ? TAG_COLORS[tag] : '#334155', color: tagFilter === tag ? '#0f172a' : TAG_COLORS[tag], fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {tag}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <select value={artistFilter} onChange={e => setArtistFilter(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 12, outline: 'none' }}>
          <option value="">All Artists</option>
          {Object.entries(artistMap).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 12, outline: 'none' }}>
          <option value="createdAt">Newest</option>
          <option value="name">Name</option>
          <option value="lastVisit">Last Visit</option>
          <option value="totalSpend">Total Spend</option>
        </select>
      </div>

      {showMerge && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#c084fc' }}>
              Duplicate Groups: {duplicateGroups.length}
            </p>
            <button onClick={() => setShowMerge(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 16, cursor: 'pointer' }}>x</button>
          </div>
          {duplicateGroups.length === 0 ? (
            <p style={{ fontSize: 12, color: '#4ade80' }}>No duplicates found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {duplicateGroups.map((group, gi) => (
                <div key={gi} style={{ background: '#1e293b', border: '1px solid #4338ca44', borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 11, color: '#a5b4fc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Match: {group.matchType.replace('_', ' + ')}
                  </p>
                  {group.clients.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                        <p style={{ fontSize: 11, color: '#64748b' }}>
                          {c.phone || 'No phone'} · {c.email || 'No email'} · Created {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button onClick={() => navigate('/client/' + c.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                        View
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleMerge(group.clients[0].id, group.clients.slice(1).map(c => c.id))}
                    disabled={merging}
                    style={{ width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 8, border: 'none', background: merging ? '#4b5563' : '#7c3aed', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {merging ? 'Merging...' : `Keep "${group.clients[0].name}" — Merge ${group.clients.length - 1} into it`}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 4 }}>{clients.length === 0 ? 'No clients yet' : 'No matches'}</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {clients.length === 0 ? 'Add your first client to get started' : 'Try a different search or tag filter'}
            </p>
            {clients.length === 0 && (
              <button onClick={() => navigate('/client/new')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                + Add Client
              </button>
            )}
          </div>
        ) : (
          filtered.map(client => (
          <div key={client.id} onClick={() => navigate('/client/' + client.id)} style={{ background: '#1e293b', borderRadius: 12, padding: 14, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 600 }}>{client.name}</p>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{client.phone || 'No phone'} · {client.email || 'No email'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Last visit: {client.lastVisitAt ? new Date(client.lastVisitAt).toLocaleDateString() : 'Never'}
              </span>
              {client.totalSpend != null && client.totalSpend > 0 && (
                <span style={{ fontSize: 11, color: '#22c55e' }}>
                  Total: ${(client.totalSpend / 100).toFixed(0)}
                </span>
              )}
              {(client.assignToArtistId || client.artistId) && artistMap[client.assignToArtistId || client.artistId || ''] && (
                <span style={{ fontSize: 11, color: '#60a5fa' }}>
                  → {artistMap[client.assignToArtistId || client.artistId || '']}
                </span>
              )}
            </div>
            {(client.tags && client.tags.length > 0) && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {client.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: (TAG_COLORS[tag] || '#64748b') + '33', color: TAG_COLORS[tag] || '#94a3b8', fontWeight: 600 }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {client.allergies && client.allergies.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                {client.allergies.map((a, i) => <span key={i} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#7f1d1d', color: '#fca5a5' }}>{a}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => navigate(`/appointment/new?clientId=${client.id}`)}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#e11d48', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Book</button>
              {client.phone && (
                <button onClick={() => window.open(`https://wa.me/${client.phone!.replace(/\D/g, '')}`, '_blank')}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#075e54', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>WhatsApp</button>
              )}
              <button onClick={() => navigate(`/invoices?clientId=${client.id}`)}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#7e22ce', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Invoice</button>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}

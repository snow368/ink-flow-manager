import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type ClientRecord } from '../db';
import { getCurrentArtistIds } from '../lib/locationLogic';

export default function Clients() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'lastVisit' | 'totalSpend'>('createdAt');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadClients(u);
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

  const filtered = clients
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search));
      const matchTag = !tagFilter || (c.tags || []).includes(tagFilter);
      return matchSearch && matchTag;
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
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#334155', color: 'white', fontSize: 13 }}>
            Import
          </button>
          <button onClick={() => navigate('/client/new')} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#e11d48', color: 'white', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setTagFilter('')}
          style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: !tagFilter ? '#e11d48' : '#334155', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>All</button>
        {TAG_LIST.map(tag => (
          <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
            style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: tagFilter === tag ? TAG_COLORS[tag] : '#334155', color: tagFilter === tag ? '#0f172a' : TAG_COLORS[tag], fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            {tag}
          </button>
        ))}
      </div>

      <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 12, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}>
        <option value="createdAt">Sort: Newest First</option>
        <option value="name">Sort: Name</option>
        <option value="lastVisit">Sort: Last Visit</option>
        <option value="totalSpend">Sort: Total Spend</option>
      </select>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>👤</p>
            <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 4 }}>{clients.length === 0 ? 'No clients yet' : 'No matches'}</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {clients.length === 0 ? 'Add your first client to get started' : 'Try a different search or tag filter'}
            </p>
            {clients.length === 0 && (
              <button onClick={() => navigate('/client/new')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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
                style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#e11d48', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Book</button>
              {client.phone && (
                <button onClick={() => window.open(`https://wa.me/${client.phone!.replace(/\D/g, '')}`, '_blank')}
                  style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#075e54', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>WhatsApp</button>
              )}
              <button onClick={() => navigate(`/invoices?clientId=${client.id}`)}
                style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#7e22ce', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Invoice</button>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}

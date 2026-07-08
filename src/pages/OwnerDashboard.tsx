import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { UserRecord } from '../db';
import { getCurrentArtistIds, getLocationArtistIds } from '../lib/locationLogic';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [artists, setArtists] = useState<{ id: string; name: string; appointments: number; revenue: number; pendingDeposits: number; clients: number }[]>([]);

  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) { navigate('/register'); return; }
    db.users.get(uid).then(async u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      const artistIds = u.roles?.includes('owner')
        ? (await db.users.where('roles').anyOf(['artist']).toArray()).map(x => x.id).concat(u.id)
        : [u.artistId || u.id];

      const today = new Date().toISOString().slice(0, 10);
      const dayStart = new Date(today + 'T00:00:00').getTime();
      const dayEnd = dayStart + 86400000;

      const results = [];
      for (const aid of artistIds) {
        const artistUser = await db.users.get(aid);
        const [appts, posTx, invoices, leads, clients] = await Promise.all([
          db.appointments.where('artistId').equals(aid).toArray(),
          db.posTransactions.filter(tx => tx.createdAt >= dayStart && tx.createdAt < dayEnd && tx.artistId === aid).toArray(),
          db.invoices.filter(inv => inv.createdAt >= dayStart && inv.createdAt < dayEnd && inv.artistId === aid).toArray(),
          db.leads.where('artistId').equals(aid).toArray(),
          db.clients.where('artistId').equals(aid).toArray(),
        ]);

        results.push({
          id: aid,
          name: artistUser?.name || aid.slice(0, 8),
          appointments: appts.filter(a => a.status !== 'cancelled').length,
          revenue: posTx.reduce((s, t) => s + t.total, 0) + invoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.total, 0),
          pendingDeposits: leads.filter(l => l.paymentStatus === 'pending_verify').length,
          clients: clients.length,
        });
      }
      setArtists(results);
    });
  }, []);

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 80 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← {t(lang, 'back')}</button>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'owner_dashboard')}</h2>

      {/* Totals Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 20 }}>
        <div style={{ background: '#1e293b', padding: 12, borderRadius: 12, border: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#64748b' }}>Artists</p>
          <p style={{ fontSize: 24, fontWeight: 700 }}>{artists.length}</p>
        </div>
        <div style={{ background: '#1e293b', padding: 12, borderRadius: 12, border: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#64748b' }}>Today Revenue</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>${artists.reduce((s, a) => s + a.revenue, 0).toFixed(0)}</p>
        </div>
        <div style={{ background: '#1e293b', padding: 12, borderRadius: 12, border: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#64748b' }}>Appointments</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{artists.reduce((s, a) => s + a.appointments, 0)}</p>
        </div>
        <div style={{ background: '#1e293b', padding: 12, borderRadius: 12, border: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#64748b' }}>Pending Deposits</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{artists.reduce((s, a) => s + a.pendingDeposits, 0)}</p>
        </div>
      </div>

      {/* Per-Artist Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {artists.map(artist => (
          <div key={artist.id} style={{ background: '#1e293b', borderRadius: 12, padding: 14, cursor: 'pointer' }}
            onClick={() => navigate(`/analytics?artistId=${artist.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{artist.name}</p>
              <span style={{ fontSize: 11, color: '#64748b' }}>{artist.clients} clients</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div><p style={{ fontSize: 10, color: '#64748b' }}>Appts</p><p style={{ fontSize: 18, fontWeight: 700 }}>{artist.appointments}</p></div>
              <div><p style={{ fontSize: 10, color: '#64748b' }}>Revenue</p><p style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>${artist.revenue.toFixed(0)}</p></div>
              <div><p style={{ fontSize: 10, color: '#64748b' }}>Deposits</p><p style={{ fontSize: 18, fontWeight: 700, color: artist.pendingDeposits > 0 ? '#fbbf24' : '#64748b' }}>{artist.pendingDeposits}</p></div>
            </div>
          </div>
        ))}
        {artists.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>No artists found. Add them in Locations.</p>}
      </div>
    </div>
  );
}

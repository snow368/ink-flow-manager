import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';

interface BioEvent {
  id: string;
  type: 'convention' | 'guest_spot';
  city: string;
  country?: string;
  venue: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

function freshId(): string {
  return 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [events, setEvents] = useState<BioEvent[]>([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);

  // New event form
  const [type, setType] = useState<'convention' | 'guest_spot'>('guest_spot');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    db.users.get(current).then(u => {
      if (!u) return;
      setUser(u);
      const evs = (u as any).bioEvents as BioEvent[] | undefined;
      setEvents(evs || []);
    });
  }, []);

  const saveEvents = async (updated: BioEvent[]) => {
    if (!user) return;
    setEvents(updated);
    await db.users.update(user.id, { bioEvents: updated } as any);

    // Sync to Worker
    const backendUrl = localStorage.getItem('inkflow_backend_url') || 'http://localhost:8787';
    const apiSecret = localStorage.getItem('inkflow_api_secret') || '';
    try {
      const res = await fetch(`${backendUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
        body: JSON.stringify({
          artistId: user.id,
          settings: { ...user, bioEvents: updated },
        }),
      });
      const data = await res.json();
      return data.ok;
    } catch {
      return false;
    }
  };

  const addEvent = async () => {
    if (!city.trim() || !venue.trim() || !startDate || !endDate) {
      setMsg('Fill in City, Venue, Start & End dates');
      setTimeout(() => setMsg(''), 2000);
      return;
    }
    if (endDate < startDate) {
      setMsg('End date must be after start date');
      setTimeout(() => setMsg(''), 2000);
      return;
    }
    const ev: BioEvent = {
      id: freshId(),
      type,
      city: city.trim(),
      country: country.trim() || undefined,
      venue: venue.trim(),
      startDate,
      endDate,
      active: true,
    };
    const updated = [...events, ev];
    const ok = await saveEvents(updated);
    setMsg(ok ? 'Event added & synced' : 'Saved locally (sync failed)');
    setTimeout(() => setMsg(''), 2000);
    // Reset form
    setCity(''); setCountry(''); setVenue(''); setStartDate(''); setEndDate('');
  };

  const updateEvent = async (id: string, patch: Partial<BioEvent>) => {
    const updated = events.map(e => e.id === id ? { ...e, ...patch } : e);
    const ok = await saveEvents(updated);
    setMsg(ok ? 'Updated & synced' : 'Saved locally');
    setTimeout(() => setMsg(''), 2000);
  };

  const deleteEvent = async (id: string) => {
    const updated = events.filter(e => e.id !== id);
    await saveEvents(updated);
  };

  const toggleActive = async (id: string) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    await updateEvent(id, { active: !ev.active });
  };

  const notifyClients = async (event: BioEvent) => {
    if (!user) return;
    setNotifying(true);
    const backendUrl = localStorage.getItem('inkflow_backend_url') || 'http://localhost:8787';
    const apiSecret = localStorage.getItem('inkflow_api_secret') || '';
    try {
      const res = await fetch(`${backendUrl}/api/notify/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
      });
      const data = await res.json();
      if (data.ok) {
        setMsg(`Notified ${data.smsSent || 0} clients via SMS, ${data.emailCount || 0} via email`);
      } else {
        setMsg(data.error || 'Notify failed');
      }
    } catch {
      setMsg('Worker not reachable');
    }
    setNotifying(false);
    setTimeout(() => setMsg(''), 4000);
  };

  const typeLabel = (t: string) => t === 'convention' ? '🎪 Convention' : '✈️ Guest Spot';

  const S: Record<string, React.CSSProperties> = {
    page: { maxWidth: 480, margin: '0 auto', padding: '24px 20px 100px', color: '#fafafa' },
    backBtn: { background: 'none', border: 'none', color: '#818cf8', fontSize: 14, cursor: 'pointer', marginBottom: 20, padding: 0 },
    title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
    subtitle: { fontSize: 12, color: '#71717a', marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    label: { display: 'block', fontSize: 12, color: '#a1a1aa', marginBottom: 4 },
    input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #27272a', background: '#0c0c0e', color: '#fafafa', fontSize: 14, outline: 'none', marginBottom: 10 },
    select: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #27272a', background: '#0c0c0e', color: '#fafafa', fontSize: 14, outline: 'none', marginBottom: 10, appearance: 'none' } as const,
    row: { display: 'flex', gap: 8 },
    halfInput: { flex: 1, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #27272a', background: '#0c0c0e', color: '#fafafa', fontSize: 14, outline: 'none', marginBottom: 10 },
    addBtn: { width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#6366f1', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
    msg: { textAlign: 'center', fontSize: 12, color: '#4ade80', marginTop: 10, marginBottom: 16 },
    errMsg: { textAlign: 'center', fontSize: 12, color: '#f87171', marginTop: 10, marginBottom: 16 },
    eventCard: { padding: 14, background: '#18181b', borderRadius: 12, border: '1.5px solid #27272a', marginBottom: 10 },
    eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    eventType: { fontSize: 13, fontWeight: 600, color: '#e4e4e7' },
    eventMeta: { fontSize: 12, color: '#a1a1aa', marginTop: 2 },
    eventDates: { fontSize: 11, color: '#52525b', marginTop: 4 },
    eventActions: { display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' },
    notifyBtn: { padding: '5px 12px', borderRadius: 6, border: '1px solid #f59e0b40', background: '#f59e0b10', color: '#fbbf24', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
    deleteBtn: { padding: '5px 10px', borderRadius: 6, border: 'none', background: '#ef444410', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' },
    empty: { textAlign: 'center', color: '#52525b', fontSize: 13, padding: 40 },
  };

  return (
    <div style={S.page}>
      <button style={S.backBtn} onClick={() => navigate('/me')}>← Back</button>
      <h1 style={S.title}>Events & Guest Spots</h1>
      <p style={S.subtitle}>Conventions and guest spots appear as a banner on your public bio page. Clients can book while you're in their city.</p>

      {/* ── Existing Events ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Your Events ({events.length})</div>
        {events.length === 0 && <div style={S.empty}>No events yet. Add one below.</div>}
        {events.map(ev => (
          <div key={ev.id} style={S.eventCard}>
            <div style={S.eventHeader}>
              <div>
                <div style={S.eventType}>{typeLabel(ev.type)}</div>
                <div style={S.eventMeta}>{ev.city}{ev.country ? `, ${ev.country}` : ''} · {ev.venue}</div>
                <div style={S.eventDates}>{ev.startDate} → {ev.endDate}</div>
              </div>
              <button style={{
                padding: '5px 10px', borderRadius: 6, border: 'none',
                background: ev.active ? '#22c55e20' : '#27272a',
                color: ev.active ? '#4ade80' : '#52525b',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }} onClick={() => toggleActive(ev.id)}>
                {ev.active ? 'Live' : 'Off'}
              </button>
            </div>
            <div style={S.eventActions}>
              <button style={S.notifyBtn} onClick={() => notifyClients(ev)} disabled={notifying}>
                {notifying ? 'Sending...' : '📢 Notify Clients'}
              </button>
              <button style={S.deleteBtn} onClick={() => deleteEvent(ev.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add New Event ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Add Event</div>

        <label style={S.label}>Type</label>
        <select style={S.select} value={type} onChange={e => setType(e.target.value as any)}>
          <option value="guest_spot">Guest Spot</option>
          <option value="convention">Convention</option>
        </select>

        <label style={S.label}>City *</label>
        <input style={S.input} value={city} onChange={e => setCity(e.target.value)} placeholder="Los Angeles" />

        <label style={S.label}>Country</label>
        <input style={S.input} value={country} onChange={e => setCountry(e.target.value)} placeholder="USA" />

        <label style={S.label}>Venue / Shop Name *</label>
        <input style={S.input} value={venue} onChange={e => setVenue(e.target.value)} placeholder="Black Anchor Tattoo" />

        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Start Date *</label>
            <input style={S.halfInput} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={todayStr()} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>End Date *</label>
            <input style={S.halfInput} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || todayStr()} />
          </div>
        </div>

        <button style={S.addBtn} onClick={addEvent}>Add Event</button>
      </div>

      {msg && <div style={msg.includes('fail') || msg.includes('not reachable') ? S.errMsg : S.msg}>{msg}</div>}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type ClientRecord } from '../db';

export default function AppointmentForm() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState('');
  const [type, setType] = useState('new_tattoo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  const durationPresets = [
    { label: '30min', value: 30 },
    { label: '1hr', value: 60 },
    { label: '1.5hrs', value: 90 },
    { label: '2hrs', value: 120 },
    { label: '3hrs', value: 180 },
  ];

  const datePresets = [
    { label: 'Tomorrow', value: 1 },
    { label: 'Day after', value: 2 },
    { label: '1 week', value: 7 },
    { label: '2 weeks', value: 14 },
    { label: '1 month', value: 30 },
  ];

  const loadClients = () => {
    setLoadingClients(true);
    db.clients.orderBy('createdAt').reverse().toArray()
      .then(list => { setClients(list); if (list.length === 0) setError(''); })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoadingClients(false));
  };

  useEffect(() => { loadClients(); }, []);

  const handleQuickCreateClient = async () => {
    if (!quickName.trim() || creatingClient) return;
    setCreatingClient(true);
    try {
      const now = Date.now();
      const id = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);
      await db.clients.add({ id, name: quickName.trim(), phone: quickPhone.trim() || undefined, createdAt: now });
      setSelectedClient(id);
      setQuickName('');
      setQuickPhone('');
      await loadClients();
    } catch (e: any) { setError('Failed: ' + (e?.message || 'unknown')); }
    finally { setCreatingClient(false); }
  };

  const handleSave = async () => {
    if (!selectedClient) { setError('Please select a client'); return; }
    const finalDuration = customDuration ? parseInt(customDuration, 10) : duration;
    if (!finalDuration || finalDuration < 5) { setError('Duration must be at least 5 minutes'); return; }
    setSaving(true); setError('');
    try {
      const artistId = localStorage.getItem('inkflow_current_user') || 'demo_artist';
      const id = 'appt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      await db.appointments.add({ id, clientId: selectedClient, artistId, date, time, duration: finalDuration, type, status: 'unconfirmed', waiverCompleted: false, createdAt: Date.now() });
      navigate('/today');
    } catch (e: any) { setError('Failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };

  const appointmentTypes = [
    { label: 'New Tattoo', value: 'new_tattoo' },
    { label: 'Touch-Up', value: 'touch_up' },
    { label: 'Consultation', value: 'consultation' },
    { label: 'Cover-Up', value: 'cover_up' },
    { label: 'Removal', value: 'removal' },
    { label: 'Continuation', value: 'continuation' },
  ];

  const showQuickCreate = !loadingClients && clients.length === 0;

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>New Appointment</h2>
      {error && <div style={{ background: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 16 }}><p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p></div>}

      {showQuickCreate ? (
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Quick Add Client</p>
          <input placeholder="Client name" value={quickName} onChange={e => setQuickName(e.target.value)} style={inputStyle} />
          <input placeholder="Phone (optional)" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} style={inputStyle} />
          <button onClick={handleQuickCreateClient} disabled={creatingClient || !quickName.trim()} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: creatingClient || !quickName.trim() ? '#4b5563' : '#e11d48', color: 'white', fontSize: 14, fontWeight: 600 }}>{creatingClient ? 'Adding...' : 'Add Client & Continue'}</button>
          <p onClick={() => navigate('/client/new')} style={{ textAlign: 'center', marginTop: 12, color: '#94a3b8', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>or create a full client profile</p>
        </div>
      ) : (
        <>
          {loadingClients ? <p style={{ color: '#94a3b8' }}>Loading clients...</p> : (
            <select value={selectedClient} onChange={e => { setSelectedClient(e.target.value); setError(''); }} style={selectStyle}>
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {/* 快捷日期按钮 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {datePresets.map(p => (
              <button key={p.value} onClick={() => { const d = new Date(); d.setDate(d.getDate() + p.value); setDate(d.toISOString().slice(0, 10)); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* 日期选择器 - 亮色图标 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: 0, colorScheme: 'dark' }} />
          </div>

          {/* 时间选择器 - 亮色图标 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, marginBottom: 0, colorScheme: 'dark' }} />
          </div>

          {/* 时长选择 */}
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Duration</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {durationPresets.map(p => (
              <button key={p.value} onClick={() => { setDuration(p.value); setCustomDuration(''); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: (duration === p.value && !customDuration) ? '#e11d48' : '#334155', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{p.label}</button>
            ))}
          </div>
          <input type="number" placeholder="Custom minutes" value={customDuration} onChange={e => { setCustomDuration(e.target.value); if (e.target.value) setDuration(0); }} style={{ ...inputStyle, marginBottom: 12 }} />

          {/* 预约类型 */}
          <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>{appointmentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>

          <button onClick={handleSave} disabled={saving || !selectedClient} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: saving || !selectedClient ? '#4b5563' : '#e11d48', color: 'white', fontSize: 16, fontWeight: 600, cursor: saving || !selectedClient ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : 'Create Appointment'}</button>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  borderRadius: 12, border: '1px solid #475569', background: '#1e293b',
  color: 'white', fontSize: 16, outline: 'none', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, marginBottom: 12, appearance: 'auto' };

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';

const DAY_NAMES_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AvailabilitySettingsPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('22:00');
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    db.users.get(current).then(u => {
      if (!u) return;
      setUser(u);
      setStartTime(u.workingHoursStart || '10:00');
      setEndTime(u.workingHoursEnd || '22:00');
      setDaysOff(u.daysOff || []);
      setInstagramHandle(u.instagramHandle || '');
      setWhatsappPhone(u.whatsappPhone || '');
      setRemindersEnabled(u.appointmentRemindersEnabled !== false);
    });
  }, []);

  const toggleDayOff = (day: string) => {
    setDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const save = async () => {
    if (!user) return;
    await db.users.update(user.id, {
      workingHoursStart: startTime,
      workingHoursEnd: endTime,
      daysOff: daysOff.length ? daysOff : undefined,
      instagramHandle: instagramHandle.trim() || undefined,
      whatsappPhone: whatsappPhone.trim() || undefined,
      appointmentRemindersEnabled: remindersEnabled,
    });
    setMsg('Saved.');
    setTimeout(() => setMsg(''), 1500);
  };

  if (!user) return <div style={{ padding: 20, color: 'white' }}>Please log in</div>;

  return (
    <div style={{ padding: 20, color: 'white', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t(lang, 'availability_settings')}</h2>
        <button onClick={() => navigate('/me')} style={backBtn}>Back</button>
      </div>

      <div style={card}>
        <p style={label}>{t(lang, 'working_hours')}</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={input} />
          <span style={{ color: '#94a3b8' }}>to</span>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={input} />
        </div>
      </div>

      <div style={card}>
        <p style={label}>{t(lang, 'days_off')}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DAY_NAMES_EN.map((day, i) => (
            <button
              key={day}
              onClick={() => toggleDayOff(day)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: daysOff.includes(day) ? '2px solid #e11d48' : '1px solid #334155',
                background: daysOff.includes(day) ? '#e11d4822' : '#0f172a',
                color: daysOff.includes(day) ? '#fca5a5' : '#94a3b8',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t(lang, DAY_KEYS[i])}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <p style={label}>{t(lang, 'social_links')}</p>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Shown to clients on your booking page.</p>
        <input
          value={instagramHandle}
          onChange={e => setInstagramHandle(e.target.value)}
          placeholder="@yourstudio"
          style={{ ...input, marginBottom: 8 }}
        />
        <input
          value={whatsappPhone}
          onChange={e => setWhatsappPhone(e.target.value)}
          placeholder="+1 555 123 4567"
          style={input}
        />
      </div>

      <div style={card}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={e => setRemindersEnabled(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontSize: 14, color: '#cbd5e1', fontWeight: 600 }}>{t(lang, 'reminders_enabled')}</span>
        </label>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
          Browser notifications for upcoming appointments (24h and 3h before).
        </p>
      </div>

      <button onClick={save} style={saveBtn}>{t(lang, 'save_availability')}</button>
      {msg && <p style={{ fontSize: 12, color: '#86efac', marginTop: 8 }}>{msg}</p>}
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 12,
  padding: 12,
  marginBottom: 10,
};

const label: React.CSSProperties = {
  fontSize: 13,
  color: '#cbd5e1',
  marginBottom: 8,
  fontWeight: 600,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0f172a',
  color: 'white',
  boxSizing: 'border-box',
  colorScheme: 'dark',
};

const backBtn: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#94a3b8',
  borderRadius: 8,
  padding: '7px 10px',
  cursor: 'pointer',
};

const saveBtn: React.CSSProperties = {
  border: 'none',
  background: '#e11d48',
  color: 'white',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
};

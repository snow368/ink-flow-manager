import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { ShiftRecord, UserRecord } from '../db';
import { createShift, deleteShift, getShiftsForDateRange } from '../lib/shiftLogic';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

export default function ShiftSchedulingPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d;
  });
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [staff, setStaff] = useState<UserRecord[]>([]);
  const [adding, setAdding] = useState<{ staffId: string; date: string } | null>(null);
  const [form, setForm] = useState({ startTime: '09:00', endTime: '17:00', note: '' });
  const [message, setMessage] = useState('');

  const weekDays = getWeekDays(weekStart);

  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) { navigate('/register'); return; }
    const load = async () => {
      const user = await db.users.get(uid);
      if (!user) return;
      const artistIds = user.roles?.includes('owner')
        ? (await db.users.where('artistId').equals(user.id).toArray()).map(u => u.id).concat(user.id)
        : [user.artistId || user.id];
      const allUsers = await db.users.toArray();
      setStaff(allUsers.filter(u => u.roles?.some(r => r === 'artist' || r === 'staff')));
      const s = await getShiftsForDateRange(artistIds, fmt(weekDays[0]), fmt(weekDays[6]));
      setShifts(s);
    };
    load();
  }, [weekStart]);

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });

  const handleAdd = async () => {
    if (!adding) return;
    const r = await createShift({
      artistId: localStorage.getItem('inkflow_current_user') || '',
      staffId: adding.staffId === '_artist' ? undefined : adding.staffId,
      date: adding.date,
      startTime: form.startTime,
      endTime: form.endTime,
      note: form.note || undefined,
    });
    if (r.ok) {
      setShifts(prev => [...prev, {
        id: '_temp',
        artistId: localStorage.getItem('inkflow_current_user') || '',
        staffId: adding.staffId === '_artist' ? undefined : adding.staffId,
        date: adding.date,
        startTime: form.startTime,
        endTime: form.endTime,
        note: form.note || undefined,
        createdAt: Date.now(),
      }]);
      setAdding(null);
      setForm({ startTime: '09:00', endTime: '17:00', note: '' });
    } else {
      setMessage(r.error || 'Failed');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (shiftId: string) => {
    if (!confirm('Remove this shift?')) return;
    await deleteShift(shiftId);
    setShifts(prev => prev.filter(s => s.id !== shiftId));
  };

  const getShiftsForCell = (staffId: string, date: string) =>
    shifts.filter(s => (s.staffId || '_artist') === staffId && s.date === date);

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 80 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← {t(lang, 'back')}</button>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'shift_scheduling')}</h2>

      {message && (
        <div style={{ padding: 10, borderRadius: 8, background: '#7f1d1d', marginBottom: 12, fontSize: 13, color: '#fca5a5' }}>{message}</div>
      )}

      {/* Week nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={prevWeek} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', cursor: 'pointer' }}>← Prev</button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
        </span>
        <button onClick={nextWeek} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', cursor: 'pointer' }}>Next →</button>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, color: '#94a3b8', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }}>Staff</th>
              {weekDays.map(d => (
                <th key={d.toISOString()} style={{ padding: 8, color: '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'center', minWidth: 100 }}>
                  {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(u => (
              <tr key={u.id}>
                <td style={{ padding: 8, borderBottom: '1px solid #1e293b', color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: 600 }}>{u.name}</td>
                {weekDays.map(d => {
                  const dateStr = fmt(d);
                  const cellShifts = getShiftsForCell(u.id, dateStr);
                  const isAdding = adding?.staffId === u.id && adding?.date === dateStr;
                  return (
                    <td key={dateStr} style={{ padding: 4, borderBottom: '1px solid #1e293b', verticalAlign: 'top', minWidth: 100 }}>
                      {cellShifts.map(s => (
                        <div key={s.id} onClick={() => handleDelete(s.id)}
                          style={{ background: '#312e81', borderRadius: 4, padding: '2px 6px', marginBottom: 2, fontSize: 10, color: '#a5b4fc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{s.startTime}-{s.endTime}</span>
                          <span style={{ color: '#f87171' }}>×</span>
                        </div>
                      ))}
                      {isAdding ? (
                        <div style={{ marginTop: 4 }}>
                          <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                            style={{ width: '100%', padding: 2, borderRadius: 4, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 10, marginBottom: 2 }} />
                          <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                            style={{ width: '100%', padding: 2, borderRadius: 4, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 10, marginBottom: 2 }} />
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button onClick={handleAdd} style={{ flex: 1, padding: '2px 4px', borderRadius: 4, border: 'none', background: '#2563eb', color: 'white', fontSize: 10, cursor: 'pointer' }}>Save</button>
                            <button onClick={() => setAdding(null)} style={{ padding: '2px 4px', borderRadius: 4, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 10, cursor: 'pointer' }}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAdding({ staffId: u.id, date: dateStr })}
                          style={{ width: '100%', padding: '2px', borderRadius: 4, border: '1px dashed #334155', background: 'transparent', color: '#475569', fontSize: 10, cursor: 'pointer', marginTop: 2 }}>+</button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

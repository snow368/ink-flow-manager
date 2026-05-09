import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';

export default function Today() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [appointments, setAppointments] = useState<(AppointmentRecord & { clientName?: string })[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateAppointmentCounts, setDateAppointmentCounts] = useState<Map<string, number>>(new Map());
  const [dragOverDate, setDragOverDate] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadAppointmentsForDate(u, selectedDate);
      loadFutureDateCounts(u);
    });
  }, [navigate, selectedDate]);

  async function loadAppointmentsForDate(u: UserRecord, date: string) {
    let query = db.appointments.where('date').equals(date);
    if (u.role === 'artist' && u.artistId) query = query.and(a => a.artistId === u.artistId);
    const apps = await query.toArray();
    const enriched = await Promise.all(apps.map(async a => {
      const client = await db.clients.get(a.clientId);
      return { ...a, clientName: client?.name || 'Unknown' };
    }));
    setAppointments(enriched.sort((a, b) => a.time.localeCompare(b.time)));
  }

  async function loadFutureDateCounts(u: UserRecord) {
    const today = new Date().toISOString().slice(0, 10);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    let query = db.appointments.where('date').between(today, endDate.toISOString().slice(0, 10));
    if (u.role === 'artist' && u.artistId) query = query.and(a => a.artistId === u.artistId);
    const futureApps = await query.toArray();
    const counts = new Map<string, number>();
    futureApps.forEach(a => counts.set(a.date, (counts.get(a.date) || 0) + 1));
    setDateAppointmentCounts(counts);
  }

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const toTimeString = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const hasOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

  const findConflict = (
    list: AppointmentRecord[],
    targetDate: string,
    time: string,
    duration: number,
    artistId: string,
    excludeId: string
  ) => {
    const start = toMinutes(time);
    const end = start + duration;
    return list.find(a => {
      if (a.id === excludeId) return false;
      if (a.date !== targetDate || a.artistId !== artistId || a.status === 'cancelled') return false;
      const s = toMinutes(a.time);
      const e = s + a.duration;
      return hasOverlap(start, end, s, e);
    });
  };

  const findNextAvailableTime = (
    list: AppointmentRecord[],
    targetDate: string,
    artistId: string,
    duration: number,
    preferredTime: string,
    excludeId: string
  ) => {
    let candidate = toMinutes(preferredTime);
    const dayEnd = 22 * 60;
    while (candidate + duration <= dayEnd) {
      const blocked = list.some(a => {
        if (a.id === excludeId) return false;
        if (a.date !== targetDate || a.artistId !== artistId || a.status === 'cancelled') return false;
        const s = toMinutes(a.time);
        const e = s + a.duration;
        return hasOverlap(candidate, candidate + duration, s, e);
      });
      if (!blocked) return toTimeString(candidate);
      candidate += 15;
    }
    return '';
  };

  const updateAppointmentInState = (id: string, patch: Partial<AppointmentRecord>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const handleStatusUpdate = async (id: string, status: AppointmentRecord['status']) => {
    await db.appointments.update(id, { status });
    updateAppointmentInState(id, { status });
    if (user) loadFutureDateCounts(user);
  };

  const handleDropToDate = async (targetDate: string, appointmentId: string) => {
    const moving = appointments.find(a => a.id === appointmentId);
    if (!moving || moving.date === targetDate) return;

    const all = await db.appointments.toArray();
    const conflict = findConflict(all, targetDate, moving.time, moving.duration, moving.artistId, moving.id);
    let finalTime = moving.time;

    if (conflict) {
      const suggested = findNextAvailableTime(all, targetDate, moving.artistId, moving.duration, moving.time, moving.id);
      if (!suggested) {
        alert(`Cannot move to ${targetDate}. No available slot for ${moving.duration} minutes.`);
        return;
      }
      const ok = confirm(
        `Time conflict on ${targetDate} at ${moving.time}.\n` +
        `Move to next available slot ${suggested} instead?`
      );
      if (!ok) return;
      finalTime = suggested;
    }

    await db.appointments.update(moving.id, { date: targetDate, time: finalTime });
    updateAppointmentInState(moving.id, { date: targetDate, time: finalTime });
    if (user) {
      loadAppointmentsForDate(user, selectedDate);
      loadFutureDateCounts(user);
    }
  };

  const weekDays = (() => {
    const days: { date: Date; label: string; dateStr: string; count: number }[] = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: d, label: dayNames[d.getDay()], dateStr, count: dateAppointmentCounts.get(dateStr) || 0 });
    }

    return days;
  })();

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  if (!user) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>{isToday ? 'Today' : selectedDate} - {new Date(selectedDate).toLocaleDateString('en', { month: 'long', day: 'numeric' })}</h2>
        <button onClick={() => navigate('/appointment/new')} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: '#e11d48', color: 'white', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #1e293b', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {weekDays.map(day => {
          const selected = day.dateStr === selectedDate;
          const count = day.count;
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              onDragOver={(e) => { e.preventDefault(); setDragOverDate(day.dateStr); }}
              onDragLeave={() => setDragOverDate('')}
              onDrop={async (e) => {
                e.preventDefault();
                const appointmentId = e.dataTransfer.getData('text/plain');
                setDragOverDate('');
                if (appointmentId) await handleDropToDate(day.dateStr, appointmentId);
              }}
              style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 10px', borderRadius: 14, border: 'none',
              background: selected ? '#e11d48' : dragOverDate === day.dateStr ? '#334155' : 'transparent',
              color: selected ? 'white' : count > 0 ? '#e2e8f0' : '#64748b',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', minWidth: 50, transition: 'background 0.15s', position: 'relative',
            }}>
              <span style={{ fontSize: 10, opacity: 0.6 }}>{day.label}</span>
              <span style={{ fontSize: 16, fontWeight: selected ? 700 : 500 }}>{day.date.getDate()}</span>
              {count > 0 && !selected ? (
                count === 1 ? (
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: '#e11d48', boxShadow: '0 0 4px rgba(225,29,72,0.6)' }} />
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginTop: 2, textShadow: '0 0 6px rgba(0,0,0,0.8)' }}>{count >= 4 ? '4+' : count}</span>
                )
              ) : selected && (
                <div style={{ width: 5, height: 5, borderRadius: 3, background: 'white', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
              )}
            </button>
          );
        })}
      </div>

      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>No Appointments</p>
          <p style={{ fontSize: 16, color: '#94a3b8' }}>No appointments on this day</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {appointments.map(app => (
            <AppointmentCard
              key={app.id}
              appointment={app}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  onStatusUpdate,
}: {
  appointment: AppointmentRecord & { clientName?: string };
  onStatusUpdate: (id: string, status: AppointmentRecord['status']) => Promise<void>;
}) {
  const navigate = useNavigate();
  const color = STATUS_COLORS[appointment.status] || '#9ca3af';
  const needsWaiver = !appointment.waiverCompleted && appointment.status !== 'done' && appointment.status !== 'cancelled';
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status: AppointmentRecord['status']) => {
    if (updating) return;
    setUpdating(true);
    try {
      await onStatusUpdate(appointment.id, status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', appointment.id)}
      style={{ background: '#1e293b', borderRadius: 14, padding: 14, borderLeft: '4px solid ' + color, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      title="Drag to another date to reschedule"
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}><span style={{ color: '#64748b', marginRight: 6 }}>{appointment.time}</span>{appointment.clientName}</p>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>{appointment.duration}min{appointment.type && ' - ' + appointment.type.replace('_', ' ')}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: color + '33', color: color, fontWeight: 600 }}>{STATUS_LABELS[appointment.status] || appointment.status}</span>
        {needsWaiver && (
          <button onClick={() => navigate('/waiver/' + appointment.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Waiver</button>
        )}
        {appointment.status === 'unconfirmed' && (
          <button disabled={updating} onClick={() => updateStatus('deposit_paid')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#60a5fa', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Deposit</button>
        )}
        {appointment.status === 'deposit_paid' && (
          <button disabled={updating} onClick={() => updateStatus('ready')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#34d399', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
        )}
        {appointment.status === 'ready' && (
          <button onClick={() => navigate('/session/' + appointment.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#34d399', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Start</button>
        )}
        {appointment.status !== 'done' && appointment.status !== 'cancelled' && (
          <button disabled={updating} onClick={() => updateStatus('cancelled')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#475569', color: '#e2e8f0', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        )}
      </div>
    </div>
  );
}


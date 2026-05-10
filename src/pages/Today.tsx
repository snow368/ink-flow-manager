import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord, type LeadRecord } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';

export default function Today() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [appointments, setAppointments] = useState<(AppointmentRecord & { clientName?: string })[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateAppointmentCounts, setDateAppointmentCounts] = useState<Map<string, number>>(new Map());
  const [dragOverDate, setDragOverDate] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [weekAppointments, setWeekAppointments] = useState<Map<string, (AppointmentRecord & { clientName?: string })[]>>(new Map());
  const [dueLeads, setDueLeads] = useState<LeadRecord[]>([]);
  const [conflictModal, setConflictModal] = useState<{
    open: boolean;
    appointmentId: string;
    targetDate: string;
    conflictWith: string;
    options: string[];
  }>({ open: false, appointmentId: '', targetDate: '', conflictWith: '', options: [] });

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadAppointmentsForDate(u, selectedDate);
      loadAppointmentsForWeek(u, selectedDate);
      loadFutureDateCounts(u);
      loadDueLeads(u);
    });
  }, [navigate, selectedDate]);

  async function loadDueLeads(u: UserRecord) {
    const artistId = u.artistId || u.id;
    const now = Date.now();
    const leads = await db.leads.where('artistId').equals(artistId).toArray();
    const due = leads
      .filter(l => !!l.nextFollowUpAt && l.nextFollowUpAt <= now && l.status !== 'won' && l.status !== 'lost')
      .sort((a, b) => (a.nextFollowUpAt || 0) - (b.nextFollowUpAt || 0));
    setDueLeads(due);
  }

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

  async function loadAppointmentsForWeek(u: UserRecord, anchorDate: string) {
    const start = new Date(anchorDate);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    let query = db.appointments.where('date').between(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
    if (u.role === 'artist' && u.artistId) query = query.and(a => a.artistId === u.artistId);
    const apps = await query.toArray();
    const enriched = await Promise.all(apps.map(async a => {
      const client = await db.clients.get(a.clientId);
      return { ...a, clientName: client?.name || 'Unknown' };
    }));

    const grouped = new Map<string, (AppointmentRecord & { clientName?: string })[]>();
    for (const a of enriched.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))) {
      const list = grouped.get(a.date) || [];
      list.push(a);
      grouped.set(a.date, list);
    }
    setWeekAppointments(grouped);
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

  const findMultipleAvailableTimes = (
    list: AppointmentRecord[],
    targetDate: string,
    artistId: string,
    duration: number,
    preferredTime: string,
    excludeId: string,
    limit = 3
  ) => {
    const out: string[] = [];
    let candidate = toMinutes(preferredTime);
    const dayEnd = 22 * 60;
    while (candidate + duration <= dayEnd && out.length < limit) {
      const blocked = list.some(a => {
        if (a.id === excludeId) return false;
        if (a.date !== targetDate || a.artistId !== artistId || a.status === 'cancelled') return false;
        const s = toMinutes(a.time);
        const e = s + a.duration;
        return hasOverlap(candidate, candidate + duration, s, e);
      });
      if (!blocked) out.push(toTimeString(candidate));
      candidate += 15;
    }
    return out;
  };

  const updateAppointmentInState = (id: string, patch: Partial<AppointmentRecord>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const handleStatusUpdate = async (id: string, status: AppointmentRecord['status']) => {
    await db.appointments.update(id, { status });
    updateAppointmentInState(id, { status });
    if (user) {
      loadFutureDateCounts(user);
      loadAppointmentsForWeek(user, selectedDate);
    }
  };

  const postponeLeadFollowUp = async (leadId: string, minutes: number) => {
    const target = Date.now() + minutes * 60 * 1000;
    await db.leads.update(leadId, { nextFollowUpAt: target });
    if (user) await loadDueLeads(user);
  };

  const applyMove = async (appointmentId: string, targetDate: string, finalTime: string) => {
    await db.appointments.update(appointmentId, { date: targetDate, time: finalTime });
    updateAppointmentInState(appointmentId, { date: targetDate, time: finalTime });
    if (user) {
      loadAppointmentsForDate(user, selectedDate);
      loadAppointmentsForWeek(user, selectedDate);
      loadFutureDateCounts(user);
    }
  };

  const handleDropToDate = async (targetDate: string, appointmentId: string) => {
    const movingFromState =
      appointments.find(a => a.id === appointmentId) ||
      Array.from(weekAppointments.values()).flat().find(a => a.id === appointmentId);
    const moving = movingFromState || await db.appointments.get(appointmentId);
    if (!moving || moving.date === targetDate) return;

    const all = await db.appointments.toArray();
    const conflict = findConflict(all, targetDate, moving.time, moving.duration, moving.artistId, moving.id);
    if (conflict) {
      const options = findMultipleAvailableTimes(all, targetDate, moving.artistId, moving.duration, moving.time, moving.id);
      if (options.length === 0) {
        alert(`Cannot move to ${targetDate}. No available slot for ${moving.duration} minutes.`);
        return;
      }
      const conflictName = (await db.clients.get(conflict.clientId))?.name || 'Unknown';
      setConflictModal({
        open: true,
        appointmentId: moving.id,
        targetDate,
        conflictWith: `${conflict.time} - ${conflictName}`,
        options,
      });
      return;
    }
    await applyMove(moving.id, targetDate, moving.time);
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

  const activeWeekDays = (() => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days: { date: Date; label: string; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, label: dayNames[i], dateStr: d.toISOString().slice(0, 10) });
    }
    return days;
  })();

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  if (!user) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  return (
    <div style={{ padding: 20, color: THEME.text.primary, paddingBottom: 12, maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>{isToday ? t(lang, 'today') : selectedDate} - {new Date(selectedDate).toLocaleDateString('en', { month: 'long', day: 'numeric' })}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: THEME.bg.panel, borderRadius: 10, padding: 2 }}>
            <button onClick={() => setViewMode('day')} style={{ border: 'none', background: viewMode === 'day' ? '#e11d48' : 'transparent', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>{t(lang, 'day')}</button>
            <button onClick={() => setViewMode('week')} style={{ border: 'none', background: viewMode === 'week' ? '#e11d48' : 'transparent', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>{t(lang, 'week')}</button>
          </div>
          <button onClick={() => navigate('/appointment/new')} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: THEME.brand.primary, color: 'white', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 13, color: '#fca5a5', fontWeight: 700 }}>Must Follow Up Now: {dueLeads.length}</p>
          <button onClick={() => navigate('/leads')} style={{ border: '1px solid #334155', background: 'transparent', color: '#93c5fd', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>Open Leads</button>
        </div>
        {dueLeads.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>No overdue follow-ups right now.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dueLeads.slice(0, 5).map(lead => (
              <div key={lead.id} style={{ background: '#0b1220', border: '1px solid #243244', borderRadius: 10, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>{lead.name}</p>
                  <span style={{ fontSize: 11, color: '#fca5a5' }}>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString() : ''}</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{lead.note || lead.changeRequest || 'No detail'}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => void postponeLeadFollowUp(lead.id, 24 * 60)} style={smallBtn}>Done +1d</button>
                  <button onClick={() => void postponeLeadFollowUp(lead.id, 3 * 24 * 60)} style={smallBtn}>Done +3d</button>
                  <button onClick={() => void postponeLeadFollowUp(lead.id, 7 * 24 * 60)} style={smallBtn}>Done +7d</button>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: THEME.brand.primary, boxShadow: '0 0 4px rgba(225,29,72,0.6)' }} />
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

      {viewMode === 'day' && appointments.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{t(lang, 'no_appointments')}</p>
          <p style={{ fontSize: 16, color: '#94a3b8' }}>{t(lang, 'no_appointments_day')}</p>
        </div>
      ) : viewMode === 'day' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {appointments.map(app => (
            <AppointmentCard
              key={app.id}
              appointment={app}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(180px, 1fr))', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {activeWeekDays.map(day => {
            const list = weekAppointments.get(day.dateStr) || [];
            const selected = day.dateStr === selectedDate;
            return (
              <div
                key={day.dateStr}
                onDragOver={(e) => { e.preventDefault(); setDragOverDate(day.dateStr); }}
                onDragLeave={() => setDragOverDate('')}
                onDrop={async (e) => {
                  e.preventDefault();
                  const appointmentId = e.dataTransfer.getData('text/plain');
                  setDragOverDate('');
                  if (appointmentId) await handleDropToDate(day.dateStr, appointmentId);
                }}
                style={{
                  background: selected ? '#182234' : '#0b1220',
                  border: dragOverDate === day.dateStr ? '1px solid #f43f5e' : selected ? '1px solid #475569' : '1px solid #243244',
                  boxShadow: dragOverDate === day.dateStr ? '0 0 0 1px rgba(244,63,94,0.35) inset' : 'none',
                  borderRadius: 12,
                  padding: 10,
                  minHeight: 240,
                }}
              >
                <button onClick={() => { setSelectedDate(day.dateStr); setViewMode('day'); }} style={{ width: '100%', border: 'none', background: 'transparent', color: 'white', textAlign: 'left', cursor: 'pointer', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{day.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{day.date.getDate()}</div>
                    <span style={{ fontSize: 11, color: '#93c5fd', background: '#1e3a5f', borderRadius: 999, padding: '2px 7px' }}>{list.length}</span>
                  </div>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#64748b' }}>No appointments</p>
                  ) : list.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
                      style={{
                        borderLeft: `3px solid ${STATUS_COLORS[item.status] || '#9ca3af'}`,
                        background: THEME.bg.panel,
                        border: '1px solid #334155',
                        borderRadius: 8,
                        padding: 8,
                        cursor: 'grab',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{item.time}</div>
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: STATUS_COLORS[item.status] || '#9ca3af' }} />
                      </div>
                      <div style={{ fontSize: 12, color: '#cbd5e1' }}>{item.clientName}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{STATUS_LABELS[item.status] || item.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {conflictModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Time Conflict</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
              Conflicts with: <span style={{ color: '#e2e8f0' }}>{conflictModal.conflictWith}</span>
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>
              Choose a suggested slot for {conflictModal.targetDate}:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {conflictModal.options.map(option => (
                <button
                  key={option}
                  onClick={async () => {
                    await applyMove(conflictModal.appointmentId, conflictModal.targetDate, option);
                    setConflictModal({ open: false, appointmentId: '', targetDate: '', conflictWith: '', options: [] });
                  }}
                  style={{ border: 'none', borderRadius: 8, padding: '10px 12px', background: '#334155', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={() => setConflictModal({ open: false, appointmentId: '', targetDate: '', conflictWith: '', options: [] })}
              style={{ width: '100%', border: '1px solid #475569', borderRadius: 8, padding: '9px 10px', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
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
      style={{ background: THEME.bg.panel, borderRadius: 14, padding: 14, borderLeft: '4px solid ' + color, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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

const smallBtn: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#cbd5e1',
  borderRadius: 8,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
};


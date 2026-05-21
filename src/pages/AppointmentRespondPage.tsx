import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../db';
import { getArtistAvailability, findMultipleAvailableTimes, isDayOff, toMinutes } from '../lib/availability';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';

type Status = 'loading' | 'ready' | 'confirmed' | 'cancelled' | 'rescheduled' | 'rescheduling';

export default function AppointmentRespondPage() {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [responding, setResponding] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const lang = detectInitialLanguage();
  const locale = lang === 'jp' ? 'ja' : lang;

  useEffect(() => {
    if (!id) return;
    db.appointments.get(id).then(async appt => {
      if (!appt) { setStatus('ready'); return; }
      setAppointment(appt);
      const c = await db.clients.get(appt.clientId);
      setClient(c);
      setStatus('ready');
      const d: string[] = [];
      for (let i = 1; i <= 14; i++) {
        const dt = new Date();
        dt.setDate(dt.getDate() + i);
        d.push(dt.toISOString().slice(0, 10));
      }
      setDates(d);
    });
  }, [id]);

  useEffect(() => {
    if (!selectedDate || !appointment) return;
    setLoadingSlots(true);
    loadSlots(selectedDate, appointment);
  }, [selectedDate, appointment]);

  async function loadSlots(date: string, appt: any) {
    try {
      const avail = await getArtistAvailability(appt.artistId);
      if (isDayOff(date, avail.daysOff)) { setSlots([]); setLoadingSlots(false); return; }
      const dayStart = toMinutes(avail.start);
      const dayEnd = toMinutes(avail.end);
      const existing = await db.appointments.where('date').equals(date).toArray();
      const times = findMultipleAvailableTimes(
        existing.filter(a => a.id !== appt.id),
        dayStart, dayEnd, appt.duration || 60, dayStart,
      );
      setSlots(times);
    } finally {
      setLoadingSlots(false);
    }
  }

  const handleConfirm = async () => {
    if (!appointment || responding) return;
    setResponding(true);
    await db.appointments.update(appointment.id, { status: 'deposit_paid' });
    setStatus('confirmed');
    setResponding(false);
  };

  const handleCancel = async () => {
    if (!appointment || responding) return;
    setResponding(true);
    await db.appointments.update(appointment.id, { status: 'cancelled' });
    setStatus('cancelled');
    setResponding(false);
  };

  const handleReschedule = async () => {
    if (!appointment || !selectedDate || !selectedSlot || responding) return;
    setResponding(true);
    await db.appointments.update(appointment.id, {
      rescheduleRequest: { proposedDate: selectedDate, proposedTime: selectedSlot, requestedAt: Date.now() },
    });
    setStatus('rescheduled');
    setResponding(false);
  };

  if (status === 'loading') {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>{t(lang, 'respond_loading')}</div>;
  }

  if (status === 'confirmed') {
    return (
      <CenterScreen>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t(lang, 'respond_confirmed')}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>{t(lang, 'respond_confirmed_desc')}</p>
        {appointment && <AppointmentSummary appointment={appointment} client={client} />}
      </CenterScreen>
    );
  }

  if (status === 'rescheduled') {
    const dateStr = selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' }) : '';
    return (
      <CenterScreen>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📩</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t(lang, 'respond_reschedule_sent')}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
          {t(lang, 'respond_reschedule_desc').replace('{date}', dateStr).replace('{time}', selectedSlot)}
        </p>
      </CenterScreen>
    );
  }

  if (status === 'cancelled') {
    return (
      <CenterScreen>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t(lang, 'respond_cancelled')}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>{t(lang, 'respond_cancelled_desc')}</p>
      </CenterScreen>
    );
  }

  if (!appointment) {
    return (
      <CenterScreen>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{t(lang, 'respond_not_found')}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>{t(lang, 'respond_invalid_link')}</p>
      </CenterScreen>
    );
  }

  if (status === 'rescheduling') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24 }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => { setStatus('ready'); setSelectedDate(''); setSelectedSlot(''); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>←</button>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>{t(lang, 'respond_pick_time')}</h1>
          </div>

          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{t(lang, 'respond_select_date')}</p>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 8 }}>
            {dates.map(d => {
              const dateObj = new Date(d + 'T00:00:00');
              const isSelected = d === selectedDate;
              return (
                <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlot(''); }}
                  style={{
                    padding: '8px 10px', borderRadius: 10, border: isSelected ? '2px solid #e11d48' : '1px solid #334155',
                    background: isSelected ? '#e11d4822' : 'transparent', color: isSelected ? 'white' : '#94a3b8',
                    fontSize: 12, cursor: 'pointer', minWidth: 52, textAlign: 'center', flexShrink: 0,
                  }}>
                  <div style={{ fontSize: 9, opacity: 0.6 }}>{dateObj.toLocaleDateString(locale, { weekday: 'short' })}</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{dateObj.getDate()}</div>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div>
              {loadingSlots ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: 20 }}>{t(lang, 'respond_loading_slots')}</p>
              ) : slots.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>{t(lang, 'respond_no_slots').replace('{date}', new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' }))}</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
                  {slots.map(t => (
                    <button key={t} onClick={() => setSelectedSlot(t)}
                      style={{
                        padding: '10px 8px', borderRadius: 8,
                        border: selectedSlot === t ? '2px solid #e11d48' : '1px solid #334155',
                        background: selectedSlot === t ? '#e11d4822' : '#1e293b',
                        color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={handleReschedule} disabled={!selectedSlot || responding}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              background: !selectedSlot || responding ? '#4b5563' : '#e11d48',
              color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}>
            {responding ? t(lang, 'respond_rescheduling') : t(lang, 'respond_confirm_time')}
          </button>
        </div>
      </div>
    );
  }

  const dateStr = new Date(appointment.date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <CenterScreen>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>{t(lang, 'respond_your_appointment')}</h1>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24, width: '100%', maxWidth: 400 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{dateStr}</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{appointment.time}</div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>{appointment.duration} min</div>
        {client && <div style={{ fontSize: 14, color: '#e2e8f0', marginTop: 8 }}>{t(lang, 'respond_name')} {client.name}</div>}
        {appointment.bodyPart && <div style={{ fontSize: 13, color: '#93c5fd' }}>{t(lang, 'respond_body')} {appointment.bodyPart}</div>}
        {appointment.designNotes && <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>{t(lang, 'respond_design')} {appointment.designNotes}</div>}
        {appointment.depositAmount > 0 && <div style={{ fontSize: 13, color: '#fbbf24', marginTop: 4 }}>{t(lang, 'respond_deposit')} ${(appointment.depositAmount / 100).toFixed(2)}</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400 }}>
        <button onClick={handleConfirm} disabled={responding}
          style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: '#22c55e', color: 'white', fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
          {t(lang, 'respond_confirm_btn')}
        </button>
        <button onClick={() => setStatus('rescheduling')} disabled={responding}
          style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid #60a5fa', background: 'transparent', color: '#60a5fa', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {t(lang, 'respond_reschedule_btn')}
        </button>
        <button onClick={handleCancel} disabled={responding}
          style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {t(lang, 'respond_cancel_btn')}
        </button>
      </div>
    </CenterScreen>
  );
}

function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh', background: '#0f172a', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      {children}
    </div>
  );
}

function AppointmentSummary({ appointment, client }: { appointment: any; client: any }) {
  return (
    <div style={{ marginTop: 20, background: '#1e293b', borderRadius: 12, padding: 16, width: '100%', maxWidth: 320 }}>
      <p style={{ fontSize: 14, color: '#e2e8f0' }}>{appointment.date} at {appointment.time}</p>
      {client && <p style={{ fontSize: 14, color: '#94a3b8' }}>{client.name}</p>}
    </div>
  );
}

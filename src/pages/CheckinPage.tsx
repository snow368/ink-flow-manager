import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, type AppointmentRecord, type ClientRecord } from '../db';
import { canCheckIn } from '../lib/qrCheckin';
import { THEME } from '../lib/theme';

type State = 'loading' | 'not_found' | 'checked_in' | 'too_early' | 'too_late' | 'ready';

export default function CheckinPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [state, setState] = useState<State>('loading');
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (!appointmentId) { setState('not_found'); return; }
    db.appointments.get(appointmentId).then(async appt => {
      if (!appt) { setState('not_found'); return; }
      setAppointment(appt);
      if (appt.clientId) {
        const c = await db.clients.get(appt.clientId);
        setClient(c || null);
      }
      if (appt.status === 'cancelled') { setState('too_late'); return; }
      if (appt.status === 'done') { setState('checked_in'); return; }
      if (!canCheckIn(appt)) { setState('too_early'); return; }
      setState('ready');
    });
  }, [appointmentId]);

  const handleCheckIn = async () => {
    if (!appointment || checkingIn) return;
    setCheckingIn(true);
    await db.appointments.update(appointment.id, { status: 'ready' });
    setState('checked_in');
    setCheckingIn(false);
  };

  if (state === 'loading') {
    return <CenterScreen><p style={{ color: '#94a3b8', fontSize: 16 }}>Loading...</p></CenterScreen>;
  }

  if (state === 'not_found') {
    return (
      <CenterScreen>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🔗</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Appointment Not Found</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>This link may have expired or is invalid.</p>
      </CenterScreen>
    );
  }

  if (state === 'checked_in') {
    const dateStr = appointment ? new Date(appointment.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }) : '';
    return (
      <CenterScreen>
        <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Checked In</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>You're all set! The artist will be with you shortly.</p>
        {appointment && (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, width: '100%', maxWidth: 320 }}>
            <p style={{ fontSize: 15, color: '#e2e8f0', fontWeight: 600 }}>{dateStr}</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 2 }}>{appointment.time} — {appointment.type || 'Appointment'}</p>
            {client && <p style={{ fontSize: 14, color: '#e2e8f0', marginTop: 4 }}>{client.name}</p>}
          </div>
        )}
      </CenterScreen>
    );
  }

  if (state === 'too_early') {
    const apptTime = appointment ? new Date(appointment.date + 'T' + appointment.time + ':00') : null;
    return (
      <CenterScreen>
        <p style={{ fontSize: 48, marginBottom: 16 }}>⏰</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Too Early to Check In</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
          Check-in opens 2 hours before your appointment.
        </p>
        {apptTime && (
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>
            {apptTime.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })} at {appointment?.time}
          </p>
        )}
      </CenterScreen>
    );
  }

  if (state === 'too_late') {
    return (
      <CenterScreen>
        <p style={{ fontSize: 48, marginBottom: 16 }}>📅</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check-in Closed</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>This appointment has been cancelled or already passed.</p>
      </CenterScreen>
    );
  }

  const dateStr = appointment ? new Date(appointment.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }) : '';

  return (
    <CenterScreen>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Check In</h1>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24, width: '100%', maxWidth: 340 }}>
        {client && <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{client.name}</p>}
        <p style={{ fontSize: 15, color: '#e2e8f0', marginBottom: 4 }}>{dateStr}</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{appointment?.time}</p>
        {appointment?.type && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{appointment.type} — {appointment.duration}min</p>}
        {appointment?.bodyPart && <p style={{ fontSize: 13, color: '#93c5fd', marginTop: 2 }}>Body: {appointment.bodyPart}</p>}
      </div>
      <button
        onClick={handleCheckIn}
        disabled={checkingIn}
        style={{
          width: '100%', maxWidth: 340, padding: 16, borderRadius: 14, border: 'none',
          background: checkingIn ? '#4b5563' : '#22c55e', color: 'white',
          fontSize: 18, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {checkingIn ? 'Checking In...' : 'I\'m Here — Check In'}
      </button>
      <p style={{ fontSize: 11, color: '#475569', marginTop: 10 }}>This confirms you've arrived at the studio.</p>
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

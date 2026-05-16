import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';
import { THEME } from '../lib/theme';

export default function AppointmentRespondPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [appointment, setAppointment] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'confirmed' | 'cancelled'>('loading');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!id) return;
    db.appointments.get(id).then(async appt => {
      if (!appt) { setStatus('ready'); return; }
      setAppointment(appt);
      const c = await db.clients.get(appt.clientId);
      setClient(c);
      setStatus('ready');
    });
  }, [id]);

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

  if (status === 'loading') {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;
  }

  if (status === 'confirmed') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Appointment Confirmed</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>Your appointment has been confirmed. See you soon!</p>
        {appointment && (
          <div style={{ marginTop: 20, background: '#1e293b', borderRadius: 12, padding: 16, width: '100%', maxWidth: 320 }}>
            <p style={{ fontSize: 14, color: '#e2e8f0' }}>{appointment.date} at {appointment.time}</p>
            {client && <p style={{ fontSize: 14, color: '#94a3b8' }}>{client.name}</p>}
          </div>
        )}
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Appointment Cancelled</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>Your appointment has been cancelled. The artist will be notified.</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Appointment Not Found</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>This link may have expired or is invalid.</p>
      </div>
    );
  }

  const dateStr = new Date(appointment.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Your Appointment</h1>
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            {dateStr}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{appointment.time}</div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>{appointment.duration} min</div>
          {client && <div style={{ fontSize: 14, color: '#e2e8f0', marginTop: 8 }}>Name: {client.name}</div>}
          {appointment.bodyPart && <div style={{ fontSize: 13, color: '#93c5fd' }}>Body: {appointment.bodyPart}</div>}
          {appointment.designNotes && <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Design: {appointment.designNotes}</div>}
          {appointment.depositAmount > 0 && <div style={{ fontSize: 13, color: '#fbbf24', marginTop: 4 }}>Deposit: ${(appointment.depositAmount / 100).toFixed(2)}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleConfirm}
            disabled={responding}
            style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: '#22c55e', color: 'white', fontSize: 17, fontWeight: 700, cursor: 'pointer' }}
          >
            Confirm Appointment
          </button>
          <button
            onClick={handleCancel}
            disabled={responding}
            style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

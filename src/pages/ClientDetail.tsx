import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type ClientRecord, type AppointmentRecord } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);

  useEffect(() => {
    if (!id) return;
    db.clients.get(id).then(c => setClient(c || null));
    db.appointments.where('clientId').equals(id).reverse().sortBy('date').then(apps => setAppointments(apps));
  }, [id]);

  if (!client) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
        Back
      </button>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 20, fontWeight: 'bold' }}>{client.name}</p>
        <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>{client.phone || 'No phone'} - {client.email || 'No email'}</p>
      </div>

      {client.allergies && client.allergies.length > 0 && (
        <div style={{ background: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Allergy Notes</p>
          {client.allergies.map((a, i) => <p key={i} style={{ fontSize: 14, color: '#fca5a5' }}>- {a}</p>)}
        </div>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Appointment History</h3>
      {appointments.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: 14 }}>No appointments yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appointments.map(a => (
            <div key={a.id} style={{ background: '#1e293b', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{a.date} - {a.time}</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{a.type || 'Unspecified'} - {a.duration} min</p>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: (STATUS_COLORS[a.status] || '#9ca3af') + '33', color: STATUS_COLORS[a.status] }}>
                {STATUS_LABELS[a.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

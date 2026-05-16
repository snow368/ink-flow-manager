import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type AppointmentRecord, type ClientRecord, type CommunicationLogRecord } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';
import { getClientTimeline } from '../lib/aftercareLogic';
import { getGoogleCalendarUrl, downloadIcsFile } from '../lib/calendarSync';
import { getChannelIcon, getDirectionBadge } from '../lib/communicationLog';
import { THEME } from '../lib/theme';

export default function ClientPortalPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientRecord | undefined>(undefined);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [timeline, setTimeline] = useState<CommunicationLogRecord[]>([]);
  const [tab, setTab] = useState<'appointments' | 'timeline'>('appointments');

  useEffect(() => {
    if (!clientId) return;
    db.clients.get(clientId).then(setClient);
    db.appointments.where('clientId').equals(clientId).reverse().sortBy('createdAt').then(setAppointments);
    getClientTimeline(clientId).then(setTimeline);
  }, [clientId]);

  const activeAppointments = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'done');
  const pastAppointments = appointments.filter(a => a.status === 'done' || a.status === 'cancelled');

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {client?.name || 'My Appointments'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          View and manage your appointments
        </p>

        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#1e293b', borderRadius: 12, padding: 4 }}>
          {(['appointments', 'timeline'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none',
                background: tab === t ? '#334155' : 'transparent',
                color: tab === t ? 'white' : '#94a3b8',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t === 'appointments' ? 'Appointments' : 'Messages'}
            </button>
          ))}
        </div>

        {tab === 'appointments' && (
          <div>
            {activeAppointments.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 14, color: '#22c55e', marginBottom: 10, fontWeight: 600 }}>Upcoming</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeAppointments.map(a => (
                    <AppointmentCard key={a.id} appointment={a} />
                  ))}
                </div>
              </div>
            )}
            {pastAppointments.length > 0 && (
              <div>
                <h2 style={{ fontSize: 14, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>Past</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pastAppointments.slice(0, 10).map(a => (
                    <AppointmentCard key={a.id} appointment={a} />
                  ))}
                </div>
              </div>
            )}
            {appointments.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <p style={{ fontSize: 16 }}>No appointments yet.</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Book with your artist to get started.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'timeline' && (
          <div>
            {timeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <p style={{ fontSize: 14 }}>No message history yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {timeline.map(log => {
                  const badge = getDirectionBadge(log.direction);
                  return (
                    <div key={log.id} style={{ background: '#1e293b', borderRadius: 10, padding: 12, borderLeft: `3px solid ${badge.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: badge.color + '22', color: badge.color, fontWeight: 600 }}>{badge.label}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{getChannelIcon(log.channel)} {log.channel}</span>
                        </div>
                        <span style={{ fontSize: 10, color: '#475569' }}>{new Date(log.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      {log.message && <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>{log.message}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: AppointmentRecord }) {
  const color = STATUS_COLORS[appointment.status] || '#9ca3af';
  const dateStr = new Date(appointment.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{dateStr} at {appointment.time}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{appointment.duration}min{appointment.type ? ' — ' + appointment.type : ''}</div>
          {appointment.bodyPart && <div style={{ fontSize: 11, color: '#93c5fd', marginTop: 2 }}>Body: {appointment.bodyPart}</div>}
          {appointment.depositAmount != null && appointment.depositAmount > 0 && (
            <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 2 }}>Deposit: ${(appointment.depositAmount / 100).toFixed(2)}</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: color + '33', color, fontWeight: 600 }}>{STATUS_LABELS[appointment.status]}</span>
          <button onClick={() => downloadIcsFile(appointment)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
            +Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

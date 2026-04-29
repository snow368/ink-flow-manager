import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type SessionRecord, type AppointmentRecord, type ClientRecord } from '../db';

export default function Portfolio() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<(SessionRecord & { appointment?: AppointmentRecord; client?: ClientRecord })[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const allSessions = await db.sessions.orderBy('startedAt').reverse().toArray();
    const enriched = await Promise.all(
      allSessions.map(async (s) => {
        const appointment = await db.appointments.get(s.appointmentId);
        const client = appointment ? await db.clients.get(appointment.clientId) : undefined;
        return { ...s, appointment, client };
      })
    );
    setSessions(enriched.filter(s => s.photos && s.photos.length > 0));
  }

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Portfolio</h2>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📸</p>
          <p style={{ fontSize: 16, color: '#94a3b8' }}>No session photos yet</p>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>
            Complete a session with photos to see them here
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sessions.map((session) => (
            <div key={session.id} style={{ background: '#1e293b', borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {session.client?.name || 'Unknown Client'}
                <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
                  {session.appointment?.type?.replace('_', ' ') || 'Tattoo'}
                </span>
              </p>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                {new Date(session.startedAt).toLocaleDateString()} · {session.actualDuration}min · {session.photos.length} photos
              </p>

              {/* 照片网格 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {session.photos.slice(0, 6).map((photo, i) => (
                  <div key={i} style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '1/1', background: '#0f172a' }}>
                    <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>

              {/* 生成社媒草稿按钮 */}
              {session.photos.length >= 2 && (
                <button
                  onClick={() => navigate(`/social-draft?sessionId=${session.id}`)}
                  style={{
                    width: '100%', marginTop: 12, padding: 10, borderRadius: 10,
                    border: 'none', background: '#8b5cf6', color: 'white',
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  🎬 Generate Reel from {session.photos.length} photos
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

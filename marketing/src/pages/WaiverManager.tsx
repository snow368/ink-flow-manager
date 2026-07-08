import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type AppointmentRecord, type ClientRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { getBackendUrl } from '../lib/backendApi';

export default function WaiverManager() {
  const lang = detectInitialLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<(AppointmentRecord & { clientName?: string; clientPhone?: string; clientEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [viewWaiver, setViewWaiver] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const all = await db.appointments
        .orderBy('date')
        .reverse()
        .filter(a => a.status !== 'cancelled')
        .toArray();

      const records = await Promise.all(
        all.map(async (a) => {
          let client: ClientRecord | undefined;
          try { client = await db.clients.get(a.clientId); } catch {}
          return {
            ...a,
            clientName: client?.name || 'Unknown',
            clientPhone: client?.phone || '',
            clientEmail: client?.email || '',
          };
        })
      );
      setAppointments(records);
    } catch (e: any) {
      setMessage('Error loading: ' + (e?.message || ''));
    }
    setLoading(false);
  }

  async function sendWaiverLink(appt: any) {
    const backendUrl = getBackendUrl();
    if (!backendUrl) { setMessage('Backend URL not configured'); return; }
    setSendingId(appt.id);
    setMessage('');
    try {
      const secret = localStorage.getItem('inkflow_backend_secret') || '';
      const user = await db.users.get(localStorage.getItem('inkflow_current_user') || '');
      const res = await fetch(`${backendUrl}/api/waiver/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': secret },
        body: JSON.stringify({
          appointmentId: appt.id,
          clientName: appt.clientName,
          clientPhone: appt.clientPhone,
          clientEmail: appt.clientEmail,
          artistId: appt.artistId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`Waiver link sent! ${data.waiverUrl}`);
      } else {
        setMessage('Error: ' + (data.error || 'unknown'));
      }
    } catch (e: any) {
      setMessage('Failed: ' + (e?.message || ''));
    }
    setSendingId(null);
  }

  async function viewSignedWaiver(appointmentId: string) {
    const backendUrl = getBackendUrl();
    if (!backendUrl) { setMessage('Backend URL not configured'); return; }
    try {
      const secret = localStorage.getItem('inkflow_backend_secret') || '';
      const res = await fetch(`${backendUrl}/api/waiver/${appointmentId}`, {
        headers: { 'x-api-secret': secret },
      });
      if (!res.ok) { setMessage('No signed waiver found'); return; }
      const data = await res.json();
      setViewWaiver(data);
    } catch (e: any) {
      setMessage('Failed: ' + (e?.message || ''));
    }
  }

  return (
    <div style={{ padding: '16px 20px', background: '#0f172a', minHeight: '100dvh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 19, fontWeight: 'bold' }}>Waiver Manager</h2>
        <button onClick={() => navigate('/me')} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
          Back to Me
        </button>
      </div>

      {message && (
        <div style={{ background: '#1e293b', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12, color: '#cbd5e1', wordBreak: 'break-all' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: 8, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>✕</button>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: 14 }}>No appointments found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appointments.map(a => (
            <div key={a.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{a.clientName}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{a.date} {a.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: a.waiverCompleted ? '#064e3b' : '#3b1117',
                  color: a.waiverCompleted ? '#6ee7b7' : '#fca5a5',
                  fontWeight: 600,
                }}>
                  {a.waiverCompleted ? 'Signed' : 'Pending'}
                </span>
                {!a.waiverCompleted ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => {
                      const waiverUrl = `${window.location.origin}/public-waiver/${a.id}`;
                      navigator.clipboard.writeText(waiverUrl);
                      setMessage('Waiver link copied!');
                    }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                      Copy Link
                    </button>
                    <button onClick={() => sendWaiverLink(a)} disabled={sendingId === a.id}
                      style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: sendingId === a.id ? '#4b5563' : '#6366f1', color: 'white', fontSize: 11, fontWeight: 600, cursor: sendingId === a.id ? 'not-allowed' : 'pointer' }}>
                      {sendingId === a.id ? '...' : 'Send Link'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => viewSignedWaiver(a.id)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #22c55e', background: '#22c55e20', color: '#4ade80', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Waiver Modal */}
      {viewWaiver && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000aa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Signed Waiver</h3>
              <button onClick={() => setViewWaiver(null)} style={{ padding: '4px 10px', borderRadius: 6, background: '#334155', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Client: {viewWaiver.clientName || 'N/A'}</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Signed: {viewWaiver.signedAt ? new Date(viewWaiver.signedAt).toLocaleString() : 'N/A'}</p>
            {viewWaiver.clientDob && <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>DOB: {viewWaiver.clientDob}</p>}
            {viewWaiver.idPhoto && (
              <div style={{ margin: '12px 0' }}>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>ID Photo:</p>
                <img src={viewWaiver.idPhoto} alt="ID" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
              </div>
            )}
            {viewWaiver.signature && (
              <div style={{ margin: '12px 0' }}>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Signature:</p>
                <img src={viewWaiver.signature} alt="Signature" style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 8, background: '#f1f5f9' }} />
              </div>
            )}
            <pre style={{ fontSize: 11, color: '#cbd5e1', whiteSpace: 'pre-wrap', background: '#0f172a', padding: 12, borderRadius: 8, marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
              {viewWaiver.waiverText || viewWaiver.content || ''}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type AppointmentRecord, type ClientRecord } from '../db';
import { generateWaiverContent, getWaiverType, getArtistShopInfo } from '../lib/waiverLogic';

export default function WaiverSign() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [waiverText, setWaiverText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentId) return;

    async function loadData() {
      try {
        const a = await db.appointments.get(appointmentId);
        if (!a) {
          setError('Appointment not found');
          return;
        }
        setAppointment(a);

        const c = await db.clients.get(a.clientId);
        setClient(c || null);

        const { shopName, artistName } = await getArtistShopInfo();

        const text = await generateWaiverContent(
          a.type || 'new_tattoo',
          c?.name || 'the Client',
          artistName,
          shopName,
          c?.allergies
        );
        setWaiverText(text);
      } catch (e: any) {
        setError('Failed to load data: ' + (e?.message || 'unknown'));
      }
    }

    loadData();
  }, [appointmentId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.moveTo(x, y);
    setDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!appointmentId || !appointment) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas?.toDataURL('image/png') || '';
      const now = Date.now();
      const waiverId = 'waiver_' + now + '_' + Math.random().toString(36).slice(2, 6);

      await db.waivers.add({
        id: waiverId,
        appointmentId,
        clientId: appointment.clientId,
        type: getWaiverType(appointment.type || 'new_tattoo'),
        content: waiverText,
        signature: signatureData,
        status: 'signed',
        signedAt: now,
        createdAt: now,
      });

      await db.appointments.update(appointmentId, {
        waiverCompleted: true,
        status: 'ready',
      });

      navigate('/today');
    } catch (e: any) {
      setError('Sign failed: ' + (e?.message || 'unknown'));
    } finally {
      setSaving(false);
    }
  };

  if (error && !appointment) {
    return (
      <div style={{ padding: 24, color: 'white' }}>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} style={{ color: '#60a5fa' }}>Go back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Waiver Signature</h2>

      {client && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Client</span>
          <span style={{ fontWeight: 600 }}>{client.name}</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 16 }}>
          <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>
        </div>
      )}

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace' }}>
          {waiverText || 'Loading...'}
        </pre>
      </div>

      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>Client Signature</p>
      <div style={{ border: '2px solid #334155', borderRadius: 12, overflow: 'hidden', marginBottom: 12, touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={350}
          height={150}
          style={{ width: '100%', height: 150, display: 'block' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <button
        onClick={clearSignature}
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, marginBottom: 12 }}
      >
        Clear Signature
      </button>

      <button
        onClick={handleSign}
        disabled={saving || !hasSignature}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: 'none',
          background: saving || !hasSignature ? '#4b5563' : '#22c55e',
          color: 'white', fontSize: 16, fontWeight: 600,
        }}
      >
        {saving ? 'Saving...' : 'Sign and Confirm'}
      </button>
    </div>
  );
}

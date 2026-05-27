import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../db';
import { getBackendUrl } from '../lib/backendApi';

interface DrawPoint { x: number; y: number; time: number; }

const healthQuestions = [
  'Are you pregnant or nursing?',
  'Do you have diabetes?',
  'Do you have a heart condition or use a pacemaker?',
  'Do you have hepatitis, HIV, or any blood-borne disease?',
  'Do you have any skin conditions (eczema, psoriasis) near the tattoo area?',
  'Are you currently taking blood thinners or antibiotics?',
  'Do you have any allergies (latex, metals, anesthetics)?',
];

export default function WalkinPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'form' | 'sign' | 'done' | 'error'>('form');
  const [studioName, setStudioName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [healthAnswers, setHealthAnswers] = useState<boolean[]>(new Array(healthQuestions.length).fill(false));
  const [signing, setSigning] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const drawStartRef = useRef<DrawPoint | null>(null);

  useEffect(() => {
    if (!artistId) return;
    db.users.get(artistId).then(u => {
      if (u) setStudioName(u.studioName || u.name || 'the studio');
    });
  }, [artistId]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, time: Date.now() };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top, time: Date.now() };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    drawStartRef.current = getCanvasPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing || !drawStartRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(drawStartRef.current.x, drawStartRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    drawStartRef.current = pos;
  };

  const endDraw = () => { setDrawing(false); drawStartRef.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasBlank = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return data.data.every(d => d === 0);
  };

  const submitWalkin = async () => {
    if (!artistId || !name.trim() || signing) return;
    setSigning(true);
    try {
      // Create or find client
      let clientId = '';
      const trimmedPhone = phone.replace(/[^\d+]/g, '');
      if (trimmedPhone) {
        const existing = await db.clients.where('phone').equals(trimmedPhone).first();
        if (existing) clientId = existing.id;
      }
      if (!clientId) {
        clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).slice(2, 4);
        await db.clients.add({
          id: clientId, name: name.trim(), phone: trimmedPhone || undefined,
          allergies: healthQuestions.filter((_, i) => healthAnswers[i]),
          createdAt: Date.now(),
        });
      } else {
        // Update allergies if client already exists
        const newAllergies = healthQuestions.filter((_, i) => healthAnswers[i]);
        if (newAllergies.length > 0) {
          const existing = await db.clients.get(clientId);
          if (existing) {
            const merged = [...new Set([...(existing.allergies || []), ...newAllergies])];
            await db.clients.update(clientId, { allergies: merged });
          }
        }
      }

      // Create appointment for today
      const today = new Date().toISOString().slice(0, 10);
      const nowTime = new Date().toTimeString().slice(0, 5);
      const { createProjectWithAppointment } = await import('../lib/projectLogic');
      const { appointment } = await createProjectWithAppointment({
        artistId,
        clientId,
        title: 'Walk-in',
        designNotes: 'Walk-in',
        projectStatus: 'in_progress',
        date: today,
        time: nowTime,
        duration: 60,
        appointmentType: 'new_tattoo',
        appointmentStatus: 'ready',
        waiverCompleted: true,
        walkIn: true,
      });
      const apptId = appointment.id;

      // Sync to backend
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const secret = localStorage.getItem('inkflow_backend_secret') || '';
        await fetch(`${backendUrl}/api/artist-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-secret': secret },
          body: JSON.stringify({
            artistId,
            appointments: [{
              id: apptId, artistId, clientName: name.trim(),
              date: today, time: nowTime, duration: 60,
              status: 'ready', walkIn: true,
            }],
            clients: [],
          }),
        }).catch(() => {});
      }

      setStep('done');
    } catch {
      setStep('error');
    }
    setSigning(false);
  };

  if (!artistId) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid #334155',
    background: '#1e293b', color: 'white', fontSize: 16, outline: 'none',
    boxSizing: 'border-box',
  };

  const bg = '#0f172a';

  return (
    <div style={{ minHeight: '100dvh', background: bg, color: 'white', padding: 24, maxWidth: 500, margin: '0 auto' }}>
      {step === 'form' && (
        <>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>✋</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Walk-in</h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
            Welcome to {studioName || 'the studio'}! Fill this out and you&apos;re good to go.
          </p>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Your name *</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Phone (optional)</p>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#fcd34d', fontWeight: 600, marginBottom: 12 }}>Health Questionnaire</p>
            {healthQuestions.map((q, i) => (
              <div key={i} style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', marginBottom: 8,
              }}>
                <p style={{ fontSize: 14, marginBottom: 8 }}>{q}</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                    <input type="radio" name={`h_${i}`} checked={healthAnswers[i]} onChange={() => {
                      const next = [...healthAnswers]; next[i] = true; setHealthAnswers(next);
                    }} style={{ width: 16, height: 16 }} />
                    Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                    <input type="radio" name={`h_${i}`} checked={!healthAnswers[i]} onChange={() => {
                      const next = [...healthAnswers]; next[i] = false; setHealthAnswers(next);
                    }} style={{ width: 16, height: 16 }} />
                    No
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep('sign')} disabled={!name.trim()}
            style={{
              width: '100%', padding: 16, borderRadius: 12, border: 'none',
              background: name.trim() ? '#e11d48' : '#334155',
              color: 'white', fontSize: 17, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}>
            Continue to Sign Waiver
          </button>
        </>
      )}

      {step === 'sign' && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Sign Waiver</h2>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 14 }}>
            Please sign below to acknowledge the health information you provided is accurate.
          </p>

          <div style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 16,
          }}>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Signature</p>
            <canvas
              ref={canvasRef}
              width={400} height={150}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
              style={{
                width: '100%', height: 120, background: '#0f172a', borderRadius: 8,
                touchAction: 'none', cursor: 'crosshair',
              }}
            />
            <button onClick={clearCanvas} style={{
              marginTop: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid #334155',
              background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
            }}>
              Clear
            </button>
          </div>

          <button onClick={submitWalkin} disabled={signing || isCanvasBlank()}
            style={{
              width: '100%', padding: 16, borderRadius: 12, border: 'none',
              background: signing || isCanvasBlank() ? '#334155' : '#22c55e',
              color: 'white', fontSize: 17, fontWeight: 700,
              cursor: signing || isCanvasBlank() ? 'not-allowed' : 'pointer',
            }}>
            {signing ? 'Submitting...' : '✋ Check In'}
          </button>

          {isCanvasBlank() && (
            <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              Please sign above to check in.
            </p>
          )}
        </>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>You're Checked In!</h2>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>
            The artist will be with you shortly.
          </p>
        </div>
      )}

      {step === 'error' && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 16 }}>
            Please tell the artist to check the connection.
          </p>
          <button onClick={() => setStep('form')}
            style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

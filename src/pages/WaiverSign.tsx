import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type AppointmentRecord, type ClientRecord } from '../db';
import { generateWaiverContent, getWaiverType, getArtistShopInfo } from '../lib/waiverLogic';

const HEALTH_QUESTIONS = [
  'Are you pregnant or nursing?',
  'Do you have any blood-borne diseases?',
  'Do you have any skin conditions?',
  'Are you diabetic or have heart conditions?',
  'Taking blood-thinning medications?',
  'Consumed alcohol or drugs in last 12h?',
  'Allergies to latex, inks, or antiseptics?',
];

interface DrawPoint { x: number; y: number; time: number; }

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
  const [healthAnswers, setHealthAnswers] = useState<boolean[]>(new Array(HEALTH_QUESTIONS.length).fill(false));

  const pointsRef = useRef<DrawPoint[]>([]);

  useEffect(() => {
    if (!appointmentId) return;
    async function loadData() {
      try {
        const a = await db.appointments.get(appointmentId);
        if (!a) { setError('Appointment not found'); return; }
        setAppointment(a);
        const c = await db.clients.get(a.clientId);
        setClient(c || null);
        const { shopName, artistName } = await getArtistShopInfo();
        const text = await generateWaiverContent(
          a.type || 'new_tattoo', c?.name || 'the Client',
          artistName, shopName
        );
        setWaiverText(text);
      } catch (e: any) { setError('Failed: ' + (e?.message || 'unknown')); }
    }
    loadData();
  }, [appointmentId]);

  // 初始化 Canvas（延迟到 DOM 渲染完成后）
  useEffect(() => {
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    });
  }, []);

  // 精确坐标转换（修复偏移问题）
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): DrawPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, time: Date.now() };
    const rect = canvas.getBoundingClientRect();

    // 计算 CSS 缩放比例
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      time: Date.now(),
    };
  };

  // Bézier 平滑绘制
  const drawSmoothSegment = (
    ctx: CanvasRenderingContext2D,
    p0: DrawPoint,
    p1: DrawPoint,
    p2: DrawPoint
  ) => {
    const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const timeDiff = p2.time - p1.time || 1;
    const speed = dist / timeDiff;
    const weight = speed > 2 ? 0.65 : speed > 1 ? 0.8 : 1.0;

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.8 * weight;
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasCoords(e);
    pointsRef.current = [point];
    setDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getCanvasCoords(e);
    pointsRef.current.push(point);

    if (pointsRef.current.length >= 2) {
      const p0 = pointsRef.current[pointsRef.current.length - 2];
      const p1 = pointsRef.current[pointsRef.current.length - 1];

      if (pointsRef.current.length === 2) {
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.8;
        ctx.stroke();
      } else {
        const pPrev = pointsRef.current[pointsRef.current.length - 3];
        drawSmoothSegment(ctx, pPrev, p0, p1);
      }
    }
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setDrawing(false);
    pointsRef.current = [];
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // 其余代码（toggleHealthAnswer、handleSign、JSX）和上一版本相同，此处略
  const toggleHealthAnswer = (index: number) => {
    const updated = [...healthAnswers];
    updated[index] = !updated[index];
    setHealthAnswers(updated);
  };

  const handleSign = async () => {
    if (!appointmentId || !appointment) return;
    const allNo = healthAnswers.every(a => !a);
    if (!allNo) {
      const yesItems = HEALTH_QUESTIONS.map((q, i) => healthAnswers[i] ? q : null).filter(Boolean);
      if (yesItems.length > 0) {
        const confirmed = confirm('Client answered YES to:\n\n' + yesItems.join('\n') + '\n\nProceed anyway?');
        if (!confirmed) return;
      }
    }
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas?.toDataURL('image/png') || '';
      const now = Date.now();
      const waiverId = 'waiver_' + now + '_' + Math.random().toString(36).slice(2, 6);
      const knownAllergies = client?.allergies?.length ? `\nKnown allergies: ${client.allergies.join(', ')}` : '';
      const healthSection = '\n\nHEALTH DECLARATION:\n' +
        HEALTH_QUESTIONS.map((q, i) => `${q}  [${healthAnswers[i] ? 'YES' : 'No'}]`).join('\n') +
        knownAllergies;
      const fullContent = waiverText + healthSection;
      await db.waivers.add({
        id: waiverId, appointmentId, clientId: appointment.clientId,
        type: getWaiverType(appointment.type || 'new_tattoo'),
        content: fullContent, signature: signatureData,
        status: 'signed', signedAt: now, createdAt: now,
      });
      await db.appointments.update(appointmentId, { waiverCompleted: true, status: 'ready' });
      navigate('/today');
    } catch (e: any) { setError('Sign failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0f172a', color: 'white' }}>
      <div style={{ padding: '12px 20px 0' }}>
        <h2 style={{ fontSize: 19, fontWeight: 'bold', marginBottom: 4 }}>Waiver</h2>
        {client && (
          <div style={{ background: '#1e293b', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>Client</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{client.name}</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {error && (
          <div style={{ background: '#7f1d1d', padding: 10, borderRadius: 10, margin: '8px 0' }}>
            <p style={{ color: '#fca5a5', fontSize: 13 }}>{error}</p>
          </div>
        )}

        <div style={{ background: '#1e293b', borderRadius: 10, padding: 14, margin: '8px 0' }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#cbd5e1', fontFamily: 'monospace' }}>
            {waiverText || 'Loading...'}
          </pre>
        </div>

        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, marginTop: 12 }}>Health Check</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {HEALTH_QUESTIONS.map((question, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: healthAnswers[i] ? '#3b1117' : '#1e293b', borderRadius: 8, padding: '10px 12px', border: healthAnswers[i] ? '1px solid #e11d4844' : '1px solid transparent' }}>
              <span style={{ fontSize: 12, flex: 1, marginRight: 10, color: healthAnswers[i] ? '#fca5a5' : '#e2e8f0' }}>{question}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => toggleHealthAnswer(i)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: healthAnswers[i] ? '#e11d48' : '#334155', color: healthAnswers[i] ? 'white' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', minWidth: 44 }}>Yes</button>
                <button onClick={() => { if (healthAnswers[i]) toggleHealthAnswer(i); }} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: !healthAnswers[i] ? '#166534' : '#334155', color: !healthAnswers[i] ? '#86efac' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', minWidth: 44 }}>No</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #334155', padding: '10px 20px 0', background: '#0f172a' }}>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Client Signature</p>
        <div style={{ border: '2px solid #475569', borderRadius: 10, overflow: 'hidden', marginBottom: 8, touchAction: 'none', background: '#f1f5f9' }}>
          <canvas ref={canvasRef} width={700} height={200} style={{ width: '100%', height: '100px', display: 'block', cursor: 'crosshair' }}
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={clearSignature} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12 }}>Clear</button>
          <button onClick={handleSign} disabled={saving || !hasSignature} style={{ flex: 2, padding: 8, borderRadius: 8, border: 'none', background: saving || !hasSignature ? '#4b5563' : '#22c55e', color: 'white', fontSize: 13, fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Sign & Confirm'}
          </button>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
      </div>
    </div>
  );
}

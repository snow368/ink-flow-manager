import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface DrawPoint { x: number; y: number; time: number; }

type Step = 'loading' | 'signed' | 'sign' | 'done' | 'error';

interface WaiverInfo {
  alreadySigned: boolean;
  signedAt?: number;
  appointmentId: string;
  clientName: string;
  artistName: string;
  shopName: string;
  appointmentType: string;
  waiverText: string;
  country?: string;
}

const healthQuestions = [
  'Are you pregnant or nursing?',
  'Do you have diabetes?',
  'Do you have a heart condition or use a pacemaker?',
  'Do you have hepatitis, HIV, or any blood-borne disease?',
  'Do you have any skin conditions (eczema, psoriasis) near the tattoo area?',
  'Are you currently taking blood thinners or antibiotics?',
  'Do you have any allergies (latex, metals, anesthetics)?',
];

const healthFollowUps = [
  'Please provide details (due date, etc.)',
  'Please provide details (type, last check-up)',
  'Please provide details (condition, medications)',
  'Please provide details',
  'Please describe the condition and location',
  'Please list the medications',
  'Please list allergies and reactions',
];

export default function PublicWaiverSign() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('loading');
  const [info, setInfo] = useState<WaiverInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [healthAnswers, setHealthAnswers] = useState<boolean[]>(new Array(healthQuestions.length).fill(false));
  const [healthFollowUps, setHealthFollowUps] = useState<string[]>(new Array(healthQuestions.length).fill(''));
  const [idPhoto, setIdPhoto] = useState<string>('');
  const [clientDob, setClientDob] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const pointsRef = useRef<DrawPoint[]>([]);
  const sigStartRef = useRef<number>(0);

  useEffect(() => {
    if (!appointmentId) { setStep('error'); setErrorMsg('Missing appointment ID'); return; }
    const backendUrl = localStorage.getItem('inkflow_backend_url') || '';
    fetch(`${backendUrl}/api/waiver/public/${appointmentId}`)
      .then(r => r.json())
      .then(data => {
        if (data.alreadySigned) {
          setStep('signed');
          return;
        }
        if (data.error) { setStep('error'); setErrorMsg(data.error); return; }
        setInfo(data);
        setName(data.clientName || '');
        setStep('sign');
      })
      .catch(e => { setStep('error'); setErrorMsg('Could not load waiver: ' + (e?.message || 'network error')); });
  }, [appointmentId]);

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
  }, [step]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): DrawPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, time: Date.now() };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY, time: Date.now() };
  };

  const drawSmoothSegment = (ctx: CanvasRenderingContext2D, p0: DrawPoint, p1: DrawPoint, p2: DrawPoint) => {
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
    if (pointsRef.current.length === 0) sigStartRef.current = Date.now();
    pointsRef.current = [getCanvasCoords(e)];
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

  const stopDrawing = () => { setDrawing(false); pointsRef.current = []; };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleIdCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setIdPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getAge = (dob: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSign = async () => {
    if (!appointmentId || !info) return;
    const allNo = healthAnswers.every(a => !a);
    if (!allNo) {
      const yesItems = healthQuestions.filter((_, i) => healthAnswers[i]);
      const confirmed = window.confirm(
        'You answered YES to:\n\n' + yesItems.join('\n') + '\n\nPlease discuss these with your artist before proceeding. Continue?'
      );
      if (!confirmed) return;
    }
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas?.toDataURL('image/png') || '';
      const healthSection = healthQuestions.map((q, i) => {
        let line = `${q}  [${healthAnswers[i] ? 'YES' : 'No'}]`;
        if (healthAnswers[i] && healthFollowUps[i].trim()) line += `  Details: ${healthFollowUps[i].trim()}`;
        return line;
      }).join('\n');
      const fullWaiverText = (info.waiverText || '') + '\n\nHEALTH DECLARATION:\n' + healthSection;

      const backendUrl = localStorage.getItem('inkflow_backend_url') || '';
      const res = await fetch(`${backendUrl}/api/waiver/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          signature: signatureData,
          idPhoto: idPhoto || undefined,
          clientDob: clientDob || undefined,
          healthAnswers,
          waiverText: fullWaiverText,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep('done');
      } else {
        if (data.error === 'already_signed') {
          setStep('signed');
        } else {
          setErrorMsg(data.error || 'Failed to save waiver');
        }
      }
    } catch (e: any) {
      setErrorMsg('Signing failed: ' + (e?.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  // === Loading ===
  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading waiver...</p>
      </div>
    );
  }

  // === Already Signed ===
  if (step === 'signed') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Waiver Already Signed</h2>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>This waiver has already been completed.</p>
        </div>
      </div>
    );
  }

  // === Error ===
  if (step === 'error') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Unable to Load Waiver</h2>
          <p style={{ color: '#fca5a5', fontSize: 14 }}>{errorMsg}</p>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 12 }}>Please contact the studio directly to complete your waiver.</p>
        </div>
      </div>
    );
  }

  // === Done ===
  if (step === 'done') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Waiver Signed!</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>
            Thank you, {name || 'dear client'}. Your waiver has been submitted successfully.
          </p>
          <p style={{ color: '#64748b', fontSize: 13 }}>Your artist will receive a copy. See you at your appointment!</p>
        </div>
      </div>
    );
  }

  // === Sign ===
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: '#0f172a', color: 'white' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <h2 style={{ fontSize: 19, fontWeight: 'bold', marginBottom: 4 }}>Remote Waiver Signing</h2>
        {info && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#1e293b', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>Artist</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{info.artistName}</span>
            </div>
            {info.shopName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Studio</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{info.shopName}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {errorMsg && (
          <div style={{ background: '#7f1d1d', padding: 10, borderRadius: 10, margin: '8px 0' }}>
            <p style={{ color: '#fca5a5', fontSize: 13 }}>{errorMsg}</p>
          </div>
        )}

        {/* Client Info */}
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Your Information</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *" style={inputStyle} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
        </div>

        {/* Waiver Text */}
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Consent Form</p>
        <div style={{ background: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#cbd5e1', fontFamily: 'monospace' }}>
            {info?.waiverText || 'Loading...'}
          </pre>
        </div>

        {/* Health Questions */}
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Health Check</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {healthQuestions.map((q, i) => (
            <div key={i} style={{ background: healthAnswers[i] ? '#3b1117' : '#1e293b', borderRadius: 8, padding: '10px 12px', border: healthAnswers[i] ? '1px solid #e11d4844' : '1px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, flex: 1, marginRight: 10, color: healthAnswers[i] ? '#fca5a5' : '#e2e8f0' }}>{q}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { const u = [...healthAnswers]; u[i] = true; setHealthAnswers(u); }} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: healthAnswers[i] ? '#e11d48' : '#334155', color: healthAnswers[i] ? 'white' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', minWidth: 44 }}>Yes</button>
                  <button onClick={() => { const u = [...healthAnswers]; u[i] = false; setHealthAnswers(u); const f = [...healthFollowUps]; f[i] = ''; setHealthFollowUps(f); }} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: !healthAnswers[i] ? '#166534' : '#334155', color: !healthAnswers[i] ? '#86efac' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', minWidth: 44 }}>No</button>
                </div>
              </div>
              {healthAnswers[i] && (
                <input value={healthFollowUps[i]} onChange={e => { const u = [...healthFollowUps]; u[i] = e.target.value; setHealthFollowUps(u); }} placeholder={healthFollowUps[i]} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e11d4844', background: '#0f172a', color: '#fca5a5', fontSize: 12, marginTop: 8, outline: 'none', boxSizing: 'border-box' }} />
              )}
            </div>
          ))}
        </div>

        {/* Age Verification */}
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Age Verification</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="date" value={clientDob} onChange={e => setClientDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} style={inputDateStyle} />
          {clientDob && getAge(clientDob) !== null && (
            <span style={{ padding: '10px 14px', borderRadius: 8, background: (getAge(clientDob) || 0) < 18 ? '#7f1d1d' : '#064e3b', color: (getAge(clientDob) || 0) < 18 ? '#fca5a5' : '#6ee7b7', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
              Age: {getAge(clientDob)}
            </span>
          )}
        </div>

        {/* ID Photo */}
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>ID Verification</p>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleIdCapture} style={{ display: 'none' }} />
        {!idPhoto ? (
          <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: 14, borderRadius: 10, border: '2px dashed #475569', background: '#1e293b', color: '#94a3b8', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>
            Capture or upload ID photo
          </button>
        ) : (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            <img src={idPhoto} alt="ID" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #334155' }} />
            <button onClick={() => { setIdPhoto(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ position: 'absolute', top: 4, right: 4, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#e11d48', color: 'white', fontSize: 12, cursor: 'pointer' }}>Remove</button>
          </div>
        )}
      </div>

      {/* Signature + Submit */}
      <div style={{ borderTop: '1px solid #334155', padding: '12px 20px', background: '#0f172a' }}>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Digital Signature</p>
        <div style={{ border: '2px solid #475569', borderRadius: 10, overflow: 'hidden', marginBottom: 8, touchAction: 'none', background: '#f1f5f9' }}>
          <canvas ref={canvasRef} width={700} height={200} style={{ width: '100%', height: '100px', display: 'block', cursor: 'crosshair' }}
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={clearSignature} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Clear</button>
          <button onClick={handleSign} disabled={saving || !hasSignature || !name.trim()} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: saving || !hasSignature || !name.trim() ? '#4b5563' : '#22c55e', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving || !hasSignature || !name.trim() ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Submitting...' : 'Sign & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const inputDateStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: 14,
  outline: 'none',
};

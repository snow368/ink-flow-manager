import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../db';
import { getBackendUrl } from '../lib/backendApi';
import { THEME } from '../lib/theme';

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

const BODY_PARTS = [
  { id: 'arm', label: 'Arm', icon: '💪' },
  { id: 'forearm', label: 'Forearm', icon: '🦾' },
  { id: 'shoulder', label: 'Shoulder', icon: '🏋️' },
  { id: 'chest', label: 'Chest', icon: '🔺' },
  { id: 'back', label: 'Back', icon: '🔲' },
  { id: 'leg', label: 'Leg', icon: '🦵' },
  { id: 'thigh', label: 'Thigh', icon: '🪑' },
  { id: 'calf', label: 'Calf', icon: '🦵' },
  { id: 'ribs', label: 'Ribs', icon: '🩻' },
  { id: 'hand', label: 'Hand', icon: '✋' },
  { id: 'foot', label: 'Foot', icon: '🦶' },
  { id: 'neck', label: 'Neck', icon: '🧣' },
  { id: 'head', label: 'Head/face', icon: '😶' },
  { id: 'other', label: 'Other', icon: '📍' },
];

const DEPOSIT_AMOUNTS = [50, 100, 150, 200, 0];

export default function WalkinPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'waiver' | 'deposit' | 'project' | 'schedule' | 'done' | 'error'>('waiver');
  const [studioName, setStudioName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [healthAnswers, setHealthAnswers] = useState<boolean[]>(new Array(healthQuestions.length).fill(false));
  const [signing, setSigning] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [signatureDone, setSignatureDone] = useState(false);
  const drawStartRef = useRef<DrawPoint | null>(null);
  const [depositAmount, setDepositAmount] = useState(100);
  const [bodyPart, setBodyPart] = useState('');
  const [designIdea, setDesignIdea] = useState('');
  const [size, setSize] = useState<'small' | 'medium' | 'large' | ''>('');
  const [scheduleNow, setScheduleNow] = useState(true);
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);

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
    setSignatureDone(false);
  };

  const markSignatureDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = !data.data.every(d => d === 0);
    setSignatureDone(hasContent);
    return hasContent;
  };

  const submitWalkin = async () => {
    if (!artistId || !name.trim() || submitting) return;
    setSubmitting(true);
    try {
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
        const newAllergies = healthQuestions.filter((_, i) => healthAnswers[i]);
        if (newAllergies.length > 0) {
          const existing = await db.clients.get(clientId);
          if (existing) {
            const merged = [...new Set([...(existing.allergies || []), ...newAllergies])];
            await db.clients.update(clientId, { allergies: merged });
          }
        }
      }

      const today = new Date().toISOString().slice(0, 10);
      const nowTime = new Date().toTimeString().slice(0, 5);
      const { createProjectWithAppointment } = await import('../lib/projectLogic');
      const { appointment } = await createProjectWithAppointment({
        artistId,
        clientId,
        title: 'Walk-in',
        designNotes: designIdea || bodyPart || 'Walk-in',
        projectStatus: 'in_progress',
        date: today,
        time: nowTime,
        duration,
        appointmentType: 'new_tattoo',
        appointmentStatus: depositAmount > 0 ? 'deposit_paid' : 'ready',
        waiverCompleted: true,
        walkIn: true,
        bodyPart: bodyPart || undefined,
        depositAmount: depositAmount || undefined,
      });
      const apptId = appointment.id;

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
              date: today, time: nowTime, duration,
              status: depositAmount > 0 ? 'deposit_paid' : 'ready',
              walkIn: true,
            }],
            clients: [],
          }),
        }).catch(() => {});
      }

      setStep('done');
    } catch {
      setStep('error');
    }
    setSubmitting(false);
  };

  if (!artistId) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 10, border: `1px solid ${THEME.border.default}`,
    background: THEME.bg.panel, color: 'white', fontSize: 16, outline: 'none',
    boxSizing: 'border-box',
  };

  const stepIndicator = () => {
    const steps = [
      { key: 'waiver', label: 'Waiver', number: 1 },
      { key: 'deposit', label: 'Deposit', number: 2 },
      { key: 'project', label: 'Project', number: 3 },
      { key: 'schedule', label: 'Schedule', number: 4 },
    ];
    const currentIdx = steps.findIndex(s => s.key === step);
    return (
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, justifyContent: 'center' }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: i <= currentIdx ? THEME.brand.primary : THEME.border.default,
              color: i <= currentIdx ? 'white' : THEME.text.subtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              transition: 'background 0.2s',
            }}>{s.number}</div>
            {i < steps.length - 1 && (
              <div style={{
                width: i < currentIdx ? 20 : 8, height: 2,
                background: i < currentIdx ? THEME.brand.primary : THEME.border.default,
                borderRadius: 1,
              }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const navButtons = (nextLabel: string, disabled = false, onNext?: () => void) => (
    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
      {step !== 'waiver' && (
        <button
          onClick={() => {
            const steps = ['waiver', 'deposit', 'project', 'schedule'];
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1] as any);
          }}
          style={{
            flex: 1, padding: '14px 20px', borderRadius: 12,
            border: `1px solid ${THEME.border.default}`, background: 'transparent',
            color: THEME.text.muted, fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Back
        </button>
      )}
      <button
        onClick={onNext || (() => {
          const steps = ['waiver', 'deposit', 'project', 'schedule'];
          const idx = steps.indexOf(step);
          if (idx < steps.length - 1) setStep(steps[idx + 1] as any);
        })}
        disabled={disabled}
        style={{
          flex: 1, padding: '14px 20px', borderRadius: 12, border: 'none',
          background: disabled ? THEME.border.default : THEME.brand.primary,
          color: 'white', fontSize: 15, fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {nextLabel}
      </button>
    </div>
  );

  const bgColor = THEME.bg.app;

  return (
    <div style={{ minHeight: '100dvh', background: bgColor, color: 'white', padding: 24, maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>✋</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Walk-in</h2>
        <p style={{ color: THEME.text.muted, fontSize: 13, marginTop: 2 }}>{studioName || 'the studio'}</p>
      </div>

      {stepIndicator()}

      {/* ===== STEP 1: Waiver ===== */}
      {step === 'waiver' && (
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: THEME.text.muted, marginBottom: 16 }}>
            Fill in your details and health info to get started.
          </p>

          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 4 }}>Your name *</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 4 }}>Phone</p>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: THEME.brand.info, marginBottom: 10 }}>Health Questionnaire</p>
            {healthQuestions.map((q, i) => (
              <div key={i} style={{
                background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`, borderRadius: 10, padding: '10px 14px', marginBottom: 6,
              }}>
                <p style={{ fontSize: 13, marginBottom: 6 }}>{q}</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: THEME.text.muted, cursor: 'pointer' }}>
                    <input type="radio" name={`h_${i}`} checked={healthAnswers[i]} onChange={() => {
                      const next = [...healthAnswers]; next[i] = true; setHealthAnswers(next);
                    }} style={{ width: 16, height: 16 }} />
                    Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: THEME.text.muted, cursor: 'pointer' }}>
                    <input type="radio" name={`h_${i}`} checked={!healthAnswers[i]} onChange={() => {
                      const next = [...healthAnswers]; next[i] = false; setHealthAnswers(next);
                    }} style={{ width: 16, height: 16 }} />
                    No
                  </label>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 6 }}>Signature *</p>
          <div style={{
            background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`, borderRadius: 12, padding: 12, marginBottom: 4,
          }}>
            <canvas
              ref={canvasRef}
              width={400} height={120}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => { endDraw(); markSignatureDone(); }} onMouseLeave={() => { endDraw(); markSignatureDone(); }}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => { endDraw(); markSignatureDone(); }}
              style={{
                width: '100%', height: 100, background: THEME.bg.panelAlt, borderRadius: 8,
                touchAction: 'none', cursor: 'crosshair',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <button onClick={clearCanvas} style={{
                padding: '4px 10px', borderRadius: 6, border: `1px solid ${THEME.border.default}`,
                background: 'transparent', color: THEME.text.subtle, fontSize: 11, cursor: 'pointer',
              }}>
                Clear
              </button>
              {signatureDone && <span style={{ fontSize: 11, color: THEME.brand.success }}>✓ Signed</span>}
            </div>
          </div>

          {navButtons('Continue', !name.trim() || !signatureDone)}
        </div>
      )}

      {/* ===== STEP 2: Deposit ===== */}
      {step === 'deposit' && (
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: THEME.text.muted, marginBottom: 16 }}>
            Secure your slot with a deposit. Fully refundable if cancelled 24h+ before.
          </p>

          <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 8 }}>Deposit amount</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {DEPOSIT_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => setDepositAmount(amt)}
                style={{
                  padding: '12px 20px', borderRadius: 10,
                  border: depositAmount === amt ? `2px solid ${THEME.brand.primary}` : `1px solid ${THEME.border.default}`,
                  background: depositAmount === amt ? `${THEME.brand.primary}20` : THEME.bg.panel,
                  color: 'white', fontSize: 15, fontWeight: depositAmount === amt ? 700 : 500,
                  cursor: 'pointer', minWidth: 70, textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {amt === 0 ? '$0' : `$${amt}`}
              </button>
            ))}
          </div>

          <div style={{
            background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`, borderRadius: 10, padding: 12, marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 4 }}>Custom amount</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: THEME.text.muted }}>$</span>
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(Number(e.target.value) || 0)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${THEME.border.default}`,
                  background: THEME.bg.panelAlt, color: 'white', fontSize: 16, outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{
            background: `${THEME.brand.info}10`, border: `1px solid ${THEME.brand.info}30`, borderRadius: 10, padding: 12,
          }}>
            <p style={{ fontSize: 12, color: THEME.brand.info }}>
              {depositAmount === 0
                ? 'No deposit required — you\'ll pay the full amount after the session.'
                : `A $${depositAmount} deposit will be requested. Pay at the front desk or via the payment link after check-in.`
              }
            </p>
          </div>

          {navButtons('Continue')}
        </div>
      )}

      {/* ===== STEP 3: Project ===== */}
      {step === 'project' && (
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: THEME.text.muted, marginBottom: 12 }}>
            Where do you want your tattoo? Pick a body part and tell us your idea.
          </p>

          <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 6 }}>Body part</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6, marginBottom: 16 }}>
            {BODY_PARTS.map(bp => (
              <button
                key={bp.id}
                onClick={() => setBodyPart(bp.id === bodyPart ? '' : bp.id)}
                style={{
                  padding: '8px 6px', borderRadius: 10,
                  border: bodyPart === bp.id ? `2px solid ${THEME.brand.primary}` : `1px solid ${THEME.border.default}`,
                  background: bodyPart === bp.id ? `${THEME.brand.primary}20` : THEME.bg.panel,
                  color: 'white', fontSize: 11, fontWeight: bodyPart === bp.id ? 700 : 500,
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 2 }}>{bp.icon}</div>
                <div>{bp.label}</div>
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 6 }}>Size</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['small', 'medium', 'large'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSize(s === size ? '' : s)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: size === s ? `2px solid ${THEME.brand.primary}` : `1px solid ${THEME.border.default}`,
                  background: size === s ? `${THEME.brand.primary}20` : THEME.bg.panel,
                  color: 'white', fontSize: 13, fontWeight: size === s ? 700 : 500,
                  cursor: 'pointer', textAlign: 'center', textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 4 }}>Design idea</p>
          <textarea
            value={designIdea}
            onChange={e => setDesignIdea(e.target.value)}
            placeholder="Describe what you want... style, size, placement details, reference ideas"
            rows={3}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: `1px solid ${THEME.border.default}`, background: THEME.bg.panel,
              color: 'white', fontSize: 14, outline: 'none', resize: 'vertical',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />

          {navButtons('Continue')}
        </div>
      )}

      {/* ===== STEP 4: Schedule ===== */}
      {step === 'schedule' && (
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: THEME.text.muted, marginBottom: 16 }}>
            Almost done! Confirm the details and check in.
          </p>

          {/* Summary card */}
          <div style={{ background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: THEME.text.subtle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: THEME.text.muted }}>Client</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
              </div>
              {bodyPart && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: THEME.text.muted }}>Body part</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{BODY_PARTS.find(b => b.id === bodyPart)?.label || bodyPart}</span>
                </div>
              )}
              {designIdea && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: THEME.text.muted }}>Design</span>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{designIdea.slice(0, 40)}{designIdea.length > 40 ? '...' : ''}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: THEME.text.muted }}>Deposit</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{depositAmount === 0 ? 'None' : `$${depositAmount}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: THEME.text.muted }}>Est. duration</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{duration} min</span>
              </div>
            </div>
          </div>

          {/* Duration slider */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 6 }}>Estimated duration: {duration} min</p>
            <input
              type="range"
              min={15}
              max={300}
              step={15}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: THEME.text.subtle }}>
              <span>15min</span>
              <span>5h</span>
            </div>
          </div>

          {/* Waiver reminder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>✅</span>
            <span style={{ fontSize: 12, color: THEME.text.muted }}>Waiver signed and health info recorded</span>
          </div>

          {navButtons('✋ Check In', submitting, submitWalkin)}
          {submitting && (
            <p style={{ fontSize: 12, color: THEME.text.subtle, textAlign: 'center', marginTop: 8 }}>
              Submitting...
            </p>
          )}
        </div>
      )}

      {/* ===== DONE ===== */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', paddingTop: 40, flex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>You're Checked In!</h2>
          <p style={{ color: THEME.text.muted, fontSize: 14, marginBottom: 8 }}>
            The artist will be with you shortly.
          </p>
          {depositAmount > 0 && (
            <p style={{ color: THEME.brand.info, fontSize: 13, background: `${THEME.brand.info}10`, borderRadius: 10, padding: 10 }}>
              💳 A ${depositAmount} deposit is due. Please pay at the front desk.
            </p>
          )}
        </div>
      )}

      {/* ===== ERROR ===== */}
      {step === 'error' && (
        <div style={{ textAlign: 'center', paddingTop: 40, flex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: THEME.text.muted, fontSize: 14, marginBottom: 16 }}>
            Please tell the artist to check the connection.
          </p>
          <button onClick={() => setStep('waiver')}
            style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: THEME.brand.primary, color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

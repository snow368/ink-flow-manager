import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type AppointmentRecord, type SessionRecord, type ClientRecord, type InventoryRecord } from '../db';
import {
  createSession, addTimelineEvent, addConsumable, addPhoto,
  addNote, finishSession, getElapsedMinutes, generateSummary,
} from '../lib/sessionManager';
import { getCommandsForLocale } from '../lib/voiceCommands';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';

export default function SessionPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryRecord[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const lang = detectInitialLanguage();

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<{ id: string; name: string; used: number; batchNumber?: string }[]>([]);
  const [markedConsumables, setMarkedConsumables] = useState<Map<string, { count: number; batchNumber?: string }>>(new Map());

  useEffect(() => {
    if (!appointmentId) return;
    db.appointments.get(appointmentId).then(a => {
      if (!a) { setError(t(lang, 'session_not_found')); return; }
      setAppointment(a);
      db.clients.get(a.clientId).then(c => setClient(c || null));
      const s = createSession(a);
      setSession(s);
      tryStartCamera();
    });
    db.inventory.orderBy('name').toArray().then(setInventoryItems);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [appointmentId]);

  const tick = useCallback(() => {
    if (session) setElapsed(getElapsedMinutes(session));
  }, [session]);

  const startTimer = () => { tick(); const i = setInterval(tick, 10000); setTimerInterval(i); };
  const pauseTimer = () => { if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null); } if (session) setSession({ ...session, status: 'paused', pausedAt: Date.now() }); };
  const resumeTimer = () => { if (session) setSession({ ...session, status: 'active' }); const i = setInterval(tick, 10000); setTimerInterval(i); };

  useEffect(() => {
    if (session?.status === 'active') startTimer();
    return () => { if (timerInterval) clearInterval(timerInterval); };
  }, [session?.status]);

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = navigator.language;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const addMessage = (msg: string) => setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const tryStartCamera = async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.setAttribute('playsinline', 'true'); videoRef.current.onloadedmetadata = () => videoRef.current?.play().then(() => setCameraReady(true)).catch(() => {}); setTimeout(() => { if (!cameraReady) setCameraReady(false); }, 5000); }
    } catch { setCameraReady(false); }
  };
  const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setCameraReady(false); };
  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !session || !cameraReady) { addMessage('Camera not ready'); speakMessage('Camera not available'); return; }
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.drawImage(video, 0, 0);
    const cropX = canvas.width * 0.1, cropY = canvas.height * 0.1, cropW = canvas.width * 0.8, cropH = canvas.height * 0.8;
    const cropped = document.createElement('canvas'); cropped.width = cropW; cropped.height = cropH;
    cropped.getContext('2d')?.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const data = cropped.toDataURL('image/jpeg', 0.85);
    setSession(addPhoto(session, data));
    addMessage(t(lang, 'session_photo_captured'));
    speakMessage(t(lang, 'session_photo_saved'));
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { addMessage(t(lang, 'session_voice_not_supported')); return; }
    if (voiceActive) { recognitionRef.current?.stop(); setVoiceActive(false); return; }
    const recognition = new SpeechRecognition(); recognition.continuous = true; recognition.interimResults = false; recognition.lang = navigator.language;
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      setVoiceText(transcript);
      const commands = getCommandsForLocale();
      const action = commands[transcript] || Object.keys(commands).find(k => transcript.includes(k));
      if (action) {
        const cmd = commands[action || transcript] || action;
        if (cmd === 'take_photo') { if (!cameraReady) tryStartCamera().then(() => setTimeout(takePhoto, 1500)); else takePhoto(); }
        else if (cmd === 'announce_time') { const msg = `${elapsed} minutes elapsed`; addMessage(msg); speakMessage(msg); }
        else if (cmd === 'pause_timer') { pauseTimer(); addMessage(t(lang, 'session_paused_msg')); }
        else if (cmd === 'resume_timer') { resumeTimer(); addMessage(t(lang, 'session_resumed_msg')); }
        else if (cmd === 'end_session') handleFinishClick();
        else addMessage('Command: ' + cmd);
      }
    };
    recognition.onerror = () => setVoiceActive(false);
    recognition.start(); recognitionRef.current = recognition;
    setVoiceActive(true); addMessage(t(lang, 'session_voice_active'));
  };

  const handleMarkItem = (item: InventoryRecord) => {
    if (!session) return;
    const prev = markedConsumables.get(item.id);
    const prevCount = prev?.count || 0;
    const updated = new Map(markedConsumables);
    updated.set(item.id, { count: prevCount + 1, batchNumber: item.batchNumber });
    setMarkedConsumables(updated);
    addMessage(`${t(lang, 'session_marked')} ${item.name} (${prevCount + 1})${item.batchNumber ? ' ' + t(lang, 'session_batch') + ' ' + item.batchNumber : ''}`);
  };

  const handleFinishClick = () => {
    const items: { id: string; name: string; used: number; batchNumber?: string }[] = [];
    for (const [id, data] of markedConsumables) {
      const item = inventoryItems.find(i => i.id === id);
      if (item) items.push({ id, name: item.name, used: data.count, batchNumber: data.batchNumber || item.batchNumber });
    }
    setCheckoutItems(items);
    setShowCheckout(true);
  };

  const handleConfirmCheckout = async () => {
    if (!session || !appointment) return;
    if (timerInterval) clearInterval(timerInterval);
    stopCamera();
    let updatedSession = session;
    for (const item of checkoutItems) {
      if (item.used <= 0) continue;
      updatedSession = addConsumable(updatedSession, item.id, item.used, item.batchNumber);
    }
    const finished = await finishSession(updatedSession);
    setSession(finished);
    addMessage(`Session finished! ${finished.photos.length} photos. ${checkoutItems.reduce((s, i) => s + i.used, 0)} items consumed.`);
    setShowCheckout(false);
    addMessage('Session saved! Redirecting to checkout...');
    setTimeout(() => navigate(`/pos?appointmentId=${appointment.id}`), 1500);
  };

  const handleSkipCheckout = async () => {
    if (!session || !appointment) return;
    if (timerInterval) clearInterval(timerInterval);
    stopCamera();
    const finished = await finishSession(session);
    setSession(finished);
    addMessage(`Session finished! ${finished.photos.length} photos. No inventory deducted.`);
    setShowCheckout(false);
    addMessage('Session saved! Redirecting to checkout...');
    setTimeout(() => navigate(`/pos?appointmentId=${appointment.id}`), 1500);
  };

  if (error) return <div style={{ padding: 24, color: 'white' }}><p>{error}</p><button onClick={() => navigate(-1)} style={{ color: '#60a5fa' }}>Go back</button></div>;
  if (!session) return <div style={{ padding: 24, color: 'white', textAlign: 'center' }}><p>{t(lang, 'session_starting')}</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: THEME.bg.app, color: 'white' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: THEME.bg.panel, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{t(lang, 'session_complete_title')}</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              {checkoutItems.length > 0 ? t(lang, 'session_review_consumables') : t(lang, 'session_no_consumables')}
            </p>

            {checkoutItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {checkoutItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderRadius: 8, padding: '8px 12px' }}>
                    <div>
                      <span style={{ fontSize: 14 }}>{item.name}</span>
                      {item.batchNumber && <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>{t(lang, 'session_batch')} {item.batchNumber}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => setCheckoutItems(prev => prev.map(i => i.id === item.id ? { ...i, used: Math.max(0, i.used - 1) } : i))} style={qtySmallBtn}>-</button>
                      <span style={{ fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{item.used}</span>
                      <button onClick={() => setCheckoutItems(prev => prev.map(i => i.id === item.id ? { ...i, used: i.used + 1 } : i))} style={qtySmallBtn}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{t(lang, 'session_skip_hint')}</p>
            )}

            <button onClick={handleConfirmCheckout} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: THEME.brand.success, color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              {t(lang, 'session_confirm_finish')}
            </button>
            <button onClick={handleSkipCheckout} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>
              {t(lang, 'session_skip_no_deduct')}
            </button>
            <button onClick={() => setShowCheckout(false)} style={{ width: '100%', marginTop: 6, padding: 8, borderRadius: 8, border: 'none', background: 'transparent', color: '#64748b', fontSize: 12 }}>
              {t(lang, 'session_cancel_return')}
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold' }}>{t(lang, 'session_title')}</h2>
          {cameraReady && <div style={{ width: 8, height: 8, borderRadius: 4, background: THEME.brand.success, boxShadow: '0 0 4px #22c55e' }} title={t(lang, 'session_camera_ready')} />}
        </div>
        <button onClick={() => { stopCamera(); navigate('/today'); }} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 20 }}>X</button>
      </div>
      {client && (
        <div style={{ padding: '0 16px' }}>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>{client.name} - {appointment?.type?.replace('_', ' ')}</p>
          {appointment?.bodyPart && <p style={{ color: '#93c5fd', fontSize: 12, marginTop: 2 }}>{t(lang, 'session_body')} {appointment.bodyPart}</p>}
          {appointment?.designNotes && <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>"{appointment.designNotes.slice(0, 80)}{(appointment.designNotes?.length || 0) > 80 ? '...' : ''}"</p>}
          {client.allergies && client.allergies.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
              {client.allergies.map((a: string, i: number) => (
                <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#7f1d1d', color: '#fca5a5' }}>{a}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <span style={{ fontSize: 42, fontWeight: 700, fontFamily: 'monospace' }}>{timeDisplay}</span>
        <span style={{ fontSize: 14, color: session.status === 'paused' ? '#fbbf24' : '#34d399', marginLeft: 10 }}>
          {session.status === 'active' ? t(lang, 'session_live') : session.status === 'paused' ? t(lang, 'session_paused_label') : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 24px', marginBottom: 12 }}>
        {session.status === 'active' ? <button onClick={pauseTimer} style={ctrlBtn('#fbbf24')}>{t(lang, 'session_pause')}</button> : <button onClick={resumeTimer} style={ctrlBtn('#34d399')}>{t(lang, 'session_resume')}</button>}
        <button onClick={toggleVoice} style={ctrlBtn(voiceActive ? '#ef4444' : '#8b5cf6')}>{voiceActive ? t(lang, 'session_voice_off') : t(lang, 'session_voice_on')}</button>
      </div>

      {voiceActive && <p style={{ color: '#a78bfa', fontSize: 13, padding: '0 24px', marginBottom: 6 }}>{t(lang, 'session_voice_hint')}</p>}

      <div style={{ padding: '0 24px', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {inventoryItems.filter(i => i.quantity > 0).map(item => (
            <button key={item.id} onClick={() => handleMarkItem(item)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: THEME.bg.panel, color: '#cbd5e1', fontSize: 12, cursor: 'pointer' }}>
              {item.name} {markedConsumables.has(item.id) ? `(${markedConsumables.get(item.id)?.count})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', marginBottom: 12 }}>
        <div style={{ background: THEME.bg.panel, borderRadius: 14, padding: 14, minHeight: 80 }}>
          {messages.length === 0 ? <p style={{ color: '#64748b', fontSize: 13 }}>{t(lang, 'session_log')}</p> : messages.map((m, i) => <p key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{m}</p>)}
        </div>
      </div>

      <div style={{ padding: '12px 24px' }}>
        <button onClick={handleFinishClick} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: THEME.brand.success, color: 'white', fontSize: 18, fontWeight: 700 }}>
          {t(lang, 'session_finish')}
        </button>
        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  );
}

const ctrlBtn = (bg: string): React.CSSProperties => ({
  flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: bg, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer',
});
const qtySmallBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 14, border: '1px solid #475569', background: 'transparent', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

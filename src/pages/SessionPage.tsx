import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord, type SessionRecord, type ClientRecord, type InventoryRecord } from '../db';
import {
  createSession, addTimelineEvent, addConsumable, addPhoto,
  addVideo, addNote, finishSession, getElapsedMinutes, generateSummary,
} from '../lib/sessionManager';
import { getCommandsForLocale } from '../lib/voiceCommands';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';
import { generateCaptionOptions, type CaptionOption } from '../lib/captionTemplates';

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

  const [user, setUser] = useState<UserRecord | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<{ id: string; name: string; used: number; batchNumber?: string }[]>([]);
  const [markedConsumables, setMarkedConsumables] = useState<Map<string, { count: number; batchNumber?: string }>>(new Map());
  const [captionOptions, setCaptionOptions] = useState<CaptionOption[]>([]);
  const [showCaptionPicker, setShowCaptionPicker] = useState(false);
  const [sharingPhoto, setSharingPhoto] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [flash, setFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoBlobsRef = useRef<Map<number, Blob>>(new Map());
  const videoIdxRef = useRef(0);

  useEffect(() => {
    if (!appointmentId) return;
    const current = localStorage.getItem('inkflow_current_user');
    if (current) db.users.get(current).then(u => setUser(u || null));
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

  const tryStartCamera = async (facing?: 'environment' | 'user') => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const mode = facing || cameraFacing;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.setAttribute('playsinline', 'true'); videoRef.current.onloadedmetadata = () => videoRef.current?.play().then(() => setCameraReady(true)).catch(() => {}); setTimeout(() => { if (!cameraReady) setCameraReady(false); }, 5000); }
    } catch { setCameraReady(false); }
  };
  const toggleCamera = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    setCameraReady(false);
    tryStartCamera(next);
  };
  const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setCameraReady(false); setRecording(false); if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop(); };
  const doCapture = () => {
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
    // Flash feedback
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  };

  const takePhoto = () => {
    doCapture();
  };

  const voiceTakePhoto = () => {
    if (!cameraReady) { tryStartCamera().then(() => setTimeout(voiceTakePhoto, 1500)); return; }
    // Countdown 3-2-1
    setCountdown(3);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('3');
      u.lang = navigator.language; u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
    let c = 3;
    const interval = setInterval(() => {
      c--;
      if (c > 0) {
        setCountdown(c);
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(String(c));
          u.lang = navigator.language; u.rate = 0.9;
          window.speechSynthesis.speak(u);
        }
      } else {
        clearInterval(interval);
        setCountdown(0);
        doCapture();
      }
    }, 1000);
  };

  const recordVideo = () => {
    if (!session || !streamRef.current) return;
    if (recording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
      addMessage('Video saved');
      speakMessage('Video saved');
      return;
    }
    // Start recording
    addMessage('Recording started');
    speakMessage('Recording started');
    const stream = streamRef.current;
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      if (blob.size < 1000) { addMessage('Recording too short, discarded.'); return; }
      const url = URL.createObjectURL(blob);
      const idx = videoIdxRef.current++;
      videoBlobsRef.current.set(idx, blob);
      setSession(prev => prev ? addVideo(prev, url) : prev);
      addMessage(`Video saved (${(blob.size / 1024).toFixed(0)}KB)`);
      setPreviewVideo(url);
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setRecording(true);
    setRecordSec(0);
  };

  // Recording timer + 15-second auto-stop
  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => setRecordSec(s => s + 1), 1000);
    const autoStop = setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
      setRecordSec(0);
      addMessage('Auto-stopped at 15s');
      speakMessage('Recording saved');
    }, 15000);
    return () => { clearInterval(interval); clearTimeout(autoStop); };
  }, [recording]);

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
        if (cmd === 'take_photo') { if (!recording) voiceTakePhoto(); else addMessage('Finish recording first'); }
        else if (cmd === 'record_video') { if (!cameraReady) tryStartCamera().then(() => setTimeout(recordVideo, 1500)); else recordVideo(); }
        else if (cmd === 'announce_time') { const msg = `${elapsed} minutes elapsed`; addMessage(msg); speakMessage(msg); }
        else if (cmd === 'pause_timer') { pauseTimer(); addMessage(t(lang, 'session_paused_msg')); }
        else if (cmd === 'resume_timer') { resumeTimer(); addMessage(t(lang, 'session_resumed_msg')); }
        else if (cmd === 'end_session') handleFinishClick();
        else if (cmd === 'emergency_stop') {
          if (recording) { recordVideo(); addMessage('Recording stopped'); }
          else { stopCamera(); pauseTimer(); addMessage('Emergency stop'); }
        }
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
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }@keyframes flashOut { 0% { opacity: 1; } 100% { opacity: 0; } }`}</style>
      {cameraReady ? (
        <div style={{ position: 'relative', margin: '0 24px 8px', borderRadius: 12, overflow: 'hidden', background: '#0f172a', aspectRatio: '4/3' }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          {/* Countdown overlay */}
          {countdown > 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
              <span style={{ fontSize: 96, fontWeight: 800, color: 'white', textShadow: '0 0 30px rgba(0,0,0,0.8)' }}>{countdown}</span>
            </div>
          )}
          {/* Flash overlay */}
          {flash && <div style={{ position: 'absolute', inset: 0, background: 'white' }} />}
          {/* Photo/video count badge */}
          {(session.photos.length > 0 || (session.videos?.length || 0) > 0) && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'white' }}>
              📷{session.photos.length} 🎥{session.videos?.length || 0}
            </div>
          )}
        </div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      )}

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
        <button onClick={() => {
          if (session.photos.length > 0 || (session.videos?.length || 0) > 0 || session.consumables.length > 0) {
            if (!confirm('End this session and go back to Today?')) return;
          }
          stopCamera(); navigate('/today');
        }} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 20 }}>X</button>
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

      {/* Camera toggle when off */}
      {!cameraReady && (
        <div style={{ padding: '0 24px', marginBottom: 8 }}>
          <button onClick={() => tryStartCamera()} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            📷 {t(lang, 'session_camera_start') || 'Turn on camera'}
          </button>
        </div>
      )}
      {/* Camera controls */}
      {cameraReady && (
        <div style={{ display: 'flex', gap: 8, padding: '0 24px', marginBottom: 8 }}>
          <button onClick={takePhoto} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#1e293b', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            📷 Photo
          </button>
          <button onClick={recordVideo} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
            background: recording ? '#dc2626' : '#1e293b',
            color: 'white', fontSize: recording ? 16 : 13, fontWeight: recording ? 800 : 600, cursor: 'pointer',
            animation: recording ? 'pulse 1s infinite' : 'none',
          }}>
            {recording ? `🔴 Stop (${recordSec}s)` : '🎥 Video'}
          </button>
          <button onClick={toggleCamera}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            🔄
          </button>
        </div>
      )}
      {/* Recording indicator bar */}
      {saving && (
        <div style={{ margin: '0 24px 8px', padding: '6px 12px', borderRadius: 8, background: '#1e3a5f', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#60a5fa' }} />
          <span style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600 }}>Saving video...</span>
        </div>
      )}
      {recording && (
        <div style={{ margin: '0 24px 8px', padding: '6px 12px', borderRadius: 8, background: '#7f1d1d', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ef4444', animation: 'pulse 0.8s infinite' }} />
          <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 600 }}>Recording... {recordSec}s / 15s</span>
          <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 600 }}>Tap STOP or auto-stops at 15s</span>
        </div>
      )}

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
        {/* Media gallery: photo/video thumbnails */}
        {(session.photos.length > 0 || (session.videos && session.videos.length > 0)) && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {session.photos.map((p, i) => (
              <img key={'p'+i} src={p} alt={`Photo ${i+1}`}
                style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }} onClick={() => setPreviewVideo(p)} />
            ))}
            {(session.videos || []).map((v, i) => (
              <div key={'v'+i} onClick={() => setPreviewVideo(v)}
                style={{ width: 80, height: 80, borderRadius: 10, background: '#0f172a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #334155', fontSize: 24 }}>
                ▶️
              </div>
            ))}
          </div>
        )}
        {/* Video preview modal */}
        {previewVideo && (
          <div onClick={() => setPreviewVideo(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
            {previewVideo.startsWith('blob:') || previewVideo.startsWith('data:video') ? (
              <video src={previewVideo} controls autoPlay playsInline
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12 }} />
            ) : (
              <img src={previewVideo} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12 }} />
            )}
          </div>
          </div>
        )}
        {session.photos.length > 0 && (
          <>
            {showCaptionPicker ? (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Choose a caption style:</p>
                {captionOptions.map((opt, i) => (
                  <button key={i} onClick={async () => {
                    setShowCaptionPicker(false);
                    setSharingPhoto(true);
                    const fullCaption = `${opt.caption}\n\n${opt.tags}`;
                    const lastPhoto = session.photos[session.photos.length - 1];
                    try {
                      if (navigator.share) {
                        const blob = await (await fetch(lastPhoto)).blob();
                        const file = new File([blob], 'tattoo.jpg', { type: 'image/jpeg' });
                        await navigator.share({ title: opt.label, text: fullCaption, files: [file] });
                      } else {
                        const blob = await (await fetch(lastPhoto)).blob();
                        await navigator.clipboard.write([new ClipboardItem({ 'image/jpeg': blob })]);
                        await navigator.clipboard.writeText(fullCaption);
                        addMessage('Photo + caption copied! Paste into Instagram.');
                      }
                    } catch { addMessage('Share cancelled or failed.'); }
                    setSharingPhoto(false);
                  }} style={{ width: '100%', textAlign: 'left', padding: 12, borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 12, cursor: 'pointer', marginBottom: 6, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</span>
                    <p style={{ marginTop: 4, color: '#cbd5e1' }}>{opt.caption}</p>
                    <p style={{ marginTop: 3, color: '#60a5fa', fontSize: 11 }}>{opt.tags}</p>
                  </button>
                ))}
                <button onClick={() => setShowCaptionPicker(false)}
                  style={{ width: '100%', padding: 8, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => {
                const typeName = (appointment?.type || 'tattoo').replace(/_/g, ' ');
                const bodyPart = appointment?.bodyPart || 'body';
                const artistName = user?.name || 'artist';
                const opts = generateCaptionOptions({
                  clientName: client?.name || 'client',
                  type: typeName,
                  bodyPart,
                  time: timeDisplay,
                  artistName,
                });
                setCaptionOptions(opts);
                setShowCaptionPicker(true);
              }}
                disabled={sharingPhoto}
                style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: sharingPhoto ? '#4b5563' : 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)', color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}>
                {sharingPhoto ? 'Sharing...' : `📸 Share to Instagram (${session.photos.length} photos${session.videos?.length ? ' + ' + session.videos.length + ' videos' : ''})`}
              </button>
            )}
          </>
        )}
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

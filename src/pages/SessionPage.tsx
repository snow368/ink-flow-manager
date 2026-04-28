import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type AppointmentRecord, type SessionRecord, type ClientRecord } from '../db';
import {
  createSession, addTimelineEvent, addConsumable, addPhoto,
  addNote, finishSession, getElapsedMinutes, generateSummary,
} from '../lib/sessionManager';
import { getCommandsForLocale } from '../lib/voiceCommands';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!appointmentId) return;
    db.appointments.get(appointmentId).then(a => {
      if (!a) { setError('Appointment not found'); return; }
      setAppointment(a);
      db.clients.get(a.clientId).then(c => setClient(c || null));
      const s = createSession(a);
      setSession(s);
    });
  }, [appointmentId]);

  const tick = useCallback(() => {
    if (session) setElapsed(getElapsedMinutes(session));
  }, [session]);

  const startTimer = () => {
    tick();
    const interval = setInterval(tick, 10000);
    setTimerInterval(interval);
  };

  const pauseTimer = () => {
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null); }
    if (session) setSession({ ...session, status: 'paused', pausedAt: Date.now() });
  };

  const resumeTimer = () => {
    if (session) setSession({ ...session, status: 'active' });
    const interval = setInterval(tick, 10000);
    setTimerInterval(interval);
  };

  useEffect(() => {
    if (session?.status === 'active') startTimer();
    return () => { if (timerInterval) clearInterval(timerInterval); };
  }, [session?.status]);

  const addMessage = (msg: string) => setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // 语音识别
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { addMessage('Voice control not supported in this browser'); return; }

    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    const commands = getCommandsForLocale();
    recognition.lang = navigator.language;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      setVoiceText(transcript);
      const action = commands[transcript] || Object.keys(commands).find(k => transcript.includes(k));
      if (action) handleVoiceAction(commands[action || transcript] || action);
    };

    recognition.onerror = () => setVoiceActive(false);
    recognition.start();
    recognitionRef.current = recognition;
    setVoiceActive(true);
    addMessage('Voice control active');
  };

  const handleVoiceAction = async (action: string) => {
    if (!session) return;
    const Actions: Record<string, () => void> = {
      take_photo: () => {
        const video = videoRef.current;
        if (video) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d')?.drawImage(video, 0, 0);
          const data = canvas.toDataURL('image/jpeg');
          setSession(addPhoto(session, data));
          addMessage('Photo taken');
        }
      },
      announce_time: () => addMessage(`Elapsed: ${elapsed} min`),
      pause_timer: () => { pauseTimer(); addMessage('Paused'); },
      resume_timer: () => { resumeTimer(); addMessage('Resumed'); },
      end_session: () => handleFinish(),
      session_info: () => addMessage(`${client?.name || 'Client'} - ${appointment?.type || 'Tattoo'} - ${elapsed}min elapsed`),
      use_needle: () => setSession(addTimelineEvent(addConsumable(session, 'needle', 1), 'consumable', 'New needle')),
      use_glove: () => setSession(addTimelineEvent(addConsumable(session, 'gloves', 1), 'consumable', 'Glove change')),
      allergy_note: () => setSession(addNote(session, voiceText, true)),
    };
    (Actions[action] || (() => addMessage('Command: ' + action)))();
  };

  const handleFinish = async () => {
    if (!session || !appointment) return;
    if (timerInterval) clearInterval(timerInterval);
    const finished = await finishSession(session);
    setSession(finished);
    addMessage('Session finished! Summary: ' + generateSummary(finished));
    setTimeout(() => navigate('/today'), 2000);
  };

  if (error) return <div style={{ padding: 24, color: 'white' }}><p>{error}</p><button onClick={() => navigate(-1)} style={{ color: '#60a5fa' }}>Go back</button></div>;
  if (!session) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>Session</h2>
        <button onClick={() => navigate('/today')} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 14 }}>✕</button>
      </div>

      {client && <p style={{ color: '#94a3b8', marginBottom: 4 }}>{client.name} · {appointment?.type?.replace('_', ' ')}</p>}

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <p style={{ fontSize: 48, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 2 }}>{timeDisplay}</p>
        <p style={{ fontSize: 14, color: session.status === 'paused' ? '#fbbf24' : '#34d399', marginTop: 4 }}>
          {session.status === 'active' ? 'In Progress' : session.status === 'paused' ? 'Paused' : session.status}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {session.status === 'active' ? (
          <button onClick={pauseTimer} style={btnStyle('#fbbf24')}>Pause</button>
        ) : (
          <button onClick={resumeTimer} style={btnStyle('#34d399')}>Resume</button>
        )}
        <button onClick={toggleVoice} style={btnStyle(voiceActive ? '#ef4444' : '#8b5cf6')}>
          {voiceActive ? 'Voice Off' : 'Voice On'}
        </button>
        <button onClick={() => { if (session) setSession(addPhoto(session, '')); addMessage('Photo saved'); }} style={btnStyle('#3b82f6')}>Photo</button>
      </div>

      {voiceActive && <p style={{ color: '#a78bfa', fontSize: 13, marginBottom: 12 }}>🎤 Listening... "{voiceText}"</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['needle', 'gloves', 'ink_black', 'ink_color'].map(item => (
          <button key={item} onClick={() => { setSession(addConsumable(session, item, 1)); addMessage(`Used: ${item}`); }} style={quickBtn}>
            {item.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, maxHeight: 180, overflowY: 'auto', marginBottom: 16 }}>
        {messages.length === 0 ? <p style={{ color: '#64748b', fontSize: 13 }}>Session log will appear here...</p> :
          messages.map((m, i) => <p key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{m}</p>)
        }
      </div>

      <button onClick={handleFinish} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: '#22c55e', color: 'white', fontSize: 18, fontWeight: 700 }}>
        Finish Session
      </button>
    </div>
  );
}

const btnStyle = (bg: string): React.CSSProperties => ({
  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
  background: bg, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
});

const quickBtn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8, border: '1px solid #334155',
  background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
};

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, type AppointmentRecord, type ClientRecord, type ProjectRecord } from '../db';
import { canCheckIn } from '../lib/qrCheckin';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';

type State = 'loading' | 'not_found' | 'checked_in' | 'too_early' | 'too_late' | 'ready';

function fmtDate(date: string, lang: AppLanguage) {
  const locale = lang === 'jp' ? 'ja' : lang;
  return new Date(date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function CheckinPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [state, setState] = useState<State>('loading');
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const lang = detectInitialLanguage();

  useEffect(() => {
    if (!appointmentId) { setState('not_found'); return; }
    db.appointments.get(appointmentId).then(async appt => {
      if (!appt) { setState('not_found'); return; }
      setAppointment(appt);
      if (appt.projectId) {
        const p = await db.projects.get(appt.projectId);
        setProject(p || null);
      }
      if (appt.clientId) {
        const c = await db.clients.get(appt.clientId);
        setClient(c || null);
      }
      if (appt.status === 'cancelled') { setState('too_late'); return; }
      if (appt.status === 'done') { setState('checked_in'); return; }
      if (!canCheckIn(appt)) { setState('too_early'); return; }
      setState('ready');
    });
  }, [appointmentId]);

  const handleCheckIn = async () => {
    if (!appointment || checkingIn) return;
    setCheckingIn(true);
    await db.appointments.update(appointment.id, { status: 'ready' });
    setState('checked_in');
    setCheckingIn(false);
  };

  if (state === 'loading') {
    return <CenterScreen><p style={{ color: '#94a3b8', fontSize: 16 }}>{t(lang, 'checkin_loading')}</p></CenterScreen>;
  }

  if (state === 'not_found') {
    return (
      <CenterScreen>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🔗</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t(lang, 'checkin_not_found')}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>{t(lang, 'checkin_invalid_link')}</p>
      </CenterScreen>
    );
  }

  if (state === 'checked_in') {
    const dateStr = appointment ? fmtDate(appointment.date, lang) : '';
    return (
      <CenterScreen>
        <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t(lang, 'checkin_checked_in')}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>{t(lang, 'checkin_all_set')}</p>
        {appointment && (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, width: '100%', maxWidth: 320 }}>
            <p style={{ fontSize: 15, color: '#e2e8f0', fontWeight: 600 }}>{dateStr}</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 2 }}>{appointment.time} — {appointment.type || t(lang, 'respond_confirm_btn')}</p>
            {client && <p style={{ fontSize: 14, color: '#e2e8f0', marginTop: 4 }}>{client.name}</p>}
          </div>
        )}
      </CenterScreen>
    );
  }

  if (state === 'too_early') {
    const apptTime = appointment ? new Date(appointment.date + 'T' + appointment.time + ':00') : null;
    return (
      <CenterScreen>
        <p style={{ fontSize: 48, marginBottom: 16 }}>⏰</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t(lang, 'checkin_too_early')}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
          {t(lang, 'checkin_early_desc')}
        </p>
        {apptTime && (
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>
            {apptTime.toLocaleDateString(lang === 'jp' ? 'ja' : lang, { weekday: 'long', month: 'long', day: 'numeric' })} at {appointment?.time}
          </p>
        )}
      </CenterScreen>
    );
  }

  if (state === 'too_late') {
    return (
      <CenterScreen>
        <p style={{ fontSize: 48, marginBottom: 16 }}>📅</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t(lang, 'checkin_closed')}</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>{t(lang, 'checkin_closed_desc')}</p>
      </CenterScreen>
    );
  }

  const dateStr = appointment ? fmtDate(appointment.date, lang) : '';

  return (
    <CenterScreen>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>{t(lang, 'checkin_title')}</h1>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24, width: '100%', maxWidth: 340 }}>
        {client && <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{client.name}</p>}
        <p style={{ fontSize: 15, color: '#e2e8f0', marginBottom: 4 }}>{dateStr}</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{appointment?.time}</p>
        {appointment?.type && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{appointment.type} — {appointment.duration}min</p>}
        {project?.bodyPart && <p style={{ fontSize: 13, color: '#93c5fd', marginTop: 2 }}>{t(lang, 'checkin_body')} {project.bodyPart}</p>}
      </div>
      <button
        onClick={handleCheckIn}
        disabled={checkingIn}
        style={{
          width: '100%', maxWidth: 340, padding: 16, borderRadius: 14, border: 'none',
          background: checkingIn ? '#4b5563' : '#22c55e', color: 'white',
          fontSize: 18, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {checkingIn ? t(lang, 'checkin_checking_in') : t(lang, 'checkin_im_here')}
      </button>
      <p style={{ fontSize: 11, color: '#475569', marginTop: 10 }}>{t(lang, 'checkin_arrived')}</p>
    </CenterScreen>
  );
}

function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh', background: '#0f172a', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      {children}
    </div>
  );
}

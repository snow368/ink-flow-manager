import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type ClientRecord, type AppointmentRecord } from '../db';
import { THEME } from '../lib/theme';
import { buildBirthdayMessage, getDormantClients } from '../lib/marketingLogic';

type Channel = 'whatsapp' | 'sms' | 'instagram' | 'facebook' | 'tiktok';
type TemplateKey = 'booking_confirm' | 'booking_reminder' | 'reschedule' | 'birthday_greeting' | 're_engagement';

const TEMPLATES: Record<TemplateKey, string> = {
  booking_confirm: 'Hi {clientName}, your appointment is booked for {date} at {time}. Reply to confirm or request changes.',
  booking_reminder: 'Reminder: your appointment is on {date} at {time}. Please arrive 10 minutes early.',
  reschedule: 'Hi {clientName}, your appointment has been updated to {date} at {time}. Reply if you need another time.',
  birthday_greeting: 'Happy birthday, {clientName}! Wishing you a wonderful day. From the studio.',
  re_engagement: 'Hey {clientName}! Long time no see — we miss you at the studio. Book your next session when ready.',
};

const CHANNEL_META: Record<Channel, { label: string; accent: string }> = {
  whatsapp: { label: 'WhatsApp', accent: '#22c55e' },
  sms: { label: 'SMS', accent: '#60a5fa' },
  instagram: { label: 'Instagram', accent: '#f43f5e' },
  facebook: { label: 'Facebook', accent: '#3b82f6' },
  tiktok: { label: 'TikTok', accent: '#f8fafc' },
};

function sanitizePhone(raw?: string) {
  return (raw || '').replace(/[^\d+]/g, '');
}

function formatDateHuman(date: string) {
  try {
    return new Date(date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return date;
  }
}

export default function Outreach() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [nextAppointment, setNextAppointment] = useState<AppointmentRecord | null>(null);
  const [templateKey, setTemplateKey] = useState<TemplateKey>('booking_reminder');
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    db.clients.orderBy('createdAt').reverse().toArray().then((list) => {
      setClients(list);
      if (list[0]) setSelectedClientId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setNextAppointment(null);
      return;
    }

    db.appointments.where('clientId').equals(selectedClientId).toArray().then((apps) => {
      const upcoming = apps
        .filter(a => a.status !== 'cancelled' && a.status !== 'done')
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] || null;
      setNextAppointment(upcoming);
    });
  }, [selectedClientId]);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId) || null, [clients, selectedClientId]);

  const message = useMemo(() => {
    const base = customMessage || TEMPLATES[templateKey];
    const dateValue = nextAppointment ? formatDateHuman(nextAppointment.date) : 'your selected date';
    const timeValue = nextAppointment?.time || 'your selected time';
    return base
      .split('{clientName}').join(selectedClient?.name || 'Client')
      .split('{date}').join(dateValue)
      .split('{time}').join(timeValue);
  }, [customMessage, templateKey, nextAppointment, selectedClient]);

  const openChannel = async () => {
    if (!selectedClient) return;

    const phone = sanitizePhone(selectedClient.phone);
    const encoded = encodeURIComponent(message);

    const map: Record<Channel, string> = {
      whatsapp: phone ? `https://wa.me/${phone.replace(/^\+/, '')}?text=${encoded}` : '',
      sms: phone ? `sms:${phone}?body=${encoded}` : '',
      instagram: 'https://www.instagram.com/direct/inbox/',
      facebook: 'https://www.facebook.com/messages/',
      tiktok: 'https://www.tiktok.com/messages',
    };

    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);

    const target = map[channel];
    if (!target) {
      alert('This client has no phone number. Add a phone for WhatsApp/SMS.');
      return;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ minHeight: '100dvh', background: `radial-gradient(1200px 600px at 10% -20%, #1d4ed8 0%, ${THEME.bg.app} 45%)`, color: THEME.text.primary, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2 }}>Client Messaging</h2>
        <button onClick={() => navigate('/me')} style={{ border: `1px solid ${THEME.border.default}`, background: 'transparent', color: THEME.text.muted, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>Back</button>
      </div>

      <div style={{ background: 'rgba(30,41,59,0.85)', border: `1px solid ${THEME.border.default}`, borderRadius: 16, padding: 16, backdropFilter: 'blur(6px)', marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: THEME.text.muted, marginBottom: 8 }}>Client</p>
        <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} style={{ width: '100%', borderRadius: 10, border: `1px solid ${THEME.border.default}`, background: THEME.bg.panelAlt, color: THEME.text.primary, padding: '10px 12px', fontSize: 14, marginBottom: 12 }}>
          {clients.length === 0 ? <option value="">No clients yet</option> : clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <p style={{ fontSize: 12, color: THEME.text.muted, marginBottom: 8 }}>Template</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
          {Object.entries(TEMPLATES).map(([key]) => (
            <button key={key} onClick={() => { setTemplateKey(key as TemplateKey); setCustomMessage(''); }} style={{ borderRadius: 10, border: 'none', padding: '10px 8px', background: templateKey === key ? THEME.brand.primary : THEME.bg.panelAlt, color: THEME.text.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {key.replace('_', ' ')}
            </button>
          ))}
        </div>

        <textarea value={message} onChange={(e) => setCustomMessage(e.target.value)} rows={5} style={{ width: '100%', borderRadius: 12, border: `1px solid ${THEME.border.default}`, background: THEME.bg.panelAlt, color: THEME.text.primary, padding: 12, fontSize: 14, boxSizing: 'border-box', resize: 'vertical', marginBottom: 12 }} />

        <p style={{ fontSize: 12, color: THEME.text.muted, marginBottom: 8 }}>Channel</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 8, marginBottom: 14 }}>
          {(Object.keys(CHANNEL_META) as Channel[]).map(ch => (
            <button key={ch} onClick={() => setChannel(ch)} style={{ borderRadius: 10, border: channel === ch ? `1px solid ${CHANNEL_META[ch].accent}` : `1px solid ${THEME.border.default}`, background: channel === ch ? `${CHANNEL_META[ch].accent}22` : THEME.bg.panelAlt, color: channel === ch ? THEME.text.primary : THEME.text.muted, padding: '9px 6px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {CHANNEL_META[ch].label}
            </button>
          ))}
        </div>

        <button onClick={openChannel} disabled={!selectedClient} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: 'linear-gradient(90deg, #e11d48 0%, #fb7185 100%)', color: 'white', fontSize: 15, fontWeight: 800, cursor: selectedClient ? 'pointer' : 'not-allowed', opacity: selectedClient ? 1 : 0.6 }}>
          {copied ? 'Message Copied - Opening Channel' : 'Send via Selected Channel'}
        </button>
      </div>

      <p style={{ fontSize: 12, color: THEME.text.subtle }}>
        Tip: Instagram/Facebook/TikTok open inbox first; message is copied so your artist can paste and send fast.
      </p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../db';
import { findMultipleAvailableTimes, getArtistAvailability, isDayOff, toMinutes } from '../lib/availability';
import { createWaitingListEntry } from '../lib/waitingList';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';

type Step = 'date' | 'info' | 'waiting_list_form' | 'success';

export default function EmbedBookingPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const [lang] = useState<AppLanguage>(detectInitialLanguage);
  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [style, setStyle] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (!selectedDate || !artistId) return;
    setSelectedTime('');
    loadSlots(selectedDate);
  }, [selectedDate, artistId]);

  async function loadSlots(date: string) {
    if (!artistId) return;
    const avail = await getArtistAvailability(artistId);
    if (isDayOff(date, avail.daysOff)) { setSlots([]); return; }
    const dayStart = toMinutes(avail.start);
    const dayEnd = toMinutes(avail.end);
    const existing = await db.appointments.where('date').equals(date).toArray();
    const times = findMultipleAvailableTimes(existing, dayStart, dayEnd, 60, dayStart);
    setSlots(times);
  }

  const handleJoinWaitingList = async () => {
    if (!name.trim() || !artistId) return;
    setLoading(true);
    try {
      await createWaitingListEntry({
        artistId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        bodyPart: bodyPart.trim() || undefined,
        style: style.trim() || undefined,
        preferredDate: selectedDate || undefined,
        preferredTime: selectedTime || undefined,
        note: note.trim() || undefined,
      });
      setStep('success');
    } catch (e) {
      setError(t(lang, 'embed_error'));
    } finally {
      setLoading(false);
    }
  };

  const renderDateStep = () => (
    <div style={{ padding: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'white' }}>{t(lang, 'embed_select_date')}</h2>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 8 }}>
        {dates.map(d => {
          const dateObj = new Date(d + 'T00:00:00');
          const isSelected = d === selectedDate;
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              style={{
                padding: '8px 10px', borderRadius: 10, border: isSelected ? '2px solid #e11d48' : '1px solid #334155',
                background: isSelected ? '#e11d4822' : 'transparent', color: isSelected ? 'white' : '#94a3b8',
                fontSize: 12, cursor: 'pointer', minWidth: 52, textAlign: 'center', flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 9, opacity: 0.6 }}>{dateObj.toLocaleDateString(lang === 'jp' ? 'ja' : lang, { weekday: 'short' })}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{dateObj.getDate()}</div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'white' }}>{t(lang, 'embed_available_times')}</h3>
          {slots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>{t(lang, 'embed_no_slots')}</p>
              <button
                onClick={() => setStep('waiting_list_form')}
                style={{ marginTop: 10, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#0f172a', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {t(lang, 'embed_join_waiting_list')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {slots.map(t => (
                <button
                  key={t}
                  onClick={() => { setSelectedTime(t); setStep('info'); }}
                  style={{ padding: '10px 8px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderInfoStep = () => (
    <div style={{ padding: 12 }}>
      <button onClick={() => setStep('date')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>← {t(lang, 'back')}</button>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'white' }}>{t(lang, 'embed_your_info')}</h2>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{selectedDate} at {selectedTime}</p>
      <input placeholder={t(lang, 'embed_name')} value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'embed_phone')} value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'embed_email')} value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'embed_body_part')} value={bodyPart} onChange={e => setBodyPart(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'embed_style')} value={style} onChange={e => setStyle(e.target.value)} style={inputStyle} />
      <textarea placeholder={t(lang, 'embed_notes')} value={note} onChange={e => setNote(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
      <button
        onClick={handleJoinWaitingList}
        disabled={loading || !name.trim()}
        style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: loading || !name.trim() ? '#4b5563' : '#e11d48', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        {loading ? t(lang, 'embed_submitting') : t(lang, 'embed_request_booking')}
      </button>
    </div>
  );

  const renderWaitingListForm = () => (
    <div style={{ padding: 12 }}>
      <button onClick={() => setStep('date')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>← {t(lang, 'back')}</button>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'white' }}>{t(lang, 'embed_join_waiting_list')}</h2>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{t(lang, 'embed_notify_message')}</p>
      <input placeholder={t(lang, 'embed_name')} value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'embed_phone')} value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'embed_email')} value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'embed_body_part')} value={bodyPart} onChange={e => setBodyPart(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'embed_preferred_style')} value={style} onChange={e => setStyle(e.target.value)} style={inputStyle} />
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{error}</p>}
      <button
        onClick={handleJoinWaitingList}
        disabled={loading || !name.trim()}
        style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: loading || !name.trim() ? '#4b5563' : '#f59e0b', color: '#0f172a', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        {loading ? t(lang, 'embed_joining') : t(lang, 'embed_join_waiting_list')}
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>✅</p>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 4 }}>{t(lang, 'embed_added_waiting_list')}</h2>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>{t(lang, 'embed_contact_message')}</p>
    </div>
  );

  return (
    <div style={{ background: '#0f172a', borderRadius: 16, maxWidth: 420, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {step === 'date' && renderDateStep()}
      {step === 'info' && renderInfoStep()}
      {step === 'waiting_list_form' && renderWaitingListForm()}
      {step === 'success' && renderSuccess()}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  marginBottom: 8,
  borderRadius: 10,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { getArtistAvailability, isDayOff, toMinutes, toTimeString, findMultipleAvailableTimes } from '../lib/availability';
import { createWaitingListEntry } from '../lib/waitingList';
import { getGoogleCalendarUrl, downloadIcsFile } from '../lib/calendarSync';

type Step = 'date' | 'info' | 'payment' | 'confirmed';

function getBookingDeposit(): number {
  try { return parseFloat(localStorage.getItem('inkflow_booking_deposit') || '0') || 0; } catch { return 0; }
}

export default function ClientBookingPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const [searchParams] = useSearchParams();
  const lang = detectInitialLanguage();
  const [artist, setArtist] = useState<UserRecord | null>(null);
  const [step, setStep] = useState<Step>('date');
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [workStart, setWorkStart] = useState('10:00');
  const [workEnd, setWorkEnd] = useState('22:00');

  // step 2 fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [style, setStyle] = useState('');
  const [note, setNote] = useState('');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'instagram' | 'phone' | 'email'>('whatsapp');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // confirmed state
  const [createdLeadId, setCreatedLeadId] = useState('');
  const [createdAppointmentId, setCreatedAppointmentId] = useState('');
  const [paying, setPaying] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [wlSubmitted, setWlSubmitted] = useState(false);
  const bookingDeposit = getBookingDeposit();

  useEffect(() => {
    const paid = searchParams.get('paid');
    const apptId = searchParams.get('appointment');
    const leadId = searchParams.get('lead');
    if (paid === '1' && apptId && leadId) {
      db.appointments.update(apptId, { status: 'deposit_paid', depositAmount: Math.round(bookingDeposit * 100) });
      setCreatedLeadId(leadId);
      setCreatedAppointmentId(apptId);
      setStep('confirmed');
      // Clean URL
      navigate(`/book/${artistId}`, { replace: true });
      return;
    }
    if (searchParams.get('canceled') === '1') {
      setStep('info');
      navigate(`/book/${artistId}`, { replace: true });
      return;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!artistId) return;
    db.users.get(artistId).then(async u => {
      if (!u) { setLoading(false); return; }
      setArtist(u);
      const avail = await getArtistAvailability(artistId);
      setWorkStart(avail.start);
      setWorkEnd(avail.end);
      setDaysOff(avail.daysOff);
      const apps = await db.appointments
        .where('artistId').equals(artistId)
        .filter(a => a.status !== 'cancelled')
        .toArray();
      setAppointments(apps);
      const today = new Date().toISOString().slice(0, 10);
      setSelectedDate(today);
      loadSlots(today, apps, avail.start, avail.end);
      setLoading(false);
    });
  }, [artistId]);

  const loadSlots = (dateStr: string, apps: AppointmentRecord[], start: string, end: string) => {
    const dayApps = apps.filter(a => a.date === dateStr);
    const dayStart = toMinutes(start);
    const dayEnd = toMinutes(end);
    const slots = findMultipleAvailableTimes(dayApps, dayStart, dayEnd, 60, dayStart, 12);
    setAvailableSlots(slots);
  };

  const weekDays = useMemo(() => {
    const days: { dateStr: string; label: string; dayNum: number; disabled: boolean }[] = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dateStr,
        label: dayLabels[d.getDay()],
        dayNum: d.getDate(),
        disabled: isDayOff(dateStr, daysOff),
      });
    }
    return days;
  }, [daysOff]);

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime('');
    const dayApps = appointments.filter(a => a.date === dateStr);
    const slots = findMultipleAvailableTimes(dayApps, toMinutes(workStart), toMinutes(workEnd), 60, toMinutes(workStart), 12);
    setAvailableSlots(slots);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const goToInfo = () => {
    if (!selectedTime) return;
    setStep('info');
  };

  const submit = async () => {
    if (!name.trim() || !artistId) {
      setError('Please enter your name.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const now = Date.now();
      const leadId = 'lead_' + now + '_' + Math.random().toString(36).slice(2, 6);
      const clientId = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);

      await db.clients.add({
        id: clientId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        createdAt: now,
      });

      await db.leads.add({
        id: leadId,
        artistId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        source: 'other',
        consultMode: 'consult_booking',
        status: 'booked',
        bodyPart: bodyPart.trim() || undefined,
        style: style.trim() || undefined,
        note: note.trim() || undefined,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
        createdAt: now,
      });

      const apptId = 'appt_' + now + '_' + Math.random().toString(36).slice(2, 8);
      await db.appointments.add({
        id: apptId,
        clientId,
        artistId,
        date: selectedDate,
        time: selectedTime,
        duration: 60,
        type: 'consultation',
        status: 'unconfirmed',
        waiverCompleted: false,
        createdAt: now,
      });

      setCreatedLeadId(leadId);
      setCreatedAppointmentId(apptId);
      if (bookingDeposit > 0) {
        setStep('payment');
      } else {
        setStep('confirmed');
      }
    } catch (e: any) {
      setError(e?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!createdLeadId || !createdAppointmentId || !artistId) return;
    setPaying(true);
    setError('');
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/book/${artistId}?paid=1&appointment=${createdAppointmentId}&lead=${createdLeadId}`;
      const cancelUrl = `${origin}/book/${artistId}?canceled=1`;
      const res = await fetch('/api/stripe/client-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          amount: bookingDeposit,
          currency: (artist?.country || 'US').toLowerCase() === 'jp' ? 'jpy' : 'usd',
          clientName: name.trim(),
          leadId: createdLeadId,
          appointmentId: createdAppointmentId,
          successUrl,
          cancelUrl,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Payment service unavailable');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24 }}>Loading...</div>;
  if (!artist && !loading) return <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24 }}>Artist not found. Please check the link.</div>;

  const dateDisplay = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24, maxWidth: 760, margin: '0 auto' }}>
      {step === 'date' && (
        <>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{t(lang, 'book_appointment')}</h2>
          {artist?.studioName && <p style={{ color: '#94a3b8', marginBottom: 4, fontSize: 14 }}>{artist.studioName}</p>}
          {artist?.instagramHandle && (
            <p style={{ color: '#f43f5e', marginBottom: 12, fontSize: 13 }}>@{artist.instagramHandle.replace(/^@/, '')}</p>
          )}

          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{t(lang, 'select_date')}</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #1e293b', scrollbarWidth: 'none' }}>
            {weekDays.map(day => {
              const selected = day.dateStr === selectedDate;
              const disabled = day.disabled;
              return (
                <button
                  key={day.dateStr}
                  onClick={() => !disabled && handleDateSelect(day.dateStr)}
                  disabled={disabled}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '8px 10px', borderRadius: 14, border: 'none',
                    background: selected ? '#e11d48' : disabled ? '#0f172a' : 'transparent',
                    color: disabled ? '#333' : selected ? 'white' : '#e2e8f0',
                    fontSize: 12, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
                    minWidth: 46, opacity: disabled ? 0.3 : 1,
                  }}
                >
                  <span style={{ fontSize: 10 }}>{day.label}</span>
                  <span style={{ fontSize: 16, fontWeight: selected ? 700 : 500 }}>{day.dayNum}</span>
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 8 }}>{dateDisplay} — {t(lang, 'available_slots')}</p>
          {availableSlots.length === 0 ? (
            <>
              <p style={{ color: '#94a3b8', fontSize: 14, padding: '20px 0 8px' }}>{t(lang, 'no_slots_available')}</p>
              {!showWaitlist && !wlSubmitted && (
                <button onClick={() => setShowWaitlist(true)}
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #a855f7', background: '#a855f722', color: '#c084fc', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
                  Join Waiting List
                </button>
              )}
              {wlSubmitted && (
                <div style={{ background: '#1e293b', border: '1px solid #22c55e44', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>Added to Waiting List</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>The artist will contact you when a slot opens up.</p>
                </div>
              )}
              {showWaitlist && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#c084fc', fontWeight: 600, marginBottom: 10 }}>Join Waiting List</p>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" style={{ ...inputStyle, marginBottom: 8 }} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" style={{ ...inputStyle, marginBottom: 8 }} />
                  <input value={bodyPart} onChange={e => setBodyPart(e.target.value)} placeholder="Body part" style={{ ...inputStyle, marginBottom: 8 }} />
                  <input value={style} onChange={e => setStyle(e.target.value)} placeholder="Style" style={{ ...inputStyle, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowWaitlist(false)}
                      style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={async () => {
                      if (!name.trim() || !artistId) return;
                      await createWaitingListEntry({
                        artistId,
                        name: name.trim(),
                        phone: phone.trim() || undefined,
                        bodyPart: bodyPart.trim() || undefined,
                        style: style.trim() || undefined,
                        preferredDate: selectedDate || undefined,
                      });
                      setShowWaitlist(false);
                      setWlSubmitted(true);
                    }} disabled={!name.trim()}
                      style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: name.trim() ? '#a855f7' : '#4b5563', color: 'white', fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed' }}>
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => handleTimeSelect(slot)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 10,
                    border: selectedTime === slot ? '2px solid #e11d48' : '1px solid #334155',
                    background: selectedTime === slot ? '#e11d4822' : '#1e293b',
                    color: selectedTime === slot ? 'white' : '#cbd5e1',
                    fontSize: 15,
                    fontWeight: selectedTime === slot ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          <button onClick={goToInfo} disabled={!selectedTime} style={{
            width: '100%', padding: 14, borderRadius: 12, border: 'none',
            background: selectedTime ? '#e11d48' : '#4b5563',
            color: 'white', fontSize: 16, fontWeight: 700,
            cursor: selectedTime ? 'pointer' : 'not-allowed',
          }}>
            Continue
          </button>
        </>
      )}

      {step === 'info' && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{t(lang, 'your_info')}</h2>
          <p style={{ color: '#94a3b8', marginBottom: 14, fontSize: 13 }}>
            {dateDisplay} at <strong style={{ color: 'white' }}>{selectedTime}</strong>
          </p>

          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" style={inputStyle} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />

          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{t(lang, 'tattoo_details')}</p>
          <input value={bodyPart} onChange={e => setBodyPart(e.target.value)} placeholder="Body part (e.g. left arm)" style={inputStyle} />
          <input value={style} onChange={e => setStyle(e.target.value)} placeholder="Style (e.g. fine line, traditional)" style={inputStyle} />
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Any notes for the artist" style={{ ...inputStyle, resize: 'vertical' }} />

          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{t(lang, 'preferred_contact')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
            {(['whatsapp', 'instagram', 'phone', 'email'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setPreferredContact(ch)}
                style={{
                  padding: '8px',
                  borderRadius: 8,
                  border: preferredContact === ch ? '2px solid #e11d48' : '1px solid #334155',
                  background: preferredContact === ch ? '#e11d4822' : '#0f172a',
                  color: preferredContact === ch ? 'white' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {ch}
              </button>
            ))}
          </div>

          {error && <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 10 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep('date')} style={{
              flex: 1, padding: 14, borderRadius: 12, border: '1px solid #334155',
              background: 'transparent', color: '#94a3b8', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              {t(lang, 'back')}
            </button>
            <button onClick={() => void submit()} disabled={submitting || !name.trim()} style={{
              flex: 2, padding: 14, borderRadius: 12, border: 'none',
              background: submitting || !name.trim() ? '#4b5563' : '#e11d48',
              color: 'white', fontSize: 15, fontWeight: 700,
              cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'Submitting...' : t(lang, 'submit_request')}
            </button>
          </div>
        </>
      )}

      {step === 'payment' && (
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Secure Deposit</h2>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 14 }}>
            A ${bookingDeposit.toFixed(2)} deposit is required to confirm your appointment.
          </p>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Appointment</span>
              <span style={{ fontSize: 13 }}>{dateDisplay} at {selectedTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Client</span>
              <span style={{ fontSize: 13 }}>{name}</span>
            </div>
            <div style={{ borderTop: '1px solid #334155', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Deposit</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>${bookingDeposit.toFixed(2)}</span>
            </div>
          </div>

          {error && <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Secured by Stripe. Your card details are never stored on our servers.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handlePayDeposit} disabled={paying}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: paying ? '#4b5563' : '#635bff',
                color: 'white', fontSize: 16, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer' }}>
              {paying ? 'Redirecting to Stripe...' : `Pay $${bookingDeposit.toFixed(2)} Deposit`}
            </button>
            <button onClick={() => setStep('confirmed')}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155',
                background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              Skip Payment for Now
            </button>
          </div>
        </div>
      )}

      {step === 'confirmed' && (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t(lang, 'booking_confirmed')}</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>
            {bookingDeposit > 0
              ? 'Your deposit has been received. The artist will confirm your appointment shortly.'
              : 'The artist will review your request and confirm.'}
          </p>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{t(lang, 'appointment_summary')}</p>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{dateDisplay} at {selectedTime}</p>
            <p style={{ fontSize: 13, color: '#cbd5e1' }}>{name} — {bodyPart || 'Tattoo consultation'}</p>
            {style && <p style={{ fontSize: 13, color: '#94a3b8' }}>Style: {style}</p>}
            {bookingDeposit > 0 && (
              <p style={{ fontSize: 13, color: '#4ade80', marginTop: 4 }}>
                Deposit paid: ${bookingDeposit.toFixed(2)}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => {
              const calUrl = getGoogleCalendarUrl({
                id: createdAppointmentId || '',
                clientId: '', artistId: artistId || '', date: selectedDate, time: selectedTime,
                duration: 60, status: 'deposit_paid', waiverCompleted: false, createdAt: Date.now(),
                clientName: name,
              });
              window.open(calUrl, '_blank', 'noopener,noreferrer');
            }} style={{
              width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155',
              background: 'transparent', color: '#cbd5e1', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              📅 Add to Calendar
            </button>
            <button onClick={() => {
              downloadIcsFile({
                id: createdAppointmentId || '',
                clientId: '', artistId: artistId || '', date: selectedDate, time: selectedTime,
                duration: 60, status: 'deposit_paid', waiverCompleted: false, createdAt: Date.now(),
                clientName: name,
              });
            }} style={{
              width: '100%', padding: 10, borderRadius: 12, border: '1px solid #334155',
              background: 'transparent', color: '#64748b', fontSize: 12, cursor: 'pointer',
            }}>
              Download .ics file
            </button>
            {artist?.whatsappPhone && (
              <button onClick={() => {
                const phone = artist.whatsappPhone?.replace(/[^\d+]/g, '') || '';
                const msg = encodeURIComponent(
                  `Hi, I just booked an appointment for ${dateDisplay} at ${selectedTime}. My name is ${name}.`
                );
                window.open(`https://wa.me/${phone.replace(/^\+/, '')}?text=${msg}`, '_blank', 'noopener,noreferrer');
              }} style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: '#22c55e', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>
                {t(lang, 'contact_whatsapp')}
              </button>
            )}
            {artist?.instagramHandle && (
              <button onClick={() => {
                const msg = `Hi, I just booked an appointment for ${dateDisplay} at ${selectedTime}. My name is ${name}.`;
                navigator.clipboard.writeText(msg);
                window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
              }} style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>
                {t(lang, 'contact_instagram')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: 10,
  borderRadius: 10,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  boxSizing: 'border-box',
};

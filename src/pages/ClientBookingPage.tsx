import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord, type PortfolioRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { getArtistAvailability, isDayOff, toMinutes, toTimeString, findMultipleAvailableTimes } from '../lib/availability';
import { createWaitingListEntry } from '../lib/waitingList';
import { getGoogleCalendarUrl, downloadIcsFile } from '../lib/calendarSync';
import { trackClientReferral } from '../lib/clientReferral';
import { getBackendUrl } from '../lib/backendApi';

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
  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioRecord[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const bookingDeposit = getBookingDeposit();

  useEffect(() => {
    const paid = searchParams.get('paid');
    const apptId = searchParams.get('appointment');
    const leadId = searchParams.get('lead');
    if (paid === '1' && apptId && leadId) {
      void (async () => {
        const appt = await db.appointments.get(apptId);
        await db.appointments.update(apptId, { status: 'deposit_paid' });
        if (appt?.projectId) {
          await db.projects.update(appt.projectId, {
            depositAmount: Math.round(bookingDeposit * 100),
            depositStatus: 'paid',
            updatedAt: Date.now(),
          });
        }
        setCreatedLeadId(leadId);
        setCreatedAppointmentId(apptId);
        setStep('confirmed');
        navigate(`/book/${artistId}`, { replace: true });
      })();
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
    // Pre-fill style from URL param
    const styleParam = searchParams.get('style');
    if (styleParam) { setStyle(styleParam); }
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
      // Load public portfolio
      const photos = await db.portfolio
        .where('artistId').equals(artistId)
        .filter(p => p.isPublic)
        .reverse()
        .sortBy('createdAt');
      setPortfolioPhotos(photos);
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

      const refCode = searchParams.get('ref') || '';
      await db.leads.add({
        id: leadId,
        artistId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        source: 'other',
        referrerCode: refCode || undefined,
        consultMode: 'consult_booking',
        status: 'booked',
        bodyPart: bodyPart.trim() || undefined,
        style: style.trim() || undefined,
        note: note.trim() || undefined,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
        createdAt: now,
      });

      if (refCode) {
        trackClientReferral(refCode, leadId).catch(() => {});
      }

      const { createProjectWithAppointment } = await import('../lib/projectLogic');
      const { appointment } = await createProjectWithAppointment({
        artistId,
        clientId,
        title: bodyPart.trim() ? `${bodyPart.trim()} tattoo` : `${name.trim()} consultation`,
        sourceLeadId: leadId,
        style: style.trim() || undefined,
        bodyPart: bodyPart.trim() || undefined,
        designNotes: note.trim() || undefined,
        projectStatus: 'scheduled',
        date: selectedDate,
        time: selectedTime,
        duration: 60,
        appointmentType: 'consultation',
        appointmentStatus: 'unconfirmed',
        referrerCode: refCode || undefined,
      });
      const apptId = appointment.id;
      await db.leads.update(leadId, { convertedProjectId: appointment.projectId, convertedAt: now });

      // Notify backend (async, non-blocking)
      const bu = getBackendUrl();
      if (bu && artistId) {
        fetch(`${bu}/api/booking/${artistId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: selectedDate, time: selectedTime, name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, placement: bodyPart.trim() || undefined, idea: note.trim() || undefined, origin: window.location.origin }),
        }).catch(() => {});
        // Create waiver stub for remote signing
        fetch(`${bu}/api/waiver/create-stub`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-secret': localStorage.getItem('inkflow_backend_secret') || '' },
          body: JSON.stringify({
            appointmentId: apptId,
            clientName: name.trim(),
            artistName: artist?.name || artist?.email || 'Artist',
            shopName: artist?.studioName || '',
            appointmentType: 'consultation',
            country: artist?.country || '',
            clientId,
          }),
        }).catch(() => {});
      }

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

          {/* Portfolio gallery */}
          {portfolioPhotos.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowPortfolio(!showPortfolio)}
                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 8, fontWeight: 600 }}>
                {showPortfolio ? 'Hide portfolio' : `View portfolio (${portfolioPhotos.length} works)`}
              </button>
              {showPortfolio && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  {portfolioPhotos.slice(0, 9).map(photo => (
                    <div key={photo.id}
                      style={{ aspectRatio: '1/1', overflow: 'hidden', borderRadius: 8, background: '#0f172a' }}>
                      <img src={photo.thumbnailUrl || photo.imageUrl} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  {portfolioPhotos.length > 9 && (
                    <div style={{ aspectRatio: '1/1', borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#64748b' }}>
                      +{portfolioPhotos.length - 9}
                    </div>
                  )}
                </div>
              )}
            </div>
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
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (for booking confirmation)" style={inputStyle} />

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
            <button onClick={async () => {
              if (!createdAppointmentId) return;
              const appt = await db.appointments.get(createdAppointmentId);
              if (!appt) return;
              const { enrichAppointment } = await import('../lib/projectLogic');
              const calUrl = getGoogleCalendarUrl(await enrichAppointment(appt));
              window.open(calUrl, '_blank', 'noopener,noreferrer');
            }} style={{
              width: '100%', padding: 14, borderRadius: 12, border: '1px solid #334155',
              background: 'transparent', color: '#cbd5e1', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              📅 Add to Calendar
            </button>
            <button onClick={async () => {
              if (!createdAppointmentId) return;
              const appt = await db.appointments.get(createdAppointmentId);
              if (!appt) return;
              const { enrichAppointment } = await import('../lib/projectLogic');
              downloadIcsFile(await enrichAppointment(appt));
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
            <button onClick={() => {
              const waiverUrl = `${window.location.origin}/public-waiver/${createdAppointmentId}`;
              if (navigator.share) {
                navigator.share({ title: 'Sign Your Waiver', text: 'Please sign your waiver before your appointment:', url: waiverUrl });
              } else {
                navigator.clipboard.writeText(waiverUrl);
                alert('Waiver link copied to clipboard!');
              }
            }} style={{
              width: '100%', padding: 14, borderRadius: 12, border: '1px solid #6366f1',
              background: '#6366f122', color: '#a5b4fc', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              📝 Sign Waiver Online
            </button>
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

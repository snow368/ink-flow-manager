import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBackendUrl } from '../lib/backendApi';

interface BookingInfo {
  id: string;
  artistId: string;
  date: string;
  time: string;
  clientName: string;
  placement?: string;
  status: string;
  paymentLink?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: 'Pending Confirmation',
  confirmed: 'Confirmed',
  paid: 'Paid',
};

export default function ConfirmBookingPage() {
  const { artistId, bookingId } = useParams<{ artistId: string; bookingId: string }>();
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const justPaid = new URLSearchParams(window.location.search).get('paid') === '1';

  useEffect(() => {
    if (!artistId || !bookingId) return;
    const base = getBackendUrl();
    if (!base) { setLoading(false); setError('Backend not configured'); return; }
    fetch(`${base}/api/booking/${artistId}/${bookingId}`)
      .then(r => r.json())
      .then(data => { setBooking(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [artistId, bookingId]);

  const handleConfirm = async () => {
    if (!artistId || !bookingId) return;
    setConfirming(true);
    const base = getBackendUrl();
    if (!base) { setError('Backend not configured'); setConfirming(false); return; }
    try {
      const res = await fetch(`${base}/api/booking/${artistId}/${bookingId}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setConfirmed(true);
        if (data.paymentLink) setBooking(prev => prev ? { ...prev, paymentLink: data.paymentLink, status: 'confirmed' } : prev);
      } else {
        setError(data.error || 'Confirmation failed');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    }
    setConfirming(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
        Loading...
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fca5a5', padding: 24 }}>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Oops</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>{error}</p>
      </div>
    );
  }

  if (!booking) return null;

  const isPaidOrConfirmed = booking.status === 'confirmed' || booking.status === 'paid';
  const dateDisplay = booking.date
    ? new Date(booking.date + 'T00:00:00').toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>

        {confirmed || isPaidOrConfirmed || justPaid ? (
          <>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
              {justPaid ? 'Deposit Paid!' : 'Appointment Confirmed!'}
            </h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>
              {justPaid
                ? 'Your deposit has been received. The artist will see the payment and prepare for your appointment.'
                : 'Your appointment has been confirmed. The artist will see it in their schedule.'}
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>📅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Confirm Your Appointment</h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
              Please confirm your booking so the artist can prepare for you.
            </p>
          </>
        )}

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Appointment Details
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{dateDisplay} at {booking.time}</p>
          {booking.placement && <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 4 }}>Placement: {booking.placement}</p>}
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>Name: {booking.clientName}</p>
          <div style={{ marginTop: 8 }}>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 10,
              background: isPaidOrConfirmed ? '#166534' : '#334155',
              color: isPaidOrConfirmed ? '#4ade80' : '#94a3b8', fontWeight: 600,
            }}>
              {STATUS_LABEL[booking.status] || booking.status}
            </span>
          </div>
        </div>

        {error && <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

        {!isPaidOrConfirmed && !confirmed && !justPaid && (
          <button onClick={handleConfirm} disabled={confirming}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              background: confirming ? '#4b5563' : '#e11d48',
              color: 'white', fontSize: 16, fontWeight: 700,
              cursor: confirming ? 'not-allowed' : 'pointer',
            }}>
            {confirming ? 'Confirming...' : '✅ Confirm Appointment'}
          </button>
        )}

        {booking.paymentLink && (
          <div style={{ marginTop: 16, background: '#0a2a1a', border: '1px solid #22c55e44', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', marginBottom: 8 }}>Deposit Required</p>
            <p style={{ fontSize: 12, color: '#86efac', marginBottom: 12 }}>Place a deposit to secure your appointment.</p>
            <a href={booking.paymentLink} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-block', padding: '12px 24px', borderRadius: 10,
                background: '#22c55e', color: '#052e16', fontSize: 14, fontWeight: 700,
                textDecoration: 'none',
              }}>
              Pay Deposit Now
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

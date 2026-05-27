import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReferralBySlug } from '../lib/clientReferral';
import type { ClientReferralRecord } from '../db';

export default function ReferralShortPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [ref, setRef] = useState<ClientReferralRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    getReferralBySlug(slug).then(r => {
      setRef(r);
      setLoading(false);
    });
  }, [slug]);

  const refLink = ref ? `${window.location.origin}/book/${ref.artistId}?ref=${ref.code}` : '';
  const shareWA = () => {
    const msg = encodeURIComponent(`Get a discount on your next tattoo! Book here: ${refLink}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bg = '#0f172a';
  const panel = '#1e293b';
  const border = '#334155';

  if (loading) {
    return (
      <div style={{ background: bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Loading...
      </div>
    );
  }

  if (!ref) {
    return (
      <div style={{ background: bg, minHeight: '100dvh', color: 'white', padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link not found</h2>
        <p style={{ color: '#94a3b8' }}>This referral link is invalid or expired.</p>
      </div>
    );
  }

  const name = ref.referrerName || 'A friend';
  const discount = ref.friendDiscountAmount || 50;

  return (
    <div style={{ background: bg, minHeight: '100dvh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: panel, borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          {name} invited you!
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
          Book your session and get ${discount} off when you check out.
        </p>

        <div style={{ background: '#1a2332', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <p style={{ color: '#fbbf24', fontSize: 36, fontWeight: 800, margin: 0 }}>${discount}</p>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>off your first session</p>
        </div>

        {ref.referrerName && (
          <p style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>
            You and {ref.referrerName} both save when you complete your session.
          </p>
        )}

        <button onClick={() => navigate(`/book/${ref.artistId}?ref=${ref.code}`)}
          style={{
            width: '100%', padding: 14, borderRadius: 12, border: 'none',
            background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', marginBottom: 12,
          }}>
          Book Your Appointment
        </button>

        <p style={{ color: '#475569', fontSize: 12, marginBottom: 20 }}>
          Discount applied at checkout after your session.
        </p>

        <div style={{ borderTop: `1px solid ${border}`, paddingTop: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
            Share this link and earn rewards too
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyLink}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none',
                background: copied ? '#14532d' : border, color: copied ? '#86efac' : 'white',
                fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button onClick={shareWA}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none',
                background: '#22c55e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

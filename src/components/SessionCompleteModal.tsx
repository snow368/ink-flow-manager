import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ReviewStars } from './ReviewStars';
import { db } from '../db';
import { createClientReferral, getClientReferralLink, getReferralConfig } from '../lib/clientReferral';
import { createReview } from '../lib/artistReview';

const THEME_BG = '#0f172a';
const THEME_PANEL = '#1e293b';
const THEME_BORDER = '#334155';

export function SessionCompleteModal({
  artistId, clientId, clientName, appointmentId,
  onDone,
}: {
  artistId: string;
  clientId: string;
  clientName?: string;
  appointmentId?: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'review' | 'instagram' | 'referral' | 'done'>('review');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [refLink, setRefLink] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [instagram, setInstagram] = useState('');
  const [igSaved, setIgSaved] = useState(false);
  const [friendDiscount, setFriendDiscount] = useState(50);
  const [referrerReward, setReferrerReward] = useState(50);
  const refSlug = useRef('');

  useEffect(() => {
    if (!clientId) { setGenerating(false); return; }
    getReferralConfig(artistId).then(cfg => {
      setFriendDiscount(cfg.friendDiscount);
      setReferrerReward(cfg.referrerReward);
      return createClientReferral(artistId, clientId, cfg.referrerReward, clientName, cfg.friendDiscount).then(ref => {
      setRefCode(ref.code);
      refSlug.current = ref.slug || '';
      const link = getClientReferralLink(ref.code, artistId, ref.slug);
      setRefLink(link);
      QRCode.toDataURL(link, { width: 200, margin: 2, color: { dark: '#ffffff', light: '#1e293b' } }).then(setQrDataUrl);
      setGenerating(false);
    });
  });
}, [artistId, clientId, clientName]);

  const handleSaveReview = async () => {
    if (rating === 0) return;
    await createReview({
      artistId, clientId, clientName: clientName || undefined,
      appointmentId: appointmentId || undefined,
      rating, text: reviewText.trim() || undefined,
      source: 'inkflow',
    });
    setReviewSaved(true);
  };

  const saveInstagram = async () => {
    if (!clientId || !instagram.trim()) return;
    await db.clients.update(clientId, { instagram: instagram.trim() });
    setIgSaved(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWA = () => {
    const msg = encodeURIComponent(`Get a discount on your next tattoo! Book here: ${refLink}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  };
  const panelStyle: React.CSSProperties = {
    background: THEME_PANEL, borderRadius: 16, padding: 24, width: '100%',
    maxWidth: 400, maxHeight: '90vh', overflowY: 'auto',
  };
  const btnStyle = (bg: string): React.CSSProperties => ({
    width: '100%', padding: 12, borderRadius: 10, border: 'none',
    background: bg, color: 'white', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginBottom: 8,
  });

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        {step === 'review' && (
          <>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'white' }}>
              How was the session?
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              {clientName ? `Rate your experience with ${clientName}` : 'Rate this session'}
            </p>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <ReviewStars rating={rating} interactive onChange={setRating} size="lg" />
              {rating > 0 && <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 4, fontWeight: 600 }}>
                {rating >= 5 ? 'Amazing!' : rating >= 4 ? 'Great!' : rating >= 3 ? 'Good' : rating >= 2 ? 'Okay' : 'Needs improvement'}
              </p>}
            </div>

            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              style={{
                width: '100%', padding: 10, borderRadius: 10,
                border: `1px solid ${THEME_BORDER}`, background: THEME_BG,
                color: 'white', fontSize: 13, resize: 'vertical',
                boxSizing: 'border-box', marginBottom: 12,
              }}
            />

            <button onClick={handleSaveReview} disabled={rating === 0}
              style={btnStyle(rating === 0 ? '#4b5563' : '#e11d48')}>
              {reviewSaved ? '✓ Review Saved' : 'Save Review'}
            </button>
            <button onClick={() => { setReviewSaved(true); setStep('instagram'); }}
              style={{ ...btnStyle('transparent'), border: `1px solid ${THEME_BORDER}`, color: '#94a3b8', fontSize: 13 }}>
              {rating > 0 ? 'Skip & Continue' : 'Skip Review'}
            </button>
          </>
        )}

        {step === 'instagram' && (
          <>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'white' }}>
              Share your tattoo online
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Leave your Instagram handle so we can tag you when sharing your new ink.
              It helps the studio showcase their work — and brings more followers your way.
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{ color: '#94a3b8', fontSize: 15, lineHeight: '40px' }}>@</span>
              <input
                value={instagram}
                onChange={e => setInstagram(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                placeholder="instagram_handle"
                maxLength={30}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10,
                  border: `1px solid ${THEME_BORDER}`, background: THEME_BG,
                  color: 'white', fontSize: 14, boxSizing: 'border-box',
                }}
              />
            </div>

            <button onClick={async () => {
              if (instagram.trim()) await saveInstagram();
              setStep('referral');
            }} style={btnStyle('#e11d48')}>
              {instagram.trim() ? (igSaved ? '✓ Saved' : 'Save & Continue') : 'Skip'}
            </button>
            <button onClick={() => setStep('referral')}
              style={{ ...btnStyle('transparent'), border: `1px solid ${THEME_BORDER}`, color: '#94a3b8', fontSize: 13 }}>
              {instagram.trim() ? 'Not now' : 'Skip'}
            </button>
          </>
        )}

        {step === 'referral' && (
          <>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'white' }}>
              Share & Earn
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Give this link to your client. When they share it with friends, everyone gets rewarded.
            </p>

            {generating ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Generating referral link...</p>
            ) : (
              <>
                {qrDataUrl && (
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <img src={qrDataUrl} alt="QR code" style={{ width: 160, height: 160, borderRadius: 8 }} />
                  </div>
                )}
                <div style={{
                  background: THEME_BG, padding: '10px 14px', borderRadius: 10,
                  fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all',
                  marginBottom: 12, color: '#cbd5e1', border: `1px solid ${THEME_BORDER}`,
                }}>
                  {refLink}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button onClick={handleCopy}
                    style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none',
                      background: copied ? '#14532d' : THEME_BORDER, color: copied ? '#86efac' : 'white',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button onClick={handleShareWA}
                    style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none',
                      background: '#22c55e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    WhatsApp
                  </button>
                </div>

                <button onClick={() => { navigator.clipboard.writeText(`Hey! Share this link with your friends and get ${refLink}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${THEME_BORDER}`,
                    background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer', marginBottom: 12 }}>
                  📋 Copy message for client
                </button>
              </>
            )}

            <button onClick={() => setStep('done')}
              style={btnStyle('#e11d48')}>
              Continue to POS
            </button>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'white' }}>
              Session Complete
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              {reviewSaved ? 'Review saved. ' : ''}{igSaved ? 'Instagram saved. ' : ''}Referral link ready.
            </p>
            <button onClick={onDone}
              style={btnStyle('#e11d48')}>
              Go to POS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

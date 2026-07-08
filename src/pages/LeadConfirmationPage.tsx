import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLeadConfirmationByToken, markConfirmationViewed, submitLeadConfirmation, detectMissingTattooInfo, isReadyForDepositRequest } from '../lib/leadConfirmation';
import type { LeadConfirmationRecord } from '../db';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  boxSizing: 'border-box',
  fontSize: 13,
  outline: 'none',
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 60,
  resize: 'vertical',
};

export default function LeadConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const [conf, setConf] = useState<LeadConfirmationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Editable fields
  const [placement, setPlacement] = useState('');
  const [style, setStyle] = useState('');
  const [size, setSize] = useState('');
  const [budget, setBudget] = useState('');
  const [availability, setAvailability] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [references, setReferences] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const c = await getLeadConfirmationByToken(token);
      if (!c) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (c.status === 'submitted' || c.status === 'completed') {
        setSubmitted(true);
        setConf(c);
        setLoading(false);
        return;
      }
      if (c.status === 'sent' || c.status === 'draft') {
        await markConfirmationViewed(c.id);
      }
      setConf(c);
      setPlacement(c.extractedData.placement || '');
      setStyle(c.extractedData.style || '');
      setSize(c.extractedData.size || '');
      setBudget(c.extractedData.budget || '');
      setAvailability(c.extractedData.availability || '');
      setRequestedChanges(c.extractedData.requestedChanges?.join('\n') || '');
      setReferences(c.extractedData.references || []);
      setLoading(false);
    })();
  }, [token]);

  const handleSubmit = useCallback(async () => {
    if (!conf) return;
    setSubmitting(true);
    try {
      const edits: LeadConfirmationRecord['extractedData'] = {
        placement: placement.trim() || undefined,
        style: style.trim() || undefined,
        size: size.trim() || undefined,
        budget: budget.trim() || undefined,
        availability: availability.trim() || undefined,
        requestedChanges: requestedChanges.trim() ? requestedChanges.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
        references: references.length > 0 ? references : undefined,
      };
      await submitLeadConfirmation(conf.id, edits);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit failed', err);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [conf, placement, style, size, budget, availability, requestedChanges, references]);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 24, height: 24, border: '2px solid #334155', borderTopColor: '#a33a3a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Loading confirmation...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔗</div>
        <p style={{ color: '#cbd5e1', fontSize: 16, fontWeight: 700, margin: 0, textAlign: 'center' }}>Confirmation link not found</p>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, textAlign: 'center' }}>This link may be expired or invalid. Please contact your artist for a new link.</p>
      </div>
    );
  }

  if (submitted && conf) {
    const missing = detectMissingTattooInfo(conf.extractedData);
    const ready = isReadyForDepositRequest(conf.extractedData);
    return (
      <div style={{ minHeight: '100dvh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
        <p style={{ color: '#cbd5e1', fontSize: 18, fontWeight: 700, margin: 0, textAlign: 'center' }}>Thank you!</p>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, textAlign: 'center' }}>Your details have been submitted. Your artist will review and follow up shortly.</p>
        {missing.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 12, marginTop: 8, width: '100%', maxWidth: 360, boxSizing: 'border-box' }}>
            <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, margin: '0 0 6px 0' }}>Still needed:</p>
            {missing.map(m => <p key={m} style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0' }}>• {m}</p>)}
          </div>
        )}
        {ready && (
          <div style={{ background: '#1e293b', border: '1px solid #22c55e', borderRadius: 12, padding: 12, marginTop: 8, width: '100%', maxWidth: 360, boxSizing: 'border-box' }}>
            <p style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, margin: 0 }}>✓ All info collected — ready to proceed</p>
          </div>
        )}
      </div>
    );
  }

  const currentData: LeadConfirmationRecord['extractedData'] = { placement, style, size, budget, references, requestedChanges: requestedChanges ? requestedChanges.split('\n').map(s => s.trim()).filter(Boolean) : [], availability };
  const missing = detectMissingTattooInfo(currentData);
  const ready = isReadyForDepositRequest(currentData);

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', padding: 20, maxWidth: 480, margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ color: '#cbd5e1', fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>Confirm Your Appointment Details</p>
        <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>Review and update the information below</p>
      </div>

      {/* Placement */}
      <div style={{ background: '#111827', border: missing.includes('Need clearer placement') ? '1px solid #f59e0b' : '1px solid #243244', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, margin: 0 }}>Placement</p>
          {missing.includes('Need clearer placement') && <span style={{ fontSize: 10, background: '#f59e0b', color: '#000', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Missing</span>}
        </div>
        <input style={inputStyle} placeholder="e.g. left forearm, upper back, etc." value={placement} onChange={e => setPlacement(e.target.value)} />
      </div>

      {/* Style */}
      <div style={{ background: '#111827', border: missing.includes('Need tattoo style') ? '1px solid #f59e0b' : '1px solid #243244', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, margin: 0 }}>Style</p>
          {missing.includes('Need tattoo style') && <span style={{ fontSize: 10, background: '#f59e0b', color: '#000', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Missing</span>}
        </div>
        <input style={inputStyle} placeholder="e.g. fine line, traditional, realism" value={style} onChange={e => setStyle(e.target.value)} />
      </div>

      {/* Size */}
      <div style={{ background: '#111827', border: missing.includes('Need size estimate') ? '1px solid #f59e0b' : '1px solid #243244', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, margin: 0 }}>Size</p>
          {missing.includes('Need size estimate') && <span style={{ fontSize: 10, background: '#f59e0b', color: '#000', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Missing</span>}
        </div>
        <input style={inputStyle} placeholder="e.g. 5cm x 5cm, palm-sized, full sleeve" value={size} onChange={e => setSize(e.target.value)} />
      </div>

      {/* Budget */}
      <div style={{ background: '#111827', border: missing.includes('Need budget range') ? '1px solid #f59e0b' : '1px solid #243244', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, margin: 0 }}>Budget</p>
          {missing.includes('Need budget range') && <span style={{ fontSize: 10, background: '#f59e0b', color: '#000', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Missing</span>}
        </div>
        <input style={inputStyle} placeholder="e.g. $200-400, flexible" value={budget} onChange={e => setBudget(e.target.value)} />
      </div>

      {/* Availability */}
      <div style={{ background: '#111827', border: '1px solid #243244', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, margin: '0 0 8px 0' }}>Availability</p>
        <input style={inputStyle} placeholder="e.g. weekday evenings, any weekend" value={availability} onChange={e => setAvailability(e.target.value)} />
      </div>

      {/* References */}
      <div style={{ background: '#111827', border: missing.includes('Need reference images or descriptions') ? '1px solid #f59e0b' : '1px solid #243244', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, margin: 0 }}>References</p>
          {missing.includes('Need reference images or descriptions') && <span style={{ fontSize: 10, background: '#f59e0b', color: '#000', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>Missing</span>}
        </div>
        {references.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {references.map((ref, i) => (
              ref.startsWith('data:') || ref.startsWith('http') ? (
                <img key={i} src={ref} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid #334155' }} />
              ) : (
                <span key={i} style={{ fontSize: 11, color: '#94a3b8', background: '#1e293b', borderRadius: 6, padding: '4px 8px', border: '1px solid #334155' }}>
                  {ref}
                </span>
              )
            ))}
          </div>
        )}
        <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>Reference images were provided by your artist. You can add more details in the notes section below.</p>
      </div>

      {/* Requested Changes */}
      <div style={{ background: '#111827', border: '1px solid #243244', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, margin: '0 0 8px 0' }}>Notes or Changes</p>
        <textarea style={textAreaStyle} placeholder="Anything you'd like to change or add..." value={requestedChanges} onChange={e => setRequestedChanges(e.target.value)} />
      </div>

      {/* Missing summary */}
      {missing.length > 0 && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, margin: '0 0 6px 0' }}>Please complete the following:</p>
          {missing.map(m => <p key={m} style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0' }}>• {m}</p>)}
        </div>
      )}

      {ready && (
        <div style={{ background: '#1e293b', border: '1px solid #22c55e', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <p style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, margin: 0 }}>✓ All info looks good! Your artist may reach out about a deposit.</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: '100%',
          padding: '14px 24px',
          borderRadius: 12,
          border: 'none',
          background: submitting ? '#555' : '#a33a3a',
          color: 'white',
          fontSize: 15,
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          marginBottom: 40,
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Confirmation'}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { THEME } from '../lib/theme';
import {
  getApprovalByToken,
  approveDesign,
  requestRevisionFromClient,
  markApprovalViewed,
} from '../lib/projectRevisionLogic';

type ApproveState = 'loading' | 'invalid' | 'expired' | 'ready' | 'approved' | 'revision_requested';

export default function ProjectApprovePage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<ApproveState>('loading');
  const [imageUrl, setImageUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      const data = await getApprovalByToken(token);
      if (!data) {
        setState('invalid');
        return;
      }
      if (data.approval.expiresAt < Date.now()) {
        setState('expired');
        return;
      }
      if (data.asset) setImageUrl(data.asset.imageUrl);
      if (data.approval.approvedAt) {
        setState('approved');
        return;
      }
      if (data.approval.revisionRequestedAt) {
        setState('revision_requested');
        return;
      }
      // Mark as viewed
      await markApprovalViewed(token);
      setState('ready');
    })();
  }, [token]);

  const handleApprove = useCallback(async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await approveDesign(token, feedback.trim() || undefined);
      setState('approved');
      setMessage('Great! Your artist will be notified.');
    } catch (err) {
      setMessage('Something went wrong. Please try again or contact your artist.');
    } finally {
      setSubmitting(false);
    }
  }, [token, feedback]);

  const handleRequestRevision = useCallback(async () => {
    if (!token || !feedback.trim()) return;
    setSubmitting(true);
    try {
      await requestRevisionFromClient(token, feedback.trim());
      setState('revision_requested');
      setMessage('Your feedback has been sent to your artist.');
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [token, feedback]);

  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', background: THEME.bg.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${THEME.border.default}`, borderTopColor: THEME.brand.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (state === 'invalid' || state === 'expired') {
    return (
      <div style={{ minHeight: '100dvh', background: THEME.bg.app, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24 }}>
        <p style={{ color: THEME.text.primary, fontSize: THEME.fontSize.xl, fontWeight: THEME.fontWeight.bold, margin: 0 }}>
          {state === 'expired' ? 'Link Expired' : 'Link Not Found'}
        </p>
        <p style={{ color: THEME.text.muted, fontSize: THEME.fontSize.base, margin: 0, textAlign: 'center' }}>
          {state === 'expired'
            ? 'This approval link has expired. Please ask your artist for a new one.'
            : 'This link is invalid. Please check the link or contact your artist.'}
        </p>
      </div>
    );
  }

  if (state === 'approved') {
    return (
      <div style={{ minHeight: '100dvh', background: THEME.bg.app, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }}>✓</div>
        <p style={{ color: THEME.brand.success, fontSize: THEME.fontSize.xl, fontWeight: THEME.fontWeight.bold, margin: 0 }}>Design Approved!</p>
        <p style={{ color: THEME.text.muted, fontSize: THEME.fontSize.base, margin: 0, textAlign: 'center' }}>{message}</p>
      </div>
    );
  }

  if (state === 'revision_requested') {
    return (
      <div style={{ minHeight: '100dvh', background: THEME.bg.app, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <p style={{ color: THEME.brand.info, fontSize: THEME.fontSize.xl, fontWeight: THEME.fontWeight.bold, margin: 0 }}>Revision Requested</p>
        <p style={{ color: THEME.text.muted, fontSize: THEME.fontSize.base, margin: 0, textAlign: 'center' }}>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: THEME.bg.app, maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ color: THEME.text.primary, fontSize: THEME.fontSize.lg, fontWeight: THEME.fontWeight.bold, margin: '0 0 4px' }}>
          Review Your Design
        </p>
        <p style={{ color: THEME.text.muted, fontSize: THEME.fontSize.sm, margin: 0 }}>
          Your artist has sent a design for your review
        </p>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Design preview"
          style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: THEME.radius['3xl'], background: '#000', marginBottom: 20 }}
        />
      )}

      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Any notes or changes? (optional)"
        rows={3}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: THEME.radius['2xl'],
          border: `1px solid ${THEME.border.default}`, background: THEME.bg.panel,
          color: THEME.text.primary, fontSize: THEME.fontSize.base, resize: 'vertical',
          boxSizing: 'border-box', marginBottom: 16, outline: 'none',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleApprove}
          disabled={submitting}
          style={{
            width: '100%', padding: '16px 24px', borderRadius: THEME.radius['2xl'],
            border: 'none', background: submitting ? '#555' : THEME.brand.success,
            color: 'white', fontSize: THEME.fontSize.lg, fontWeight: THEME.fontWeight.bold,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Submitting...' : 'Approve Design'}
        </button>
        <button
          onClick={handleRequestRevision}
          disabled={submitting || !feedback.trim()}
          style={{
            width: '100%', padding: '16px 24px', borderRadius: THEME.radius['2xl'],
            border: `1px solid ${THEME.brand.info}`, background: 'transparent',
            color: submitting || !feedback.trim() ? THEME.text.subtle : THEME.brand.info,
            fontSize: THEME.fontSize.lg, fontWeight: THEME.fontWeight.semibold,
            cursor: submitting || !feedback.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Request Changes
        </button>
      </div>

      <p style={{ color: THEME.text.subtle, fontSize: THEME.fontSize.xs, textAlign: 'center', marginTop: 20 }}>
        Need a revision? Leave notes above and click "Request Changes".
      </p>
    </div>
  );
}

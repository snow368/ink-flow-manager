import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRevisionByToken, markRevisionViewed, approveRevision, requestRevisionChanges } from '../lib/projectRevision';
import type { ProjectRevisionRecord } from '../db';

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
  fontFamily: 'inherit',
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 80,
  resize: 'vertical',
};

type ChangeCategory = NonNullable<ProjectRevisionRecord['requestedChanges']>[number]['category'];
const CHANGE_CATEGORIES: { value: ChangeCategory; label: string }[] = [
  { value: 'placement', label: 'Placement' },
  { value: 'size', label: 'Size' },
  { value: 'style', label: 'Style' },
  { value: 'detail', label: 'Detail' },
  { value: 'linework', label: 'Linework' },
  { value: 'shading', label: 'Shading' },
  { value: 'color', label: 'Color' },
  { value: 'wording', label: 'Wording' },
  { value: 'other', label: 'Other' },
];

export default function DesignReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [revision, setRevision] = useState<ProjectRevisionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionDone, setActionDone] = useState<'approve' | 'revision' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Revision request state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [changeNote, setChangeNote] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      const rev = await getRevisionByToken(token);
      if (!rev) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (rev.status === 'approved') {
        setActionDone('approve');
      } else if (rev.status === 'revision_requested') {
        setActionDone('revision');
      }
      if (rev.status === 'sent') {
        await markRevisionViewed(token);
      }
      setRevision(rev);
      setLoading(false);
    })();
  }, [token]);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleApprove = useCallback(async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await approveRevision(token);
      setActionDone('approve');
    } finally {
      setSubmitting(false);
    }
  }, [token]);

  const handleRequestChanges = useCallback(async () => {
    if (!token || selectedCategories.size === 0) return;
    setSubmitting(true);
    try {
      const changes = Array.from(selectedCategories).map(cat => ({
        category: cat as ChangeCategory,
        note: changeNote.trim() || undefined,
      }));
      await requestRevisionChanges(token, changes);
      setActionDone('revision');
    } finally {
      setSubmitting(false);
    }
  }, [token, selectedCategories, changeNote]);

  // ── Loading ──

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0c0c0c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #2a2a2e', borderTopColor: '#a33a3a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Not found ──

  if (notFound || !revision) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0c0c0c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#a3a3a3', fontSize: 16, margin: 0 }}>Review link not found</p>
          <p style={{ color: '#525252', fontSize: 13, margin: '8px 0 0' }}>This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  // ── Success states ──

  if (actionDone === 'approve') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0c0c0c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#22c55e20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ color: '#22c55e', fontSize: 24 }}>✓</span>
          </div>
          <p style={{ color: '#22c55e', fontSize: 18, fontWeight: 700, margin: 0 }}>Design approved</p>
          <p style={{ color: '#a3a3a3', fontSize: 13, margin: '8px 0 0' }}>Your feedback has been sent to the artist.</p>
        </div>
      </div>
    );
  }

  if (actionDone === 'revision') {
    return (
      <div style={{ minHeight: '100dvh', background: '#0c0c0c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ color: '#f59e0b', fontSize: 24 }}>✎</span>
          </div>
          <p style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>Revision request sent</p>
          <p style={{ color: '#a3a3a3', fontSize: 13, margin: '8px 0 0' }}>The artist will review your feedback.</p>
        </div>
      </div>
    );
  }

  // ── Active review ──

  return (
    <div style={{ minHeight: '100dvh', background: '#0c0c0c', maxWidth: 480, margin: '0 auto', padding: '24px 16px 48px' }}>
      {/* Version label */}
      <p style={{ fontSize: 11, color: '#525252', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Design Review
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: '4px 0 16px' }}>
        Version {revision.version}
      </p>

      {/* Image grid */}
      {revision.imageUrls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {revision.imageUrls.map((url, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '#141416' }}>
              <img
                src={url}
                alt={`Design v${revision.version} - ${i + 1}`}
                style={{ width: '100%', display: 'block' }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Artist note */}
      {revision.note && (
        <div style={{ background: '#141416', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#525252', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Artist note
          </p>
          <p style={{ fontSize: 14, color: '#a3a3a3', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {revision.note}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleApprove}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
            background: '#22c55e', color: '#000', fontSize: 15,
            fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Processing...' : 'Approve Design'}
        </button>

        <button
          onClick={() => {
            if (selectedCategories.size > 0) {
              handleRequestChanges();
            } else {
              document.getElementById('change-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 12,
            border: '1px solid #334155', background: 'transparent',
            color: '#f59e0b', fontSize: 15, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          Request Changes
        </button>
      </div>

      {/* Change request section */}
      <div id="change-section" style={{ marginTop: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: '0 0 12px' }}>
          What would you like adjusted?
        </p>

        {/* Category chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {CHANGE_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => toggleCategory(cat.value)}
              style={{
                padding: '8px 14px', borderRadius: 8,
                border: `1px solid ${selectedCategories.has(cat.value) ? '#f59e0b' : '#334155'}`,
                background: selectedCategories.has(cat.value) ? '#f59e0b20' : 'transparent',
                color: selectedCategories.has(cat.value) ? '#f59e0b' : '#a3a3a3',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Note textarea */}
        <textarea
          value={changeNote}
          onChange={e => setChangeNote(e.target.value)}
          placeholder="Describe what you'd like changed..."
          style={textAreaStyle}
        />

        {/* Submit revision request */}
        <button
          onClick={handleRequestChanges}
          disabled={submitting || selectedCategories.size === 0}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: 12,
            border: 'none', marginTop: 10,
            background: '#f59e0b', color: '#000', fontSize: 14,
            fontWeight: 700, cursor: submitting || selectedCategories.size === 0 ? 'not-allowed' : 'pointer',
            opacity: submitting || selectedCategories.size === 0 ? 0.5 : 1,
          }}
        >
          {submitting ? 'Sending...' : 'Send Revision Request'}
        </button>
      </div>
    </div>
  );
}

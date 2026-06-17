import { useCallback, useEffect, useState } from 'react';
import { db, type SessionRecord, type ClientRecord, type ProjectRecord } from '../db';
import { THEME } from '../lib/theme';
import {
  getSessionDuration, formatDuration,
  startSession, pauseSession, resumeSession,
  markStencilReady, completeSession,
  addProgressPhoto, addSessionNote,
  markAftercareReady,
  PRESET_NOTES, PHOTO_LABELS,
} from '../lib/sessionExecution';
import { uploadImage } from '../lib/upload';

interface Props {
  session: SessionRecord;
  onUpdate: () => void;
}

const STATE_COLORS: Record<string, string> = {
  scheduled: '#60a5fa',
  checked_in: '#a855f7',
  stencil_ready: '#f59e0b',
  tattooing: '#22c55e',
  break: '#f97316',
  completed: '#64748b',
};

const STATE_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked In',
  stencil_ready: 'Stencil Ready',
  tattooing: 'Tattooing',
  break: 'Break',
  completed: 'Completed',
};

function ImgUploadBtn({ onCapture }: { onCapture: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  return (
    <label style={{
      border: `1px solid ${THEME.border.default}`, borderRadius: THEME.radius.lg,
      padding: '6px 12px', fontSize: THEME.fontSize.xs, color: THEME.text.muted,
      cursor: 'pointer', fontWeight: THEME.fontWeight.semibold,
      display: 'inline-flex', alignItems: 'center', gap: 4, opacity: uploading ? 0.5 : 1,
    }}>
      {uploading ? '⏳' : '+ Photo'}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        disabled={uploading}
        onChange={async e => {
          const file = e.target.files?.[0];
          if (!file || uploading) return;
          setUploading(true);
          try {
            const url = await uploadImage(file);
            onCapture(url);
          } catch (err) {
            console.error('Upload failed:', err);
          } finally {
            setUploading(false);
          }
        }}
      />
    </label>
  );
}

export default function ActiveSessionPanel({ session, onUpdate }: Props) {
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showPhotoLabels, setShowPhotoLabels] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    db.clients.get(session.clientId || '').then(c => setClient(c || null));
    db.projects.get(session.projectId || '').then(p => setProject(p || null));
  }, [session.clientId, session.projectId]);

  // Live timer tick
  useEffect(() => {
    if (session.sessionState !== 'tattooing') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session.sessionState]);

  const duration = getSessionDuration({
    ...session,
    timerStartedAt: session.sessionState === 'tattooing' ? session.timerStartedAt : undefined,
    accumulatedDurationMs: session.accumulatedDurationMs,
  } as SessionRecord);

  const stateColor = STATE_COLORS[session.sessionState || 'scheduled'] || '#94a3a8';
  const stateLabel = STATE_LABELS[session.sessionState || 'scheduled'] || session.sessionState || 'Unknown';

  const handleStart = useCallback(async () => {
    setBusy(true); await startSession(session.id); onUpdate(); setBusy(false);
  }, [session.id, onUpdate]);

  const handlePause = useCallback(async () => {
    setBusy(true); await pauseSession(session.id); onUpdate(); setBusy(false);
  }, [session.id, onUpdate]);

  const handleResume = useCallback(async () => {
    setBusy(true); await resumeSession(session.id); onUpdate(); setBusy(false);
  }, [session.id, onUpdate]);

  const handleStencilReady = useCallback(async () => {
    setBusy(true); await markStencilReady(session.id); onUpdate(); setBusy(false);
  }, [session.id, onUpdate]);

  const handleComplete = useCallback(async () => {
    setBusy(true); await completeSession(session.id); onUpdate(); setBusy(false);
  }, [session.id, onUpdate]);

  const handlePhoto = useCallback(async (url: string) => {
    setShowPhotoLabels(true);
    // Default: add without label
    setBusy(true); await addProgressPhoto(session.id, url); onUpdate(); setBusy(false);
  }, [session.id, onUpdate]);

  const handlePhotoWithLabel = useCallback(async (label: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment' as any;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const url = await uploadImage(file);
        await addProgressPhoto(session.id, url, label);
        onUpdate();
      } catch (err) {
        console.error('Upload failed:', err);
      }
      setBusy(false);
      setShowPhotoLabels(false);
    };
    input.click();
  }, [session.id, onUpdate]);

  const handleAddNote = useCallback(async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    await addSessionNote(session.id, noteText.trim());
    setNoteText('');
    setShowNoteInput(false);
    onUpdate();
    setBusy(false);
  }, [session.id, noteText, onUpdate]);

  const handlePresetNote = useCallback(async (note: string) => {
    setBusy(true);
    await addSessionNote(session.id, note);
    onUpdate();
    setBusy(false);
  }, [session.id, onUpdate]);

  const handleAftercare = useCallback(async () => {
    setBusy(true);
    await markAftercareReady(session.id);
    onUpdate();
    setBusy(false);
  }, [session.id, onUpdate]);

  const isCompleted = session.sessionState === 'completed';

  return (
    <div style={{
      background: THEME.bg.panel, borderRadius: THEME.radius['2xl'],
      border: `1px solid ${isCompleted ? THEME.border.subtle : stateColor}40`,
      padding: 12, marginBottom: 8,
    }}>
      {/* Row 1: Client info + state badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: THEME.fontSize.base, fontWeight: THEME.fontWeight.semibold, color: THEME.text.primary, margin: 0 }}>
            {client?.name || 'Unknown client'}
          </p>
          {project && (
            <p style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, margin: '1px 0 0' }}>
              {project.title}
            </p>
          )}
        </div>
        <span style={{
          fontSize: THEME.fontSize.xs, borderRadius: 999, padding: '2px 10px',
          fontWeight: THEME.fontWeight.semibold, whiteSpace: 'nowrap',
          background: `${stateColor}20`, color: stateColor,
          border: `1px solid ${stateColor}40`,
        }}>
          {stateLabel}
        </span>
      </div>

      {/* Row 2: Timer */}
      {!isCompleted && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: session.sessionState === 'tattooing' ? '#22c55e' : THEME.text.primary,
            fontFamily: 'monospace',
          }}>
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Row 3: Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {session.sessionState === 'scheduled' || session.sessionState === 'checked_in' ? (
          <>
            <ActionBtn label="Stencil Ready" color="#f59e0b" onClick={handleStencilReady} busy={busy} />
            <ActionBtn label="Start" color="#22c55e" onClick={handleStart} busy={busy} />
          </>
        ) : session.sessionState === 'stencil_ready' ? (
          <ActionBtn label="Start Tattooing" color="#22c55e" onClick={handleStart} busy={busy} />
        ) : session.sessionState === 'tattooing' ? (
          <>
            <ActionBtn label="Pause" color="#f97316" onClick={handlePause} busy={busy} />
            <ImgUploadBtn onCapture={handlePhoto} />
            <ActionBtn label="Note" color="#a855f7" onClick={() => setShowNoteInput(!showNoteInput)} busy={busy} />
          </>
        ) : session.sessionState === 'break' ? (
          <ActionBtn label="Resume" color="#22c55e" onClick={handleResume} busy={busy} />
        ) : null}

        {!isCompleted && (
          <ActionBtn label="Complete" color="#64748b" onClick={handleComplete} busy={busy} />
        )}

        {/* Aftercare trigger */}
        {isCompleted && !session.aftercareSentAt && (
          <ActionBtn label="Send Aftercare" color="#f59e0b" onClick={handleAftercare} busy={busy} />
        )}
        {isCompleted && session.aftercareSentAt && (
          <span style={{ fontSize: THEME.fontSize.xs, color: '#22c55e', fontWeight: THEME.fontWeight.semibold, padding: '4px 0' }}>
            Aftercare sent
          </span>
        )}
      </div>

      {/* Photo label picker (shown after clicking +Photo) */}
      {showPhotoLabels && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 9, color: THEME.text.subtle, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Photo label (optional)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PHOTO_LABELS.map(label => (
              <button
                key={label}
                onClick={() => handlePhotoWithLabel(label)}
                style={{
                  border: `1px solid ${THEME.border.default}`, background: 'transparent',
                  color: THEME.text.muted, borderRadius: THEME.radius.sm,
                  padding: '4px 10px', fontSize: THEME.fontSize.xs, cursor: 'pointer',
                  fontWeight: THEME.fontWeight.semibold,
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowPhotoLabels(false)}
              style={{
                border: '1px solid #ef444440', background: 'transparent',
                color: '#ef4444', borderRadius: THEME.radius.sm,
                padding: '4px 10px', fontSize: THEME.fontSize.xs, cursor: 'pointer',
                fontWeight: THEME.fontWeight.semibold,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Note input */}
      {showNoteInput && (
        <div style={{ marginTop: 8 }}>
          {/* Preset notes */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {PRESET_NOTES.slice(0, 5).map(n => (
              <button
                key={n}
                onClick={() => handlePresetNote(n)}
                style={{
                  border: `1px solid ${THEME.border.default}`, background: 'transparent',
                  color: THEME.text.muted, borderRadius: THEME.radius.sm,
                  padding: '4px 10px', fontSize: THEME.fontSize.xs, cursor: 'pointer',
                  fontWeight: THEME.fontWeight.semibold,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Custom note..."
              style={{
                flex: 1, padding: '6px 10px', fontSize: THEME.fontSize.xs, borderRadius: THEME.radius.sm,
                border: `1px solid ${THEME.border.default}`, background: THEME.bg.app,
                color: THEME.text.primary, outline: 'none',
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNote(); }}
            />
            <button onClick={handleAddNote} style={{
              border: 'none', background: THEME.brand.primary, color: '#fff',
              borderRadius: THEME.radius.sm, padding: '6px 12px', fontSize: THEME.fontSize.xs,
              cursor: 'pointer', fontWeight: THEME.fontWeight.semibold,
            }}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, color, onClick, busy }: { label: string; color: string; onClick: () => void; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        border: `1px solid ${color}40`, background: `${color}15`,
        color, borderRadius: THEME.radius.lg,
        padding: '6px 12px', fontSize: THEME.fontSize.xs,
        cursor: busy ? 'not-allowed' : 'pointer',
        fontWeight: THEME.fontWeight.semibold, opacity: busy ? 0.5 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export { ImgUploadBtn };

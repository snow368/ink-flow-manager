import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, type LeadRecord } from '../db';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';

export default function LeadRevisePage() {
  const { leadId } = useParams<{ leadId: string }>();
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [note, setNote] = useState('');
  const [changeRequest, setChangeRequest] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [doneVersion, setDoneVersion] = useState<number | null>(null);
  const lang: AppLanguage = detectInitialLanguage();

  useEffect(() => {
    if (!leadId) return;
    db.leads.get(leadId).then((l) => setLead(l || null));
  }, [leadId]);

  const title = useMemo(() => lead
    ? t(lang, 'lead_revise_title').replace('{name}', lead.name)
    : t(lang, 'lead_revise_title_default'), [lead, lang]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const max = Math.min(files.length, Math.max(0, 6 - images.length));
    const list: string[] = [];
    for (let i = 0; i < max; i++) {
      const data = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.readAsDataURL(files[i]);
      });
      list.push(data);
    }
    setImages(prev => [...prev, ...list]);
  };

  const submit = async () => {
    if (!leadId) return;
    if (!note.trim() && !changeRequest.trim() && images.length === 0) return;
    setSubmitting(true);
    try {
      const revisions = await db.leadRevisions.where('leadId').equals(leadId).toArray();
      const version = revisions.length > 0 ? Math.max(...revisions.map(r => r.version)) + 1 : 1;
      const now = Date.now();
      await db.leadRevisions.add({
        id: `rev_${now}_${Math.random().toString(36).slice(2, 6)}`,
        leadId,
        version,
        actor: 'client',
        channel: 'other',
        note: note.trim() || undefined,
        changeRequest: changeRequest.trim() || undefined,
        referenceImages: images.length > 0 ? images : undefined,
        createdAt: now,
      });
      setDoneVersion(version);
      setNote('');
      setChangeRequest('');
      setImages([]);
    } finally {
      setSubmitting(false);
    }
  };

  if (!leadId || !lead) {
    return <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24 }}>{t(lang, 'lead_revise_invalid')}</div>;
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: '#94a3b8', marginBottom: 14 }}>{t(lang, 'lead_revise_desc')}</p>

      {doneVersion && (
        <div style={{ background: '#14532d', border: '1px solid #166534', borderRadius: 10, padding: 10, marginBottom: 12 }}>
          <p style={{ color: '#86efac', fontSize: 14 }}>{t(lang, 'lead_revise_success').replace('{version}', String(doneVersion))}</p>
        </div>
      )}

      <textarea
        placeholder={t(lang, 'lead_revise_note_placeholder')}
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
        style={textAreaStyle}
      />

      <textarea
        placeholder={t(lang, 'lead_revise_change_placeholder')}
        value={changeRequest}
        onChange={e => setChangeRequest(e.target.value)}
        rows={3}
        style={textAreaStyle}
      />

      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{t(lang, 'lead_revise_upload_label')}</p>
      <input type="file" accept="image/*" multiple onChange={e => void handleFiles(e.target.files)} style={{ marginBottom: 8 }} />
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
          {images.map((img, i) => <img key={i} src={img} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 8 }} />)}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting || (!note.trim() && !changeRequest.trim() && images.length === 0)}
        style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: submitting ? '#475569' : '#e11d48', color: 'white', fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer' }}
      >
        {submitting ? t(lang, 'lead_revise_submitting') : t(lang, 'lead_revise_submit')}
      </button>
    </div>
  );
}

const textAreaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: 8,
  borderRadius: 10,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  boxSizing: 'border-box',
  resize: 'vertical',
};

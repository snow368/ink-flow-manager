import { useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { db } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { canAddStorage, reportStorageDelta } from '../lib/quota';
import { trackClientReferral } from '../lib/clientReferral';

const ALLERGY_OPTIONS = [
  'Latex gloves',
  'Alcohol antiseptic',
  'Adhesive tape',
  'Red ink',
  'Yellow ink',
  'Anesthetic',
];

const STYLE_OPTIONS = ['Fine line', 'Traditional', 'Japanese', 'Blackwork', 'Realism', 'Lettering', 'Custom'];

export default function IntakePage() {
  const { artistId } = useParams<{ artistId: string }>();
  const location = useLocation();
  const lang = detectInitialLanguage();
  const sourceFromQuery = useMemo(() => {
    const raw = new URLSearchParams(location.search).get('src');
    const valid = ['instagram', 'facebook', 'tiktok', 'referral', 'walk_in', 'other'];
    return valid.includes(raw || '') ? (raw as 'instagram' | 'facebook' | 'tiktok' | 'referral' | 'walk_in' | 'other') : null;
  }, [location.search]);
  const creativeIdFromQuery = useMemo(
    () => new URLSearchParams(location.search).get('cr') || undefined,
    [location.search]
  );
  const refCode = useRef(new URLSearchParams(location.search).get('ref') || '');
  const pendingBytes = useRef(0); // tracks incoming file bytes for quota reporting

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<'instagram' | 'facebook' | 'tiktok' | 'referral' | 'walk_in' | 'other'>(sourceFromQuery || 'instagram');
  const [bodyPart, setBodyPart] = useState('');
  const [style, setStyle] = useState('');
  const [size, setSize] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'instagram' | 'phone' | 'email'>('whatsapp');
  const [consultMode, setConsultMode] = useState<'online_chat' | 'consult_booking' | 'walk_in_direct'>('online_chat');
  const [coverUp, setCoverUp] = useState<'no' | 'yes'>('no');
  const [scarArea, setScarArea] = useState<'no' | 'yes'>('no');
  const [decisionMaker, setDecisionMaker] = useState<'self' | 'shared'>('self');
  const [note, setNote] = useState('');
  const [changeRequest, setChangeRequest] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergySeverity, setAllergySeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [allergyNote, setAllergyNote] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    if (!artistId) return;
    const artist = await db.users.get(artistId);
    let incomingBytes = 0;
    for (let i = 0; i < files.length; i++) incomingBytes += files[i].size || 0;
    pendingBytes.current += incomingBytes;
    const quotaCheck = await canAddStorage(artist || null, artistId, incomingBytes);
    if (!quotaCheck.ok) {
      alert(`Storage quota exceeded (${quotaCheck.usedMb.toFixed(1)}MB / ${quotaCheck.quotaMb}MB). Please ask studio to upgrade plan.`);
      return;
    }
    const max = Math.min(6 - referenceImages.length, files.length);
    const list: string[] = [];
    for (let i = 0; i < max; i++) {
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(files[i]);
      });
      list.push(data);
    }
    setReferenceImages(prev => [...prev, ...list]);
  };

  const toggleAllergy = (item: string) => {
    setAllergies(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const submit = async () => {
    if (!artistId || !name.trim()) return;
    setSubmitting(true);
    try {
      const now = Date.now();
      const structuredContext = [
        `Preferred contact: ${preferredContact}`,
        `Cover-up: ${coverUp}`,
        `Scar area: ${scarArea}`,
        `Decision maker: ${decisionMaker}`,
      ].join(' | ');

      const leadId = `lead_${now}_${Math.random().toString(36).slice(2, 6)}`;
      await db.leads.add({
        id: leadId,
        artistId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        source: refCode.current ? 'referral' : source,
        referrerCode: refCode.current || undefined,
        creativeId: creativeIdFromQuery,
        consultMode,
        status: 'new',
        bodyPart: bodyPart.trim() || undefined,
        style: style.trim() || undefined,
        size: size.trim() || undefined,
        budget: budget.trim() || undefined,
        preferredDate: preferredDate || undefined,
        preferredTime: preferredTime || undefined,
        note: [note.trim(), structuredContext].filter(Boolean).join('\n') || undefined,
        changeRequest: changeRequest.trim() || undefined,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        allergySeverity: allergies.length > 0 ? allergySeverity : undefined,
        allergyNote: allergyNote.trim() || undefined,
        createdAt: now,
      });
      if (pendingBytes.current > 0) {
        const artistRecord = await db.users.get(artistId);
        reportStorageDelta(artistId, artistRecord?.plan || 'free', pendingBytes.current).catch(() => {});
        pendingBytes.current = 0;
      }
      if (refCode.current) {
        trackClientReferral(refCode.current, leadId).catch(() => {});
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!artistId) return <div style={{ padding: 24 }}>Invalid intake link.</div>;
  if (done) return <div style={{ padding: 24, color: 'white', background: '#0f172a', minHeight: '100dvh' }}><h2>Thanks</h2><p>Your request was submitted. The studio will contact you soon.</p></div>;

  return (
    <div style={{ background: '#0f172a', minHeight: '100dvh', color: 'white', padding: 20, maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t(lang, 'intake_form')}</h2>
      <p style={{ color: '#94a3b8', marginBottom: 14 }}>This takes about 2-3 minutes. The more detail you share, the faster we can quote and schedule.</p>

      <Section title="1) Contact">
        <input placeholder="Name (required)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <select value={preferredContact} onChange={e => setPreferredContact(e.target.value as typeof preferredContact)} style={inputStyle}>
          <option value="whatsapp">Preferred contact: WhatsApp</option>
          <option value="instagram">Preferred contact: Instagram</option>
          <option value="phone">Preferred contact: Phone</option>
          <option value="email">Preferred contact: Email</option>
        </select>
      </Section>

      <Section title="2) Tattoo Design">
        <textarea placeholder="Describe your tattoo idea and meaning" value={note} onChange={e => setNote(e.target.value)} rows={3} style={textAreaStyle} />
        <textarea placeholder="Anything to avoid or change from references?" value={changeRequest} onChange={e => setChangeRequest(e.target.value)} rows={3} style={textAreaStyle} />
        <select value={style} onChange={e => setStyle(e.target.value)} style={inputStyle}>
          <option value="">Select style</option>
          {STYLE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Section>

      <Section title="3) Placement & Size">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Body part" value={bodyPart} onChange={e => setBodyPart(e.target.value)} style={inputStyle} />
          <input placeholder="Approx size (e.g. 8x5cm)" value={size} onChange={e => setSize(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select value={coverUp} onChange={e => setCoverUp(e.target.value as typeof coverUp)} style={inputStyle}>
            <option value="no">Cover-up needed: No</option>
            <option value="yes">Cover-up needed: Yes</option>
          </select>
          <select value={scarArea} onChange={e => setScarArea(e.target.value as typeof scarArea)} style={inputStyle}>
            <option value="no">Scar/stretch area: No</option>
            <option value="yes">Scar/stretch area: Yes</option>
          </select>
        </div>
      </Section>

      <Section title="4) Budget & Schedule">
        <select value={consultMode} onChange={e => setConsultMode(e.target.value as typeof consultMode)} style={inputStyle}>
          <option value="online_chat">Next step: Online chat first</option>
          <option value="consult_booking">Next step: Book consultation</option>
          <option value="walk_in_direct">Next step: Direct walk-in</option>
        </select>
        <select value={budget} onChange={e => setBudget(e.target.value)} style={inputStyle}>
          <option value="">Budget range</option>
          <option value="under_300">Under $300</option>
          <option value="300_600">$300-$600</option>
          <option value="600_1000">$600-$1000</option>
          <option value="1000_plus">$1000+</option>
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} style={inputStyle} />
          <input type="time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} style={inputStyle} />
        </div>
        <select value={decisionMaker} onChange={e => setDecisionMaker(e.target.value as typeof decisionMaker)} style={inputStyle}>
          <option value="self">Decision maker: Myself</option>
          <option value="shared">Decision maker: Shared with partner/friend</option>
        </select>
      </Section>

      <Section title="5) Health & Safety">
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Allergies (if any)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {ALLERGY_OPTIONS.map(a => (
            <button key={a} onClick={() => toggleAllergy(a)} style={{ padding: '6px 10px', borderRadius: 999, border: allergies.includes(a) ? '1px solid #e11d48' : '1px solid #334155', background: allergies.includes(a) ? '#4c0519' : '#1e293b', color: allergies.includes(a) ? '#fda4af' : '#cbd5e1', cursor: 'pointer' }}>{a}</button>
          ))}
        </div>
        {allergies.length > 0 && (
          <>
            <select value={allergySeverity} onChange={e => setAllergySeverity(e.target.value as typeof allergySeverity)} style={inputStyle}>
              <option value="low">Low concern</option>
              <option value="medium">Medium concern</option>
              <option value="high">High concern</option>
            </select>
            <textarea placeholder="Allergy details" value={allergyNote} onChange={e => setAllergyNote(e.target.value)} rows={2} style={textAreaStyle} />
          </>
        )}
      </Section>

      <Section title="6) Reference Images (Optional)">
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>You can submit without images.</p>
        <input type="file" accept="image/*" multiple onChange={e => void handleFiles(e.target.files)} style={{ marginBottom: 10 }} />
        {referenceImages.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {referenceImages.map((src, i) => <img key={i} src={src} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 8 }} />)}
          </div>
        )}
      </Section>

      <select value={source} onChange={e => setSource(e.target.value as typeof source)} style={inputStyle}>
        <option value="instagram">Source: Instagram</option>
        <option value="facebook">Source: Facebook</option>
        <option value="tiktok">Source: TikTok</option>
        <option value="referral">Source: Referral</option>
        <option value="walk_in">Source: Walk-in</option>
        <option value="other">Source: Other</option>
      </select>

      <button onClick={submit} disabled={submitting || !name.trim()} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: submitting ? '#475569' : '#e11d48', color: 'white', fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
        {submitting ? 'Submitting...' : t(lang, 'submit_request')}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#111827', border: '1px solid #243244', borderRadius: 12, padding: 10, marginBottom: 10 }}>
      <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 700, marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: 8,
  borderRadius: 10,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  boxSizing: 'border-box',
};

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


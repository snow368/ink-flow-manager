import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type ClientRecord, type AppointmentRecord, type InvoiceRecord, type SessionRecord, type PortfolioRecord, type ProjectRecord, type PhotoRecord, PHOTO_STEPS, BODY_PART_LABELS, type BodyPart, type PhotoStep } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';
import { detectInitialLanguage, t } from '../lib/i18n';
import { formatInvoiceCurrency, getCountryConfig } from '../lib/invoiceConfig';
import { checkAndSuggestMerge, mergeClients } from '../lib/clientMerge';
import { getChannelIcon, getDirectionBadge, getClientTimeline } from '../lib/communicationLog';
import type { CommunicationLogRecord } from '../db';
import { logCommunication } from '../lib/communicationLog';
import { buildClientTimeline, getClientTimelineSummary, calculateEngagementScore, getSmartInsights, TIMELINE_EVENT_CONFIG } from '../lib/clientTimeline';
import type { ClientTimelineItem, EngagementScoreResult, SmartInsight } from '../lib/clientTimeline';
import { getAftercareStatus, type AftercareStatus } from '../lib/aftercareEngine';
import { detectTouchUpNeed, type TouchUpRisk } from '../lib/touchupDetector';
import { getRepeatBookingSignals, type RepeatBookingSignal } from '../lib/repeatBookingEngine';
import { getReferralOpportunity, type ReferralOpportunity } from '../lib/referralEngine';
import { getClientRiskProfile, type ClientRiskProfile } from '../lib/clientRiskEngine';
import { getNextBestAction, type NextBestAction } from '../lib/nextBestAction';

interface ImageEntry {
  type: 'design' | 'progress' | 'finished';
  imageUrl: string;
  date: number;
  note?: string;
  projectTitle?: string;
}

const IMAGE_TYPE_LABELS: Record<ImageEntry['type'], { label: string; color: string }> = {
  design: { label: 'Design', color: '#93c5fd' },
  progress: { label: 'In Progress', color: '#fbbf24' },
  finished: { label: 'Finished', color: '#4ade80' },
};

const TAG_COLORS: Record<string, string> = {
  vip: '#fbbf24', at_risk: '#f87171', new: '#4ade80',
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editingContact, setEditingContact] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [message, setMessage] = useState('');
  const [potentialDuplicates, setPotentialDuplicates] = useState<ClientRecord[]>([]);
  const [showMergeSuggestion, setShowMergeSuggestion] = useState(false);
  const [commLogs, setCommLogs] = useState<CommunicationLogRecord[]>([]);
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [showDmLog, setShowDmLog] = useState(false);
  const [dmTopic, setDmTopic] = useState('design_change');
  const [dmNote, setDmNote] = useState('');
  const [timeline, setTimeline] = useState<ClientTimelineItem[]>([]);
  const [engagementScore, setEngagementScore] = useState<EngagementScoreResult | null>(null);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'key' | 'messages'>('all');
  const [aftercareStatuses, setAftercareStatuses] = useState<Map<string, AftercareStatus>>(new Map());
  const [touchupRisks, setTouchupRisks] = useState<Map<string, TouchUpRisk>>(new Map());
  const [repeatSignal, setRepeatSignal] = useState<RepeatBookingSignal | null>(null);
  const [referralOpportunity, setReferralOpportunity] = useState<ReferralOpportunity | null>(null);
  const [riskProfile, setRiskProfile] = useState<ClientRiskProfile | null>(null);
  const [nextAction, setNextAction] = useState<NextBestAction | null>(null);

  useEffect(() => {
    if (!id) return;
    loadClient();
    loadDuplicates(id);
    loadPhotos();
    db.appointments.where('clientId').equals(id).reverse().sortBy('date').then(setAppointments);
    db.invoices.where('clientId').equals(id).reverse().sortBy('createdAt').then(setInvoices);
    loadImages(id);
    getClientTimeline(id).then(logs => setCommLogs(logs.slice(0, 30)));
    // Load full client timeline
    buildClientTimeline(id).then(items => {
      setTimeline(items);
      setEngagementScore(calculateEngagementScore(items));
      setInsights(getSmartInsights(items));
    });
    // Load aftercare + retention data
    (async () => {
      const sessions = await db.sessions.where('clientId').equals(id).toArray();
      const completedSessions = sessions.filter(s => s.sessionState === 'completed');
      // Aftercare status per session
      const statusMap = new Map<string, AftercareStatus>();
      for (const s of completedSessions) {
        const st = await getAftercareStatus(s.id);
        statusMap.set(s.id, st);
      }
      setAftercareStatuses(statusMap);
      // Touch-up risk per project
      const projects = await db.projects.where('clientId').equals(id).toArray();
      const riskMap = new Map<string, TouchUpRisk>();
      for (const p of projects) {
        const risk = await detectTouchUpNeed(p.id);
        riskMap.set(p.id, risk);
      }
      setTouchupRisks(riskMap);
      // Repeat booking signal
      const rep = await getRepeatBookingSignals(id);
      setRepeatSignal(rep);
      // Referral opportunity
      const ref = await getReferralOpportunity(id);
      setReferralOpportunity(ref);
      // Risk profile + next best action for first project
      const clientProjects = await db.projects.where('clientId').equals(id).toArray();
      if (clientProjects.length > 0) {
        const firstPid = clientProjects[0].id;
        getClientRiskProfile(firstPid).then(setRiskProfile);
        getNextBestAction(firstPid).then(setNextAction);
      }
    })();
    db.users.where('roles').anyOf(['artist', 'owner']).toArray().then(users => {
      setArtists(users.map(u => ({ id: u.id, name: u.name })));
    });
  }, [id]);

  const loadImages = async (clientId: string) => {
    const entries: ImageEntry[] = [];

    // Sessions — progress photos
    const apps = await db.appointments.where('clientId').equals(clientId).toArray();
    const appIds = apps.map(a => a.id);
    if (appIds.length > 0) {
      const sessions = await db.sessions.where('appointmentId').anyOf(appIds).toArray();
      for (const s of sessions) {
        // Collect notes from timeline
        const timelineNotes = s.timeline?.filter(t => t.type === 'note').map(t => t.payload || '') || [];
        for (let i = 0; i < (s.photos || []).length; i++) {
          entries.push({
            type: 'progress',
            imageUrl: s.photos[i],
            date: s.startedAt,
            note: timelineNotes[i] || s.notes?.[i] || undefined,
          });
        }
      }
    }

    // Projects & Portfolio — design + finished
    const projects = await db.projects.where('clientId').equals(clientId).toArray();
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const projectIds = projects.map(p => p.id);
    if (projectIds.length > 0) {
      const portfolios = await db.portfolio.where('projectId').anyOf(projectIds).toArray();
      for (const p of portfolios) {
        const proj = projectMap.get(p.projectId || '');
        entries.push({
          type: 'finished',
          imageUrl: p.imageUrl,
          date: p.createdAt,
          note: proj?.style || undefined,
          projectTitle: proj?.title,
        });
      }
    }

    // Design drafts from projects that have status consultation/in_progress
    for (const proj of projects) {
      if (
        proj.status === 'consultation' ||
        proj.status === 'design' ||
        proj.status === 'in_progress' ||
        proj.status === 'scheduled' ||
        proj.status === 'approved'
      ) {
        // Use project itself as design reference
        entries.push({
          type: 'design',
          imageUrl: '', // no image — show as placeholder card
          date: proj.createdAt,
          note: proj.bodyPart ? `${proj.style || ''} · ${proj.bodyPart}` : proj.style,
          projectTitle: proj.title,
        });
      }
    }

    entries.sort((a, b) => b.date - a.date);
    setImages(entries);
  };

  const loadPhotos = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/photos/${id}`, {
        headers: { 'x-api-secret': localStorage.getItem('inkflow_api_secret') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos((data.photos || []).sort((a: any, b: any) => b.createdAt - a.createdAt));
      }
    } catch { /* offline fallback */ }
  };

  const handleAddPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file || !id) return;
      const bodyPart = prompt('部位: arm / leg / chest / back / hand / foot / neck / face / ribs / hip / shoulder / other') || 'other';
      const step = parseInt(prompt('步骤 (1-6):\n1=干净皮肤 2=Stencil 3=刻线 4=上色 5=完成 6=包扎') || '5') as PhotoStep;
      if (step < 1 || step > 6) return;
      try {
        // 1. Upload image to R2
        const formData = new FormData();
        formData.append('artistId', '');
        formData.append('file', file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-api-secret': localStorage.getItem('inkflow_api_secret') || '' },
          body: formData,
        });
        if (!uploadRes.ok) return;
        const { url } = await uploadRes.json();
        // 2. Save metadata to D1
        await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-secret': localStorage.getItem('inkflow_api_secret') || '' },
          body: JSON.stringify({ clientId: id, imageUrl: url, bodyPart, step, source: 'gallery_import' }),
        });
      } catch {}
      loadPhotos();
    };
    input.click();
  };

  const loadClient = () => {
    if (!id) return;
    db.clients.get(id).then(c => {
      setClient(c || null);
      setBirthday(c?.birthday || '');
    });
  };

  const loadDuplicates = (clientId: string) => {
    db.clients.get(clientId).then(c => {
      if (!c) return;
      checkAndSuggestMerge(c.name, c.phone, c.email, c.artistId).then(dupes => {
        setPotentialDuplicates(dupes.filter(d => d.id !== clientId));
        setShowMergeSuggestion(dupes.filter(d => d.id !== clientId).length > 0);
      });
    });
  };

  const handleMergeIntoCurrent = async (mergeId: string) => {
    if (!id || !client) return;
    await mergeClients(id, [mergeId]);
    setPotentialDuplicates(prev => prev.filter(d => d.id !== mergeId));
    if (potentialDuplicates.length <= 1) setShowMergeSuggestion(false);
    loadClient();
    setMessage('Clients merged successfully.');
  };

  const saveBirthday = async () => {
    if (!client) return;
    await db.clients.update(client.id, { birthday: birthday || undefined });
    setEditingBirthday(false);
    loadClient();
  };

  const toggleTag = async (tag: string) => {
    if (!client) return;
    const tags = client.tags || [];
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    await db.clients.update(client.id, { tags: next });
    loadClient();
  };

  const addCustomTag = async () => {
    const trimmed = tagInput.trim();
    if (!trimmed || !client) return;
    const tags = client.tags || [];
    if (tags.includes(trimmed)) { setTagInput(''); return; }
    await db.clients.update(client.id, { tags: [...tags, trimmed] });
    setTagInput('');
    loadClient();
  };

  const handleSaveContact = async () => {
    if (!client) return;
    await db.clients.update(client.id, {
      phone: editPhone || undefined,
      email: editEmail || undefined,
      instagram: editInstagram || undefined,
      notes: editNotes || undefined,
    });
    setEditingContact(false);
    loadClient();
  };

  if (!client) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  const formatDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString() : 'Never';
  const formatCents = (c?: number) => c != null ? '$' + (c / 100).toFixed(0) : '$0';

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 100 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
        ← {t(lang, 'back')}
      </button>

      {message && (
        <div style={{ background: '#14532d', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#86efac' }}>{message}</p>
        </div>
      )}

      {showMergeSuggestion && potentialDuplicates.length > 0 && (
        <div style={{ background: '#1e293b', border: '1px solid #c084fc44', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#c084fc', fontWeight: 700, marginBottom: 4 }}>
            Possible Duplicate{potentialDuplicates.length > 1 ? 's' : ''} Found
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
            These clients share the same phone or email. Merge to combine their history.
          </p>
          {potentialDuplicates.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #334155' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>{d.phone || 'No phone'} · {d.email || 'No email'}</p>
              </div>
              <button onClick={async () => {
                await handleMergeIntoCurrent(d.id);
              }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Merge →
              </button>
            </div>
          ))}
          <button onClick={() => setShowMergeSuggestion(false)}
            style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: 11, cursor: 'pointer' }}>
            Dismiss
          </button>
        </div>
      )}

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 20, fontWeight: 'bold' }}>{client.name}</p>
        <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
          {client.phone || 'No phone'} — {client.email || 'No email'}
          {client.instagram && <span> — @{client.instagram}</span>}
          <button onClick={() => {
            if (!editingContact) {
              setEditPhone(client.phone || '');
              setEditEmail(client.email || '');
              setEditInstagram(client.instagram || '');
              setEditNotes(client.notes || '');
            }
            setEditingContact(!editingContact);
          }}
            style={{ ...editIcon, marginLeft: 6 }}>{editingContact ? 'Cancel' : 'Edit'}</button>
        </p>
        {editingContact && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone" style={miniInput} />
            <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" style={miniInput} />
            <input value={editInstagram} onChange={e => setEditInstagram(e.target.value)} placeholder="Instagram" style={miniInput} />
            <input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes" style={{ ...miniInput, flex: 2 }} />
            <button onClick={handleSaveContact} style={qaBtn('#22c55e')}>Save</button>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={() => navigate(`/appointment/new?clientId=${client.id}`)}
            style={qaBtn('#e11d48')}>Book</button>
          {client.phone && (
            <button onClick={() => window.open(`https://wa.me/${client.phone!.replace(/\D/g, '')}`, '_blank')}
              style={qaBtn('#075e54')}>WhatsApp</button>
          )}
          {client.instagram && (
            <button onClick={() => window.open(`https://instagram.com/${client.instagram}`, '_blank')}
              style={qaBtn('#a855f7')}>Instagram</button>
          )}
          <button onClick={() => navigate(`/invoices?clientId=${client.id}`)}
            style={qaBtn('#7e22ce')}>Invoice</button>
        </div>
      </div>

      {/* Assign to Artist */}
      <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{t(lang, 'assigned_artist')}</span>
          <select value={client.assignToArtistId || client.artistId || ''} onChange={async e => {
            const val = e.target.value || undefined;
            await db.clients.update(client!.id, { assignToArtistId: val });
            loadClient();
          }}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, maxWidth: 200 }}>
            <option value="">Unassigned</option>
            {artists.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Birthday */}
      <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>{t(lang, 'client_birthday')}</span>
          {editingBirthday ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, colorScheme: 'dark' }} />
              <button onClick={saveBirthday} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#22c55e', color: 'white', fontSize: 12 }}>Save</button>
              <button onClick={() => setEditingBirthday(false)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12 }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditingBirthday(true)}
              style={{ fontSize: 14, color: client.birthday ? '#e2e8f0' : '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              {client.birthday || t(lang, 'not_set')}
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>{t(lang, 'client_tags')}</span>
          <button onClick={() => setEditingTags(!editingTags)}
            style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 12 }}>{editingTags ? 'Done' : 'Edit'}</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(client.tags || []).map(tag => (
            <span key={tag} onClick={() => editingTags && toggleTag(tag)}
              style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                background: (TAG_COLORS[tag] || '#64748b') + '33',
                color: TAG_COLORS[tag] || '#94a3b8',
                cursor: editingTags ? 'pointer' : 'default',
              }}>
              {tag} {editingTags ? '✕' : ''}
            </span>
          ))}
          {(!client.tags || client.tags.length === 0) && (
            <span style={{ fontSize: 12, color: '#64748b' }}>{t(lang, 'no_tags')}</span>
          )}
        </div>
        {editingTags && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input placeholder="Add tag" value={tagInput} onChange={e => setTagInput(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13 }} />
            <button onClick={addCustomTag}
              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#334155', color: 'white', fontSize: 12 }}>Add</button>
            <button onClick={() => toggleTag('vip')}
              style={tagBtn(TAG_COLORS.vip)}>VIP</button>
            <button onClick={() => toggleTag('new')}
              style={tagBtn(TAG_COLORS.new)}>New</button>
            <button onClick={() => toggleTag('at_risk')}
              style={tagBtn(TAG_COLORS.at_risk)}>At Risk</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{t(lang, 'client_total_spend')}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{formatCents(client.totalSpend)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{t(lang, 'client_last_visit')}</span>
          <span style={{ fontSize: 14 }}>{formatDate(client.lastVisitAt)}</span>
        </div>
        {client.leadSource && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{t(lang, 'client_lead_source')}</span>
            <span style={{ fontSize: 14, color: '#93c5fd' }}>{client.leadSource}</span>
          </div>
        )}
      </div>

      {/* Allergies */}
      {client.allergies && client.allergies.length > 0 && (
        <div style={{ background: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 12 }}>
          <p style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Allergy Notes</p>
          {client.allergies.map((a, i) => <p key={i} style={{ fontSize: 14, color: '#fca5a5' }}>- {a}</p>)}
        </div>
      )}

      {/* Tattoo Image Gallery */}
      {images.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Tattoos ({images.length})</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['design', 'progress', 'finished'] as const).map(t => {
                const info = IMAGE_TYPE_LABELS[t];
                const count = images.filter(i => i.type === t).length;
                if (count === 0) return null;
                return (
                  <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: info.color + '22', color: info.color }}>
                    {info.label} {count}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
            {images.map((img, idx) => (
              <div key={idx} onClick={() => img.imageUrl && setFullImage(img.imageUrl)}
                style={{ minWidth: 160, maxWidth: 160, background: '#1e293b', borderRadius: 10, overflow: 'hidden', cursor: img.imageUrl ? 'pointer' : 'default', scrollSnapAlign: 'start', flexShrink: 0 }}>
                {img.imageUrl ? (
                  <div style={{ height: 120, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={img.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                ) : (
                  <div style={{ height: 80, background: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 24 }}>📐</span>
                  </div>
                )}
                <div style={{ padding: 8 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: IMAGE_TYPE_LABELS[img.type].color + '22', color: IMAGE_TYPE_LABELS[img.type].color, fontWeight: 600 }}>
                      {IMAGE_TYPE_LABELS[img.type].label}
                    </span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>
                      {new Date(img.date).toLocaleDateString().slice(5)}
                    </span>
                  </div>
                  {img.projectTitle && (
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{img.projectTitle}</p>
                  )}
                  {img.note && (
                    <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.3 }}>{img.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Photo Wall (body part grouped) ── */}
      {photos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Photo Wall ({photos.length})</h3>
            <button onClick={handleAddPhoto} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>+ Add Photo</button>
          </div>
          {/* Group by body part */}
          {[...new Set(photos.map(p => p.bodyPart))].map(bp => {
            const partPhotos = photos.filter(p => p.bodyPart === bp).sort((a: any, b: any) => a.step - b.step || a.createdAt - b.createdAt);
            return (
              <div key={bp} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{BODY_PART_LABELS[bp as BodyPart]}</p>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {partPhotos.map(p => {
                    const stepInfo = PHOTO_STEPS.find(s => s.step === p.step);
                    return (
                      <div key={p.id} onClick={() => p.imageUrl && setFullImage(p.imageUrl)}
                        style={{ minWidth: 140, maxWidth: 140, background: '#1e293b', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ height: 100, background: '#0f172a', overflow: 'hidden' }}>
                          <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        </div>
                        <div style={{ padding: 6 }}>
                          <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#334155', color: '#94a3b8' }}>
                            {stepInfo?.label || `Step ${p.step}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-screen image viewer */}
      {fullImage && (
        <div onClick={() => setFullImage(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={fullImage} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setFullImage(null)}
            style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 20, border: 'none', background: '#ffffff22', color: 'white', fontSize: 20, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Client Timeline ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 10 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Client Timeline</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Timeline filter */}
          {(['all', 'key', 'messages'] as const).map(f => (
            <button key={f} onClick={() => setTimelineFilter(f)}
              style={{
                padding: '3px 10px', borderRadius: 6, border: 'none',
                background: timelineFilter === f ? '#60a5fa' : '#334155',
                color: timelineFilter === f ? '#000' : '#94a3b8',
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}>
              {f === 'all' ? 'All' : f === 'key' ? 'Key Events' : 'Messages'}
            </button>
          ))}
        </div>
      </div>

      {/* Engagement Score + Insights */}
      {engagementScore && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Score ring */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(${engagementScore.score >= 80 ? '#22c55e' : engagementScore.score >= 60 ? '#f59e0b' : engagementScore.score >= 40 ? '#f97316' : '#64748b'} ${engagementScore.score}%, #334155 ${engagementScore.score}%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: '#1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{engagementScore.score}</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{engagementScore.label}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>Engagement</span>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                {timeline.length} events · {engagementScore.riskFlags.length > 0 ? engagementScore.riskFlags[0] : 'No flags'}
              </p>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {insights.slice(0, 3).map((ins, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: ins.severity === 'positive' ? '#14532d' : ins.severity === 'warning' ? '#451a03' : '#7f1d1d',
                  border: `1px solid ${ins.severity === 'positive' ? '#22c55e30' : ins.severity === 'warning' ? '#f59e0b30' : '#ef444430'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: ins.severity === 'positive' ? '#4ade80' : ins.severity === 'warning' ? '#fbbf24' : '#f87171',
                    }}>
                      {ins.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#cbd5e1', margin: '3px 0 0', lineHeight: 1.4 }}>{ins.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline event list */}
      <div style={{ marginBottom: 16 }}>
        {timeline.length === 0 ? (
          <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
            No timeline events yet.
          </p>
        ) : (
          timeline
            .filter(item => {
              if (timelineFilter === 'messages') return item.type === 'message_sent' || item.type === 'message_received';
              if (timelineFilter === 'key') return !['message_sent', 'message_received', 'note', 'session_break', 'session_resumed'].includes(item.type);
              return true;
            })
            .slice(0, 50)
            .map(item => {
              const cfg = TIMELINE_EVENT_CONFIG[item.type];
              return (
                <div key={item.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderLeft: `2px solid ${cfg.color}40`, paddingLeft: 12, position: 'relative', marginLeft: 6 }}>
                  <div style={{ position: 'absolute', left: -5, top: 12, width: 8, height: 8, borderRadius: 4, background: cfg.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                      {item.projectTitle && (
                        <span style={{ fontSize: 9, color: '#475569' }}>{item.projectTitle}</span>
                      )}
                      <span style={{ fontSize: 9, color: '#475569', marginLeft: 'auto' }}>
                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0', margin: 0 }}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
        )}
        {timeline.length > 50 && (
          <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: '8px 0' }}>
            Showing 50 of {timeline.length} events
          </p>
        )}
      </div>

      {/* Log DM button (below timeline) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowDmLog(true)}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #475569', background: '#1e293b', color: '#60a5fa', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + Log DM
        </button>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Appointment History</h3>
      {appointments.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: 14 }}>No appointments yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appointments.map(a => (
            <div key={a.id} style={{ background: '#1e293b', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{a.date} - {a.time}</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{a.type || 'Unspecified'} - {a.duration} min</p>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: (STATUS_COLORS[a.status] || '#9ca3af') + '33', color: STATUS_COLORS[a.status] }}>
                {STATUS_LABELS[a.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Invoice History */}
      {invoices.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, marginTop: 20 }}>
            Invoice History ({invoices.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invoices.map(inv => {
              const cfg = getCountryConfig(inv.country);
              return (
                <div key={inv.id} onClick={() => navigate(`/invoice/${inv.id}`)}
                  style={{ background: '#1e293b', borderRadius: 10, padding: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>#{inv.invoiceNumber}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(inv.createdAt).toLocaleDateString(cfg.locale, { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{formatInvoiceCurrency(inv.total, inv.country)}</p>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 }}>
                      {inv.sentAt ? (
                        <span style={{ fontSize: 10, color: '#60a5fa' }}>Sent via {inv.sentVia}</span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#fbbf24' }}>Not sent</span>
                      )}
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: inv.paymentStatus === 'paid' ? '#22c55e20' : '#fbbf2420', color: inv.paymentStatus === 'paid' ? '#4ade80' : '#fbbf24' }}>
                        {inv.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Client 360 ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #1e1b4b 100%)', border: '1px solid #4338ca', borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#a5b4fc', marginBottom: 10 }}>{t(lang, 'client_360')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: '#64748b' }}>{t(lang, 'client_session_count')}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa' }}>{appointments.length}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#64748b' }}>{t(lang, 'client_lifetime_value')}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#4ade80' }}>
              ${invoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.total, 0).toFixed(0)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#64748b' }}>Completed</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{appointments.filter(a => a.status === 'done').length}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#64748b' }}>{t(lang, 'client_no_show_rate')}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: appointments.length > 0 ? (appointments.filter(a => a.status === 'cancelled').length / appointments.length > 0.3 ? '#ef4444' : '#94a3b8') : '#64748b' }}>
              {appointments.length > 0 ? Math.round(appointments.filter(a => a.status === 'cancelled').length / appointments.length * 100) + '%' : '—'}
            </p>
          </div>
        </div>
        {client.tags && client.tags.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {client.tags.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#312e81', color: '#a5b4fc' }}>{t}</span>)}
          </div>
        )}
      </div>

      {/* ── Aftercare & Retention ── */}
      {aftercareStatuses.size > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>Aftercare & Retention</p>

          {/* Aftercare Progress */}
          {Array.from(aftercareStatuses.entries()).map(([sessionId, status]) => {
            const allDays = [1, 3, 7, 30];
            const sentSet = new Set(status.sentDays.map(d => d.day));
            return (
              <div key={sessionId} style={{ marginBottom: 10, padding: 10, background: '#0f172a', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Aftercare Schedule</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: status.allSent ? '#22c55e20' : '#f59e0b20', color: status.allSent ? '#4ade80' : '#fbbf24', fontWeight: 600 }}>
                    {status.allSent ? 'Complete' : `${status.pendingDays.length} pending`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {allDays.map(day => {
                    const sent = sentSet.has(day);
                    return (
                      <div key={day} style={{
                        flex: 1, padding: '6px 0', borderRadius: 6, textAlign: 'center',
                        background: sent ? '#22c55e20' : '#33415540',
                        border: `1px solid ${sent ? '#22c55e40' : '#334155'}`,
                        fontSize: 11, fontWeight: 600, color: sent ? '#4ade80' : '#64748b',
                      }}>
                        D{day}{sent ? ' ✓' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Healing Status */}
          {Array.from(aftercareStatuses.keys()).length > 0 && (
            <div style={{ marginBottom: 10, padding: 10, background: '#0f172a', borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Healing Status</span>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {(['healing', 'stable', 'fully_healed', 'needs_touchup'] as const).map(st => (
                  <button key={st} onClick={async () => {
                    const sId = Array.from(aftercareStatuses.keys())[0];
                    await db.sessions.update(sId, { healingStatus: st });
                    // Refresh
                    const statusMap = new Map(aftercareStatuses);
                    const newStatus = await getAftercareStatus(sId);
                    statusMap.set(sId, newStatus);
                    setAftercareStatuses(new Map(statusMap));
                  }} style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid #334155',
                    background: 'transparent', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    color: st === 'needs_touchup' ? '#ef4444' : st === 'fully_healed' ? '#22c55e' : st === 'stable' ? '#60a5fa' : '#f59e0b',
                  }}>
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Touch-up Risk */}
          {Array.from(touchupRisks.entries()).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {Array.from(touchupRisks.entries()).map(([projectId, risk]) => {
                const riskColors = { low: '#64748b', medium: '#f59e0b', high: '#ef4444' };
                return (
                  <div key={projectId} style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: `${riskColors[risk.risk]}15`,
                    border: `1px solid ${riskColors[risk.risk]}30`,
                    fontSize: 11, flex: 1, minWidth: 0,
                  }}>
                    <span style={{ fontWeight: 700, color: riskColors[risk.risk] }}>
                      Touch-up Risk: {risk.risk.toUpperCase()}
                    </span>
                    <p style={{ color: '#94a3b8', margin: '2px 0 0', fontSize: 10 }}>{risk.suggestedAction}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Repeat Booking Suggestion */}
          {repeatSignal && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 6,
              background: repeatSignal.likelihood === 'high' ? '#14532d' : repeatSignal.likelihood === 'medium' ? '#451a03' : '#1e293b',
              border: `1px solid ${repeatSignal.likelihood === 'high' ? '#22c55e30' : repeatSignal.likelihood === 'medium' ? '#f59e0b30' : '#334155'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: repeatSignal.likelihood === 'high' ? '#4ade80' : repeatSignal.likelihood === 'medium' ? '#fbbf24' : '#94a3b8' }}>
                  Repeat Booking: {repeatSignal.likelihood}
                </span>
                <span style={{ fontSize: 9, color: '#64748b' }}>
                  Timing: {repeatSignal.timing.replace('_', ' ')}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: '3px 0 0', fontStyle: 'italic' }}>
                "{repeatSignal.suggestedMessage}"
              </p>
            </div>
          )}

          {/* Referral Suggestion */}
          {referralOpportunity && referralOpportunity.ready && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: '#312e81',
              border: '1px solid #4338ca30',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc' }}>
                  Referral Ready
                </span>
                <span style={{ fontSize: 9, color: '#64748b' }}>
                  Timing: {referralOpportunity.timing.replace('_', ' ')}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: '3px 0 0', fontStyle: 'italic' }}>
                "{referralOpportunity.promptMessage}"
              </p>
            </div>
          )}

          {/* Risk Profile */}
          {riskProfile && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 6,
              background: riskProfile.risk === 'high' ? '#7f1d1d' : riskProfile.risk === 'medium' ? '#451a03' : '#14532d',
              border: `1px solid ${riskProfile.risk === 'high' ? '#ef444430' : riskProfile.risk === 'medium' ? '#f59e0b30' : '#22c55e30'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  color: riskProfile.risk === 'high' ? '#f87171' : riskProfile.risk === 'medium' ? '#fbbf24' : '#4ade80' }}>
                  Risk: {riskProfile.risk.toUpperCase()}
                </span>
              </div>
              {riskProfile.reasons.length > 0 && (
                <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>
                  {riskProfile.reasons.join('; ')}
                </p>
              )}
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: '3px 0 0' }}>
                {riskProfile.suggestedAction}
              </p>
            </div>
          )}

          {/* Next Best Action */}
          {nextAction && nextAction.priority < 9 && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: '#1e3a5f',
              border: '1px solid #60a5fa30',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#93c5fd' }}>
                  Next: {nextAction.action}
                </span>
                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3,
                  background: nextAction.category === 'revenue' ? '#22c55e20' : nextAction.category === 'conversion' ? '#f59e0b20' : '#60a5fa20',
                  color: nextAction.category === 'revenue' ? '#4ade80' : nextAction.category === 'conversion' ? '#fbbf24' : '#93c5fd',
                  fontWeight: 600 }}>
                  {nextAction.category}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: '3px 0 0' }}>
                {nextAction.reason}
              </p>
            </div>
          )}
        </div>
      )}
      {showDmLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }}>
          <div style={{ width: '100%', background: '#1e293b', borderRadius: '16px 16px 0 0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 700 }}>Log DM Conversation</p>
              <button onClick={() => { setShowDmLog(false); setDmNote(''); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Topic</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { id: 'design_change', label: 'Design Change' },
                { id: 'scheduling', label: 'Scheduling' },
                { id: 'pricing', label: 'Pricing' },
                { id: 'aftercare', label: 'Aftercare' },
                { id: 'other', label: 'Other' },
              ].map(t => (
                <button key={t.id} onClick={() => setDmTopic(t.id)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: dmTopic === t.id ? '#e11d48' : '#334155', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>
            <textarea value={dmNote} onChange={e => setDmNote(e.target.value)}
              placeholder="What was discussed? E.g. Client wants to change dragon sleeve colors, said they'll come in Saturday to adjust in person."
              style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: 13, resize: 'vertical', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowDmLog(false); setDmNote(''); }}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={async () => {
                if (!dmNote.trim() || !id || !client) return;
                const artistId = localStorage.getItem('inkflow_current_user') || '';
                await logCommunication(artistId, 'instagram', 'inbound', {
                  clientId: id,
                  message: `[${dmTopic}] ${dmNote.trim()}`,
                  templateType: `dm_${dmTopic}`,
                });
                setCommLogs(await getClientTimeline(id));
                setDmNote('');
                setShowDmLog(false);
              }}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: dmNote.trim() ? '#3b82f6' : '#334155', color: 'white', fontSize: 14, fontWeight: 600, cursor: dmNote.trim() ? 'pointer' : 'default' }}>
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tagBtn = (color: string): React.CSSProperties => ({
  padding: '4px 8px', borderRadius: 6, border: `1px solid ${color}44`,
  background: 'transparent', color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
});

const qaBtn = (bg: string): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 8, border: 'none', background: bg,
  color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', flex: 1,
});

const editIcon: React.CSSProperties = {
  background: 'none', border: 'none', color: '#60a5fa', fontSize: 12, cursor: 'pointer', padding: 0,
};

const miniInput: React.CSSProperties = {
  padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a',
  color: 'white', fontSize: 13, flex: 1, minWidth: 0,
};

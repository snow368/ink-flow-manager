import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type LeadRecord, type LeadRevisionRecord } from '../db';

type FollowPreset = {
  id: string;
  label: string;
  minutes: number;
};

const STATUS_COLORS: Record<LeadRecord['status'], string> = {
  new: '#60a5fa',
  contacted: '#f59e0b',
  booked: '#34d399',
  won: '#22c55e',
  lost: '#94a3b8',
};

const DEFAULT_PRESETS: FollowPreset[] = [
  { id: 'tomorrow', label: 'Tomorrow', minutes: 24 * 60 },
  { id: 'in_3_days', label: 'In 3 Days', minutes: 3 * 24 * 60 },
  { id: 'next_monday', label: 'Next Monday', minutes: 7 * 24 * 60 },
  { id: 'month_end', label: 'Month End', minutes: 21 * 24 * 60 },
];

function presetsKey(artistId: string) {
  return `inkflow_followup_presets_${artistId}`;
}

function loadPresets(artistId: string): FollowPreset[] {
  if (!artistId) return DEFAULT_PRESETS;
  try {
    const raw = localStorage.getItem(presetsKey(artistId));
    if (!raw) return DEFAULT_PRESETS;
    const parsed = JSON.parse(raw) as FollowPreset[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PRESETS;
    return parsed.filter(p => p && typeof p.label === 'string' && Number.isFinite(p.minutes) && p.minutes > 0);
  } catch {
    return DEFAULT_PRESETS;
  }
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState('');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [filter, setFilter] = useState<LeadRecord['status'] | 'all'>('all');
  const [revisionsByLead, setRevisionsByLead] = useState<Map<string, LeadRevisionRecord[]>>(new Map());
  const [draftNoteByLead, setDraftNoteByLead] = useState<Record<string, string>>({});
  const [draftChangeByLead, setDraftChangeByLead] = useState<Record<string, string>>({});
  const [draftImagesByLead, setDraftImagesByLead] = useState<Record<string, string[]>>({});
  const [draftChannelByLead, setDraftChannelByLead] = useState<Record<string, LeadRevisionRecord['channel']>>({});
  const [quickActionByLead, setQuickActionByLead] = useState<Record<string, 'contacted' | 'awaiting_confirmation' | 'booked_slot'>>({});
  const [followPresets, setFollowPresets] = useState<FollowPreset[]>(DEFAULT_PRESETS);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetDays, setNewPresetDays] = useState('');

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    setArtistId(current);
    setFollowPresets(loadPresets(current));
    db.leads.where('artistId').equals(current).reverse().sortBy('createdAt').then(setLeads);
  }, []);

  useEffect(() => {
    loadRevisions();
  }, [leads]);

  useEffect(() => {
    if (!artistId) return;
    localStorage.setItem(presetsKey(artistId), JSON.stringify(followPresets));
  }, [artistId, followPresets]);

  const loadRevisions = async () => {
    if (leads.length === 0) {
      setRevisionsByLead(new Map());
      return;
    }
    const ids = new Set(leads.map(l => l.id));
    const all = await db.leadRevisions.orderBy('createdAt').reverse().toArray();
    const grouped = new Map<string, LeadRevisionRecord[]>();
    for (const r of all) {
      if (!ids.has(r.leadId)) continue;
      const arr = grouped.get(r.leadId) || [];
      arr.push(r);
      grouped.set(r.leadId, arr);
    }
    setRevisionsByLead(grouped);
  };

  const refresh = async () => {
    if (!artistId) return;
    const list = await db.leads.where('artistId').equals(artistId).reverse().sortBy('createdAt');
    setLeads(list);
  };

  const toClient = async (lead: LeadRecord) => {
    const now = Date.now();
    const clientId = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);
    const revisionNotes = (revisionsByLead.get(lead.id) || [])
      .slice()
      .reverse()
      .map(r => [r.note, r.changeRequest].filter(Boolean).join(' | '))
      .filter(Boolean)
      .join('\n');

    await db.clients.add({
      id: clientId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      allergies: lead.allergies,
      notes: [lead.note, lead.changeRequest, lead.allergyNote, revisionNotes].filter(Boolean).join('\n'),
      artistId: lead.artistId,
      createdAt: now,
    });
    await db.leads.update(lead.id, { status: 'won' });
    await refresh();
    navigate(`/appointment/new?clientId=${encodeURIComponent(clientId)}&leadId=${encodeURIComponent(lead.id)}`);
  };

  const updateStatus = async (id: string, status: LeadRecord['status']) => {
    await db.leads.update(id, { status });
    await refresh();
  };

  const setFinalRevision = async (leadId: string, revision: LeadRevisionRecord) => {
    await db.leads.update(leadId, { finalRevisionId: revision.id, finalRevisionVersion: revision.version });
    await refresh();
  };

  const setFollowUp = async (leadId: string, minutes: number) => {
    const target = Date.now() + minutes * 60 * 1000;
    await db.leads.update(leadId, { nextFollowUpAt: target });
    await refresh();
  };

  const clearFollowUp = async (leadId: string) => {
    await db.leads.update(leadId, { nextFollowUpAt: undefined });
    await refresh();
  };

  const addFollowPreset = () => {
    const label = newPresetLabel.trim();
    const days = Number(newPresetDays);
    if (!label || !Number.isFinite(days) || days <= 0) return;
    const minutes = Math.round(days * 24 * 60);
    const preset: FollowPreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      minutes,
    };
    setFollowPresets(prev => [...prev, preset]);
    setNewPresetLabel('');
    setNewPresetDays('');
  };

  const removeFollowPreset = (id: string) => {
    setFollowPresets(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(p => p.id !== id);
    });
  };

  const handleDraftFiles = async (leadId: string, files: FileList | null) => {
    if (!files) return;
    const current = draftImagesByLead[leadId] || [];
    const max = Math.min(files.length, Math.max(0, 6 - current.length));
    const list: string[] = [];
    for (let i = 0; i < max; i++) {
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(files[i]);
      });
      list.push(data);
    }
    setDraftImagesByLead(prev => ({ ...prev, [leadId]: [...current, ...list] }));
  };

  const addRevision = async (leadId: string) => {
    const action = quickActionByLead[leadId] || 'contacted';
    const actionText =
      action === 'contacted' ? 'Contacted client, waiting for details.' :
      action === 'awaiting_confirmation' ? 'Details sent, awaiting client confirmation.' :
      'Client accepted proposed slot.';
    const note = (draftNoteByLead[leadId] || '').trim() || actionText;
    const changeRequest = (draftChangeByLead[leadId] || '').trim();
    const images = draftImagesByLead[leadId] || [];
    const channel = draftChannelByLead[leadId] || 'whatsapp';
    if (!note && !changeRequest && images.length === 0) return;

    const existing = revisionsByLead.get(leadId) || [];
    const version = existing.length > 0 ? Math.max(...existing.map(r => r.version)) + 1 : 1;
    const now = Date.now();
    await db.leadRevisions.add({
      id: `rev_${now}_${Math.random().toString(36).slice(2, 6)}`,
      leadId,
      version,
      actor: 'artist',
      channel,
      note: note || undefined,
      changeRequest: changeRequest || undefined,
      referenceImages: images.length > 0 ? images : undefined,
      createdAt: now,
    });

    setDraftNoteByLead(prev => ({ ...prev, [leadId]: '' }));
    setDraftChangeByLead(prev => ({ ...prev, [leadId]: '' }));
    setDraftImagesByLead(prev => ({ ...prev, [leadId]: [] }));
    setDraftChannelByLead(prev => ({ ...prev, [leadId]: 'whatsapp' }));
    setQuickActionByLead(prev => ({ ...prev, [leadId]: 'contacted' }));
    await loadRevisions();
  };

  const filtered = useMemo(() => filter === 'all' ? leads : leads.filter(l => l.status === filter), [leads, filter]);
  const intakeLink = `${window.location.origin}/intake/${artistId}`;
  const getReviseLink = (leadId: string) => `${window.location.origin}/intake/revise/${leadId}`;

  return (
    <div style={{ padding: 24, color: 'white', background: '#0f172a', minHeight: '100dvh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Leads</h2>
        <button onClick={() => navigate('/me')} style={{ border: '1px solid #334155', background: 'transparent', color: '#94a3b8', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>Back</button>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Your intake link</p>
        <div style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 10, padding: 10, fontSize: 12, wordBreak: 'break-all', marginBottom: 8 }}>{intakeLink}</div>
        <button onClick={() => navigator.clipboard.writeText(intakeLink)} style={{ border: 'none', borderRadius: 8, background: '#334155', color: 'white', padding: '8px 12px', cursor: 'pointer' }}>Copy Intake Link</button>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Follow-up presets (artist-defined)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {followPresets.map(p => (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f172a', border: '1px solid #334155', borderRadius: 999, padding: '5px 8px', fontSize: 12 }}>
              {p.label}
              <button onClick={() => removeFollowPreset(p.id)} style={{ border: 'none', background: 'transparent', color: '#fda4af', cursor: 'pointer', fontSize: 12 }}>x</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 80px', gap: 6 }}>
          <input
            placeholder="Preset name (e.g. Next week)"
            value={newPresetLabel}
            onChange={e => setNewPresetLabel(e.target.value)}
            style={{ ...textAreaStyle, height: 36, marginBottom: 0 }}
          />
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Days"
            value={newPresetDays}
            onChange={e => setNewPresetDays(e.target.value)}
            style={{ ...textAreaStyle, height: 36, marginBottom: 0 }}
          />
          <button onClick={addFollowPreset} style={{ ...btnStyle, height: 36 }}>Add</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['all', 'new', 'contacted', 'booked', 'won', 'lost'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ border: 'none', borderRadius: 999, padding: '6px 10px', background: filter === s ? '#e11d48' : '#1e293b', color: 'white', cursor: 'pointer' }}>{s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No leads yet.</p>
        ) : filtered.map(lead => {
          const revisions = revisionsByLead.get(lead.id) || [];
          const draftImages = draftImagesByLead[lead.id] || [];
          const isDue = !!lead.nextFollowUpAt && lead.nextFollowUpAt <= Date.now();
          return (
            <div key={lead.id} style={{ background: '#1e293b', border: `1px solid ${isDue ? '#dc2626' : '#334155'}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ fontSize: 15, fontWeight: 700 }}>{lead.name}</p>
                <span style={{ background: `${STATUS_COLORS[lead.status]}33`, color: STATUS_COLORS[lead.status], borderRadius: 8, padding: '2px 8px', fontSize: 11 }}>{lead.status}</span>
              </div>
              {lead.finalRevisionVersion && (
                <p style={{ fontSize: 11, color: '#86efac', marginBottom: 4 }}>
                  Final Revision: v{lead.finalRevisionVersion}
                </p>
              )}
              {lead.nextFollowUpAt && (
                <p style={{ fontSize: 11, color: isDue ? '#fca5a5' : '#93c5fd', marginBottom: 4 }}>
                  Follow-up: {isDue ? 'Due now' : 'Scheduled'} at {new Date(lead.nextFollowUpAt).toLocaleString()}
                </p>
              )}
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{lead.phone || 'No phone'} - {lead.source}</p>
              <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>{lead.note || lead.changeRequest || 'No details'}</p>
              {lead.allergies && lead.allergies.length > 0 && (
                <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>Allergy Alert ({lead.allergySeverity || 'low'}): {lead.allergies.join(', ')}</p>
              )}
              {lead.referenceImages && lead.referenceImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 6 }}>
                  {lead.referenceImages.slice(0, 4).map((img, i) => <img key={i} src={img} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6 }} />)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <button onClick={() => updateStatus(lead.id, 'contacted')} style={btnStyle}>Contacted</button>
                <button onClick={() => updateStatus(lead.id, 'booked')} style={btnStyle}>Booked</button>
                <button onClick={() => toClient(lead)} style={{ ...btnStyle, background: '#166534', color: '#86efac', borderColor: '#166534' }}>Convert to Client</button>
                <button onClick={() => updateStatus(lead.id, 'lost')} style={{ ...btnStyle, color: '#fca5a5' }}>Lost</button>
                <button onClick={() => navigator.clipboard.writeText(getReviseLink(lead.id))} style={{ ...btnStyle, color: '#93c5fd' }}>Copy Client Update Link</button>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {followPresets.map(p => (
                  <button key={p.id} onClick={() => void setFollowUp(lead.id, p.minutes)} style={{ ...btnStyle, padding: '5px 8px' }}>
                    {p.label}
                  </button>
                ))}
                {lead.nextFollowUpAt && (
                  <button onClick={() => void clearFollowUp(lead.id)} style={{ ...btnStyle, padding: '5px 8px', color: '#fca5a5' }}>Clear Follow-up</button>
                )}
              </div>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #334155' }}>
                <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Quick Log (15-sec mode)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginBottom: 8 }}>
                  <button onClick={() => setQuickActionByLead(prev => ({ ...prev, [lead.id]: 'contacted' }))} style={{ ...chipStyle, padding: '11px 12px', fontSize: 13, background: (quickActionByLead[lead.id] || 'contacted') === 'contacted' ? '#334155' : 'transparent' }}>Contacted</button>
                  <button onClick={() => setQuickActionByLead(prev => ({ ...prev, [lead.id]: 'awaiting_confirmation' }))} style={{ ...chipStyle, padding: '11px 12px', fontSize: 13, background: (quickActionByLead[lead.id] || 'contacted') === 'awaiting_confirmation' ? '#334155' : 'transparent' }}>Awaiting Confirm</button>
                  <button onClick={() => setQuickActionByLead(prev => ({ ...prev, [lead.id]: 'booked_slot' }))} style={{ ...chipStyle, padding: '11px 12px', fontSize: 13, background: (quickActionByLead[lead.id] || 'contacted') === 'booked_slot' ? '#334155' : 'transparent' }}>Booked Slot</button>
                </div>
                <input
                  placeholder="One-line takeaway (optional)"
                  value={draftNoteByLead[lead.id] || ''}
                  onChange={e => setDraftNoteByLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                  style={{ ...textAreaStyle, height: 36 }}
                />
                <textarea
                  placeholder="What changed this round? (optional)"
                  value={draftChangeByLead[lead.id] || ''}
                  onChange={e => setDraftChangeByLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                  rows={1}
                  style={textAreaStyle}
                />
                <select
                  value={draftChannelByLead[lead.id] || 'whatsapp'}
                  onChange={e => setDraftChannelByLead(prev => ({ ...prev, [lead.id]: e.target.value as LeadRevisionRecord['channel'] }))}
                  style={{ ...textAreaStyle, height: 42, marginBottom: 8, fontSize: 13 }}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="sms">SMS</option>
                  <option value="other">Other</option>
                </select>
                <input type="file" accept="image/*" multiple onChange={e => void handleDraftFiles(lead.id, e.target.files)} style={{ marginBottom: 6 }} />
                {draftImages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 6 }}>
                    {draftImages.map((img, i) => <img key={i} src={img} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6 }} />)}
                  </div>
                )}
                <button onClick={() => void addRevision(lead.id)} style={{ ...btnStyle, width: '100%', padding: '11px 12px', background: '#334155', color: 'white', fontSize: 13, fontWeight: 700 }}>Save Quick Log</button>

                {revisions.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {revisions.map(rev => (
                      <div key={rev.id} style={{ background: '#111827', border: '1px solid #243244', borderRadius: 8, padding: 8 }}>
                        <p style={{ fontSize: 11, color: '#93c5fd', marginBottom: 3 }}>
                          v{rev.version} - {rev.actor}
                          {rev.channel ? ` via ${rev.channel}` : ''}
                          {' - '}{new Date(rev.createdAt).toLocaleString()}
                        </p>
                        {rev.note && <p style={{ fontSize: 12, color: '#cbd5e1' }}>{rev.note}</p>}
                        {rev.changeRequest && <p style={{ fontSize: 12, color: '#fda4af', marginTop: 2 }}>Change: {rev.changeRequest}</p>}
                        {rev.referenceImages && rev.referenceImages.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 6 }}>
                            {rev.referenceImages.slice(0, 4).map((img, i) => <img key={i} src={img} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6 }} />)}
                          </div>
                        )}
                        <button
                          onClick={() => void setFinalRevision(lead.id, rev)}
                          style={{
                            marginTop: 6,
                            border: '1px solid #334155',
                            borderRadius: 6,
                            background: lead.finalRevisionId === rev.id ? '#166534' : 'transparent',
                            color: lead.finalRevisionId === rev.id ? '#86efac' : '#cbd5e1',
                            padding: '5px 8px',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          {lead.finalRevisionId === rev.id ? 'Final Selected' : 'Set as Final'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#cbd5e1',
  borderRadius: 8,
  padding: '6px 9px',
  cursor: 'pointer',
  fontSize: 12,
};

const textAreaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: 6,
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0f172a',
  color: 'white',
  boxSizing: 'border-box',
  resize: 'vertical',
};

const chipStyle: React.CSSProperties = {
  border: '1px solid #334155',
  color: '#cbd5e1',
  borderRadius: 999,
  padding: '6px 10px',
  fontSize: 11,
  cursor: 'pointer',
};

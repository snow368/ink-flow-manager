import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type ClientRecord, type AppointmentRecord, type InvoiceRecord, type SessionRecord, type PortfolioRecord, type ProjectRecord } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';
import { detectInitialLanguage, t } from '../lib/i18n';
import { formatInvoiceCurrency, getCountryConfig } from '../lib/invoiceConfig';
import { checkAndSuggestMerge, mergeClients } from '../lib/clientMerge';
import { getClientTimeline, getChannelIcon, getDirectionBadge } from '../lib/communicationLog';
import type { CommunicationLogRecord } from '../db';

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
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editingContact, setEditingContact] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [message, setMessage] = useState('');
  const [potentialDuplicates, setPotentialDuplicates] = useState<ClientRecord[]>([]);
  const [showMergeSuggestion, setShowMergeSuggestion] = useState(false);
  const [commLogs, setCommLogs] = useState<CommunicationLogRecord[]>([]);

  useEffect(() => {
    if (!id) return;
    loadClient();
    loadDuplicates(id);
    db.appointments.where('clientId').equals(id).reverse().sortBy('date').then(setAppointments);
    db.invoices.where('clientId').equals(id).reverse().sortBy('createdAt').then(setInvoices);
    loadImages(id);
    getClientTimeline(id).then(logs => setCommLogs(logs.slice(0, 30)));
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
      if (proj.status === 'consultation' || proj.status === 'in_progress') {
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
          <button onClick={() => {
            if (!editingContact) {
              setEditPhone(client.phone || '');
              setEditEmail(client.email || '');
              setEditNotes(client.notes || '');
            }
            setEditingContact(!editingContact);
          }}
            style={{ ...editIcon, marginLeft: 6 }}>{editingContact ? 'Cancel' : 'Edit'}</button>
        </p>
        {editingContact && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone" style={miniInput} />
            <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" style={miniInput} />
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
          <button onClick={() => navigate(`/invoices?clientId=${client.id}`)}
            style={qaBtn('#7e22ce')}>Invoice</button>
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

      {/* Communication Timeline */}
      {commLogs.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, marginTop: 4 }}>Communication Timeline</h3>
          <div style={{ marginBottom: 16 }}>
            {commLogs.map(log => {
              const badge = getDirectionBadge(log.direction);
              return (
                <div key={log.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderLeft: '2px solid #334155', paddingLeft: 12, position: 'relative', marginLeft: 6 }}>
                  <div style={{
                    position: 'absolute', left: -5, top: 12, width: 8, height: 8, borderRadius: 4,
                    background: badge.color,
                  }} />
                  <div style={{ width: 28, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.color + '22', padding: '1px 4px', borderRadius: 3 }}>
                      {getChannelIcon(log.channel)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: badge.color, fontWeight: 600 }}>{badge.label}</span>
                      {log.templateType && (
                        <span style={{ fontSize: 9, color: '#64748b' }}>{log.templateType.replace(/_/g, ' ')}</span>
                      )}
                      <span style={{ fontSize: 9, color: '#475569', marginLeft: 'auto' }}>
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {log.message && (
                      <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                        {log.message.length > 120 ? log.message.slice(0, 120) + '...' : log.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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

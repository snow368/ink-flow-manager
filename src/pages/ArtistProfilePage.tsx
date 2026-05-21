import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { t, detectInitialLanguage } from '../lib/i18n';

interface BioLink {
  id: string;
  label: string;
  url: string;
  icon?: string;
}

interface BioEvent {
  id: string;
  type: 'convention' | 'guest_spot';
  city: string;
  country?: string;
  venue: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface BioProfile {
  slug?: string;
  avatarUrl?: string;
  displayName: string;
  shopName?: string;
  address?: string;
  phone?: string;
  bookingEnabled: boolean;
  links: BioLink[];
  portfolioImages?: string[];
}

const LINK_ICONS: Record<string, string> = {
  Instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  TikTok: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  YouTube: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 8.5 16 12 10 15.5" fill="currentColor" stroke="none"/></svg>`,
  'X (Twitter)': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l7 8-7 8"/><path d="M20 4l-7 8 7 8"/></svg>`,
  Facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  WhatsApp: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/></svg>`,
  Snapchat: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1a6 6 0 0 1-6 6 6 6 0 0 1-6-6H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/></svg>`,
  Pinterest: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`,
  Website: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  Email: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></svg>`,
  Telegram: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  Discord: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6a6 6 0 0 0-4 2 14 14 0 0 0 8 8 14 14 0 0 0 8-8 6 6 0 0 0-4-2"/></svg>`,
  LINE: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>`,
};

function freshId(): string {
  return 'bl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function autoSlug(name: string, igHandle?: string): string {
  if (igHandle) {
    return igHandle.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30);
  }
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'artist';
}

export default function ArtistProfilePage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [msg, setMsg] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [slug, setSlug] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<BioEvent[]>([]);

  // For adding a new link
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // For adding a new event
  const [newEvent, setNewEvent] = useState<Omit<BioEvent, 'id'> | null>(null);

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    db.users.get(current).then(u => {
      if (!u) return;
      setUser(u);
      const bp = (u as any).bioProfile as BioProfile | undefined;
      if (bp) {
        setAvatarUrl(bp.avatarUrl || '');
        setDisplayName(bp.displayName || u.studioName || '');
        setShopName(bp.shopName || '');
        setAddress(bp.address || '');
        setPhone(bp.phone || u.whatsappPhone || '');
        setBookingEnabled(bp.bookingEnabled !== false);
        setLinks(bp.links || []);
        setPortfolioImages(bp.portfolioImages || []);
        setSlug(bp.slug || autoSlug(bp.displayName || u.studioName || u.name || '', u.instagramHandle));
        setEvents((u as any).bioEvents || []);
      } else {
        setDisplayName(u.studioName || '');
        setSlug(autoSlug(u.studioName || u.name || '', u.instagramHandle));
      }
    });
  }, []);

  const getProfile = (): BioProfile => ({
    avatarUrl: avatarUrl.trim() || undefined,
    displayName: displayName.trim() || shopName.trim() || user?.studioName || 'Artist',
    shopName: shopName.trim() || undefined,
    address: address.trim() || undefined,
    phone: phone.trim() || undefined,
    slug: slug.trim() || undefined,
    bookingEnabled,
    links,
    portfolioImages: portfolioImages.filter(u => u.trim()),
  });

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const bioProfile = getProfile();
    if (!bioProfile.slug) {
      bioProfile.slug = autoSlug(bioProfile.displayName || user.studioName || user.name || '', user.instagramHandle);
    }
    await db.users.update(user.id, { bioProfile } as any);

    // Sync to Worker
    const backendUrl = localStorage.getItem('inkflow_backend_url') || 'http://localhost:8787';
    const apiSecret = localStorage.getItem('inkflow_api_secret') || '';
    try {
      const res = await fetch(`${backendUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
        body: JSON.stringify({
          artistId: user.id,
          settings: {
            ...user,
            bioProfile,
            bioEvents: events,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg('Saved & synced');
      } else {
        setMsg('Saved locally (sync failed)');
      }
    } catch {
      setMsg('Saved locally (Worker not reachable)');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 2000);
  };

  const addLink = () => {
    const label = newLabel.trim();
    let url = newUrl.trim();
    if (!label || !url) return;
    if (!url.startsWith('http')) url = 'https://' + url;
    const icon = LINK_ICONS[label] || `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
    setLinks([...links, { id: freshId(), label, url, icon }]);
    setNewLabel('');
    setNewUrl('');
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const moveLink = (index: number, dir: -1 | 1) => {
    const next = [...links];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLinks(next);
  };

  const previewUrl = user ? `/bio/${user.id}` : '';

  // ── Styles ──
  const S: Record<string, React.CSSProperties> = {
    page: { maxWidth: 480, margin: '0 auto', padding: '24px 20px 100px', color: '#fafafa' },
    backBtn: { background: 'none', border: 'none', color: '#818cf8', fontSize: 14, cursor: 'pointer', marginBottom: 20, padding: 0 },
    title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
    subtitle: { fontSize: 12, color: '#71717a', marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    label: { display: 'block', fontSize: 12, color: '#a1a1aa', marginBottom: 4 },
    input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #27272a', background: '#0c0c0e', color: '#fafafa', fontSize: 14, outline: 'none', marginBottom: 10 },
    toggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#18181b', borderRadius: 10, border: '1.5px solid #27272a', marginBottom: 8 },
    toggleLabel: { fontSize: 14, color: '#e4e4e7' },
    linkCard: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#18181b', borderRadius: 10, border: '1.5px solid #27272a', marginBottom: 6, fontSize: 14 },
    linkIcon: { width: 24, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.7 } as const,
    linkLabel: { flex: 1, color: '#e4e4e7', fontWeight: 500 },
    linkUrl: { fontSize: 11, color: '#52525b', wordBreak: 'break-all' } as const,
    removeBtn: { background: 'none', border: 'none', color: '#f87171', fontSize: 18, cursor: 'pointer', padding: '0 4px' },
    moveBtn: { background: 'none', border: 'none', color: '#52525b', fontSize: 14, cursor: 'pointer', padding: '0 4px' },
    addRow: { display: 'flex', gap: 8, marginBottom: 8 },
    addInput: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #27272a', background: '#0c0c0e', color: '#fafafa', fontSize: 13, outline: 'none' },
    addBtn: { padding: '10px 16px', borderRadius: 8, border: 'none', background: '#6366f1', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' } as const,
    saveBtn: { width: '100%', padding: 16, borderRadius: 14, border: 'none', background: saving ? '#27272a' : '#6366f1', color: 'white', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8 },
    msg: { textAlign: 'center', fontSize: 12, color: '#4ade80', marginTop: 10 },
    preview: { fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 16 },
  };

  return (
    <div style={S.page}>
      <button style={S.backBtn} onClick={() => navigate('/me')}>← Back</button>
      <h1 style={S.title}>Profile Page</h1>
      <p style={S.subtitle}>Your public link-in-bio at {previewUrl}</p>

      {/* ── Identity ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Identity</div>
        <label style={S.label}>Short Link Slug <span style={{ color: '#ef4444', fontSize: 10 }}>REQUIRED</span></label>
        <input style={S.input} value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))} placeholder="yourname" />
        <div style={{ fontSize: 10, color: '#3f3f46', marginBottom: 12, marginTop: -6 }}>{window.location.origin}/{slug || 'yourname'}</div>
        <label style={S.label}>Avatar <span style={{ color: '#71717a', fontWeight: 400 }}>(optional)</span></label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'end' }}>
          {avatarUrl && (
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '2px solid #27272a' }}>
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <input
              style={{ ...S.input, marginBottom: 0 }}
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://... or upload below"
            />
          </div>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: '1.5px solid #27272a', background: '#18181b', color: '#a1a1aa', fontSize: 13, cursor: 'pointer', marginBottom: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload Photo
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setAvatarUrl(reader.result as string);
            reader.readAsDataURL(file);
          }} />
        </label>
        <label style={S.label}>Display Name <span style={{ color: '#ef4444', fontSize: 10 }}>REQUIRED</span></label>
        <input style={S.input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
        <label style={S.label}>Shop Name <span style={{ color: '#71717a', fontWeight: 400 }}>(optional)</span></label>
        <input style={S.input} value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Studio name" />
        <label style={S.label}>Address <span style={{ color: '#71717a', fontWeight: 400 }}>(optional, shown with map link)</span></label>
        <input style={S.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Studio address, City, Country" />
        <label style={S.label}>Phone / WhatsApp <span style={{ color: '#71717a', fontWeight: 400 }}>(optional, shown as call button)</span></label>
        <input style={S.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
      </div>

      {/* ── Portfolio Images ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Portfolio Images <span style={{ color: '#71717a', fontWeight: 400 }}>(optional)</span></div>
        {portfolioImages.map((url, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <input style={{ ...S.input, flex: 1, marginBottom: 0 }} value={url} onChange={e => {
              const next = [...portfolioImages];
              next[i] = e.target.value;
              setPortfolioImages(next);
            }} placeholder="https://i.imgur.com/..." />
            <button style={S.removeBtn} onClick={() => setPortfolioImages(portfolioImages.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {portfolioImages.length < 6 && (
          <button onClick={() => setPortfolioImages([...portfolioImages, ''])}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px dashed #27272a', background: 'none', color: '#71717a', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
            + Add Image URL
          </button>
        )}
        <div style={{ fontSize: 10, color: '#3f3f46', marginTop: 6 }}>Paste image URLs (Imgur, Instagram CDN, etc). Images are not stored — linked directly.</div>
      </div>

      {/* ── Booking Toggle ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Booking</div>
        <div style={S.toggle}>
          <span style={S.toggleLabel}>Show "Book Now" button</span>
          <div style={{ width: 44, height: 24, borderRadius: 12, background: bookingEnabled ? '#6366f1' : '#27272a', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setBookingEnabled(!bookingEnabled)}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: 'white', position: 'absolute', top: 2, left: bookingEnabled ? 22 : 2, transition: 'left 0.2s' }} />
          </div>
        </div>
      </div>

      {/* ── Events ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>{t(lang, 'bio_events')} <span style={{ color: '#71717a', fontWeight: 400 }}>({t(lang, 'bio_events_sub')})</span></div>
        {events.map(ev => (
          <div key={ev.id} style={{ ...S.linkCard, borderColor: '#27272a' }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{ev.type === 'convention' ? '🎪' : '✈️'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#e4e4e7', fontWeight: 500 }}>{ev.type === 'convention' ? t(lang, 'bio_event_convention') : t(lang, 'bio_event_guest_spot')} — {ev.city}{ev.country ? ', ' + ev.country : ''}</div>
              <div style={{ fontSize: 11, color: '#52525b' }}>{ev.venue} · {ev.startDate} ~ {ev.endDate}</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#71717a', cursor: 'pointer', marginRight: 4 }}>
              <input type="checkbox" checked={ev.active} onChange={() => setEvents(events.map(e => e.id === ev.id ? { ...e, active: !e.active } : e))} />
              {t(lang, 'bio_event_active')}
            </label>
            <button style={S.removeBtn} onClick={() => setEvents(events.filter(e => e.id !== ev.id))}>✕</button>
          </div>
        ))}
        {newEvent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, background: '#18181b', borderRadius: 10, border: '1.5px solid #27272a', marginTop: 4 }}>
            <select style={S.addInput} value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}>
              <option value="convention">{t(lang, 'bio_event_convention')}</option>
              <option value="guest_spot">{t(lang, 'bio_event_guest_spot')}</option>
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={S.addInput} value={newEvent.city} onChange={e => setNewEvent({ ...newEvent, city: e.target.value })} placeholder={t(lang, 'bio_event_city')} />
              <input style={S.addInput} value={newEvent.country || ''} onChange={e => setNewEvent({ ...newEvent, country: e.target.value || undefined })} placeholder={t(lang, 'bio_event_country')} />
            </div>
            <input style={S.addInput} value={newEvent.venue} onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })} placeholder={t(lang, 'bio_event_venue')} />
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={S.addInput} type="date" value={newEvent.startDate} onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })} />
              <input style={S.addInput} type="date" value={newEvent.endDate} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.addBtn} onClick={() => {
                if (!newEvent.city || !newEvent.venue || !newEvent.startDate || !newEvent.endDate) return;
                setEvents([...events, { ...newEvent, id: freshId(), active: true }]);
                setNewEvent(null);
              }}>{t(lang, 'bio_event_add')}</button>
              <button style={{ ...S.addBtn, background: '#27272a' }} onClick={() => setNewEvent(null)}>{t(lang, 'bio_event_cancel')}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNewEvent({ type: 'convention', city: '', venue: '', startDate: '', endDate: '', active: true })}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px dashed #27272a', background: 'none', color: '#71717a', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
            {t(lang, 'bio_event_add_link')}
          </button>
        )}
      </div>

      {/* ── Links ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Links</div>
        {links.map((link, i) => (
          <div key={link.id} style={S.linkCard}>
            <span style={S.linkIcon} dangerouslySetInnerHTML={{ __html: link.icon || '' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.linkLabel}>{link.label}</div>
              <div style={S.linkUrl}>{link.url}</div>
            </div>
            <button style={S.moveBtn} onClick={() => moveLink(i, -1)} disabled={i === 0}>▲</button>
            <button style={S.moveBtn} onClick={() => moveLink(i, 1)} disabled={i === links.length - 1}>▼</button>
            <button style={S.removeBtn} onClick={() => removeLink(link.id)}>✕</button>
          </div>
        ))}

        <div style={S.addRow}>
          <input style={{ ...S.addInput, flex: 1 }} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label" />
          <input style={{ ...S.addInput, flex: 2 }} value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL" />
          <button style={S.addBtn} onClick={addLink}>Add</button>
        </div>
      </div>

      <button style={S.saveBtn} onClick={save} disabled={saving}>
        {saving ? 'Saving...' : 'Save & Sync'}
      </button>
      {msg && <div style={S.msg}>{msg}</div>}
      <div style={S.preview}>Public page: {window.location.origin}{previewUrl}</div>
    </div>
  );
}

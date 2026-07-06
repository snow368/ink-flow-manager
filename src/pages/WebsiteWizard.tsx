import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type StudioLocationRecord } from '../db';
import { getApiBaseUrl } from '../lib/backendApi';
import { detectInitialLanguage, t } from '../lib/i18n';

const TEMPLATES = [
  { name: 'Portfolio Grid', desc: 'Big portfolio grid + hero + booking', layout: 'grid', key: 'portfolio' },
  { name: 'Single Page', desc: 'All-in-one scroll: bio, works, reviews, book', layout: 'scroll', key: 'single' },
  { name: 'Minimal Link', desc: 'Just name + booking button — perfect for IG bio', layout: 'minimal', key: 'minimal' },
  { name: 'Studio Showcase', desc: 'Multi-artist, locations, services, booking', layout: 'studio', key: 'studio' },
];

// Shared with Worker templates.ts — 31 color themes
const THEMES: { name: string; primary: string; bg: string; card: string; text: string; key: string; tier: string; desc: string }[] = [
  { name: 'Minimal', primary: '#1a1a1a', bg: '#ffffff', card: '#ffffff', text: '#1a1a1a', key: 'minimal', tier: 'free', desc: 'Clean white, timeless' },
  { name: 'Traditional', primary: '#c41e1e', bg: '#0a0a0a', card: '#141414', text: '#f5f0e8', key: 'traditional', tier: 'free', desc: 'Bold American red' },
  { name: 'Vintage', primary: '#8b4513', bg: '#f5f0e8', card: '#faf5ee', text: '#2c2418', key: 'vintage', tier: 'free', desc: 'Warm retro feel' },
  { name: 'Moody', primary: '#b8860b', bg: '#0d0d0d', card: '#141414', text: '#e8e0d8', key: 'moody', tier: 'free', desc: 'Dark with gold' },
  { name: 'Edgy', primary: '#ff0066', bg: '#0a0a0a', card: '#111', text: '#f0f0f0', key: 'edgy', tier: 'pro', desc: 'Neon pink on black' },
  { name: 'Studio', primary: '#d4a574', bg: '#f8f8f8', card: '#ffffff', text: '#222', key: 'studio', tier: 'pro', desc: 'Gallery warm tones' },
  { name: 'Brutalist', primary: '#ffffff', bg: '#000000', card: '#0a0a0a', text: '#ffffff', key: 'brutalist', tier: 'pro', desc: 'Heavy black & white' },
  { name: 'Nature', primary: '#4a8c3f', bg: '#0f1a0e', card: '#1a2a18', text: '#e0ecd8', key: 'nature', tier: 'pro', desc: 'Forest green' },
  { name: 'Royal', primary: '#7c3aed', bg: '#0e0a1a', card: '#1a1528', text: '#e8e0f0', key: 'royal', tier: 'pro', desc: 'Deep purple & gold' },
  { name: 'Neon', primary: '#00ffff', bg: '#0a0a12', card: '#12121e', text: '#f0f0f8', key: 'neon', tier: 'pro', desc: 'Cyan on dark' },
  { name: 'Japanese', primary: '#cc3300', bg: '#0f0a08', card: '#1a1410', text: '#f0e8e0', key: 'japanese', tier: 'pro', desc: 'Traditional irezumi red' },
  { name: 'Cyberpunk', primary: '#ff00aa', bg: '#0a0515', card: '#140a24', text: '#e0d8f0', key: 'cyberpunk', tier: 'pro', desc: 'Neon magenta cyber' },
  { name: 'Sunset', primary: '#ff6622', bg: '#1a0e0a', card: '#2a1810', text: '#f0e0d8', key: 'sunset', tier: 'pro', desc: 'Warm orange glow' },
  { name: 'Sakura', primary: '#e86a8a', bg: '#1a1018', card: '#2a1a24', text: '#f0e0e8', key: 'sakura', tier: 'pro', desc: 'Cherry blossom pink' },
  { name: 'Punk', primary: '#ffee00', bg: '#0a0a0a', card: '#141010', text: '#f0f0f0', key: 'punk', tier: 'pro', desc: 'High-contrast yellow' },
  { name: 'Neonoir', primary: '#ff2244', bg: '#080808', card: '#111114', text: '#e0e0e0', key: 'neonoir', tier: 'pro', desc: 'Red noir dramatic' },
  { name: 'Midnight', primary: '#4a80d0', bg: '#080c14', card: '#101826', text: '#d8e0f0', key: 'midnight', tier: 'free', desc: 'Deep blue night' },
  { name: 'Botanical', primary: '#5a9e6a', bg: '#0f1a12', card: '#1a2a1e', text: '#dce8d8', key: 'botanical', tier: 'free', desc: 'Sage green' },
  { name: 'Arctic', primary: '#2a7aaa', bg: '#e8f0f5', card: '#ffffff', text: '#1a2a3a', key: 'arctic', tier: 'free', desc: 'Cool ice blue' },
  { name: 'Desert', primary: '#c4783a', bg: '#e8e0d0', card: '#f5f0e8', text: '#2a2218', key: 'desert', tier: 'free', desc: 'Warm desert tones' },
  { name: 'Tribal', primary: '#d4d4d4', bg: '#050505', card: '#0d0d0d', text: '#e8e8e8', key: 'tribal', tier: 'free', desc: 'Black & grey' },
  { name: 'Lavender', primary: '#8a6aca', bg: '#f0ecf5', card: '#ffffff', text: '#2a203a', key: 'lavender', tier: 'free', desc: 'Soft purple' },
  { name: 'Industrial', primary: '#4682b4', bg: '#121212', card: '#1c1c1c', text: '#d8d8d8', key: 'industrial', tier: 'plus', desc: 'Steel & concrete' },
  { name: 'Woodcut', primary: '#cc9a4a', bg: '#1a1410', card: '#26201a', text: '#e0d8cc', key: 'woodcut', tier: 'plus', desc: 'Dark print-like' },
  { name: 'Watercolor', primary: '#e88d9a', bg: '#f8f4f0', card: '#ffffff', text: '#2a2420', key: 'watercolor', tier: 'plus', desc: 'Soft pastels' },
  { name: 'Gothic', primary: '#800020', bg: '#0a0808', card: '#141010', text: '#d8d0c8', key: 'gothic', tier: 'plus', desc: 'Ornate dark' },
  { name: 'Coastal', primary: '#2a8a8a', bg: '#f0f5f5', card: '#ffffff', text: '#1a2a2a', key: 'coastal', tier: 'plus', desc: 'Light & breezy' },
  { name: 'Urban', primary: '#ff6600', bg: '#0a0a0a', card: '#151515', text: '#f0f0f0', key: 'urban', tier: 'plus', desc: 'Graffiti bold' },
  { name: 'Metallic', primary: '#9a9aaa', bg: '#0e0e10', card: '#18181c', text: '#e0e0e4', key: 'metallic', tier: 'plus', desc: 'Silver chrome' },
  { name: 'Steampunk', primary: '#b8862a', bg: '#14100a', card: '#1e1a14', text: '#e0d8cc', key: 'steampunk', tier: 'plus', desc: 'Brass & bronze' },
  { name: 'Celestial', primary: '#c8a040', bg: '#080818', card: '#101028', text: '#e0d8f0', key: 'celestial', tier: 'plus', desc: 'Gold on midnight' },
  { name: 'Biomechanical', primary: '#c0392b', bg: '#0d0d0f', card: '#161618', text: '#e0e0e2', key: 'biomechanical', tier: 'pro', desc: 'Metallic red & grey' },
  { name: 'Chicano', primary: '#c4956a', bg: '#1a1410', card: '#261e18', text: '#e8ddd0', key: 'chicano', tier: 'pro', desc: 'Warm brown & gold' },
  { name: 'Maori', primary: '#cc2222', bg: '#080808', card: '#111111', text: '#e8e8e8', key: 'maori', tier: 'free', desc: 'Tribal red & black' },
  { name: 'Trash Polka', primary: '#cc2244', bg: '#0a0a0a', card: '#141414', text: '#f0f0f0', key: 'trash-polka', tier: 'plus', desc: 'Collage red chaos' },
  { name: 'New School', primary: '#ff66cc', bg: '#0a0a20', card: '#151530', text: '#e8e8f0', key: 'new-school', tier: 'pro', desc: 'Bright neon cartoon' },
  { name: 'Halloween', primary: '#ff6600', bg: '#0a0808', card: '#141010', text: '#e8d8c8', key: 'halloween', tier: 'free', desc: 'Orange & black' },
  { name: 'Nordic', primary: '#7a9aaa', bg: '#0c1018', card: '#161c28', text: '#d8e0e8', key: 'nordic', tier: 'free', desc: 'Cool steel blue' },
  { name: 'Tropical', primary: '#ff7744', bg: '#0a1414', card: '#142020', text: '#dce8e0', key: 'tropical', tier: 'pro', desc: 'Coral & teal' },
  { name: 'Monochrome', primary: '#666666', bg: '#080808', card: '#141414', text: '#cccccc', key: 'monochrome', tier: 'free', desc: 'Clean grey scale' },
  { name: 'Retro Wave', primary: '#ff6688', bg: '#0a0a30', card: '#151545', text: '#e0d8f8', key: 'retro-wave', tier: 'plus', desc: '80s sunset neon' },
];

export default function WebsiteWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [bio, setBio] = useState('');
  const [templateKey, setTemplateKey] = useState('portfolio');
  const [themeKey, setThemeKey] = useState('minimal');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [customDomain, setCustomDomain] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [locations, setLocations] = useState<StudioLocationRecord[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [maxSteps, setMaxSteps] = useState(3);

  useEffect(() => {
    db.users.toArray().then(users => {
      const u = users[0];
      if (!u) return;
      setUser(u);
      const bp = (u as any).bioProfile || {};
      setSlug(bp.slug || '');
      const savedTheme = (u as any).siteTheme || 'dark';
      setThemeKey(savedTheme);
      setBio((u as any).siteBio || '');

      const plan = u.plan || 'free';
      if (plan === 'pro_plus' || plan === 'plus') {
        setMaxSteps(6); // info → template → theme → preview → locations → domain
      } else {
        setMaxSteps(5); // info → template → theme → preview → domain
      }
    });
    db.portfolio.count().then(setPortfolioCount);
    db.studioLocations.toArray().then(locs => {
      setLocations(locs);
      setSelectedLocations(new Set(locs.filter(l => l.name).map(l => l.id)));
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const bp = { ...((user as any).bioProfile || {}), slug: slug.trim() || undefined };
    await db.users.update(user.id, {
      bioProfile: bp,
      siteTheme: themeKey,
      siteBio: bio.trim(),
      siteTemplate: templateKey,
      customDomain: customDomain.trim() || undefined,
      siteLocations: Array.from(selectedLocations),
    } as any);

    /* Sync to server */
    try {
      const base = getApiBaseUrl();
      if (base) {
        await fetch(`${base}/api/site-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-secret': localStorage.getItem('inkflow_api_secret') || '',
            'x-user-role': 'owner',
            'x-user-id': user.id,
          },
          body: JSON.stringify({
            artistId: user.id,
            slug: slug.trim(),
            template: templateKey,
            theme: themeKey,
            bio: bio.trim(),
            studioName: user.studioName || user.name,
            customDomain: customDomain.trim() || '',
            locations: Array.from(selectedLocations),
          }),
        });
      }
    } catch (e) {
      console.error('Site config sync failed (non-fatal):', e);
    }

    setSaving(false);
    setDone(true);
  };

  const theme = THEMES.find(t => t.key === themeKey) || THEMES[0];
  const shortLink = slug ? `https://app.ink-flows.com/s/${slug}` : '';
  const previewUrl = slug ? `https://app.ink-flows.com/s/${slug}` : '';
  const domainUrl = customDomain.trim() ? `https://${customDomain.trim()}` : '';

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Your site is live!</h2>
        {shortLink && (
          <>
            <p style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>Share your short link — perfect for IG bio, cards, or Google Business:</p>
            <a href={shortLink} target="_blank" rel="noopener"
              style={{ color: '#60a5fa', fontSize: 18, fontWeight: 700, textDecoration: 'underline', display: 'block', marginBottom: 8 }}>
              {shortLink.replace(/^https?:\/\//, '')}
            </a>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <button onClick={() => navigator.clipboard.writeText(shortLink)}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#60a5fa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                📋 Copy Short Link
              </button>
              <button onClick={() => {
                const text = `Book a tattoo with me: ${shortLink}`;
                if (navigator.share) { navigator.share({ title: 'Book an Appointment', text, url: shortLink }); }
                else { navigator.clipboard.writeText(shortLink); }
              }}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#22c55e', color: '#052e16', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                📱 Share
              </button>
              <button onClick={() => {
                window.open(`https://wa.me/?text=${encodeURIComponent(`Book a tattoo with me: ${shortLink}`)}`, '_blank');
              }}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                💬 WhatsApp
              </button>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>Full page preview:</p>
            <a href={shortLink} target="_blank" rel="noopener"
              style={{ color: '#64748b', fontSize: 13, textDecoration: 'underline', display: 'block', marginBottom: 12 }}>
              {shortLink}
            </a>
            {domainUrl && (
              <>
                <p style={{ color: '#94a3b8', marginBottom: 4, fontSize: 13 }}>Custom domain:</p>
                <p style={{ color: '#22c55e', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{domainUrl}</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>DNS propagation may take a few minutes.</p>
              </>
            )}
          </>
        )}
        <br />
        <button onClick={() => navigate('/me')}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, cursor: 'pointer' }}>
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 20 }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
        {Array.from({ length: maxSteps }, (_, i) => i + 1).map(s => (
          <div key={s} style={{
            width: 32, height: 32, borderRadius: 16,
            background: step >= s ? '#e11d48' : '#334155',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
          }}>{s}</div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
        {step === 1 ? 'Your Studio Info' : step === 2 ? 'Choose a Template' : step === 3 ? 'Choose a Theme' : step === 4 ? 'Preview' : step === 5 ? (user?.plan === 'pro_plus' || user?.plan === 'plus' ? 'Your Locations' : 'Custom Domain') : 'Custom Domain'}
      </h2>

      {/* Step 1: Info */}
      {step === 1 && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Studio Name</label>
          <input value={user?.studioName || ''} readOnly
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#64748b', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />

          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Your subdomain</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <input value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-z0-9_-]/g, '').toLowerCase())}
              placeholder="yourname"
              style={{ width: 120, padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 14, outline: 'none' }} />
            <span style={{ fontSize: 13, color: '#64748b' }}>.ink-flows.com</span>
          </div>

          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Bio / Description</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            placeholder="Tell clients about your studio, style, and experience..."
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />

          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Portfolio photos</label>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{portfolioCount} photos in portfolio. Add more from your profile.</p>

          <button onClick={() => setStep(2)}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Next: Choose Template →
          </button>
        </div>
      )}

      {/* Step 2: Template */}
      {step === 2 && (
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {TEMPLATES.map(t => (
              <div key={t.key} onClick={() => setTemplateKey(t.key)}
                style={{
                  padding: 20, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: templateKey === t.key ? '3px solid #22c55e' : '2px solid #334155',
                  background: templateKey === t.key ? '#16653420' : '#1e293b',
                }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {t.key === 'portfolio' ? '🖼️' : t.key === 'single' ? '📄' : t.key === 'minimal' ? '🔗' : '🏢'}
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: templateKey === t.key ? '#22c55e' : 'white' }}>{t.name}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{t.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep(1)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={() => setStep(3)}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Next: Choose Theme →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Theme */}
      {step === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 500, margin: '0 auto' }}>
            {THEMES.map(t => (
              <div key={t.key} onClick={() => setThemeKey(t.key)}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', border: themeKey === t.key ? `3px solid ${t.primary}` : '3px solid transparent',
                  background: t.bg, color: t.text,
                }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 7, background: t.primary }} />
                  <div style={{ width: 14, height: 14, borderRadius: 7, background: t.card }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t.name}</p>
              </div>
            ))}
          </div>

          {/* Live preview */}
          <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid #334155', maxWidth: 300, margin: '16px auto 0' }}>
            <div style={{ background: theme.bg, padding: 16, color: theme.text }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', margin: 0 }}>{user?.studioName || 'Your Studio'}</p>
              <p style={{ fontSize: 11, color: theme.text + '88', textAlign: 'center', margin: '4px 0 8px' }}>📍 City, State</p>
              <div style={{ background: theme.primary, padding: 8, borderRadius: 8, textAlign: 'center', color: 'white', fontSize: 12, fontWeight: 600 }}>
                Book an Appointment
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, maxWidth: 400, margin: '16px auto 0' }}>
            <button onClick={() => setStep(2)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={() => setStep(4)}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Next: Preview →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 4 && (
        <div style={{ maxWidth: 350, margin: '0 auto' }}>
          {/* Full preview card */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #334155', marginBottom: 16 }}>
            <div style={{ background: theme.bg, color: theme.text }}>
              <div style={{ padding: 24, textAlign: 'center', background: theme.card }}>
                <div style={{ width: 60, height: 60, borderRadius: 30, background: theme.primary + '33', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎨</div>
                <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{user?.studioName || 'Your Studio'}</p>
                <p style={{ fontSize: 12, color: theme.text + '88', marginTop: 4 }}>{bio || 'Tattoo artist'}</p>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} style={{ aspectRatio: '1', background: theme.card, borderRadius: 4 }} />
                  ))}
                </div>
              </div>
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ background: theme.primary, padding: 12, borderRadius: 10, textAlign: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>
                  Book an Appointment
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(3)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={() => {
              const plan = user?.plan || 'free';
              if (plan === 'pro_plus' || plan === 'plus') setStep(5);
              else setStep(5); // domain step
            }}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Next: {user?.plan === 'pro_plus' || user?.plan === 'plus' ? 'Locations →' : 'Domain →'}
            </button>
          </div>
          {!slug && <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginTop: 8 }}>Please enter a URL slug first</p>}
        </div>
      )}

      {/* Step 5: Locations (Plus only) */}
      {step === 5 && (user?.plan === 'pro_plus' || user?.plan === 'plus') && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #334155' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📍 Your Studio Locations</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              Select which locations to show on your website. Each location gets its own booking link.
            </p>
            {locations.length === 0 ? (
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px dashed #475569' }}>
                <p style={{ fontSize: 12, color: '#64748b' }}>No locations yet. <a href="/locations" style={{ color: '#60a5fa' }}>Add locations first</a></p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {locations.map(loc => {
                  const isSel = selectedLocations.has(loc.id);
                  return (
                    <div key={loc.id} onClick={() => {
                      setSelectedLocations(prev => {
                        const next = new Set(prev);
                        if (next.has(loc.id)) next.delete(loc.id);
                        else next.add(loc.id);
                        return next;
                      });
                    }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: '#0f172a', border: isSel ? '2px solid #22c55e' : '1px solid #334155', cursor: 'pointer' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: isSel ? 'none' : '2px solid #475569', background: isSel ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>
                        {isSel ? '✓' : ''}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{loc.name}</p>
                        {loc.address && <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{loc.address}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ fontSize: 11, color: '#64748b' }}>Selected: {selectedLocations.size} locations</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(4)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={() => setStep(6)}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Next: Domain →
            </button>
          </div>
        </div>
      )}

      {/* Custom Domain (Step 5 for non-Plus, Step 6 for Plus) */}
      {((step === 5 && user?.plan !== 'pro_plus' && user?.plan !== 'plus') || (step === 6 && (user?.plan === 'pro_plus' || user?.plan === 'plus'))) && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #334155' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🌐 Custom Domain {(user?.plan === 'pro_plus' || user?.plan === 'plus') ? '(Plus)' : ''}</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              Use your own domain like <strong>booking.yourstudio.com</strong> instead of ink-flows.com/tattoo/yourname.
            </p>
            <input
              value={customDomain}
              onChange={e => { setCustomDomain(e.target.value); setDomainVerified(false); }}
              placeholder="booking.yourstudio.com"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />
            {customDomain && !domainVerified && (
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #334155' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', marginBottom: 6 }}>📋 DNS Setup Instructions</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>1. Go to your domain provider (GoDaddy, Namecheap, Cloudflare)</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>2. Add a CNAME record pointing to our server:</p>
                <div style={{ background: '#1e293b', borderRadius: 6, padding: 8, marginBottom: 8 }}>
                  <code style={{ fontSize: 11, color: '#60a5fa' }}>
                    {customDomain ? customDomain.split('.')[0] : 'booking'} → inkflow.pages.dev
                  </code>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>3. Come back and click Verify</p>
                <button onClick={() => setDomainVerified(true)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                  I've added the CNAME record — Verify
                </button>
              </div>
            )}
            {domainVerified && (
              <div style={{ background: '#16653420', borderRadius: 8, padding: 10, border: '1px solid #22c55e44', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>✅ Domain configured! SSL will provision automatically.</p>
              </div>
            )}
            <p style={{ fontSize: 11, color: '#64748b' }}>
              Don't have a domain yet? You can publish without one.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              const plan = user?.plan || 'free';
              if (plan === 'pro_plus' || plan === 'plus') setStep(5);
              else setStep(4);
            }}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={handleSave} disabled={saving || !slug}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: saving || !slug ? '#4b5563' : '#22c55e', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Publishing...' : '🚀 Publish Website'}
            </button>
          </div>
          {!slug && <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginTop: 8 }}>Please enter a URL slug first</p>}
        </div>
      )}
    </div>
  );
}

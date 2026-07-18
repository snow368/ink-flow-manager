import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type UserRecord, type PortfolioRecord, type ReviewRecord } from '../db';
import { getApiBaseUrl } from '../lib/backendApi';

/* Minimal site config shape from the API */
interface SiteConfig {
  id: string;
  artistId: string;
  slug: string;
  template: string;
  theme: string;
  bio: string;
  studioName: string;
  customDomain: string;
  locations: string;
  publishedAt: number;
  updatedAt: number;
}

export default function ArtistLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<UserRecord | null>(null);
  const [photos, setPhotos] = useState<PortfolioRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  /* Extra fields from API (when available) */
  const [apiSite, setApiSite] = useState<SiteConfig | null>(null);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    let cancelled = false;

    async function load() {
      /* 1. Try API first (public, no auth needed) */
      let siteConfig: SiteConfig | null = null;
      try {
        const base = getApiBaseUrl();
        if (base) {
          const res = await fetch(`${base}/api/site-config/${slug}`, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            siteConfig = await res.json() as SiteConfig;
            if (!cancelled) setApiSite(siteConfig);
          }
        }
      } catch { /* API unavailable — fall back to local */ }

      if (cancelled) return;

      /* 2. Try local IndexedDB (artist preview mode) */
      const all = await db.users.toArray();
      const match = all.find(u => {
        const bp = (u as any).bioProfile as { slug?: string } | undefined;
        return bp?.slug === slug;
      });

      if (match) {
        if (!cancelled) setArtist(match);
        /* Load portfolio & reviews from local DB */
        const imgs = await db.portfolio
          .where('artistId').equals(match.id)
          .filter(p => p.isPublic)
          .toArray();
        imgs.sort((a, b) => (b.sortOrder || b.createdAt) - (a.sortOrder || a.createdAt));
        if (!cancelled) setPhotos(imgs);

        const revs = await db.reviews
          .where('artistId').equals(match.id)
          .toArray();
        if (!cancelled) setReviews(revs.filter(r => r.rating >= 4).slice(0, 6));
      }

      /* 3. If both API and DB failed, show 404 */
      if (!siteConfig && !match) {
        if (!cancelled) setNotFound(true);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  // ── LocalBusiness Schema ──
  useEffect(() => {
    if (!artist) return;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: artist.studioName || artist.name,
      description: `Professional tattoo studio run by ${artist.name}. Book online.`,
      url: window.location.href,
      image: photos[0]?.thumbnailUrl || undefined,
      telephone: bp?.phone || undefined,
      address: bp?.address ? {
        '@type': 'PostalAddress',
        streetAddress: bp.address,
      } : undefined,
      openingHours: artist.workingHoursStart && artist.workingHoursEnd
        ? `Mo-Su ${artist.workingHoursStart}-${artist.workingHoursEnd}`
        : undefined,
      aggregateRating: reviews.length > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
        reviewCount: reviews.length,
      } : undefined,
      priceRange: '$$',
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, [artist, photos, reviews]);

  // ── Meta tags ──
  useEffect(() => {
    if (!artist) return;
    const name = artist.studioName || artist.name;
    const loc = bp?.address || 'your area';
    const desc = `${name} — tattoo artist in ${loc}. Browse portfolio and book online.`;
    document.title = `${name} | InkFlow Tattoo`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    else {
      const m = document.createElement('meta');
      m.name = 'description'; m.content = desc;
      document.head.appendChild(m);
    }

    // Canonical URL (custom domain if set)
    const canon = document.querySelector('link[rel="canonical"]');
    if (canon) {
      canon.setAttribute('href', customDomain ? `https://${customDomain}` : window.location.href);
    }
  }, [artist]);

  if (loading) return <div style={{ minHeight: '100vh', background: '#0c0c0c' }} />;

  if (notFound || (!artist && !apiSite)) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c0c0c', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Artist not found</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>This link may be incorrect or the artist hasn't set up their page yet.</p>
        <button onClick={() => navigate('/')}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#1e293b', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
          Go Home
        </button>
      </div>
    );
  }

  /* ── Resolve data from API or local DB ── */
  const name = apiSite?.studioName || artist?.studioName || artist?.name || 'Your Studio';
  const bp = (artist as any)?.bioProfile as { avatarUrl?: string; address?: string; phone?: string; bookingEnabled?: boolean } | undefined;
  const siteTheme = apiSite?.theme || (artist as any)?.siteTheme || 'dark';
  const siteBio = apiSite?.bio || (artist as any)?.siteBio || '';
  const siteTemplate = apiSite?.template || (artist as any)?.siteTemplate || 'portfolio';
  const customDomain = apiSite?.customDomain || (artist as any)?.customDomain || '';
  const artistId = apiSite?.artistId || artist?.id || '';
  const THEME: Record<string, any> = {
    dark: { bg: '#0c0c0c', card: '#1a1a1e', primary: '#e11d48', text: '#ffffff' },
    minimal: { bg: '#ffffff', card: '#f5f5f5', primary: '#000000', text: '#1a1a1a' },
    rose: { bg: '#1a0a0a', card: '#2d1414', primary: '#e11d48', text: '#ffe4e6' },
    forest: { bg: '#0f172a', card: '#1e293b', primary: '#22c55e', text: '#e2e8f0' },
    ocean: { bg: '#0c1929', card: '#1a2a40', primary: '#3b82f6', text: '#e0f2fe' },
    gold: { bg: '#1c1917', card: '#292524', primary: '#f59e0b', text: '#fef3c7' },
    lavender: { bg: '#130c1a', card: '#201530', primary: '#a855f7', text: '#f3e8ff' },
    teal: { bg: '#0a1414', card: '#142121', primary: '#14b8a6', text: '#ccfbf1' },
    coral: { bg: '#1a0f0a', card: '#2d1a14', primary: '#f97316', text: '#ffedd5' },
    slate: { bg: '#0f1117', card: '#1a1d27', primary: '#64748b', text: '#e2e8f0' },
    cherry: { bg: '#0c0c0c', card: '#1e1018', primary: '#be123c', text: '#ffe4e6' },
    sky: { bg: '#0c1520', card: '#142130', primary: '#0ea5e9', text: '#e0f2fe' },
  };
  const t = THEME[siteTheme] || THEME.dark;

  // ── Minimal template (Linktree-style) ──
  if (siteTemplate === 'minimal') {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, color: t.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', fontFamily: 'sans-serif' }}>
        {bp?.avatarUrl ? (
          <img src={bp.avatarUrl} alt={name} style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover', marginBottom: 12 }} />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: 40, background: t.card, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>{name.charAt(0)}</div>
        )}
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{name}</h1>
        {siteBio && <p style={{ fontSize: 13, color: t.text + '99', marginTop: 6, textAlign: 'center', maxWidth: 280 }}>{siteBio}</p>}

        <div style={{ width: '100%', maxWidth: 320, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a href={`/book/${artistId}`}
            style={{ display: 'block', padding: 14, borderRadius: 12, background: t.primary, color: 'white', textAlign: 'center', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Book an Appointment
          </a>
          {photos.length > 0 && (
            <a href={`/portfolio/${artistId}`}
              style={{ display: 'block', padding: 14, borderRadius: 12, border: `2px solid ${t.text}22`, color: t.text, textAlign: 'center', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              View Portfolio ({photos.length})
            </a>
          )}
          {artist?.instagramHandle && (
            <a href={`https://instagram.com/${artist.instagramHandle.replace('@', '')}`} target="_blank" rel="noopener"
              style={{ display: 'block', padding: 14, borderRadius: 12, border: `2px solid ${t.text}22`, color: t.text, textAlign: 'center', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              📷 Instagram
            </a>
          )}
        </div>

        {reviews.length > 0 && (
          <div style={{ marginTop: 24, width: '100%', maxWidth: 320 }}>
            <p style={{ fontSize: 12, color: t.text + '77', marginBottom: 8, fontWeight: 600, textAlign: 'center' }}>★★★★★ {reviews.length} reviews</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: 'sans-serif', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${t.card} 0%, ${t.bg} 100%)`,
        padding: '40px 20px 24px', textAlign: 'center',
      }}>
        {bp?.avatarUrl ? (
          <img src={bp.avatarUrl} alt={name}
            style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover', marginBottom: 12 }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: 40, background: t.card,
            margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: t.text + '88',
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{name}</h1>
        {siteBio && (
          <p style={{ fontSize: 13, color: t.text + '99', marginTop: 6, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
            {siteBio}
          </p>
        )}
        {bp?.address && (
          <p style={{ fontSize: 13, color: t.text + '77', marginTop: 4 }}>
            📍 {bp.address}
          </p>
        )}
        {artist?.instagramHandle && (
          <p style={{ fontSize: 13, color: t.primary + 'aa', marginTop: 2 }}>
            @{artist.instagramHandle.replace('@', '')}
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '16px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{photos.length}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Works</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{reviews.length}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Reviews</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Rating</div>
        </div>
      </div>

      {/* Portfolio preview */}
      {photos.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, padding: '0 20px', marginBottom: 8 }}>Portfolio</h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, padding: '0 3px',
          }}>
            {photos.slice(0, 9).map(p => (
              <div key={p.id}
                onClick={() => navigate(`/portfolio/${artistId}`)}
                style={{ aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', borderRadius: 0 }}>
                <img src={p.thumbnailUrl || p.imageUrl} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          {photos.length > 9 && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#60a5fa', margin: '8px 0', cursor: 'pointer' }}
              onClick={() => navigate(`/portfolio/${artistId}`)}>
              View all {photos.length} works →
            </p>
          )}
        </>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, padding: '20px 20px 8px', margin: 0 }}>Reviews</h2>
          <div style={{ overflowX: 'auto', padding: '0 16px 12px', display: 'flex', gap: 10 }}>
            {reviews.map(r => (
              <div key={r.id} style={{
                minWidth: 220, maxWidth: 260, background: t.card, borderRadius: 12,
                padding: 14, flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 12, background: '#1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#94a3b8', fontWeight: 600,
                  }}>
                    {r.clientName?.charAt(0) || '?'}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{r.clientName || 'Anonymous'}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#facc15' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                </div>
                {r.text && <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{r.text}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Book CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(to top, #0c0c0c 60%, transparent)',
      }}>
        <button onClick={() => navigate(`/book/${artistId}`)}
          style={{
            width: '100%', padding: 14, borderRadius: 12, border: 'none',
            background: t.primary,
            color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 4px 20px ${t.primary}44`,
          }}>
          Book an Appointment
        </button>
      </div>
    </div>
  );
}

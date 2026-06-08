import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type UserRecord, type PortfolioRecord, type ReviewRecord } from '../db';

export default function ArtistLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<UserRecord | null>(null);
  const [photos, setPhotos] = useState<PortfolioRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    // Find artist by bioProfile.slug
    db.users.toArray().then(async all => {
      const match = all.find(u => {
        const bp = (u as any).bioProfile as { slug?: string } | undefined;
        return bp?.slug === slug;
      });
      if (!match) { setNotFound(true); setLoading(false); return; }
      setArtist(match);

      // Portfolio
      const imgs = await db.portfolio
        .where('artistId')
        .equals(match.id)
        .filter(p => p.isPublic)
        .toArray();
      imgs.sort((a, b) => (b.sortOrder || b.createdAt) - (a.sortOrder || a.createdAt));
      setPhotos(imgs);

      // Reviews
      const revs = await db.reviews
        .where('artistId')
        .equals(match.id)
        .toArray();
      setReviews(revs.filter(r => r.rating >= 4).slice(0, 6));

      setLoading(false);
    });
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
  }, [artist]);

  if (loading) return <div style={{ minHeight: '100vh', background: '#0c0c0c' }} />;

  if (notFound || !artist) {
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

  const name = artist.studioName || artist.name;
  const bp = (artist as any).bioProfile as { avatarUrl?: string; address?: string; phone?: string } | undefined;

  return (
    <div style={{ background: '#0c0c0c', color: 'white', fontFamily: 'sans-serif', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg, #1e1e2a 0%, #0c0c0c 100%)',
        padding: '40px 20px 24px', textAlign: 'center',
      }}>
        {bp?.avatarUrl ? (
          <img src={bp.avatarUrl} alt={name}
            style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover', marginBottom: 12 }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: 40, background: '#1e293b',
            margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#94a3b8',
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{name}</h1>
        {bp?.address && (
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            📍 {bp.address}
          </p>
        )}
        {artist.instagramHandle && (
          <p style={{ fontSize: 13, color: '#60a5fa', marginTop: 2 }}>
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
                onClick={() => navigate(`/portfolio/${artist.id}`)}
                style={{ aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', borderRadius: 0 }}>
                <img src={p.thumbnailUrl || p.imageUrl} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          {photos.length > 9 && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#60a5fa', margin: '8px 0', cursor: 'pointer' }}
              onClick={() => navigate(`/portfolio/${artist.id}`)}>
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
                minWidth: 220, maxWidth: 260, background: '#1a1a1e', borderRadius: 12,
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
        <button onClick={() => navigate(`/book/${artist.id}`)}
          style={{
            width: '100%', padding: 14, borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #e11d48, #be123c)',
            color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(225,29,72,0.3)',
          }}>
          Book an Appointment
        </button>
      </div>
    </div>
  );
}

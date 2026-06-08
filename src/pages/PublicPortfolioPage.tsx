import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type PortfolioRecord, type UserRecord } from '../db';

export default function PublicPortfolioPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<UserRecord | null>(null);
  const [photos, setPhotos] = useState<PortfolioRecord[]>([]);
  const [selected, setSelected] = useState<PortfolioRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFlashOnly, setShowFlashOnly] = useState(false);

  useEffect(() => {
    if (!artistId) { setError('Invalid link'); setLoading(false); return; }
    db.users.get(artistId).then(u => {
      if (!u) { setError('Artist not found'); setLoading(false); return; }
      setArtist(u);
      db.portfolio
        .where('artistId')
        .equals(artistId)
        .filter(p => p.isPublic)
        .toArray()
        .then(all => {
          all.sort((a, b) => (b.sortOrder || b.createdAt) - (a.sortOrder || a.createdAt));
          setPhotos(all);
          setLoading(false);
        });
    });
  }, [artistId]);

  const displayName = artist?.studioName || artist?.name || 'Artist';
  const igHandle = artist?.instagramHandle;
  const flashPhotos = photos.filter(p => p.isFlash);
  const displayPhotos = showFlashOnly ? flashPhotos : photos;

  return (
    <div style={{
      minHeight: '100dvh', background: '#0c0c0c', color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '32px 20px 20px',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32, background: '#1e293b',
          margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#94a3b8',
        }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{displayName}</h1>
        {igHandle && (
          <p style={{ fontSize: 13, color: '#60a5fa', margin: 0 }}>
            @{igHandle.replace('@', '')}
          </p>
        )}
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          {photos.length} {photos.length === 1 ? 'work' : 'works'}
        </p>
      </div>

      {/* Flash filter */}
      {flashPhotos.length > 0 && (
        <div style={{ padding: '8px 16px', display: 'flex', gap: 8 }}>
          <button onClick={() => setShowFlashOnly(false)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: !showFlashOnly ? '#334155' : 'transparent',
              color: !showFlashOnly ? 'white' : '#94a3b8',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
            All Work
          </button>
          <button onClick={() => setShowFlashOnly(true)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: showFlashOnly ? '#a855f7' : 'transparent',
              color: showFlashOnly ? 'white' : '#94a3b8',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
            ⭐ Flash ({flashPhotos.length})
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontSize: 14 }}>
          Loading portfolio...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#f87171', fontSize: 16, marginBottom: 8 }}>{error}</p>
          <button onClick={() => navigate('/')}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#1e293b', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && displayPhotos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {showFlashOnly ? 'No flash designs yet' : 'No public works yet'}
          </p>
        </div>
      )}

      {/* Photo grid */}
      {!loading && !error && displayPhotos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 3, padding: 3,
        }}>
          {displayPhotos.map(photo => (
            <div key={photo.id}
              onClick={() => setSelected(photo)}
              style={{
                aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer',
                background: '#0f172a', borderRadius: 0, position: 'relative',
              }}>
              <img src={photo.thumbnailUrl || photo.imageUrl} alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {photo.isFlash && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  background: photo.isSold ? '#7f1d1d' : '#a855f7',
                  borderRadius: 4, padding: '2px 6px', fontSize: 9, color: 'white',
                }}>
                  {photo.isSold ? 'Sold' : 'Flash'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
            zIndex: 300, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button onClick={() => setSelected(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: 18, border: 'none',
              background: '#1e293b', color: 'white', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 301,
            }}>
            X
          </button>
          <img src={selected.imageUrl} alt=""
            style={{ maxWidth: '95%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }} />

          {/* Tags & badges */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '0 20px' }}>
            {selected.isFlash && (
              <span style={{
                padding: '3px 10px', borderRadius: 4,
                background: selected.isSold ? '#7f1d1d' : '#a855f7',
                color: 'white', fontSize: 11, fontWeight: 600,
              }}>
                {selected.isSold ? 'Sold' : 'Available — Flash'}
              </span>
            )}
            {selected.serviceType && (
              <span style={{ padding: '3px 10px', borderRadius: 4, background: '#2563eb', color: 'white', fontSize: 11, fontWeight: 600 }}>
                {selected.serviceType}
              </span>
            )}
            {selected.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{ padding: '2px 8px', borderRadius: 4, background: '#1e293b', color: '#94a3b8', fontSize: 10 }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Book this style button */}
          {!selected.isSold && (
            <button onClick={(e) => {
              e.stopPropagation();
              const params = selected.serviceType ? `?style=${encodeURIComponent(selected.serviceType)}` : '';
              navigate(`/book/${artistId}${params}`);
            }}
              style={{
                marginTop: 16, padding: '12px 32px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #e11d48, #be123c)',
                color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>
              Book{selected.serviceType ? ` this ${selected.serviceType}` : ' Appointment'}
            </button>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      {!loading && !error && artist && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, #0c0c0c 60%, transparent)',
        }}>
          <button onClick={() => navigate(`/book/${artistId}`)}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(225,29,72,0.3)',
            }}>
            Book an Appointment
          </button>
        </div>
      )}
    </div>
  );
}

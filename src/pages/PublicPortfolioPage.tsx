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

  useEffect(() => {
    if (!artistId) { setError('Invalid link'); setLoading(false); return; }
    db.users.get(artistId).then(u => {
      if (!u) { setError('Artist not found'); setLoading(false); return; }
      setArtist(u);
      db.portfolio
        .where('artistId')
        .equals(artistId)
        .filter(p => p.isPublic)
        .reverse()
        .sortBy('createdAt')
        .then(imgs => {
          setPhotos(imgs);
          setLoading(false);
        });
    });
  }, [artistId]);

  const displayName = artist?.studioName || artist?.name || 'Artist';
  const igHandle = artist?.instagramHandle;

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
      {!loading && !error && photos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>No public works yet</p>
        </div>
      )}

      {/* Photo grid */}
      {!loading && !error && photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 3, padding: 3,
        }}>
          {photos.map((photo, idx) => (
            <div key={photo.id}
              onClick={() => setSelected(photo)}
              style={{
                aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer',
                background: '#0f172a', borderRadius: 0,
              }}>
              <img
                src={photo.thumbnailUrl || photo.imageUrl}
                alt=""
                loading="lazy"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'opacity 0.15s',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
            zIndex: 300, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setSelected(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: 18, border: 'none',
              background: '#1e293b', color: 'white', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 301,
            }}
          >
            X
          </button>
          <img
            src={selected.imageUrl}
            alt=""
            style={{
              maxWidth: '95%', maxHeight: '80vh', borderRadius: 8,
              objectFit: 'contain',
            }}
          />
          {selected.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '0 20px' }}>
              {selected.tags.map(tag => (
                <span key={tag}
                  style={{
                    padding: '2px 8px', borderRadius: 4, background: '#1e293b',
                    color: '#94a3b8', fontSize: 10,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book CTA */}
      {!loading && !error && artist && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, #0c0c0c 60%, transparent)',
        }}>
          <button
            onClick={() => navigate(`/book/${artistId}`)}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(225,29,72,0.3)',
            }}
          >
            Book an Appointment
          </button>
        </div>
      )}
    </div>
  );
}

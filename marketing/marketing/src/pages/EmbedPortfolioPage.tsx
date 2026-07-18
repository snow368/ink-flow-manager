import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, type PortfolioRecord } from '../db';

export default function EmbedPortfolioPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const [photos, setPhotos] = useState<PortfolioRecord[]>([]);
  const [selected, setSelected] = useState<PortfolioRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) return;
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
  }, [artistId]);

  if (loading) return null;

  return (
    <div style={{ background: 'transparent', fontFamily: 'sans-serif' }}>
      {photos.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>No public works</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 4 }}>
          {photos.map(photo => (
            <div key={photo.id}
              onClick={() => setSelected(photo)}
              style={{
                aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer',
                background: '#0f172a', borderRadius: 4, position: 'relative',
              }}>
              <img src={photo.thumbnailUrl || photo.imageUrl} alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {photo.isFlash && (
                <div style={{
                  position: 'absolute', top: 3, right: 3,
                  background: photo.isSold ? '#7f1d1d' : '#a855f7',
                  borderRadius: 3, padding: '1px 5px', fontSize: 8, color: 'white',
                }}>
                  {photo.isSold ? 'Sold' : 'Flash'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <button onClick={() => setSelected(null)}
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 32, height: 32, borderRadius: 16, border: 'none',
              background: '#1e293b', color: 'white', fontSize: 14, cursor: 'pointer',
            }}>X</button>
          <img src={selected.imageUrl} alt=""
            style={{ maxWidth: '92%', maxHeight: '90vh', borderRadius: 6, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}

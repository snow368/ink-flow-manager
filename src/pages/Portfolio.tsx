import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type PortfolioRecord, type UserRecord } from '../db';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';

const TAGS = ['japanese', 'realism', 'traditional', 'neo-traditional', 'blackwork', 'dotwork',
  'geometric', 'watercolor', 'tribal', 'minimalist', 'sketch', 'portrait',
  'lettering', 'cover-up', 'arm', 'leg', 'back', 'chest', 'sleeve', 'hand', 'neck'];

function generateThumbnail(dataUrl: string, maxW = 300): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxW / img.width, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function Portfolio() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [items, setItems] = useState<PortfolioRecord[]>([]);
  const [selected, setSelected] = useState<PortfolioRecord | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [message, setMessage] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadItems(u.id);
    });
  }, []);

  const loadItems = (uid: string) => {
    db.portfolio.where('artistId').equals(uid).reverse().sortBy('createdAt').then(setItems);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    setUploadCount(0);
    const fileArr = Array.from(files).slice(0, 20);
    let count = 0;

    for (const file of fileArr) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });
      const thumbnailUrl = await generateThumbnail(dataUrl);

      await db.portfolio.add({
        id: 'pf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        artistId: user.id,
        imageUrl: dataUrl,
        thumbnailUrl,
        tags: [],
        isPublic: true,
        consentForSocial: false,
        consentForPromotion: false,
        createdAt: Date.now(),
      });
      count++;
      setUploadCount(count);
    }

    setUploading(false);
    setMessage(`${count} photo(s) added`);
    setTimeout(() => setMessage(''), 2500);
    loadItems(user.id);
    e.target.value = '';
  };

  const toggleTag = async (item: PortfolioRecord, tag: string) => {
    const tags = item.tags.includes(tag)
      ? item.tags.filter(t => t !== tag)
      : [...item.tags, tag];
    await db.portfolio.update(item.id, { tags });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, tags } : i));
    if (selected?.id === item.id) setSelected({ ...selected, tags });
  };

  const togglePublic = async (item: PortfolioRecord) => {
    await db.portfolio.update(item.id, { isPublic: !item.isPublic });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isPublic: !item.isPublic } : i));
    if (selected?.id === item.id) setSelected({ ...selected, isPublic: !item.isPublic });
  };

  const toggleConsent = async (item: PortfolioRecord, field: 'consentForSocial' | 'consentForPromotion') => {
    const val = !item[field];
    const updateData = field === 'consentForSocial'
      ? { consentForSocial: val } as Partial<PortfolioRecord>
      : { consentForPromotion: val } as Partial<PortfolioRecord>;
    await db.portfolio.update(item.id, updateData);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updateData } : i));
    if (selected?.id === item.id) setSelected({ ...selected, ...updateData });
  };

  const handleDelete = async (item: PortfolioRecord) => {
    if (!confirm('Delete this photo from your portfolio?')) return;
    await db.portfolio.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    if (selected?.id === item.id) setSelected(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} photo(s)?`)) return;
    for (const id of selectedIds) {
      await db.portfolio.delete(id);
    }
    setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    setMessage(`${selectedIds.size} photo(s) deleted`);
    setTimeout(() => setMessage(''), 2500);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const openDetail = (item: PortfolioRecord, idx: number) => {
    if (selectMode) { toggleSelectItem(item.id); return; }
    setSelected(item);
    setSelectedIdx(idx);
  };

  const getFiltered = () => {
    let f = filterTag ? items.filter(i => i.tags.includes(filterTag)) : items;
    if (visibilityFilter === 'public') f = f.filter(i => i.isPublic);
    if (visibilityFilter === 'private') f = f.filter(i => !i.isPublic);
    return f;
  };
  const filtered = getFiltered();

  const goToPrev = useCallback(() => {
    if (selectedIdx <= 0) return;
    const f = getFiltered();
    const prev = f[selectedIdx - 1];
    setSelected(prev);
    setSelectedIdx(selectedIdx - 1);
  }, [selectedIdx, filterTag, items, visibilityFilter]);

  const goToNext = useCallback(() => {
    const f = getFiltered();
    if (selectedIdx >= f.length - 1) return;
    const next = f[selectedIdx + 1];
    setSelected(next);
    setSelectedIdx(selectedIdx + 1);
  }, [selectedIdx, filterTag, items, visibilityFilter]);

  const copyImageUrl = async (item: PortfolioRecord) => {
    await navigator.clipboard.writeText(item.imageUrl);
    setMessage('Image copied to clipboard');
    setTimeout(() => setMessage(''), 2000);
  };
  const activeTags = [...new Set(items.flatMap(i => i.tags))].sort();
  const publicCount = items.filter(i => i.isPublic).length;

  return (
    <div style={{ padding: 16, color: THEME.text.primary, paddingBottom: 100, minHeight: '100dvh', maxWidth: 1024, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: 0 }}>Portfolio</h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {items.length} photos ({publicCount} public)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {items.length > 0 && (
            <button onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #334155', background: selectMode ? '#7e22ce20' : 'transparent', color: selectMode ? '#c084fc' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          <label style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {uploading ? `Uploading... ${uploadCount}` : '+ Upload'}
            <input type="file" accept="image/*" multiple onChange={handleUpload}
              style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Bulk actions */}
      {selectMode && selectedIds.size > 0 && (
        <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: 10, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #7e22ce40' }}>
          <span style={{ fontSize: 13 }}>{selectedIds.size} selected</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={selectAll} style={selectBtn}>Select All ({filtered.length})</button>
            <button onClick={handleBulkDelete} style={{ ...selectBtn, color: '#f87171', borderColor: '#7f1d1d' }}>Delete Selected</button>
          </div>
        </div>
      )}

      {message && (
        <div style={{ background: '#14532d', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#86efac' }}>{message}</p>
        </div>
      )}

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', background: '#1e293b', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['all', 'public', 'private'] as const).map(f => (
            <button key={f} onClick={() => setVisibilityFilter(f)}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: visibilityFilter === f ? '#334155' : 'transparent', color: visibilityFilter === f ? 'white' : '#94a3b8', fontSize: 11, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {activeTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
              style={{
                padding: '4px 8px', borderRadius: 6, border: '1px solid',
                borderColor: filterTag === tag ? '#e11d48' : '#334155',
                background: filterTag === tag ? '#e11d4820' : 'transparent',
                color: filterTag === tag ? '#f87171' : '#94a3b8', fontSize: 10, cursor: 'pointer',
              }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 4 }}>
            {items.length === 0 ? 'No portfolio photos yet' : 'No photos match your filters'}
          </p>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {items.length === 0 ? 'Upload from your phone gallery to start building your portfolio' : 'Try a different tag or visibility filter'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
          {filtered.map((item, idx) => (
            <div key={item.id}
              onClick={() => openDetail(item, idx)}
              style={{
                borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', cursor: 'pointer',
                position: 'relative', background: '#0f172a',
                border: selectedIds.has(item.id) ? '2px solid #c084fc' : '1px solid #1e293b',
              }}>
              <img src={item.thumbnailUrl || item.imageUrl} alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Overlays */}
              {selectMode && (
                <div style={{
                  position: 'absolute', top: 4, left: 4,
                  width: 20, height: 20, borderRadius: 4,
                  border: selectedIds.has(item.id) ? '2px solid #c084fc' : '2px solid #475569',
                  background: selectedIds.has(item.id) ? '#7e22ce' : 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                }}>
                  {selectedIds.has(item.id) ? '✓' : ''}
                </div>
              )}
              {!item.isPublic && !selectMode && (
                <div style={{ position: 'absolute', top: 4, right: 4, background: '#7f1d1d', borderRadius: 4, padding: '1px 6px', fontSize: 9, color: '#fca5a5' }}>
                  Private
                </div>
              )}
              {item.consentForPromotion && !selectMode && (
                <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#7e22ce', borderRadius: 4, padding: '1px 6px', fontSize: 9, color: '#e9d5ff' }}>
                  Promo
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div onClick={() => { setSelected(null); setSelectedIdx(-1); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%', margin: '0 auto', padding: 16 }}>
            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <button onClick={() => { setSelected(null); setSelectedIdx(-1); }}
                style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#1e293b', color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                X
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedIdx > 0 && (
                  <button onClick={goToPrev}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 16, cursor: 'pointer' }}>
                    &larr;
                  </button>
                )}
                {selectedIdx < filtered.length - 1 && (
                  <button onClick={goToNext}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 16, cursor: 'pointer' }}>
                    &rarr;
                  </button>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>{selectedIdx + 1} / {filtered.length}</span>
            </div>

            {/* Full image */}
            <img src={selected.imageUrl} alt=""
              style={{ width: '100%', borderRadius: 12, maxHeight: '55vh', objectFit: 'contain', background: '#0f172a' }} />

            {/* Actions row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <button onClick={() => togglePublic(selected)}
                style={actionBtn(selected.isPublic ? '#22c55e' : '#475569')}>
                {selected.isPublic ? 'Public' : 'Private'}
              </button>
              <button onClick={() => toggleConsent(selected, 'consentForSocial')}
                style={actionBtn(selected.consentForSocial ? '#2563eb' : '#334155')}>
                Social OK
              </button>
              <button onClick={() => toggleConsent(selected, 'consentForPromotion')}
                style={actionBtn(selected.consentForPromotion ? '#7e22ce' : '#334155')}>
                Promo OK
              </button>
              <button onClick={() => copyImageUrl(selected)}
                style={{ ...actionBtn('#334155'), color: '#94a3b8' }}>
                Copy
              </button>
              <button onClick={() => handleDelete(selected)}
                style={{ ...actionBtn('#7f1d1d'), color: '#f87171', marginLeft: 'auto' }}>
                Delete
              </button>
            </div>

            {/* Tags */}
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
              {TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(selected, tag)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid',
                    borderColor: selected.tags.includes(tag) ? '#e11d48' : '#334155',
                    background: selected.tags.includes(tag) ? '#e11d4820' : 'transparent',
                    color: selected.tags.includes(tag) ? '#f87171' : '#94a3b8',
                    fontSize: 11, cursor: 'pointer',
                  }}>
                  {tag}
                </button>
              ))}
            </div>

            {/* Meta */}
            <p style={{ fontSize: 11, color: '#475569' }}>
              {new Date(selected.createdAt).toLocaleDateString()} · {selected.tags.length} tags
            </p>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/me')}
        style={{ marginTop: 24, width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
        Back to Me
      </button>
    </div>
  );
}

const actionBtn = (bg: string): React.CSSProperties => ({
  padding: '6px 12px', borderRadius: 8, border: 'none', background: bg,
  color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer',
});

const selectBtn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8, border: '1px solid #334155',
  background: 'transparent', color: '#cbd5e1', fontSize: 11, cursor: 'pointer', fontWeight: 600,
};

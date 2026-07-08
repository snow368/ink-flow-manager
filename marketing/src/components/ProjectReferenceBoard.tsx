import { useCallback, useEffect, useState } from 'react';
import { db, type ProjectAssetRecord } from '../db';
import { THEME } from '../lib/theme';

interface Props {
  projectId: string;
  artistId: string;
}

type RefFilter = 'all' | 'approved' | 'rejected';

export default function ProjectReferenceBoard({ projectId, artistId }: Props) {
  const [assets, setAssets] = useState<ProjectAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RefFilter>('all');
  const [addingNote, setAddingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const loadAssets = useCallback(async () => {
    const all = await db.projectAssets
      .where('projectId').equals(projectId)
      .toArray();
    setAssets(all.filter(a => a.type === 'client_reference'));
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const handleApproveToggle = useCallback(async (asset: ProjectAssetRecord) => {
    const newVal = !asset.approved;
    await db.projectAssets.update(asset.id, {
      approved: newVal,
      approvedAt: newVal ? Date.now() : undefined,
    });
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, approved: newVal, approvedAt: newVal ? Date.now() : undefined } : a));
  }, []);

  const handleRejectToggle = useCallback(async (asset: ProjectAssetRecord) => {
    await db.projectAssets.update(asset.id, {
      approved: false,
      approvedAt: undefined,
    });
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, approved: false, approvedAt: undefined } : a));
  }, []);

  const handleSaveNote = useCallback(async (assetId: string) => {
    await db.projectAssets.update(assetId, { note: noteText.trim() || undefined });
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, note: noteText.trim() || undefined } : a));
    setAddingNote(null);
    setNoteText('');
  }, [noteText]);

  const filtered = assets.filter(a => {
    if (filter === 'approved') return a.approved === true;
    if (filter === 'rejected') return a.approved === false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ color: THEME.text.subtle, fontSize: THEME.fontSize.sm, margin: 0 }}>Loading references...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: THEME.fontSize.base, fontWeight: THEME.fontWeight.semibold, color: THEME.text.primary, margin: 0 }}>
          Reference Board ({assets.length})
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['all', 'approved', 'rejected'] as RefFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 10px', borderRadius: 999, border: `1px solid ${filter === f ? THEME.brand.primary + '60' : THEME.border.default}`,
              background: filter === f ? THEME.brand.primary + '20' : 'transparent',
              color: filter === f ? THEME.brand.primary : THEME.text.muted,
              fontSize: THEME.fontSize.xs, fontWeight: THEME.fontWeight.semibold, cursor: 'pointer',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: THEME.text.subtle, fontSize: THEME.fontSize.sm, margin: 0 }}>
            {assets.length === 0 ? 'No references yet.' : 'No matching references'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {filtered.map(asset => (
          <div
            key={asset.id}
            style={{
              borderRadius: THEME.radius['2xl'],
              overflow: 'hidden',
              background: THEME.bg.panel,
              border: asset.approved
                ? '2px solid #22c55e'
                : asset.approved === false
                ? '2px solid #ef4444'
                : `1px solid ${THEME.border.subtle}`,
              position: 'relative',
            }}
          >
            <img
              src={asset.imageUrl}
              alt="Reference"
              style={{ width: '100%', display: 'block' }}
              loading="lazy"
            />

            {asset.approved && (
              <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, background: '#22c55e', color: '#000', fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                Approved
              </span>
            )}
            {asset.approved === false && (
              <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, background: '#ef4444', color: '#fff', fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                Rejected
              </span>
            )}

            <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 3 }}>
              <button
                onClick={() => handleApproveToggle(asset)}
                style={{
                  width: 22, height: 22, borderRadius: '50%', border: '1px solid #334155',
                  background: asset.approved ? '#22c55e' : '#141416',
                  color: asset.approved ? '#000' : '#a3a3a3',
                  fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Approve reference"
              >
                ✓
              </button>
              <button
                onClick={() => handleRejectToggle(asset)}
                style={{
                  width: 22, height: 22, borderRadius: '50%', border: '1px solid #334155',
                  background: asset.approved === false ? '#ef4444' : '#141416',
                  color: asset.approved === false ? '#fff' : '#a3a3a3',
                  fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Reject reference"
              >
                ×
              </button>
            </div>

            {asset.note && (
              <p style={{ fontSize: THEME.fontSize.xs, color: THEME.text.muted, padding: '6px 8px', margin: 0 }}>
                {asset.note}
              </p>
            )}

            {addingNote === asset.id ? (
              <div style={{ padding: '6px 8px', display: 'flex', gap: 4 }}>
                <input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add note..."
                  style={{
                    flex: 1, padding: '4px 8px', fontSize: THEME.fontSize.xs, borderRadius: THEME.radius.sm,
                    border: `1px solid ${THEME.border.default}`, background: THEME.bg.app, color: THEME.text.primary, outline: 'none',
                  }}
                  autoFocus
                />
                <button onClick={() => handleSaveNote(asset.id)} style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.info, background: 'none', border: 'none', cursor: 'pointer', fontWeight: THEME.fontWeight.semibold }}>
                  Save
                </button>
                <button onClick={() => setAddingNote(null)} style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, background: 'none', border: 'none', cursor: 'pointer' }}>
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAddingNote(asset.id); setNoteText(asset.note || ''); }}
                style={{
                  width: '100%', padding: '5px 8px', background: 'none', border: 'none',
                  fontSize: THEME.fontSize.xs, color: THEME.text.subtle, cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {asset.note ? 'Edit note' : '+ Add note'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

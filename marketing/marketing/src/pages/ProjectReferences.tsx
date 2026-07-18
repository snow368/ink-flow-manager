import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, type ProjectAssetRecord, type ProjectAssetType } from '../db';
import { THEME } from '../lib/theme';
import {
  getProjectAssets,
  addProjectAsset,
  createRevision,
  markFinalDesignApproved,
  getLatestApprovedDesign,
  generateApprovalToken,
  buildApprovalLink,
} from '../lib/projectRevisionLogic';

const TYPE_LABELS: Record<ProjectAssetType, string> = {
  client_reference: 'Client Reference',
  artist_draft: 'Artist Draft',
  revision: 'Revision',
  final_design: 'Final Design',
  stencil: 'Stencil',
  healed_photo: 'Healed Photo',
};

const TAB_LABELS: { type: ProjectAssetType | 'all'; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'client_reference', label: 'References' },
  { type: 'artist_draft', label: 'Drafts' },
  { type: 'revision', label: 'Revisions' },
  { type: 'final_design', label: 'Final' },
  { type: 'stencil', label: 'Stencils' },
  { type: 'healed_photo', label: 'Healed' },
];

export default function ProjectReferences() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState('');
  const [assets, setAssets] = useState<ProjectAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProjectAssetType | 'all'>('all');
  const [projectName, setProjectName] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<ProjectAssetType>('artist_draft');
  const [uploadNote, setUploadNote] = useState('');

  // Approval link
  const [approvalToken, setApprovalToken] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    setArtistId(current);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const proj = await db.projects.get(projectId);
      if (proj) setProjectName(proj.title);
      const list = await getProjectAssets(projectId);
      setAssets(list);
      setLoading(false);
    })();
  }, [projectId]);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    const list = await getProjectAssets(projectId);
    setAssets(list);
  }, [projectId]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return assets;
    return assets.filter(a => a.type === activeTab);
  }, [assets, activeTab]);

  const approvedDesign = useMemo(
    () => assets.find(a => a.type === 'final_design' && a.approved === true),
    [assets],
  );

  const handleUploadImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0] || !projectId || !artistId) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(files[0]);
      });
      await addProjectAsset({
        projectId,
        artistId,
        type: uploadType,
        imageUrl: dataUrl,
        note: uploadNote.trim() || undefined,
        uploadedBy: 'artist',
      });
      setUploadNote('');
      await refresh();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [projectId, artistId, uploadType, uploadNote, refresh]);

  const handleCreateRevision = useCallback(async () => {
    if (!projectId || !artistId) return;
    // Trigger file input for revision
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const dataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.readAsDataURL(file);
        });
        await createRevision(projectId, artistId, dataUrl, uploadNote.trim() || undefined);
        setUploadNote('');
        await refresh();
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [projectId, artistId, uploadNote, refresh]);

  const handleMarkApproved = useCallback(async (assetId: string) => {
    if (!projectId || !artistId) return;
    await markFinalDesignApproved(assetId, projectId, artistId);
    await refresh();
  }, [projectId, artistId, refresh]);

  const handleGenerateApprovalLink = useCallback(async (assetId: string) => {
    if (!projectId || !artistId) return;
    setGenerating(true);
    try {
      const token = await generateApprovalToken(projectId, assetId, artistId);
      const link = buildApprovalLink(token);
      await navigator.clipboard.writeText(link);
      setApprovalToken(link);
      setTimeout(() => setApprovalToken(''), 3000);
    } finally {
      setGenerating(false);
    }
  }, [projectId, artistId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: THEME.bg.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${THEME.border.default}`, borderTopColor: THEME.brand.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: THEME.bg.app, maxWidth: 600, margin: '0 auto', padding: '0 0 24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: THEME.text.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: THEME.fontSize['2xl'], fontWeight: THEME.fontWeight.bold, color: THEME.text.primary, margin: 0, lineHeight: 1.2 }}>
            Reference Board
          </h1>
          {projectName && (
            <p style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted, margin: '2px 0 0' }}>{projectName}</p>
          )}
        </div>
        {approvedDesign && (
          <span style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.success, fontWeight: THEME.fontWeight.semibold }}>
            ✓ Approved
          </span>
        )}
      </div>

      {/* Upload bar */}
      <div style={{ background: THEME.bg.panel, margin: '0 12px 8px', borderRadius: THEME.radius['2xl'], padding: 12, border: `1px solid ${THEME.border.subtle}` }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <select
            value={uploadType}
            onChange={e => setUploadType(e.target.value as ProjectAssetType)}
            style={selectStyle}
          >
            <option value="artist_draft">Artist Draft</option>
            <option value="client_reference">Reference</option>
            <option value="stencil">Stencil</option>
            <option value="healed_photo">Healed Photo</option>
          </select>
          <input
            placeholder="Optional note..."
            value={uploadNote}
            onChange={e => setUploadNote(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 120 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <label style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px', borderRadius: THEME.radius.lg, border: `1px dashed ${THEME.border.default}`,
            background: THEME.bg.panelAlt, color: THEME.text.muted, fontSize: THEME.fontSize.base,
            cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: THEME.fontWeight.semibold,
          }}>
            {uploading ? 'Uploading...' : '+ Upload Image'}
            <input type="file" accept="image/*" onChange={handleUploadImage} style={{ display: 'none' }} disabled={uploading} />
          </label>
          <button
            onClick={handleCreateRevision}
            disabled={uploading}
            style={{
              padding: '10px 16px', borderRadius: THEME.radius.lg, border: 'none',
              background: THEME.brand.primary, color: 'white', fontSize: THEME.fontSize.base,
              cursor: 'pointer', fontWeight: THEME.fontWeight.semibold, whiteSpace: 'nowrap',
            }}
          >
            + New Revision
          </button>
        </div>
        {approvalToken && (
          <div style={{ marginTop: 8, padding: 8, background: '#164e3f', borderRadius: THEME.radius.md, fontSize: THEME.fontSize.sm, color: '#22c55e', textAlign: 'center' }}>
            ✓ Approval link copied!
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0 12px', marginBottom: 8, overflowX: 'auto', flexWrap: 'nowrap' }}>
        {TAB_LABELS.map(tab => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            style={{
              border: 'none', background: activeTab === tab.type ? THEME.bg.panelAlt : 'transparent',
              color: activeTab === tab.type ? THEME.text.primary : THEME.text.muted,
              borderRadius: THEME.radius.lg, padding: '6px 12px', fontSize: THEME.fontSize.xs,
              cursor: 'pointer', fontWeight: THEME.fontWeight.semibold, whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.type !== 'all' && (
              <span style={{ color: THEME.text.subtle, marginLeft: 4 }}>
                {assets.filter(a => a.type === tab.type).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ color: THEME.text.subtle, fontSize: THEME.fontSize.md }}>No assets yet.</p>
          <p style={{ color: THEME.text.subtle, fontSize: THEME.fontSize.sm, marginTop: 4 }}>Upload an image to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 12px' }}>
          {filtered.map(asset => (
            <div
              key={asset.id}
              style={{
                background: THEME.bg.panel, border: `1px solid ${
                  asset.approved ? THEME.brand.success : THEME.border.subtle
                }`, borderRadius: THEME.radius['2xl'], overflow: 'hidden',
              }}
            >
              <img
                src={asset.imageUrl}
                alt=""
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain', background: '#000', borderBottom: `1px solid ${THEME.border.subtle}` }}
              />
              <div style={{ padding: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: THEME.fontSize.xs, background: `${THEME.bg.panelAlt}`, color: THEME.text.muted, borderRadius: THEME.radius.sm, padding: '2px 8px', fontWeight: THEME.fontWeight.semibold }}>
                    {TYPE_LABELS[asset.type]}
                  </span>
                  {asset.revisionNumber && (
                    <span style={{ fontSize: THEME.fontSize.xs, color: '#a855f7', fontWeight: THEME.fontWeight.bold }}>
                      v{asset.revisionNumber}
                    </span>
                  )}
                  {asset.approved && (
                    <span style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.success, fontWeight: THEME.fontWeight.semibold }}>
                      ✓ Approved Final
                    </span>
                  )}
                  <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, marginLeft: 'auto' }}>
                    {asset.uploadedBy === 'artist' ? 'Artist' : 'Client'} · {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {asset.note && (
                  <p style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted, margin: '2px 0' }}>{asset.note}</p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {!asset.approved && (
                    <button
                      onClick={() => handleMarkApproved(asset.id)}
                      style={actionBtnStyle}
                    >
                      Mark as Final
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerateApprovalLink(asset.id)}
                    disabled={generating}
                    style={{ ...actionBtnStyle, color: THEME.brand.info, borderColor: `${THEME.brand.info}40` }}
                  >
                    {generating ? '...' : 'Send for Approval'}
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(asset.imageUrl)}
                    style={actionBtnStyle}
                  >
                    Copy Image
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.border.default}`,
  background: THEME.bg.panelAlt, color: THEME.text.primary, fontSize: THEME.fontSize.sm,
  outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  minWidth: 120,
};

const actionBtnStyle: React.CSSProperties = {
  border: `1px solid ${THEME.border.default}`,
  background: 'transparent',
  color: THEME.text.muted,
  borderRadius: THEME.radius.sm,
  padding: '5px 10px',
  fontSize: THEME.fontSize.xs,
  cursor: 'pointer',
  fontWeight: THEME.fontWeight.semibold,
};

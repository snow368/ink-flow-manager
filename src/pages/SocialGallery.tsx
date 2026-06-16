import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type SocialDraftRecord } from '../db';

interface PhotoItem {
  id: string;
  clientId: string;
  imageUrl: string;
  bodyPart: string;
  step: number;
  createdAt: number;
  clientName?: string;
}

type SharePlatform = 'instagram' | 'facebook' | 'pinterest';

const PLATFORM_CONFIG: Record<SharePlatform, { label: string; icon: string; aspect: number; width: number; height: number; }> = {
  instagram: { label: 'Instagram', icon: '📷', aspect: 1, width: 1080, height: 1080 },
  facebook: { label: 'Facebook', icon: '👍', aspect: 1.91, width: 1200, height: 628 },
  pinterest: { label: 'Pinterest', icon: '📌', aspect: 0.67, width: 1000, height: 1500 },
};

const HASHTAGS_BY_PLATFORM: Record<SharePlatform, string[]> = {
  instagram: ['#tattoo', '#inked', '#tattooart', '#tattooartist', '#tattoosleeve', '#tattoodesign', '#instatattoo', '#tattoocommunity', '#tattoolife', '#bodyart', '#tattooidea', '#newtattoo', '#tattooer', '#tattoostudio', '#artistontiktok'],
  facebook: ['#tattoo', '#tattooartist', '#inked', '#bodyart', '#tattoocommunity', '#tattoodesign', '#tattoosleeve', '#art', '#tattoostudio', '#newtattoo', '#instatattoo', '#tattoolife', '#tattooidea', '#tattooer', '#tattooflash'],
  pinterest: ['#tattoo', '#tattooideas', '#tattoodesign', '#inked', '#bodyart', '#tattooinspiration', '#tattooart', '#tattoosleeve', '#tattoocommunity', '#tattooflash', '#tattoostudio', '#tattoodesigns', '#tattooartist', '#newtattoo', '#art'],
};

const CAPTION_TEMPLATES = [
  { platform: 'instagram', title: 'New piece showcase', text: 'Freshly done for this legend 🤝\n\nSwipe to see the whole process →\n\nBook your session at the link in bio' },
  { platform: 'instagram', title: 'Process/steps', text: 'From blank skin to finished art 🖤\n\nStep 1: Clean & prep\nStep 2: Stencil placement\nStep 3: Lining\nStep 4: Shading\nStep 5: Done ✅\n\nWhich step is your favorite? 👇' },
  { platform: 'instagram', title: 'Client appreciation', text: 'Another happy client walking out with art they\'ll love forever 🙏\n\nNothing beats seeing your vision come to life.\n\nDM to book your consultation' },
  { platform: 'instagram', title: 'Flash/availability', text: '⚡️ FLASH DAY ⚡️\n\nI have 3 spots opening up this week for flash designs.\n\nFirst come, first served.\n\nComment FLASH and I\'ll DM you the available designs!' },
  { platform: 'instagram', title: 'Behind the scenes', text: 'Behind the needle 🎬\n\nA little sneak peek of how this piece came together.\n\nThe magic is in the details.\n\nWant to see the full timelapse? Let me know 👇' },
  { platform: 'tiktok', title: 'Quick process', text: 'Watch this one come together 🎬\n\nFrom start to finish in 15 seconds.\n\nWho\'s next? 👇' },
  { platform: 'tiktok', title: 'Before/after reveal', text: 'The reveal NEVER gets old 😮‍💨\n\nRate this transformation 1-10 👇' },
  { platform: 'tiktok', title: 'Educational', text: 'Answering the #1 question I get:\n\n"How much does a tattoo cost?"\n\nHere\'s the truth 👇' },
];

const GROWTH_TIPS = [
  { platform: 'instagram' as const, tip: 'Post consistently 3-4x/week. Use all 10 hashtags. Reply to every comment within 1hr.' },
  { platform: 'instagram' as const, tip: 'Stories > Feed. Post process videos to Stories daily. Use polls/questions to boost engagement.' },
  { platform: 'tiktok' as const, tip: 'Hook in first 2 seconds. Show the process, not just the result. Use trending sounds.' },
  { platform: 'tiktok' as const, tip: 'Post 1-2x daily. Reply to comments with video. Cross-post your best TikToks to Reels.' },
];

const DEEP_LINKS: Record<SharePlatform, { app: string; url: string; hint: string }> = {
  instagram: { app: 'Instagram', url: 'https://www.instagram.com/create/story/', hint: 'Open Instagram → upload the saved image' },
  facebook: { app: 'Facebook', url: 'https://www.facebook.com/photo/', hint: 'Open Facebook → create a new post with the image' },
  pinterest: { app: 'Pinterest', url: 'https://www.pinterest.com/pin/create/button/', hint: 'Pinterest pin builder (image URL needed — upload first)' },
};

function getRandomHashtags(platform: SharePlatform): string[] {
  return [...HASHTAGS_BY_PLATFORM[platform]].sort(() => Math.random() - 0.5).slice(0, 10);
}

export default function SocialGallery() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [watermark, setWatermark] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<SharePlatform>('instagram');

  /* ── Draft / Caption Editor state ── */
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [editorCaption, setEditorCaption] = useState('');
  const [editorHashtags, setEditorHashtags] = useState<string[]>(() => getRandomHashtags('instagram'));
  const [drafts, setDrafts] = useState<SocialDraftRecord[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ── Copy feedback ── */
  const [copyFeedback, setCopyFeedback] = useState('');

  /* ── Initialize ── */
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('inkflow_current_user_data') || '{}');
    const instagram = userData?.instagram || '';
    if (instagram) setWatermark(`@${instagram.replace('@', '')}`);
    loadPhotos();
    loadDrafts();
  }, []);

  useEffect(() => {
    setEditorHashtags(getRandomHashtags(platform));
  }, [platform]);

  /* ── Data loading ── */
  const loadPhotos = async () => {
    setLoading(true);
    try {
      const artistId = localStorage.getItem('inkflow_current_user') || '';
      const res = await fetch(`/api/photos/artist/${artistId}?step=5`, {
        headers: { 'x-api-secret': localStorage.getItem('inkflow_api_secret') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadDrafts = async () => {
    setDraftsLoading(true);
    try {
      const all = await db.socialDrafts
        .where('status')
        .equals('draft' as any)
        .reverse()
        .sortBy('createdAt');
      setDrafts(all.slice(0, 30));
    } catch { setDrafts([]); }
    setDraftsLoading(false);
  };

  /* ── Photo selection ── */
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 9) next.add(id);
      return next;
    });
  };

  /* ── Canvas helpers ── */
  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const text = watermark.trim();
    if (!text) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const barH = 30;
    const barY = h - barH - 8;
    const tw = ctx.measureText(text).width;
    ctx.fillRect((w - tw - 24) / 2, barY, tw + 24, barH);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${Math.max(12, w * 0.04)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, w / 2, barY + barH - 8);
    ctx.restore();
  };

  /* ── Grid generation + save draft ── */
  const generateGrid = async () => {
    const selectedPhotos = photos.filter(p => selected.has(p.id));
    if (selectedPhotos.length === 0) return;
    setGenerating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = PLATFORM_CONFIG[platform];
    const cols = platform === 'instagram' ? 3 : 1;
    const rows = platform === 'instagram' ? Math.ceil(selectedPhotos.length / cols) : selectedPhotos.length;
    const cellSize = cfg.width / cols;
    const padding = 2;
    canvas.width = cfg.width;
    canvas.height = platform === 'instagram' ? rows * cellSize : cfg.height;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < selectedPhotos.length; i++) {
      try {
        const img = await loadImage(selectedPhotos[i].imageUrl);
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellSize + padding;
        const y = row * cellSize + padding;
        const size = cellSize - padding * 2;
        const scale = Math.max(size / img.width, size / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.drawImage(img, x + (size - sw) / 2, y + (size - sh) / 2, sw, sh);
      } catch { /* skip bad image */ }
    }

    drawWatermark(ctx, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    setGenerating(false);

    /* Auto-save draft to IndexedDB */
    try {
      const draft: SocialDraftRecord = {
        id: crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        portfolioId: 'gallery_grid',
        platform,
        status: 'draft',
        caption: editorCaption || ' ',
        hashtags: editorHashtags.join(' '),
        imageUrls: [],
        gridDataUrl: dataUrl,
        selectedPhotoIds: Array.from(selected),
        watermarkText: watermark.trim(),
        createdAt: Date.now(),
      };
      await db.socialDrafts.add(draft);
      showToast('💾 Draft saved!');
      loadDrafts();
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  };

  /* ── Toast ── */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  /* ── Actions on preview ── */
  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `inkflow_gallery_${platform}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    const blob = await (await fetch(previewUrl)).blob();
    const file = new File([blob], `inkflow_gallery_${platform}.png`, { type: 'image/png' });
    const shareText = editorCaption
      ? `${editorCaption}\n\n${editorHashtags.join(' ')}`
      : `Check out my latest tattoo work! ${editorHashtags.join(' ')}`;
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'InkFlow Gallery', text: shareText, files: [file] });
    } else {
      handleDownload();
    }
  };

  /* ── Deep link ── */
  const handleDeepLink = (p: SharePlatform) => {
    const link = DEEP_LINKS[p];
    window.open(link.url, '_blank');
    showToast(`📋 Image saved. ${link.hint}`);
  };

  /* ── Caption: apply template ── */
  const applyTemplate = (text: string) => {
    setEditorCaption(text);
  };

  /* ── Copy helpers ── */
  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(''), 1500);
  };

  /* ── Draft actions ── */
  const downloadDraftImage = (dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `inkflow_draft.png`;
    a.click();
  };

  const shareDraft = async (draft: SocialDraftRecord) => {
    if (!draft.gridDataUrl) return;
    const blob = await (await fetch(draft.gridDataUrl)).blob();
    const file = new File([blob], 'inkflow_draft.png', { type: 'image/png' });
    const shareText = draft.caption && draft.caption !== ' '
      ? `${draft.caption}\n\n${draft.hashtags || ''}`
      : 'Check out my latest tattoo work!';
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'InkFlow Gallery', text: shareText, files: [file] });
    } else {
      downloadDraftImage(draft.gridDataUrl);
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      await db.socialDrafts.delete(id);
      setDrafts(prev => prev.filter(d => d.id !== id));
      showToast('🗑️ Draft deleted');
    } catch { showToast('Failed to delete'); }
    setConfirmDeleteId(null);
  };

  const restoreDraft = (draft: SocialDraftRecord) => {
    setActiveTab('compose');
    if (draft.gridDataUrl) setPreviewUrl(draft.gridDataUrl);
    if (draft.platform === 'instagram' || draft.platform === 'facebook' || draft.platform === 'pinterest') {
      setPlatform(draft.platform);
    }
    if (draft.caption && draft.caption !== ' ') setEditorCaption(draft.caption);
    if (draft.hashtags) setEditorHashtags(draft.hashtags.split(' ').filter(Boolean));
    if (draft.watermarkText) setWatermark(draft.watermarkText);
    if (draft.selectedPhotoIds?.length) {
      setSelected(new Set(draft.selectedPhotoIds));
    }
  };

  /* ── Format date ── */
  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  /* ── Platform emoji ── */
  const platformEmoji = (p: string) => {
    switch (p) {
      case 'instagram': return '📷';
      case 'facebook': return '👍';
      case 'pinterest': return '📌';
      case 'youtube': return '🎬';
      default: return '📱';
    }
  };

  /* ════════════════════════════════════════════════ RENDER ════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 16, paddingBottom: 80 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Social Gallery</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Back</button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#166534', color: '#bbf7d0', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#1e293b', borderRadius: 10, padding: 3 }}>
        {(['compose', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              background: activeTab === tab ? '#334155' : 'transparent',
              color: activeTab === tab ? 'white' : '#64748b',
              fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer',
            }}>
            {tab === 'compose' ? '✍️ Create' : '📂 Drafts'}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════ COMPOSE TAB ═══════════════════════════ */}
      {activeTab === 'compose' && (
        <>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
            Select up to 9 completed tattoos. Generate a grid, edit caption, save.
          </p>

          {/* ── Platform selector ── */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(Object.entries(PLATFORM_CONFIG) as [SharePlatform, typeof PLATFORM_CONFIG['instagram']][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setPlatform(key)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, border: platform === key ? '2px solid #22c55e' : '1px solid #334155',
                  background: platform === key ? '#16653420' : '#1e293b', color: platform === key ? '#22c55e' : '#94a3b8',
                  fontSize: 12, fontWeight: platform === key ? 600 : 400, cursor: 'pointer',
                }}>
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>

          {/* ── Watermark + counter ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input value={watermark} onChange={e => setWatermark(e.target.value)}
              placeholder="@yourinstagram"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 13, outline: 'none' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>{selected.size}/9</span>
          </div>

          {/* ── Generate button ── */}
          {selected.size > 0 && (
            <button onClick={generateGrid} disabled={generating}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: generating ? '#4b5563' : '#22c55e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
              {generating ? '🔄 Generating...' : `🎨 Generate Grid (${selected.size})`}
            </button>
          )}

          {/* ── Photo grid ── */}
          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Loading photos...</p>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>📸</p>
              <p style={{ color: '#94a3b8' }}>No completed tattoo photos yet.</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>Take photos with step "完成" in sessions, or import from gallery in client profile.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
              {photos.map(p => {
                const isSelected = selected.has(p.id);
                return (
                  <div key={p.id} onClick={() => toggleSelect(p.id)}
                    style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: isSelected ? '3px solid #22c55e' : '3px solid transparent', opacity: selected.size >= 9 && !isSelected ? 0.4 : 1 }}>
                    <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                        {Array.from(selected).indexOf(p.id) + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Preview ── */}
          {previewUrl && (
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <img src={previewUrl} alt="Grid preview" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #334155' }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
                <button onClick={handleDownload} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: 'white', fontSize: 12, cursor: 'pointer' }}>⬇ Download</button>
                <button onClick={handleShare} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#075e54', color: 'white', fontSize: 12, cursor: 'pointer' }}>📤 Share</button>
                <button onClick={() => handleDeepLink(platform)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                  🔗 Open {PLATFORM_CONFIG[platform].label}
                </button>
              </div>
            </div>
          )}

          {/* ── Caption Editor ── */}
          {selected.size > 0 && (
            <div style={{ borderTop: '1px solid #334155', paddingTop: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>✍️ Caption</h3>

              {/* Template presets */}
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Click a template to start:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {CAPTION_TEMPLATES.filter(c => c.platform === platform).slice(0, 4).map((c, i) => (
                  <button key={i} onClick={() => applyTemplate(c.text)}
                    style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 11, cursor: 'pointer', lineHeight: 1.3 }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{c.title}</span>
                    <span style={{ color: '#64748b' }}> — {c.text.slice(0, 50)}...</span>
                  </button>
                ))}
              </div>

              {/* Editable textarea */}
              <textarea value={editorCaption} onChange={e => setEditorCaption(e.target.value)}
                placeholder="Write your caption here..."
                rows={4}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />

              {/* Copy caption */}
              <button onClick={() => copyToClipboard(editorCaption || ' ', 'caption')}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 11, cursor: 'pointer', marginBottom: 12 }}>
                {copyFeedback === 'caption' ? '✓ Copied!' : '📋 Copy Caption'}
              </button>

              {/* ── Hashtags ── */}
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🏷️ Hashtags</h3>
              <div style={{ background: '#1e293b', borderRadius: 8, padding: 10, border: '1px solid #334155', marginBottom: 6 }}>
                <p style={{ fontSize: 12, color: '#60a5fa', lineHeight: 1.6, margin: 0 }}>{editorHashtags.join(' ')}</p>
              </div>
              <button onClick={() => setEditorHashtags(getRandomHashtags(platform))}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: 11, cursor: 'pointer', marginRight: 6, marginBottom: 12 }}>
                🔄 Shuffle
              </button>
              <button onClick={() => copyToClipboard(editorHashtags.join(' '), 'hashtags')}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: 11, cursor: 'pointer', marginBottom: 12 }}>
                {copyFeedback === 'hashtags' ? '✓ Copied!' : '📋 Copy Hashtags'}
              </button>

              {/* ── Growth Tips ── */}
              <details style={{ marginBottom: 16 }}>
                <summary style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer', padding: 8, borderRadius: 6, background: '#1e293b', border: '1px solid #334155' }}>
                  📈 Growth tips for {PLATFORM_CONFIG[platform].label}
                </summary>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {GROWTH_TIPS.filter(t => t.platform === platform).map((t, i) => (
                    <div key={i} style={{ background: '#1e293b', borderRadius: 6, padding: 8, border: '1px solid #334155' }}>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>💡 {t.tip}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Hidden canvas for grid generation */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      )}

      {/* ═══════════════════════════ HISTORY TAB ═══════════════════════════ */}
      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Previously saved drafts</p>
            <button onClick={loadDrafts} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
              🔄 Refresh
            </button>
          </div>

          {draftsLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Loading drafts...</p>
          ) : drafts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>📂</p>
              <p style={{ color: '#94a3b8' }}>No drafts yet</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>Generate a grid in the Create tab — it saves automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {drafts.map(draft => (
                <div key={draft.id} style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155' }}>
                  {/* Thumbnail */}
                  {draft.gridDataUrl && (
                    <div style={{ width: '100%', aspectRatio: '1.5', maxHeight: 200, overflow: 'hidden', background: '#0f172a' }}>
                      <img src={draft.gridDataUrl} alt="Draft" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span>{platformEmoji(draft.platform)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>{draft.platform}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>{fmtDate(draft.createdAt)}</span>
                    </div>

                    {draft.caption && draft.caption !== ' ' && (
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px', lineHeight: 1.3, maxHeight: 36, overflow: 'hidden' }}>
                        {draft.caption.slice(0, 80)}{draft.caption.length > 80 ? '...' : ''}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => draft.gridDataUrl && downloadDraftImage(draft.gridDataUrl)}
                        disabled={!draft.gridDataUrl}
                        style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                        ⬇ Download
                      </button>
                      <button onClick={() => shareDraft(draft)}
                        disabled={!draft.gridDataUrl}
                        style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                        📤 Share
                      </button>
                      <button onClick={() => restoreDraft(draft)}
                        style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
                        ✏️ Edit
                      </button>
                      {confirmDeleteId === draft.id ? (
                        <button onClick={() => deleteDraft(draft.id)}
                          style={{ flex: 0, padding: '6px 10px', borderRadius: 6, border: 'none', background: '#dc2626', color: 'white', fontSize: 11, cursor: 'pointer' }}>
                          Confirm?
                        </button>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(draft.id)}
                          style={{ flex: 0, padding: '6px 10px', borderRadius: 6, border: '1px solid #dc262644', background: 'transparent', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

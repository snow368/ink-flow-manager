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
type GridLayout = '3x3' | '2x2' | '4x1' | '1xN';
type Tone = 'professional' | 'casual' | 'hype' | 'educational';
type V2Tab = 'compose' | 'history' | 'scheduled' | 'analytics';

interface CloudDraft {
  id: string;
  artistId: string;
  platform: string;
  caption: string;
  hashtags: string;
  imageUrls: string;
  gridDataUrl: string;
  watermarkText: string;
  layout: string;
  backgroundColor: string;
  tone: string;
  status: string;
  scheduledAt: number | null;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface AnalyticsData {
  total: { posts: number; impressions: number; likes: number; comments: number; shares: number; saves: number; clicks: number };
  byPlatform: Record<string, { posts: number; impressions: number; likes: number }>;
  items: any[];
}

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
  { platform: 'facebook', title: 'New work showcase', text: 'Fresh ink alert 🖤\n\nJust finished this piece for an amazing client.\n\nBook your session today!' },
  { platform: 'facebook', title: 'Studio update', text: 'Spots opening up this week!\n\nDM to book your consultation.\n\nFlash designs available first come first served.' },
  { platform: 'pinterest', title: 'Tattoo inspiration', text: 'Tattoo inspiration for your next piece 🖤\n\nPin this to your tattoo ideas board!' },
  { platform: 'pinterest', title: 'Design highlight', text: 'Detailed linework and shading this piece came together beautifully.\n\nSave this to your inspiration board.' },
];

const LOCAL_SEO_TIPS = [
  { platform: 'instagram', tip: 'Tag your city/neighborhood in every post. Use local hashtags like #portlandtattoo #seattletattoo.' },
  { platform: 'instagram', tip: 'Create a "near me" highlight — show clients walking distance from your studio.' },
  { platform: 'facebook', tip: 'Join local community groups. Share flash day offers there — not just your page.' },
  { platform: 'facebook', tip: 'Facebook counts local engagement as a ranking signal. Reply to comments within 1hr.' },
  { platform: 'pinterest', tip: 'Name your boards with service+city: "Fine Line Tattoo Portland | Cover Up NYC".' },
  { platform: 'pinterest', tip: 'Google Images indexes Pinterest pins. Use city names in pin descriptions for local search.' },
];

const GROWTH_TIPS = [
  { platform: 'instagram' as const, tip: 'Post consistently 3-4x/week. Use all 10 hashtags. Reply to every comment within 1hr.' },
  { platform: 'instagram' as const, tip: 'Stories > Feed. Post process videos to Stories daily. Use polls/questions to boost engagement.' },
  { platform: 'tiktok' as const, tip: 'Hook in first 2 seconds. Show the process, not just the result. Use trending sounds.' },
  { platform: 'tiktok' as const, tip: 'Post 1-2x daily. Reply to comments with video. Cross-post your best TikToks to Reels.' },
  { platform: 'facebook' as const, tip: 'Post in local tattoo groups. Share process videos. Tag clients (with permission) for reach.' },
  { platform: 'facebook' as const, tip: 'Facebook Marketplace counts as local SEO — list your flash designs there.' },
  { platform: 'pinterest' as const, tip: 'Create themed boards (sleeve ideas / fine line / cover-ups). Pin consistently 5-10x/day.' },
  { platform: 'pinterest' as const, tip: 'Use keyword-rich pin descriptions. Rich pins from your website auto-update.' },
];

const DEEP_LINKS: Record<SharePlatform, { app: string; url: string }> = {
  instagram: { app: 'Instagram', url: 'https://www.instagram.com/create/story/' },
  facebook: { app: 'Facebook', url: 'https://www.facebook.com/photo/' },
  pinterest: { app: 'Pinterest', url: 'https://www.pinterest.com/pin/create/button/' },
};

const LAYOUTS: { key: GridLayout; label: string; desc: string }[] = [
  { key: '3x3', label: '3×3 Grid', desc: 'Classic grid, max 9 photos' },
  { key: '2x2', label: '2×2 Grid', desc: 'Clean 4-photo layout' },
  { key: '4x1', label: '4×1 Strip', desc: 'Horizontal strip, 4 photos' },
  { key: '1xN', label: '1×N Stack', desc: 'Vertical stack' },
];

const BG_COLORS = ['#000000', '#0f172a', '#1e293b', '#ffffff', '#fef3c7', '#fce7f3', '#dbeafe', '#f0fdf4'];

const TONES: { key: Tone; label: string }[] = [
  { key: 'professional', label: 'Professional' },
  { key: 'casual', label: 'Casual' },
  { key: 'hype', label: 'Hype' },
  { key: 'educational', label: 'Educational' },
];

function getRandomHashtags(platform: SharePlatform): string[] {
  return [...HASHTAGS_BY_PLATFORM[platform]].sort(() => Math.random() - 0.5).slice(0, 10);
}

function getUserPlan(): 'free' | 'solo' | 'pro' | 'pro_plus' {
  try {
    const data = JSON.parse(localStorage.getItem('inkflow_current_user_data') || '{}');
    return data.plan || 'free';
  } catch { return 'free'; }
}

function getUserArtistId(): string {
  try {
    const data = JSON.parse(localStorage.getItem('inkflow_current_user_data') || '{}');
    return data.id || localStorage.getItem('inkflow_current_user') || '';
  } catch { return localStorage.getItem('inkflow_current_user') || ''; }
}

function isPro(plan: string): boolean {
  return plan === 'pro' || plan === 'pro_plus';
}

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-secret': localStorage.getItem('inkflow_api_secret') || '',
  };
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

  /* ── Pro features ── */
  const [activeTab, setActiveTab] = useState<V2Tab>('compose');
  const [editorCaption, setEditorCaption] = useState('');
  const [editorHashtags, setEditorHashtags] = useState<string[]>(() => getRandomHashtags('instagram'));
  const [drafts, setDrafts] = useState<SocialDraftRecord[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  /* ── Studio enhancements ── */
  const [gridLayout, setGridLayout] = useState<GridLayout>('3x3');
  const [bgColor, setBgColor] = useState('#000000');
  const [showProUpsell, setShowProUpsell] = useState(false);

  /* ── V2: AI Caption + Local SEO ── */
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [captionTone, setCaptionTone] = useState<Tone>('professional');
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [captionHints, setCaptionHints] = useState('');

  /* ── V2: Cloud drafts ── */
  const [cloudDrafts, setCloudDrafts] = useState<CloudDraft[]>([]);
  const [cloudDraftsLoading, setCloudDraftsLoading] = useState(false);

  /* ── V2: Calendar/Schedule ── */
  const [scheduledPosts, setScheduledPosts] = useState<CloudDraft[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  /* ── V2: Analytics ── */
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'week' | 'month' | 'all'>('week');

  /* ── V2: Location autofill from user data ── */
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('inkflow_current_user_data') || '{}');
      if (data.city) setCity(data.city);
      if (data.state) setState(data.state);
    } catch {}
  }, []);

  const plan = getUserPlan();
  const isProUser = isPro(plan);
  const artistId = getUserArtistId();

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
      const uid = localStorage.getItem('inkflow_current_user') || '';
      const res = await fetch(`/api/photos/artist/${uid}?step=5`, {
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

  /* ── V2: Cloud Drafts ── */
  const loadCloudDrafts = async () => {
    if (!artistId) return;
    setCloudDraftsLoading(true);
    try {
      const res = await fetch(`/api/content/drafts?artistId=${artistId}&status=draft`, { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCloudDrafts(data.items || []);
      }
    } catch { /* ignore */ }
    setCloudDraftsLoading(false);
  };

  const saveToCloud = async () => {
    if (!artistId) { showToast('Please log in to save to cloud'); return; }
    if (!previewUrl) { showToast('Generate a grid first'); return; }
    try {
      const body = {
        artistId,
        platform,
        caption: editorCaption || '',
        hashtags: editorHashtags.join(' '),
        gridDataUrl: previewUrl,
        watermarkText: watermark,
        layout: gridLayout,
        backgroundColor: bgColor,
        tone: captionTone,
        status: 'draft',
      };
      const res = await fetch('/api/content/drafts', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast('Saved to cloud!');
        loadCloudDrafts();
      } else {
        showToast('Cloud save failed');
      }
    } catch { showToast('Cloud save failed'); }
  };

  const deleteCloudDraft = async (id: string) => {
    try {
      await fetch(`/api/content/drafts/${id}`, { method: 'DELETE', headers: apiHeaders() });
      setCloudDrafts(prev => prev.filter(d => d.id !== id));
      setScheduledPosts(prev => prev.filter(d => d.id !== id));
      showToast('Deleted');
    } catch { showToast('Delete failed'); }
  };

  /* ── V2: AI Caption Generation ── */
  const generateAICaption = async () => {
    if (generatingCaption) return;
    setGeneratingCaption(true);
    try {
      const selectedPhotos = photos.filter(p => selected.has(p.id));
      const body: any = {
        platform,
        tone: captionTone,
        captionHints,
        imageUrls: selectedPhotos.map(p => p.imageUrl),
      };
      if (city) body.city = city;
      if (state) body.state = state;
      const userData = JSON.parse(localStorage.getItem('inkflow_current_user_data') || '{}');
      if (userData.studioName) body.studioName = userData.studioName;

      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.caption) setEditorCaption(data.caption);
        if (data.hashtags) setEditorHashtags(data.hashtags);
        showToast('AI caption generated!');
      } else {
        showToast('AI generation failed — try template instead');
      }
    } catch { showToast('AI generation failed'); }
    setGeneratingCaption(false);
  };

  /* ── V2: Schedule ── */
  const loadScheduledPosts = async () => {
    if (!artistId) return;
    setScheduleLoading(true);
    try {
      const from = Date.now() - 7 * 86400 * 1000;
      const to = Date.now() + 30 * 86400 * 1000;
      const res = await fetch(`/api/content/calendar?artistId=${artistId}&from=${from}&to=${to}`, { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        setScheduledPosts(data.items || []);
      }
    } catch { /* ignore */ }
    setScheduleLoading(false);
  };

  const scheduleDraft = async (draftId: string, dateStr: string) => {
    if (!draftId || !dateStr) return;
    const scheduledAt = new Date(dateStr).getTime();
    if (isNaN(scheduledAt)) { showToast('Invalid date'); return; }
    try {
      const res = await fetch(`/api/content/drafts/${draftId}`, {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({ status: 'scheduled', scheduledAt }),
      });
      if (res.ok) {
        showToast('Scheduled!');
        loadScheduledPosts();
        loadCloudDrafts();
      }
    } catch { showToast('Schedule failed'); }
  };

  /* ── V2: Analytics ── */
  const loadAnalytics = async (period = analyticsPeriod) => {
    if (!artistId) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/content/analytics?artistId=${artistId}&period=${period}`, { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch { /* ignore */ }
    setAnalyticsLoading(false);
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
    const barH = 30;
    const barY = h - barH - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const tw = ctx.measureText(text).width;
    ctx.fillRect((w - tw - 24) / 2, barY, tw + 24, barH);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${Math.max(12, w * 0.04)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, w / 2, barY + barH - 8);
    ctx.restore();
  };

  /* ── Grid generation ── */
  const generateGrid = async () => {
    const selectedPhotos = photos.filter(p => selected.has(p.id));
    if (selectedPhotos.length === 0) return;
    setGenerating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = PLATFORM_CONFIG[platform];
    let cols: number, rows: number;
    switch (gridLayout) {
      case '2x2': cols = 2; rows = 2; break;
      case '4x1': cols = 4; rows = 1; break;
      case '1xN': cols = 1; rows = selectedPhotos.length; break;
      default: cols = platform === 'instagram' ? 3 : 1; rows = platform === 'instagram' ? Math.ceil(selectedPhotos.length / cols) : selectedPhotos.length;
    }

    const cellSize = cfg.width / cols;
    const padding = 2;
    canvas.width = cfg.width;
    canvas.height = gridLayout === '4x1' ? cfg.width / 4 * 2 : gridLayout === '1xN' ? rows * cellSize : platform === 'instagram' ? rows * cellSize : cfg.height;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < Math.min(selectedPhotos.length, cols * rows); i++) {
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
      } catch { /* skip */ }
    }

    drawWatermark(ctx, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    setGenerating(false);

    /* Auto-save local draft */
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
      showToast('Draft saved!');
      loadDrafts();
    } catch { /* ignore */ }
  };

  /* ── Toast ── */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  /* ── Download ── */
  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `inkflow_gallery_${platform}.png`;
    a.click();
  };

  /* ── Share ── */
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

  /* ── Copy All (Pro+) ── */
  const handleCopyAll = async () => {
    if (!previewUrl) return;
    try {
      const blob = await (await fetch(previewUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      const text = `${editorCaption || ''}\n\n${editorHashtags.join(' ')}`.trim();
      if (text) await navigator.clipboard.writeText(text);
      showToast('Copied! Image + caption ready to paste');
    } catch { showToast('Copy failed — try Download instead'); }
  };

  /* ── Deep link ── */
  const handleDeepLink = (p: SharePlatform) => {
    window.open(DEEP_LINKS[p].url, '_blank');
    showToast(`Opening ${DEEP_LINKS[p].app} in browser`);
  };

  /* ── Caption helpers ── */
  const applyTemplate = (text: string) => setEditorCaption(text);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(''), 1500);
  };

  /* ── Draft actions ── */
  const downloadDraftImage = (dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'inkflow_draft.png';
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
      showToast('Draft deleted');
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
    if (draft.selectedPhotoIds?.length) setSelected(new Set(draft.selectedPhotoIds));
  };

  const restoreCloudDraft = (draft: CloudDraft) => {
    setActiveTab('compose');
    if (draft.gridDataUrl) setPreviewUrl(draft.gridDataUrl);
    if (draft.platform === 'instagram' || draft.platform === 'facebook' || draft.platform === 'pinterest') {
      setPlatform(draft.platform as SharePlatform);
    }
    if (draft.caption) setEditorCaption(draft.caption);
    if (draft.hashtags) setEditorHashtags(draft.hashtags.split(' ').filter(Boolean));
    if (draft.watermarkText) setWatermark(draft.watermarkText);
    if (draft.layout) setGridLayout(draft.layout as GridLayout);
    if (draft.backgroundColor) setBgColor(draft.backgroundColor);
  };

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fmtDateShort = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const platformEmoji = (p: string) => {
    switch (p) {
      case 'instagram': return '📷';
      case 'facebook': return '👍';
      case 'pinterest': return '📌';
      case 'youtube': return '🎬';
      default: return '📱';
    }
  };

  /* ── Number format ── */
  const fmtNum = (n: number) => n.toLocaleString();

  /* ════════════════════════════════════════════════ RENDER ════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 16, paddingBottom: 80 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Social Content Studio</h2>
          <span style={{ fontSize: 11, color: isProUser ? '#22c55e' : '#64748b' }}>
            {plan === 'free' ? 'Free' : plan === 'solo' ? 'Solo' : plan === 'pro' ? 'Pro' : 'Pro+'}
            {isProUser ? '' : ' — upgrade to Pro for AI layouts & Copy All'}
          </span>
        </div>
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
        {([['compose', 'Create'], ['history', 'Drafts'], ['scheduled', 'Schedule'], ['analytics', 'Analytics']] as [V2Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => {
            setActiveTab(key);
            if (key === 'history') { loadDrafts(); loadCloudDrafts(); }
            if (key === 'scheduled') loadScheduledPosts();
            if (key === 'analytics') loadAnalytics();
          }}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none',
              background: activeTab === key ? '#334155' : 'transparent',
              color: activeTab === key ? 'white' : '#64748b',
              fontSize: 12, fontWeight: activeTab === key ? 600 : 400, cursor: 'pointer',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ COMPOSE ═══════════════════ */}
      {activeTab === 'compose' && (
        <>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
            Select completed tattoos. Generate a grid, add caption, then copy all or download.
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

          {/* ── Layout selector (Pro+) ── */}
          {isProUser && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Layout</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {LAYOUTS.map(l => (
                  <button key={l.key} onClick={() => setGridLayout(l.key)}
                    style={{
                      flex: 1, padding: '6px', borderRadius: 6, border: gridLayout === l.key ? '2px solid #22c55e' : '1px solid #334155',
                      background: gridLayout === l.key ? '#16653420' : '#1e293b',
                      color: gridLayout === l.key ? '#22c55e' : '#94a3b8', fontSize: 11, cursor: 'pointer',
                    }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Background color (Pro+) ── */}
          {isProUser && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Background</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {BG_COLORS.map(c => (
                  <div key={c} onClick={() => setBgColor(c)}
                    style={{
                      width: 24, height: 24, borderRadius: 12, background: c, cursor: 'pointer',
                      border: bgColor === c ? '3px solid #22c55e' : '2px solid transparent',
                      boxShadow: c === '#ffffff' || c === '#fef3c7' ? '0 0 0 1px #334155' : 'none',
                    }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Watermark + counter ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input value={watermark} onChange={e => setWatermark(e.target.value)}
              placeholder="@yourinstagram"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 13, outline: 'none' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>{selected.size}/9</span>
          </div>

          {/* ── Generate ── */}
          {selected.size > 0 && (
            <button onClick={generateGrid} disabled={generating}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: generating ? '#4b5563' : '#22c55e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
              {generating ? 'Generating...' : `Generate Grid (${selected.size})`}
            </button>
          )}

          {/* ── Photo grid ── */}
          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Loading photos...</p>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>📸</p>
              <p style={{ color: '#94a3b8' }}>No completed tattoo photos yet.</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>Take photos with step  Done  in sessions, or import from gallery in client profile.</p>
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
                <button onClick={handleDownload} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: 'white', fontSize: 12, cursor: 'pointer' }}>Download</button>
                <button onClick={handleShare} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#075e54', color: 'white', fontSize: 12, cursor: 'pointer' }}>Share</button>
                <button onClick={() => handleDeepLink(platform)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                  Open {PLATFORM_CONFIG[platform].label}
                </button>
                {isProUser && (
                  <button onClick={handleCopyAll} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontSize: 12, cursor: 'pointer' }}>
                    Copy All
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Pro upsell ── */}
          {!isProUser && previewUrl && (
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 10, border: '1px solid #7c3aed44', marginBottom: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#a78bfa', margin: 0 }}>
                Want more layouts, custom backgrounds, and Copy All? <a href="/pricing" style={{ color: '#22c55e', fontWeight: 600 }}>Upgrade to Pro</a>
              </p>
            </div>
          )}

          {/* ── Caption ── */}
          {selected.size > 0 && (
            <div style={{ borderTop: '1px solid #334155', paddingTop: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Caption</h3>

              {/* ── V2: Local SEO Location Input ── */}
              <details style={{ marginBottom: 10 }}>
                <summary style={{ fontSize: 12, color: '#60a5fa', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155' }}>
                  📍 Local SEO — add your city for better reach
                </summary>
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="City e.g. Portland"
                    style={{ flex: 2, padding: '8px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12, outline: 'none' }} />
                  <input value={state} onChange={e => setState(e.target.value)}
                    placeholder="State e.g. OR"
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12, outline: 'none' }} />
                </div>
              </details>

              {/* ── V2: Tone selector ── */}
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Tone:</p>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {TONES.map(t => (
                  <button key={t.key} onClick={() => setCaptionTone(t.key)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: captionTone === t.key ? '2px solid #22c55e' : '1px solid #334155',
                      background: captionTone === t.key ? '#16653420' : 'transparent',
                      color: captionTone === t.key ? '#22c55e' : '#94a3b8', fontSize: 11, cursor: 'pointer',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── V2: AI Caption Generation ── */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button onClick={generateAICaption} disabled={generatingCaption}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: generatingCaption ? '#4b5563' : '#7c3aed', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {generatingCaption ? 'Generating...' : '🤖 AI Caption'}
                </button>
              </div>

              {/* ── Caption hints input ── */}
              <input value={captionHints} onChange={e => setCaptionHints(e.target.value)}
                placeholder="Optional: what's special about this work? (e.g. 'fine line cover up, 3hr session')"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 11, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />

              {/* ── Templates ── */}
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Or pick a template:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {CAPTION_TEMPLATES.filter(c => c.platform === platform).slice(0, 4).map((c, i) => (
                  <button key={i} onClick={() => applyTemplate(c.text)}
                    style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 11, cursor: 'pointer', lineHeight: 1.3 }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{c.title}</span>
                    <span style={{ color: '#64748b' }}> — {c.text.slice(0, 50)}...</span>
                  </button>
                ))}
              </div>

              <textarea value={editorCaption} onChange={e => setEditorCaption(e.target.value)}
                placeholder="Write your caption here..."
                rows={4}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />

              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button onClick={() => copyToClipboard(editorCaption || ' ', 'caption')}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                  {copyFeedback === 'caption' ? 'Copied!' : 'Copy Caption'}
                </button>
                {/* ── V2: Cloud Save ── */}
                {previewUrl && (
                  <button onClick={saveToCloud}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
                    ☁️ Save to Cloud
                  </button>
                )}
              </div>

              {/* ── Hashtags ── */}
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Hashtags</h3>
              <div style={{ background: '#1e293b', borderRadius: 8, padding: 10, border: '1px solid #334155', marginBottom: 6 }}>
                <p style={{ fontSize: 12, color: '#60a5fa', lineHeight: 1.6, margin: 0 }}>{editorHashtags.join(' ')}</p>
              </div>
              <button onClick={() => setEditorHashtags(getRandomHashtags(platform))}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: 11, cursor: 'pointer', marginRight: 6, marginBottom: 12 }}>
                Shuffle
              </button>
              <button onClick={() => copyToClipboard(editorHashtags.join(' '), 'hashtags')}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: 11, cursor: 'pointer', marginBottom: 12 }}>
                {copyFeedback === 'hashtags' ? 'Copied!' : 'Copy Hashtags'}
              </button>

              {/* ── Local SEO Tips ── */}
              <details style={{ marginBottom: 8 }}>
                <summary style={{ fontSize: 12, color: '#f59e0b', cursor: 'pointer', padding: 8, borderRadius: 6, background: '#1e293b', border: '1px solid #334155' }}>
                  📍 Local SEO tips for {PLATFORM_CONFIG[platform].label}
                </summary>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {LOCAL_SEO_TIPS.filter(t => t.platform === platform).map((t, i) => (
                    <div key={i} style={{ background: '#1e293b', borderRadius: 6, padding: 8, border: '1px solid #334155' }}>
                      <p style={{ fontSize: 12, color: '#fde68a', margin: 0 }}>{t.tip}</p>
                    </div>
                  ))}
                </div>
              </details>

              {/* ── Growth Tips ── */}
              <details style={{ marginBottom: 16 }}>
                <summary style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer', padding: 8, borderRadius: 6, background: '#1e293b', border: '1px solid #334155' }}>
                  Growth tips for {PLATFORM_CONFIG[platform].label}
                </summary>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {GROWTH_TIPS.filter(t => t.platform === platform).map((t, i) => (
                    <div key={i} style={{ background: '#1e293b', borderRadius: 6, padding: 8, border: '1px solid #334155' }}>
                      <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>{t.tip}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      )}

      {/* ═══════════════════ DRAFTS ═══════════════════ */}
      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Saved drafts</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
                {cloudDrafts.length > 0 ? `☁️ ${cloudDrafts.length} cloud drafts` : ''}
                {cloudDrafts.length > 0 && drafts.length > 0 ? ' · ' : ''}
                {drafts.length > 0 ? `💾 ${drafts.length} local drafts` : ''}
              </p>
            </div>
            <button onClick={() => { loadDrafts(); loadCloudDrafts(); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
              Refresh
            </button>
          </div>

          {/* ── Cloud Drafts ── */}
          {cloudDrafts.length > 0 && (
            <>
              <h4 style={{ fontSize: 12, color: '#60a5fa', margin: '0 0 8px' }}>☁️ Cloud Drafts</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {cloudDrafts.map(draft => (
                  <div key={draft.id} style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155' }}>
                    {draft.gridDataUrl && (
                      <div style={{ width: '100%', aspectRatio: '1.5', maxHeight: 160, overflow: 'hidden', background: '#0f172a' }}>
                        <img src={draft.gridDataUrl} alt="Draft" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div style={{ padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span>{platformEmoji(draft.platform)}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>{draft.platform}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>{fmtDate(draft.createdAt)}</span>
                      </div>
                      {draft.caption && (
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 6px', lineHeight: 1.3, maxHeight: 32, overflow: 'hidden' }}>
                          {draft.caption.slice(0, 80)}{draft.caption.length > 80 ? '...' : ''}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => restoreCloudDraft(draft)}
                          style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => deleteCloudDraft(draft.id)}
                          style={{ flex: 0, padding: '6px 10px', borderRadius: 6, border: '1px solid #dc262644', background: 'transparent', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Local Drafts ── */}
          <h4 style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>💾 Local Drafts</h4>
          {draftsLoading && cloudDraftsLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Loading drafts...</p>
          ) : drafts.length === 0 && cloudDrafts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>📂</p>
              <p style={{ color: '#94a3b8' }}>No drafts yet</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>Generate a grid in the Create tab — it saves automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {drafts.map(draft => (
                <div key={draft.id} style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155' }}>
                  {draft.gridDataUrl && (
                    <div style={{ width: '100%', aspectRatio: '1.5', maxHeight: 200, overflow: 'hidden', background: '#0f172a' }}>
                      <img src={draft.gridDataUrl} alt="Draft" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
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
                        Download
                      </button>
                      <button onClick={() => shareDraft(draft)}
                        disabled={!draft.gridDataUrl}
                        style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                        Share
                      </button>
                      <button onClick={() => restoreDraft(draft)}
                        style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
                        Edit
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

      {/* ═══════════════════ SCHEDULE ═══════════════════ */}
      {activeTab === 'scheduled' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Scheduled posts</p>
            <button onClick={loadScheduledPosts} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
              Refresh
            </button>
          </div>

          {scheduleLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Loading...</p>
          ) : scheduledPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>📅</p>
              <p style={{ color: '#94a3b8' }}>No scheduled posts</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>Save a draft to cloud, then come back to schedule it.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scheduledPosts.map(post => (
                <div key={post.id} style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155' }}>
                  <div style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span>{platformEmoji(post.platform)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>{post.platform}</span>
                      {post.scheduledAt && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b' }}>
                          📅 {fmtDateShort(post.scheduledAt)}
                        </span>
                      )}
                    </div>
                    {post.caption && (
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px', lineHeight: 1.3 }}>{post.caption.slice(0, 100)}</p>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => scheduleDraft(post.id, scheduleDate)}
                        style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#22c55e', fontSize: 11, cursor: 'pointer' }}>
                        Reschedule
                      </button>
                      <button onClick={() => deleteCloudDraft(post.id)}
                        style={{ flex: 0, padding: '6px 10px', borderRadius: 6, border: '1px solid #dc262644', background: 'transparent', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Schedule picker ── */}
          <div style={{ marginTop: 16, background: '#1e293b', borderRadius: 8, padding: 12, border: '1px solid #334155' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Pick a date to schedule/reschedule posts:</p>
            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
              To schedule a new post: save to cloud in Create tab, then come here to set date.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════ ANALYTICS ═══════════════════ */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Content Performance</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['week', 'month', 'all'] as const).map(p => (
                <button key={p} onClick={() => { setAnalyticsPeriod(p); loadAnalytics(p); }}
                  style={{
                    padding: '4px 8px', borderRadius: 4, border: analyticsPeriod === p ? '1px solid #22c55e' : '1px solid #334155',
                    background: analyticsPeriod === p ? '#16653420' : 'transparent',
                    color: analyticsPeriod === p ? '#22c55e' : '#64748b', fontSize: 11, cursor: 'pointer',
                  }}>
                  {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Loading analytics...</p>
          ) : !analyticsData || analyticsData.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>📊</p>
              <p style={{ color: '#94a3b8' }}>No data yet</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>Analytics will show up after you publish posts and record engagement.</p>
            </div>
          ) : (
            <>
              {/* ── Summary cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Posts', value: analyticsData.total.posts, color: '#60a5fa' },
                  { label: 'Impressions', value: analyticsData.total.impressions, color: '#22c55e' },
                  { label: 'Likes', value: analyticsData.total.likes, color: '#f472b6' },
                  { label: 'Comments', value: analyticsData.total.comments, color: '#f59e0b' },
                  { label: 'Shares', value: analyticsData.total.shares, color: '#a78bfa' },
                  { label: 'Clicks', value: analyticsData.total.clicks, color: '#fb923c' },
                ].map(card => (
                  <div key={card.label} style={{ background: '#1e293b', borderRadius: 8, padding: 10, textAlign: 'center', border: '1px solid #334155' }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: card.color, margin: 0 }}>{fmtNum(card.value)}</p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>{card.label}</p>
                  </div>
                ))}
              </div>

              {/* ── By Platform ── */}
              <h4 style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>By Platform</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(analyticsData.byPlatform).map(([p, data]) => (
                  <div key={p} style={{ background: '#1e293b', borderRadius: 8, padding: 10, border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{platformEmoji(p)}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{p}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span>{data.posts} posts</span>
                      <span style={{ color: '#60a5fa' }}>{fmtNum(data.impressions)} impressions</span>
                      <span style={{ color: '#f472b6' }}>{fmtNum(data.likes)} likes</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Recent items ── */}
              <h4 style={{ fontSize: 12, color: '#94a3b8', margin: '12px 0 8px' }}>Recent Activity</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {analyticsData.items.slice(0, 10).map((item: any) => (
                  <div key={item.id} style={{ background: '#1e293b', borderRadius: 6, padding: 8, border: '1px solid #334155', fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#94a3b8' }}>{platformEmoji(item.platform)} {item.caption?.slice(0, 40) || 'No caption'}</span>
                      <span style={{ color: '#64748b' }}>{item.recordedAt ? fmtDateShort(item.recordedAt) : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, color: '#64748b' }}>
                      <span>👁 {item.impressionCount || 0}</span>
                      <span>❤️ {item.likeCount || 0}</span>
                      <span>💬 {item.commentCount || 0}</span>
                      <span>↗️ {item.shareCount || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

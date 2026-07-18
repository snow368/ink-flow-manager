import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';

const TATTOO_KEYWORDS = [
  'tattoo', 'tattooer', 'tattoo artist', 'ink', 'inked', 'flash', 'custom design',
  'blackwork', 'fineline', 'fine line', 'traditional tattoo', 'japanese tattoo',
  'cover up', 'sleeve', 'piercing', 'studio', 'body art',
  '纹身', '刺青', '纹身师', '刺青师', '纹身工作室', '手稿', '图腾',
  'タトゥー', '入れ墨', '타투', 'тату', 'tatuagem', 'tatuador', 'tatuaje', 'tatuador',
];

type Platform = 'instagram' | 'facebook' | 'tiktok';

function normalizeLink(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('@')) return value;
  return `https://${value}`;
}

function keywordHits(text: string) {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const kw of TATTOO_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) hits.push(kw);
  }
  return Array.from(new Set(hits));
}

function calcScore(input: {
  links: string[];
  shopName: string;
  bio: string;
  postCaptions: string;
}) {
  const profileText = `${input.shopName} ${input.bio}`;
  const profileHits = keywordHits(profileText);

  const lines = input.postCaptions
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  const tattooPostCount = lines.filter(line => keywordHits(line).length > 0).length;
  const postRatio = lines.length > 0 ? Math.round((tattooPostCount / lines.length) * 100) : 0;

  let score = 0;
  if (input.links.length >= 1) score += 25;
  if (profileHits.length >= 2) score += 30;
  else if (profileHits.length >= 1) score += 20;

  if (postRatio >= 70) score += 35;
  else if (postRatio >= 50) score += 25;
  else if (postRatio >= 30) score += 15;

  if (lines.length >= 6) score += 10;

  return {
    score: Math.min(100, score),
    profileHits,
    postRatio,
    sampledPosts: lines.length,
    tattooPostCount,
  };
}

export default function Verification() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId') || localStorage.getItem('inkflow_current_user') || '';
  const navigate = useNavigate();

  const [platform, setPlatform] = useState<Platform>('instagram');
  const [primaryLink, setPrimaryLink] = useState('');
  const [secondaryLink, setSecondaryLink] = useState('');
  const [shopName, setShopName] = useState('');
  const [bio, setBio] = useState('');
  const [postCaptions, setPostCaptions] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'passed' | 'pending' | 'failed' | ''>('');
  const [score, setScore] = useState(0);
  const lang = detectInitialLanguage();

  const metrics = useMemo(() => {
    const links = [normalizeLink(primaryLink), normalizeLink(secondaryLink)].filter(Boolean);
    return calcScore({ links, shopName, bio, postCaptions });
  }, [primaryLink, secondaryLink, shopName, bio, postCaptions]);

  const handleVerify = async () => {
    if (!userId) return;
    const links = [normalizeLink(primaryLink), normalizeLink(secondaryLink)].filter(Boolean);
    if (links.length === 0) return;

    setSubmitting(true);
    try {
      const finalScore = metrics.score;
      setScore(finalScore);
      const approved = finalScore >= 70;
      await db.users.update(userId, {
        verified: approved,
        verificationType: 'social',
        verificationStatus: approved ? 'approved' : 'pending',
        verificationScore: finalScore,
        socialLinks: links,
        studioName: shopName.trim() || undefined,
      });
      setResult(approved ? 'passed' : 'pending');
    } catch {
      setResult('failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (result === 'passed') {
    return (
      <div style={{ padding: 24, color: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: '16px 0' }}>Verification Approved</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>Score: {score}/100</p>
        <button onClick={() => navigate('/me')} style={primaryBtn}>Go to My Profile</button>
      </div>
    );
  }

  if (result === 'pending') {
    return (
      <div style={{ padding: 24, color: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: '16px 0' }}>Verification Pending Review</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>Score: {score || metrics.score}/100</p>
        <button onClick={() => navigate('/me')} style={ghostBtn}>Back to Profile</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: 'white', maxWidth: 820, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>{t(lang, 'verification')}</h2>
      <p style={{ color: '#94a3b8', marginBottom: 14 }}>We validate only two things: profile tattoo keywords and tattoo-focused recent posts.</p>

      <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} style={inputStyle}>
        <option value="instagram">Primary platform: Instagram</option>
        <option value="facebook">Primary platform: Facebook</option>
        <option value="tiktok">Primary platform: TikTok</option>
      </select>
      <input placeholder="Primary social link or @handle" value={primaryLink} onChange={e => setPrimaryLink(e.target.value)} style={inputStyle} />
      <input placeholder="Secondary social link (optional)" value={secondaryLink} onChange={e => setSecondaryLink(e.target.value)} style={inputStyle} />

      <input placeholder="Studio/brand name" value={shopName} onChange={e => setShopName(e.target.value)} style={inputStyle} />
      <textarea placeholder="Bio text from your profile" value={bio} onChange={e => setBio(e.target.value)} rows={3} style={textAreaStyle} />
      <textarea
        placeholder="Paste recent post captions (one post per line)"
        value={postCaptions}
        onChange={e => setPostCaptions(e.target.value)}
        rows={6}
        style={textAreaStyle}
      />

      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 10, marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Score preview</p>
        <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{metrics.score}/100</p>
        <p style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
          Tattoo keyword hits in profile: {metrics.profileHits.length} {metrics.profileHits.length > 0 ? `(${metrics.profileHits.slice(0, 6).join(', ')})` : ''}
        </p>
        <p style={{ fontSize: 12, color: '#cbd5e1' }}>
          Tattoo post ratio: {metrics.postRatio}% ({metrics.tattooPostCount}/{metrics.sampledPosts || 0} posts)
        </p>
      </div>

      <button onClick={handleVerify} disabled={submitting || !primaryLink.trim()} style={primaryBtn}>
        {submitting ? t(lang, 'verifying') : t(lang, 'submit_verification')}
      </button>
      <button onClick={() => navigate('/me')} style={ghostBtn}>{t(lang, 'back')}</button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: 15,
  marginBottom: 10,
  boxSizing: 'border-box',
};

const textAreaStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: 14,
  marginBottom: 10,
  boxSizing: 'border-box',
  resize: 'vertical',
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 'none',
  background: '#e11d48',
  color: 'white',
  fontSize: 16,
  fontWeight: 600,
};

const ghostBtn: React.CSSProperties = {
  width: '100%',
  marginTop: 12,
  padding: 14,
  borderRadius: 12,
  border: '1px solid #334155',
  background: 'transparent',
  color: '#94a3b8',
};


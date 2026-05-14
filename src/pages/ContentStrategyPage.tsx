import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';
import {
  runGapAnalysis,
  generateContent,
  buildAIPrompt,
  STRATEGIES,
  type GapItem,
  type ContentPiece,
  type StrategyKey,
} from '../lib/contentStrategy';

const OUR_NAME = 'InkFlow Manager';

export default function ContentStrategyPage() {
  const navigate = useNavigate();
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<StrategyKey>('problem_first');
  const [content, setContent] = useState<ContentPiece | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [editingCta, setEditingCta] = useState('');
  const [editingHashtags, setEditingHashtags] = useState('');
  const [copied, setCopied] = useState('');
  const [showGaps, setShowGaps] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    runGapAnalysis(OUR_NAME).then(setGaps);
  }, []);

  useEffect(() => {
    generateContent(activeStrategy, OUR_NAME).then(c => {
      setContent(c);
      setEditingTitle(c.title);
      setEditingBody(c.body);
      setEditingCta(c.cta);
      setEditingHashtags(c.hashtags);
    });
  }, [activeStrategy]);

  const strategyDef = useMemo(() => STRATEGIES.find(s => s.key === activeStrategy), [activeStrategy]);

  const handleRegenerate = () => {
    generateContent(activeStrategy, OUR_NAME).then(c => {
      setContent(c);
      setEditingTitle(c.title);
      setEditingBody(c.body);
      setEditingCta(c.cta);
      setEditingHashtags(c.hashtags);
    });
  };

  const handleCopyContent = async () => {
    const text = `${editingTitle}\n\n${editingBody}\n\n${editingCta}\n\n${editingHashtags}`;
    await navigator.clipboard.writeText(text);
    setCopied('content');
    setTimeout(() => setCopied(''), 1800);
  };

  const handleBuildPrompt = async () => {
    const prompt = await buildAIPrompt(activeStrategy, OUR_NAME);
    setAiPrompt(prompt);
    setShowPrompt(true);
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(aiPrompt);
    setCopied('prompt');
    setTimeout(() => setCopied(''), 1800);
  };

  return (
    <div style={{ minHeight: '100dvh', background: `radial-gradient(1200px 600px at 10% -20%, #7e22ce 0%, ${THEME.bg.app} 45%)`, color: THEME.text.primary, padding: 24, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2, margin: 0 }}>Content Strategy Engine</h2>
          <p style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>竞品缺口分析 + SaaS营销策略 + 内容生成</p>
        </div>
        <button onClick={() => navigate('/me')} style={{ border: `1px solid ${THEME.border.default}`, background: 'transparent', color: THEME.text.muted, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>Back</button>
      </div>

      {/* Gap Analysis */}
      <div style={{ background: 'rgba(30,41,59,0.85)', border: `1px solid ${THEME.border.default}`, borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
        <button
          onClick={() => setShowGaps(!showGaps)}
          style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: THEME.text.primary, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>Market Gap Analysis ({gaps.length} opportunities)</span>
          <span style={{ fontSize: 11, color: THEME.text.muted }}>{showGaps ? 'Hide' : 'Show'}</span>
        </button>
        {showGaps && (
          <div style={{ padding: '0 16px 12px' }}>
            {gaps.length === 0 ? (
              <p style={{ fontSize: 12, color: THEME.text.subtle }}>No competitor data yet. Add competitors to see gap analysis.</p>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {gaps.slice(0, 8).map(g => (
                  <div key={g.feature} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{g.feature}</span>
                      <span style={{ fontSize: 11, color: THEME.text.muted, marginLeft: 8 }}>{g.missingBy.slice(0, 3).join(', ')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#f87171' }}>{g.missingCount} missing</span>
                      <span style={{ fontSize: 11, color: '#fbbf24' }}>{g.basicCount} basic</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: g.opportunityScore >= 60 ? '#4ade80' : '#fbbf24' }}>{g.opportunityScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strategy Selector */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: THEME.text.muted, marginBottom: 8 }}>Select Strategy Framework</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
          {STRATEGIES.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveStrategy(s.key)}
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                border: activeStrategy === s.key ? `1px solid #a855f7` : `1px solid ${THEME.border.default}`,
                background: activeStrategy === s.key ? '#7e22ce22' : THEME.bg.panelAlt,
                color: activeStrategy === s.key ? THEME.text.primary : THEME.text.muted,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: THEME.text.subtle, marginTop: 2, lineHeight: 1.3 }}>{s.whenToUse}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Info */}
      {strategyDef && (
        <div style={{ background: 'rgba(126,34,206,0.15)', border: '1px solid #7e22ce44', borderRadius: 10, padding: 10, marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{strategyDef.icon} {strategyDef.name} — {strategyDef.desc}</p>
          <p style={{ fontSize: 11, color: '#c4b5fd' }}>SaaS参考: {strategyDef.saasPattern}</p>
        </div>
      )}

      {/* Content Card */}
      {content && (
        <div style={{ background: 'rgba(30,41,59,0.9)', border: `1px solid ${THEME.border.default}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#7e22ce33', color: '#c4b5fd' }}>{content.type}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleRegenerate} style={miniBtn}>Regen</button>
              <button onClick={handleCopyContent} style={{ ...miniBtn, background: copied === 'content' ? '#22c55e' : THEME.bg.panelAlt }}>
                {copied === 'content' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <input
            value={editingTitle}
            onChange={e => setEditingTitle(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: THEME.text.primary, fontSize: 17, fontWeight: 800, marginBottom: 10, outline: 'none', padding: 0 }}
          />

          <textarea
            value={editingBody}
            onChange={e => setEditingBody(e.target.value)}
            rows={12}
            style={{ width: '100%', background: THEME.bg.panelAlt, border: `1px solid ${THEME.border.default}`, borderRadius: 10, color: THEME.text.primary, fontSize: 13, padding: 12, resize: 'vertical', marginBottom: 10, lineHeight: 1.6, boxSizing: 'border-box' }}
          />

          <input
            value={editingCta}
            onChange={e => setEditingCta(e.target.value)}
            style={{ width: '100%', background: THEME.bg.panelAlt, border: `1px solid ${THEME.border.default}`, borderRadius: 8, color: '#fbbf24', fontSize: 13, fontWeight: 600, padding: '8px 12px', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
          />

          <input
            value={editingHashtags}
            onChange={e => setEditingHashtags(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: THEME.text.muted, fontSize: 11, outline: 'none', padding: 0, boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* AI Prompt */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={handleBuildPrompt}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #7e22ce80', background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)', color: '#c4b5fd', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>Build AI Prompt (for Claude / GPT)</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{showPrompt ? 'Hide' : 'Show'}</span>
        </button>

        {showPrompt && aiPrompt && (
          <div style={{ marginTop: 8, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: THEME.text.muted }}>Copy this prompt into Claude or ChatGPT</span>
              <button onClick={handleCopyPrompt} style={{ ...miniBtn, background: copied === 'prompt' ? '#22c55e' : THEME.bg.panelAlt }}>
                {copied === 'prompt' ? 'Copied' : 'Copy Prompt'}
              </button>
            </div>
            <pre style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 200, overflowY: 'auto', margin: 0 }}>{aiPrompt}</pre>
          </div>
        )}
      </div>

      {/* Note */}
      <p style={{ fontSize: 11, color: THEME.text.subtle, textAlign: 'center' }}>
        Dev-only. Content is generated from competitor gap analysis data. Edit before posting.
      </p>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: 6,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#e2e8f0',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type CompetitorRecord, type CompetitorFeature } from '../db';
import { SEED_COMPETITORS } from '../lib/competitorData';

const CATEGORY_LABELS: Record<string, string> = {
  studio_mgmt: '工作室管理', booking: '预约平台', pos: '收银POS',
  marketing: '营销获客', crm: '客户管理', other: '其他',
};

const RATING_OPTIONS: { value: CompetitorFeature['rating']; label: string }[] = [
  { value: 'best', label: '领先' },
  { value: 'good', label: '不错' },
  { value: 'basic', label: '基础' },
  { value: 'missing', label: '缺失' },
];

const emptyCompetitor = (): CompetitorRecord => ({
  id: '', name: '', website: '', category: 'other', description: '',
  features: [], status: 'active', lastCheckedAt: Date.now(),
  nextCheckAt: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: Date.now(),
});

export default function CompetitorsAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [competitors, setCompetitors] = useState<CompetitorRecord[]>([]);
  const [editingComp, setEditingComp] = useState<CompetitorRecord | null>(null);
  const [showAddComp, setShowAddComp] = useState(false);
  const [formName, setFormName] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formCategory, setFormCategory] = useState<string>('other');
  const [formDesc, setFormDesc] = useState('');
  const [formPricing, setFormPricing] = useState('');
  const [formStrengths, setFormStrengths] = useState('');
  const [formWeaknesses, setFormWeaknesses] = useState('');
  const [formStatus, setFormStatus] = useState<CompetitorRecord['status']>('active');
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [featureTargetCompId, setFeatureTargetCompId] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [featureNotes, setFeatureNotes] = useState('');
  const [featureRating, setFeatureRating] = useState<CompetitorFeature['rating']>('basic');
  const [editFeatureIdx, setEditFeatureIdx] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u || !u.roles?.includes('dev')) { navigate('/me'); return; }
      setUser(u);
      loadAll();
    });
  }, []);

  const loadAll = () => db.competitors.toArray().then(arr => { arr.sort((a, b) => b.createdAt - a.createdAt); setCompetitors(arr); });

  const openAdd = () => {
    setEditingComp(null);
    setFormName(''); setFormWebsite(''); setFormCategory('other'); setFormDesc('');
    setFormPricing(''); setFormStrengths(''); setFormWeaknesses(''); setFormStatus('active');
    setShowAddComp(true);
  };

  const openEdit = (comp: CompetitorRecord) => {
    setEditingComp(comp);
    setFormName(comp.name); setFormWebsite(comp.website); setFormCategory(comp.category);
    setFormDesc(comp.description); setFormPricing(comp.pricing || '');
    setFormStrengths(comp.strengths || ''); setFormWeaknesses(comp.weaknesses || '');
    setFormStatus(comp.status);
    setShowAddComp(true);
  };

  const handleSaveComp = async () => {
    if (!formName.trim()) return;
    const base = {
      name: formName.trim(), website: formWebsite.trim(), category: formCategory as CompetitorRecord['category'],
      description: formDesc.trim(), pricing: formPricing.trim() || undefined,
      strengths: formStrengths.trim() || undefined, weaknesses: formWeaknesses.trim() || undefined,
      status: formStatus,
    };
    if (editingComp) {
      await db.competitors.update(editingComp.id, base);
    } else {
      const id = 'comp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      await db.competitors.add({ ...emptyCompetitor(), ...base, id, createdAt: Date.now() });
    }
    setShowAddComp(false);
    loadAll();
  };

  const handleDeleteComp = async (id: string) => {
    if (!confirm('删除此竞争对手及所有功能分析数据？')) return;
    await db.competitors.delete(id);
    loadAll();
  };

  const openFeatureModal = (compId: string, editIdx?: number) => {
    setFeatureTargetCompId(compId);
    if (editIdx !== undefined) {
      const comp = competitors.find(c => c.id === compId);
      const f = comp?.features[editIdx];
      if (f) {
        setFeatureName(f.name); setFeatureNotes(f.notes); setFeatureRating(f.rating);
        setEditFeatureIdx(editIdx);
      }
    } else {
      setFeatureName(''); setFeatureNotes(''); setFeatureRating('basic'); setEditFeatureIdx(null);
    }
    setShowFeatureModal(true);
  };

  const handleSaveFeature = async () => {
    if (!featureName.trim()) return;
    const comp = competitors.find(c => c.id === featureTargetCompId);
    if (!comp) return;
    const features = [...comp.features];
    const newFeat: CompetitorFeature = { name: featureName.trim(), notes: featureNotes.trim(), rating: featureRating };
    if (editFeatureIdx !== null) {
      features[editFeatureIdx] = newFeat;
    } else {
      features.push(newFeat);
    }
    await db.competitors.update(featureTargetCompId, { features });
    setShowFeatureModal(false);
    loadAll();
  };

  const handleDeleteFeature = async (compId: string, idx: number) => {
    if (!confirm('删除此功能分析？')) return;
    const comp = competitors.find(c => c.id === compId);
    if (!comp) return;
    const features = comp.features.filter((_, i) => i !== idx);
    await db.competitors.update(compId, { features });
    loadAll();
  };

  const handleResetSeed = async () => {
    if (!confirm('将清除所有竞品数据并重置为种子数据？')) return;
    await db.competitors.clear();
    await db.competitors.bulkAdd(SEED_COMPETITORS);
    loadAll();
  };

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 100 }}>
      <button onClick={() => navigate('/competitors')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
        ← Back to Competitors
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>管理竞争对手</h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>仅限开发者 · Dev Only</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={openAdd} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#0f766e', color: 'white', fontSize: 14, fontWeight: 600 }}>
          + 添加竞争对手
        </button>
        <button onClick={handleResetSeed} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #f59e0b44', background: '#7f1d1d', color: '#fca5a5', fontSize: 12 }}>
          重置种子数据
        </button>
      </div>

      {/* Competitor list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {competitors.map(comp => (
          <div key={comp.id} style={{ background: '#1e293b', borderRadius: 12, padding: 12, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{comp.name}</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: catBg(comp.category), color: catColor(comp.category) }}>
                    {CATEGORY_LABELS[comp.category] || comp.category}
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>{comp.features.length} 项分析</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{comp.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                <button onClick={() => openEdit(comp)} style={smBtn}>编辑</button>
                <button onClick={() => handleDeleteComp(comp.id)} style={{ ...smBtn, color: '#f87171' }}>X</button>
              </div>
            </div>

            {/* Features list */}
            {comp.features.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {comp.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderRadius: 6, padding: '6px 10px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{f.name}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{f.notes}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: ratingColor(f.rating) + '22', color: ratingColor(f.rating) }}>{ratingLabel(f.rating)}</span>
                      <button onClick={() => openFeatureModal(comp.id, i)} style={{ ...smBtn, fontSize: 10 }}>✎</button>
                      <button onClick={() => handleDeleteFeature(comp.id, i)} style={{ ...smBtn, color: '#f87171', fontSize: 10 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => openFeatureModal(comp.id)}
              style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, border: '1px dashed #334155', background: 'transparent', color: '#5eead4', fontSize: 11, cursor: 'pointer' }}>
              + 添加功能分析
            </button>
          </div>
        ))}
      </div>

      {/* Add/Edit Competitor Modal */}
      {showAddComp && (
        <div onClick={() => setShowAddComp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>{editingComp ? '编辑竞争对手' : '添加竞争对手'}</h3>

            <input placeholder="名称" value={formName} onChange={e => setFormName(e.target.value)} style={inputS} />
            <input placeholder="网站 URL" value={formWebsite} onChange={e => setFormWebsite(e.target.value)} style={inputS} />
            <select value={formCategory} onChange={e => setFormCategory(e.target.value)} style={inputS}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <textarea placeholder="一句话描述" value={formDesc} onChange={e => setFormDesc(e.target.value)} style={{ ...inputS, minHeight: 50 }} />
            <input placeholder="定价" value={formPricing} onChange={e => setFormPricing(e.target.value)} style={inputS} />
            <textarea placeholder="优势" value={formStrengths} onChange={e => setFormStrengths(e.target.value)} style={{ ...inputS, minHeight: 50 }} />
            <textarea placeholder="弱点" value={formWeaknesses} onChange={e => setFormWeaknesses(e.target.value)} style={{ ...inputS, minHeight: 50 }} />
            <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} style={inputS}>
              <option value="active">活跃</option>
              <option value="tracking">跟踪中</option>
              <option value="archived">已归档</option>
            </select>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={handleSaveComp} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#0f766e', color: 'white', fontSize: 14, fontWeight: 600 }}>保存</button>
              <button onClick={() => setShowAddComp(false)} style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Feature Modal */}
      {showFeatureModal && (
        <div onClick={() => setShowFeatureModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 500 }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>{editFeatureIdx !== null ? '编辑功能分析' : '添加功能分析'}</h3>

            <input placeholder="功能名称" value={featureName} onChange={e => setFeatureName(e.target.value)} style={inputS} />
            <textarea placeholder="分析备注" value={featureNotes} onChange={e => setFeatureNotes(e.target.value)} style={{ ...inputS, minHeight: 60 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {RATING_OPTIONS.map(r => (
                <button key={r.value} onClick={() => setFeatureRating(r.value)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: featureRating === r.value ? `1px solid ${ratingColor(r.value)}` : '1px solid #334155', background: featureRating === r.value ? ratingColor(r.value) + '22' : 'transparent', color: featureRating === r.value ? ratingColor(r.value) : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                  {r.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveFeature} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#0f766e', color: 'white', fontSize: 14, fontWeight: 600 }}>保存</button>
              <button onClick={() => setShowFeatureModal(false)} style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function catBg(cat: string): string { return catColor(cat) + '22'; }

function catColor(cat: string): string {
  const map: Record<string, string> = { studio_mgmt: '#a855f7', booking: '#3b82f6', pos: '#f97316', marketing: '#22c55e', crm: '#eab308', other: '#64748b' };
  return map[cat] || '#64748b';
}

function ratingLabel(r: string): string {
  const map: Record<string, string> = { best: '领先', good: '不错', basic: '基础', missing: '缺失' };
  return map[r] || r;
}

function ratingColor(r: string): string {
  const map: Record<string, string> = { best: '#4ade80', good: '#60a5fa', basic: '#fbbf24', missing: '#f87171' };
  return map[r] || '#94a3b8';
}

const inputS: React.CSSProperties = { width: '100%', padding: '10px 14px', marginBottom: 8, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const smBtn: React.CSSProperties = { padding: '3px 8px', borderRadius: 4, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 11, cursor: 'pointer' };

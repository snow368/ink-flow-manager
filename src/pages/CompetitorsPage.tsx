import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type CompetitorRecord } from '../db';
import { seedCompetitorsIfEmpty, recordMarketCheck } from '../lib/competitorData';

const CATEGORY_LABELS: Record<string, string> = {
  studio_mgmt: '工作室管理',
  booking: '预约平台',
  pos: '收银POS',
  marketing: '营销获客',
  crm: '客户管理',
  other: '其他',
};

const RATING_MAP: Record<string, { label: string; color: string }> = {
  best: { label: '领先', color: '#4ade80' },
  good: { label: '不错', color: '#60a5fa' },
  basic: { label: '基础', color: '#fbbf24' },
  missing: { label: '缺失', color: '#f87171' },
};

export default function CompetitorsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [competitors, setCompetitors] = useState<CompetitorRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'due'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u || !u.roles?.includes('dev')) { navigate('/me'); return; }
      setUser(u);
      loadData();
    });
  }, []);

  const loadData = async () => {
    await seedCompetitorsIfEmpty();
    const all = await db.competitors.toArray();
    all.sort((a, b) => b.createdAt - a.createdAt);
    setCompetitors(all);
  };

  const handleCheckNow = () => {
    recordMarketCheck();
    loadData();
  };

  const now = Date.now();
  const categories = ['all', ...new Set(competitors.map(c => c.category))];

  let filtered = activeTab === 'due'
    ? competitors.filter(c => c.nextCheckAt <= now && c.status !== 'archived')
    : competitors;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(c => c.category === activeCategory);
  }

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 100 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
        ← Back to Settings
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>竞争市场监控</h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Tattoo Studio SaaS Competitor Intelligence</p>
        </div>
        <button onClick={() => navigate('/competitors/admin')}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #14b8a680', background: '#0f766e', color: '#5eead4', fontSize: 12, fontWeight: 600 }}>
          Manage
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: '#1e293b', borderRadius: 10, padding: 2, marginBottom: 14 }}>
        <button onClick={() => setActiveTab('all')}
          style={{ flex: 1, border: 'none', background: activeTab === 'all' ? '#0f766e' : 'transparent', color: 'white', borderRadius: 8, padding: '8px 0', fontSize: 13, cursor: 'pointer' }}>
          全部 ({competitors.length})
        </button>
        <button onClick={() => setActiveTab('due')}
          style={{ flex: 1, border: 'none', background: activeTab === 'due' ? '#f59e0b' : 'transparent', color: 'white', borderRadius: 8, padding: '8px 0', fontSize: 13, cursor: 'pointer' }}>
          待检查 ({competitors.filter(c => c.nextCheckAt <= now && c.status !== 'archived').length})
        </button>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14, whiteSpace: 'nowrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{
              padding: '5px 12px', borderRadius: 20, border: activeCategory === cat ? '1px solid #5eead4' : '1px solid #334155',
              background: activeCategory === cat ? '#0f766e33' : 'transparent', color: activeCategory === cat ? '#5eead4' : '#94a3b8',
              fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            {cat === 'all' ? '全部' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Market check button */}
      <button onClick={handleCheckNow}
        style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #0d9488', background: '#0f766e22', color: '#5eead4', fontSize: 13, marginBottom: 14, cursor: 'pointer' }}>
        标记本次市场检查完成
      </button>

      {/* Competitor list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(comp => {
          const isExpanded = expandedId === comp.id;
          const daysSinceCheck = Math.floor((now - comp.lastCheckedAt) / (24 * 60 * 60 * 1000));
          const isOverdue = comp.nextCheckAt <= now;

          return (
            <div key={comp.id}
              style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: isOverdue ? '1px solid #f59e0b44' : '1px solid #334155' }}>
              {/* Card header */}
              <div onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                style={{ padding: 14, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{comp.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: catColor(comp.category) + '22', color: catColor(comp.category) }}>
                      {CATEGORY_LABELS[comp.category] || comp.category}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: comp.status === 'active' ? '#22c55e22' : comp.status === 'tracking' ? '#fbbf2422' : '#64748b22', color: comp.status === 'active' ? '#4ade80' : comp.status === 'tracking' ? '#fbbf24' : '#64748b' }}>
                      {comp.status === 'active' ? '活跃' : comp.status === 'tracking' ? '跟踪中' : '已归档'}
                    </span>
                    {isOverdue && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#7f1d1d', color: '#fca5a5' }}>待检查</span>}
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>{comp.description}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{comp.pricing || '价格未公开'}</span>
                    <span style={{ fontSize: 11, color: isOverdue ? '#fbbf24' : '#64748b' }}>
                      {daysSinceCheck}天前检查
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 18, color: '#64748b', marginLeft: 8 }}>{isExpanded ? '▾' : '▸'}</span>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #334155' }}>
                  <a href={comp.website} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginTop: 12, padding: '6px 14px', borderRadius: 8, background: '#0f766e', color: '#5eead4', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                    Visit Website →
                  </a>

                  {/* Features */}
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>功能分析</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {comp.features.map((f, i) => {
                        const r = RATING_MAP[f.rating] || RATING_MAP.basic;
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#0f172a', borderRadius: 8, padding: '8px 10px' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</p>
                              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.notes}</p>
                            </div>
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: r.color + '22', color: r.color, fontWeight: 600, marginLeft: 8, whiteSpace: 'nowrap' }}>
                              {r.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  {comp.strengths && (
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#14532d33', border: '1px solid #22c55e22' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>优势</p>
                      <p style={{ fontSize: 12, color: '#86efac' }}>{comp.strengths}</p>
                    </div>
                  )}
                  {comp.weaknesses && (
                    <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: '#7f1d1d33', border: '1px solid #ef444422' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>弱点</p>
                      <p style={{ fontSize: 12, color: '#fca5a5' }}>{comp.weaknesses}</p>
                    </div>
                  )}

                  {/* Quick update check time */}
                  <button onClick={async () => {
                    const next = Date.now() + 30 * 24 * 60 * 60 * 1000;
                    await db.competitors.update(comp.id, { lastCheckedAt: Date.now(), nextCheckAt: next });
                    loadData();
                  }}
                    style={{ marginTop: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#5eead4', fontSize: 11, cursor: 'pointer' }}>
                    更新检查时间
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 40 }}>没有匹配的竞品数据</p>
      )}
    </div>
  );
}

function catColor(cat: string): string {
  const map: Record<string, string> = {
    studio_mgmt: '#a855f7', booking: '#3b82f6', pos: '#f97316',
    marketing: '#22c55e', crm: '#eab308', other: '#64748b',
  };
  return map[cat] || '#64748b';
}

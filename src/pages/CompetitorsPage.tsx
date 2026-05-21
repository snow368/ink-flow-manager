import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type CompetitorRecord, type UserRecord } from '../db';
import { seedCompetitorsIfEmpty, recordMarketCheck, getDaysSinceLastMarketCheck } from '../lib/competitorData';
import { detectInitialLanguage, t } from '../lib/i18n';
import { trackAffiliateClick } from '../lib/affiliateTracking';

const CATEGORY_LABELS: Record<string, string> = {
  studio_mgmt: 'competitor_category_studio_mgmt',
  booking: 'competitor_category_booking',
  pos: 'competitor_category_pos',
  marketing: 'competitor_category_marketing',
  crm: 'competitor_category_crm',
  other: 'competitor_category_other',
};

const RATING_MAP: Record<string, { label: string; color: string }> = {
  best: { label: 'competitor_rating_best', color: '#4ade80' },
  good: { label: 'competitor_rating_good', color: '#60a5fa' },
  basic: { label: 'competitor_rating_basic', color: '#fbbf24' },
  missing: { label: 'competitor_rating_missing', color: '#f87171' },
};

const STATUS_LABELS: Record<string, string> = {
  active: 'competitor_status_active',
  tracking: 'competitor_status_tracking',
  archived: 'competitor_status_archived',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  tracking: '#fbbf24',
  archived: '#64748b',
};

export default function CompetitorsPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'due'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [marketDays, setMarketDays] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/me'); return; }
      setUser(u);
      loadData();
      setMarketDays(getDaysSinceLastMarketCheck());
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
    setMarketDays(0);
    loadData();
  };

  const now = Date.now();
  const q = search.trim().toLowerCase();
  const categories = ['all', ...new Set(competitors.map(c => c.category))];

  const dueCount = competitors.filter(c => c.nextCheckAt <= now && c.status !== 'archived').length;

  let filtered = activeTab === 'due'
    ? competitors.filter(c => c.nextCheckAt <= now && c.status !== 'archived')
    : competitors;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(c => c.category === activeCategory);
  }

  if (q) {
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }

  if (!user) return <div style={{ padding: 24, color: 'white', background: '#0f172a', minHeight: '100dvh' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24, paddingBottom: 100 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, marginBottom: 16, cursor: 'pointer' }}>
        ← Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t(lang, 'competitor_title')}</h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{t(lang, 'competitor_subtitle')}</p>
        </div>
        <button onClick={() => navigate('/competitors/admin')}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #14b8a680', background: '#0f766e', color: '#5eead4', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {t(lang, 'manage')}
        </button>
      </div>

      {/* Market check reminder */}
      {marketDays > 30 && (
        <div style={{ marginBottom: 14, padding: 10, borderRadius: 10, background: '#f59e0b15', border: '1px solid #f59e0b33', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#fbbf24' }}>{t(lang, 'market_check_banner').replace('{n}', String(marketDays))}</span>
          <button onClick={() => navigate('/competitors')}
            style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#f59e0b33', color: '#fbbf24', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            {t(lang, 'market_check_view')}
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: '#1e293b', borderRadius: 10, padding: 2, marginBottom: 12 }}>
        <button onClick={() => setActiveTab('all')}
          style={{ flex: 1, border: 'none', background: activeTab === 'all' ? '#0f766e' : 'transparent', color: 'white', borderRadius: 8, padding: '8px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
          {t(lang, 'competitor_all').replace('{n}', String(competitors.length))}
        </button>
        <button onClick={() => setActiveTab('due')}
          style={{ flex: 1, border: 'none', background: activeTab === 'due' ? '#f59e0b' : 'transparent', color: 'white', borderRadius: 8, padding: '8px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
          {t(lang, 'competitor_due').replace('{n}', String(dueCount))}
        </button>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 10, whiteSpace: 'nowrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => { setActiveCategory(cat); setExpandedId(null); }}
            style={{
              padding: '5px 12px', borderRadius: 20, border: activeCategory === cat ? '1px solid #5eead4' : '1px solid #334155',
              background: activeCategory === cat ? '#0f766e33' : 'transparent', color: activeCategory === cat ? '#5eead4' : '#94a3b8',
              fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            {cat === 'all' ? t(lang, 'all') : t(lang, CATEGORY_LABELS[cat] || cat)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search competitors..."
          value={search}
          onChange={e => { setSearch(e.target.value); setExpandedId(null); }}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 10,
            border: '1px solid #334155', background: '#1e293b', color: 'white',
            fontSize: 13, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Market check button */}
      <button onClick={handleCheckNow}
        style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #0d9488', background: '#0f766e22', color: '#5eead4', fontSize: 13, marginBottom: 14, cursor: 'pointer' }}>
        {t(lang, 'competitor_mark_check_done')}
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
              <div onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                style={{ padding: 14, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{comp.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: catColor(comp.category) + '22', color: catColor(comp.category) }}>
                      {t(lang, CATEGORY_LABELS[comp.category] || comp.category)}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: STATUS_COLORS[comp.status] + '22', color: STATUS_COLORS[comp.status] }}>
                      {t(lang, STATUS_LABELS[comp.status] || comp.status)}
                    </span>
                    {isOverdue && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#7f1d1d', color: '#fca5a5' }}>{t(lang, 'competitor_due_label')}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.description}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{comp.pricing || t(lang, 'competitor_pricing_unlisted')}</span>
                    <span style={{ fontSize: 11, color: isOverdue ? '#fbbf24' : '#64748b' }}>
                      {t(lang, 'days_suffix').replace('{n}', String(daysSinceCheck))}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 18, color: '#64748b', marginLeft: 8 }}>{isExpanded ? '▾' : '▸'}</span>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #334155' }}>
                  <a href={comp.website} target="_blank" rel="noopener noreferrer"
                    onClick={() => trackAffiliateClick({ brandId: comp.id, brandName: comp.name, affiliateLink: comp.website, sourcePage: 'competitors' })}
                    style={{ display: 'inline-block', marginTop: 12, padding: '6px 14px', borderRadius: 8, background: '#0f766e', color: '#5eead4', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                    {t(lang, 'competitor_visit')}
                  </a>

                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>{t(lang, 'competitor_feature_analysis')}</p>
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
                              {t(lang, r.label)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {comp.strengths && (
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#14532d33', border: '1px solid #22c55e22' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>{t(lang, 'competitor_strengths')}</p>
                      <p style={{ fontSize: 12, color: '#86efac' }}>{comp.strengths}</p>
                    </div>
                  )}
                  {comp.weaknesses && (
                    <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: '#7f1d1d33', border: '1px solid #ef444422' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>{t(lang, 'competitor_weaknesses')}</p>
                      <p style={{ fontSize: 12, color: '#fca5a5' }}>{comp.weaknesses}</p>
                    </div>
                  )}

                  <button onClick={async () => {
                    const next = Date.now() + 30 * 24 * 60 * 60 * 1000;
                    await db.competitors.update(comp.id, { lastCheckedAt: Date.now(), nextCheckAt: next });
                    loadData();
                  }}
                    style={{ marginTop: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#5eead4', fontSize: 11, cursor: 'pointer' }}>
                    {t(lang, 'competitor_update_check')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 40 }}>{t(lang, 'competitor_no_match')}</p>
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

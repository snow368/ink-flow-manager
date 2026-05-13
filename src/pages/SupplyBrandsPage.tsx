import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type SupplyBrandRecord, type SupplyProduct } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';

type CategoryKey = 'all' | SupplyBrandRecord['category'];
type TabKey = 'brands' | 'new';

const CATEGORIES: { key: CategoryKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'ink', labelKey: 'ink' },
  { key: 'needles', labelKey: 'needles' },
  { key: 'machines', labelKey: 'machines' },
  { key: 'aftercare', labelKey: 'aftercare' },
  { key: 'other', labelKey: 'other' },
];

const TABS: { key: TabKey; labelKey: string; descKey: string }[] = [
  { key: 'brands', labelKey: 'brands_tab', descKey: 'supply_brands_desc' },
  { key: 'new', labelKey: 'new_products', descKey: 'new_products_desc' },
];

const NOW = Date.now();
const DAY = 86400000;

const SEED_BRANDS: SupplyBrandRecord[] = [
  {
    id: 'brand_eternal_ink',
    name: 'Eternal Ink',
    category: 'ink',
    description: 'Industry-standard tattoo ink trusted by artists worldwide. Vibrant, long-lasting colors with full safety compliance.',
    logoUrl: '',
    affiliateLink: 'https://eternaltattooink.com',
    commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_ei_1', name: 'Eternal Ink Black Liner 8oz', imageUrl: '', price: '$29.99', affiliateLink: 'https://eternaltattooink.com/black-liner', note: 'Best seller' },
      { id: 'prod_ei_2', name: 'Eternal Ink Color Set (12x1oz)', imageUrl: '', price: '$89.99', affiliateLink: 'https://eternaltattooink.com/color-set', note: 'New color range', isNew: true, createdAt: NOW - 5 * DAY },
      { id: 'prod_ei_3', name: 'Eternal Ink White Highlight 4oz', imageUrl: '', price: '$18.99', affiliateLink: 'https://eternaltattooink.com/white', note: 'High opacity' },
    ],
    sortOrder: 1,
    active: true,
    featured: true,
    createdAt: NOW,
  },
  {
    id: 'brand_cheyenne',
    name: 'Cheyenne',
    category: 'machines',
    description: 'Premium German-engineered tattoo machines. Precision, reliability, and ergonomic design for professional artists.',
    logoUrl: '',
    affiliateLink: 'https://cheyennetattoo.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ch_1', name: 'Cheyenne SOL Nova Unlimited', imageUrl: '', price: '$799.00', affiliateLink: 'https://cheyennetattoo.com/sol-nova', note: 'Just launched', isNew: true, createdAt: NOW - 1 * DAY },
      { id: 'prod_ch_2', name: 'Cheyenne HAWK Pen', imageUrl: '', price: '$549.00', affiliateLink: 'https://cheyennetattoo.com/hawk-pen', note: 'Versatile workhorse' },
      { id: 'prod_ch_3', name: 'Cheyenne Cartridge Grip', imageUrl: '', price: '$89.00', affiliateLink: 'https://cheyennetattoo.com/grip', note: 'Ergonomic' },
    ],
    sortOrder: 2,
    active: true,
    featured: true,
    createdAt: NOW,
  },
  {
    id: 'brand_kwadron',
    name: 'Kwadron',
    category: 'needles',
    description: 'Premium cartridge needles with precision-machined tips. Consistent performance for lining and shading.',
    logoUrl: '',
    affiliateLink: 'https://kwadron.com',
    commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_kw_1', name: 'Kwadron Cartridge Liners (Box 50)', imageUrl: '', price: '$39.99', affiliateLink: 'https://kwadron.com/liners', note: '7RL to 14RL' },
      { id: 'prod_kw_2', name: 'Kwadron Cartridge Mags (Box 50)', imageUrl: '', price: '$42.99', affiliateLink: 'https://kwadron.com/mags', note: 'New gauge option', isNew: true, createdAt: NOW - 3 * DAY },
      { id: 'prod_kw_3', name: 'Kwadron Round Shader Set', imageUrl: '', price: '$36.99', affiliateLink: 'https://kwadron.com/round-shader', note: 'Soft shading' },
    ],
    sortOrder: 3,
    active: true,
    createdAt: NOW,
  },
  {
    id: 'brand_hustle_butter',
    name: 'Hustle Butter',
    category: 'aftercare',
    description: 'The go-to tattoo aftercare brand. Vegan, petroleum-free balm for healing and during-tattoo glide.',
    logoUrl: '',
    affiliateLink: 'https://hustlebutter.com',
    commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_hb_1', name: 'Hustle Butter Deluxe 5oz Tub', imageUrl: '', price: '$19.99', affiliateLink: 'https://hustlebutter.com/deluxe', note: 'Tattoo care essential' },
      { id: 'prod_hb_2', name: 'Hustle Butter CBD Foam Soap', imageUrl: '', price: '$14.99', affiliateLink: 'https://hustlebutter.com/soap', note: 'New formula', isNew: true, createdAt: NOW - 7 * DAY },
      { id: 'prod_hb_3', name: 'Hustle Butter Travel Kit', imageUrl: '', price: '$24.99', affiliateLink: 'https://hustlebutter.com/travel', note: 'On-the-go set' },
    ],
    sortOrder: 4,
    active: true,
    createdAt: NOW,
  },
  {
    id: 'brand_bishop',
    name: 'Bishop Rotary',
    category: 'machines',
    description: 'American-made rotary machines known for power and durability. Favored by artists for large-scale work.',
    logoUrl: '',
    affiliateLink: 'https://bishoprotary.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_br_1', name: 'Bishop Power Wand Packer', imageUrl: '', price: '$649.00', affiliateLink: 'https://bishoprotary.com/packer', note: 'New release', isNew: true, createdAt: NOW - 2 * DAY },
      { id: 'prod_br_2', name: 'Bishop Power Wand Liner', imageUrl: '', price: '$629.00', affiliateLink: 'https://bishoprotary.com/liner', note: 'Crisp lines' },
      { id: 'prod_br_3', name: 'Bishop Power Pack Battery', imageUrl: '', price: '$199.00', affiliateLink: 'https://bishoprotary.com/battery', note: 'All-day runtime' },
    ],
    sortOrder: 5,
    active: true,
    createdAt: NOW,
  },
];

function daysAgo(ts: number): string {
  const d = Math.floor((NOW - ts) / DAY);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

function catColor(cat: SupplyBrandRecord['category']): string {
  const map: Record<string, string> = { ink: '#a855f7', needles: '#f97316', machines: '#3b82f6', aftercare: '#22c55e', furniture: '#eab308', other: '#64748b' };
  return map[cat] || '#64748b';
}

export default function SupplyBrandsPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [tab, setTab] = useState<TabKey>('brands');
  const [brands, setBrands] = useState<SupplyBrandRecord[]>([]);
  const [category, setCategory] = useState<CategoryKey>('all');
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      let all = await db.supplyBrands.toArray();
      if (all.length === 0) {
        await db.supplyBrands.bulkAdd(SEED_BRANDS);
        all = SEED_BRANDS;
      }
      all.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
      setBrands(all.filter(b => b.active));
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (category === 'all') return brands;
    return brands.filter(b => b.category === category);
  }, [brands, category]);

  const newProducts = useMemo(() => {
    const items: (SupplyProduct & { brandName: string; brandCategory: SupplyBrandRecord['category'] })[] = [];
    for (const b of brands) {
      for (const p of b.products) {
        if (!p.isNew) continue;
        if (category !== 'all' && b.category !== category) continue;
        items.push({ ...p, brandName: b.name, brandCategory: b.category });
      }
    }
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return items;
  }, [brands, category]);

  const activeTab = TABS.find(t => t.key === tab) || TABS[0];

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 0 }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 0 }}>{'<'}</button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t(lang, activeTab.labelKey)}</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{t(lang, activeTab.descKey)}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 0, borderBottom: '1px solid #1e293b' }}>
        {TABS.map(tb => (
          <button
            key={tb.key}
            onClick={() => { setTab(tb.key); setExpandedBrand(null); }}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              color: tab === tb.key ? 'white' : '#64748b',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              borderBottom: tab === tb.key ? '2px solid #e11d48' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t(lang, tb.labelKey)}
            {tb.key === 'new' && (
              <span style={{ marginLeft: 6, fontSize: 10, background: '#e11d4820', color: '#fca5a5', padding: '2px 6px', borderRadius: 4 }}>{newProducts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '1px solid #1e293b' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => { setCategory(c.key); setExpandedBrand(null); }}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: category === c.key ? '2px solid #e11d48' : '2px solid #334155',
              background: category === c.key ? '#e11d4820' : 'transparent',
              color: category === c.key ? '#fca5a5' : '#94a3b8',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {t(lang, c.labelKey)}
          </button>
        ))}
      </div>

      {/* Brands view */}
      {tab === 'brands' && (
        <div style={{ padding: '12px 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: '#64748b', paddingTop: 40 }}>No brands in this category yet.</p>
          )}
          {filtered.map(brand => {
            const isExpanded = expandedBrand === brand.id;
            return (
              <div
                key={brand.id}
                style={{
                  background: '#1e293b',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: brand.featured ? '1px solid #fbbf2480' : '1px solid #334155',
                }}
              >
                <div
                  onClick={() => setExpandedBrand(isExpanded ? null : brand.id)}
                  style={{ padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: catColor(brand.category) + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 800, color: catColor(brand.category),
                    flexShrink: 0,
                  }}>
                    {brand.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 16, fontWeight: 700 }}>{brand.name}</p>
                      {brand.featured && <span style={{ fontSize: 10, background: '#fbbf2420', color: '#fbbf24', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Featured</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.description}</p>
                    {brand.commissionNote && (
                      <p style={{ fontSize: 11, color: '#22c55e', marginTop: 2 }}>{t(lang, 'brand_commission')}: {brand.commissionNote}</p>
                    )}
                  </div>
                  <span style={{ color: '#64748b', fontSize: 14, flexShrink: 0 }}>{isExpanded ? 'v' : '>'}</span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #334155', padding: '12px 16px 16px' }}>
                    <a
                      href={brand.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={async () => {
                        await db.supplyBrands.update(brand.id, { clickCount: (brand.clickCount || 0) + 1 });
                        brand.clickCount = (brand.clickCount || 0) + 1;
                      }}
                      style={{ display: 'block', textAlign: 'center', padding: '8px 0', marginBottom: 12, borderRadius: 10, background: '#2563eb', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                    >
                      {t(lang, 'buy')} {brand.name} Official Store
                    </a>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {brand.products.map(p => (
                        <div key={p.id} style={{ display: 'flex', gap: 10, background: '#0f172a', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                          <div style={{ width: 52, height: 52, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: catColor(brand.category) }}>
                            {'#'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <p style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                              {p.isNew && <span style={{ fontSize: 9, background: '#22c55e20', color: '#4ade80', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>NEW</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{p.price}</span>
                              {p.note && <span style={{ fontSize: 11, color: '#64748b' }}>{p.note}</span>}
                            </div>
                          </div>
                          <a href={p.affiliateLink} target="_blank" rel="noopener noreferrer" onClick={async e => { e.stopPropagation(); const prods = brand.products.map(x => x.id === p.id ? { ...x, clickCount: (x.clickCount || 0) + 1 } : x); await db.supplyBrands.update(brand.id, { products: prods }); brand.products = prods; }} style={{ padding: '8px 16px', borderRadius: 10, background: '#e11d48', color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                            {t(lang, 'buy')}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Products view */}
      {tab === 'new' && (
        <div style={{ padding: '12px 20px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {newProducts.length === 0 && (
            <p style={{ textAlign: 'center', color: '#64748b', paddingTop: 40 }}>No new products in this category.</p>
          )}
          {newProducts.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 12, background: '#1e293b', borderRadius: 14, padding: 12, alignItems: 'center', border: '1px solid #334155' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: catColor(p.brandCategory) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, color: catColor(p.brandCategory), position: 'relative' }}>
                {'#'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</p>
                  <span style={{ fontSize: 9, background: '#22c55e20', color: '#4ade80', padding: '1px 6px', borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>NEW</span>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.brandName} · {p.createdAt ? daysAgo(p.createdAt) : ''}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{p.price}</span>
                  {p.note && <span style={{ fontSize: 11, color: '#64748b' }}>{p.note}</span>}
                </div>
              </div>
              <a href={p.affiliateLink} target="_blank" rel="noopener noreferrer" onClick={async () => {
                const brand = brands.find(b => b.id.startsWith('brand_') && b.products.some(x => x.id === p.id));
                if (brand) {
                  const prods = brand.products.map(x => x.id === p.id ? { ...x, clickCount: (x.clickCount || 0) + 1 } : x);
                  await db.supplyBrands.update(brand.id, { products: prods });
                  p.clickCount = (p.clickCount || 0) + 1;
                }
              }} style={{ padding: '8px 16px', borderRadius: 10, background: '#e11d48', color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                {t(lang, 'buy')}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

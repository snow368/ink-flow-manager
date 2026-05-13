import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type SupplyBrandRecord, type SupplyProduct } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';

const SEED_BRANDS: SupplyBrandRecord[] = [
  {
    id: 'brand_eternal_ink', name: 'Eternal Ink', category: 'ink',
    description: 'Industry-standard tattoo ink trusted by artists worldwide.',
    logoUrl: '', affiliateLink: 'https://eternaltattooink.com', commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_ei_1', name: 'Eternal Ink Black Liner 8oz', imageUrl: '', price: '$29.99', affiliateLink: 'https://eternaltattooink.com/black-liner', note: 'Best seller' },
      { id: 'prod_ei_2', name: 'Eternal Ink Color Set (12x1oz)', imageUrl: '', price: '$89.99', affiliateLink: 'https://eternaltattooink.com/color-set', note: 'New color range', isNew: true, createdAt: Date.now() - 432000000 },
      { id: 'prod_ei_3', name: 'Eternal Ink White Highlight 4oz', imageUrl: '', price: '$18.99', affiliateLink: 'https://eternaltattooink.com/white', note: 'High opacity' },
    ], sortOrder: 1, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_cheyenne', name: 'Cheyenne', category: 'machines',
    description: 'Premium German-engineered tattoo machines.',
    logoUrl: '', affiliateLink: 'https://cheyennetattoo.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ch_1', name: 'Cheyenne SOL Nova Unlimited', imageUrl: '', price: '$799.00', affiliateLink: 'https://cheyennetattoo.com/sol-nova', note: 'Just launched', isNew: true, createdAt: Date.now() - 86400000 },
      { id: 'prod_ch_2', name: 'Cheyenne HAWK Pen', imageUrl: '', price: '$549.00', affiliateLink: 'https://cheyennetattoo.com/hawk-pen', note: 'Versatile workhorse' },
      { id: 'prod_ch_3', name: 'Cheyenne Cartridge Grip', imageUrl: '', price: '$89.00', affiliateLink: 'https://cheyennetattoo.com/grip', note: 'Ergonomic' },
    ], sortOrder: 2, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_kwadron', name: 'Kwadron', category: 'needles',
    description: 'Premium cartridge needles with precision-machined tips.',
    logoUrl: '', affiliateLink: 'https://kwadron.com', commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_kw_1', name: 'Kwadron Cartridge Liners (Box 50)', imageUrl: '', price: '$39.99', affiliateLink: 'https://kwadron.com/liners', note: '7RL to 14RL' },
      { id: 'prod_kw_2', name: 'Kwadron Cartridge Mags (Box 50)', imageUrl: '', price: '$42.99', affiliateLink: 'https://kwadron.com/mags', note: 'New gauge option', isNew: true, createdAt: Date.now() - 259200000 },
      { id: 'prod_kw_3', name: 'Kwadron Round Shader Set', imageUrl: '', price: '$36.99', affiliateLink: 'https://kwadron.com/round-shader', note: 'Soft shading' },
    ], sortOrder: 3, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_hustle_butter', name: 'Hustle Butter', category: 'aftercare',
    description: 'The go-to tattoo aftercare brand. Vegan, petroleum-free.',
    logoUrl: '', affiliateLink: 'https://hustlebutter.com', commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_hb_1', name: 'Hustle Butter Deluxe 5oz Tub', imageUrl: '', price: '$19.99', affiliateLink: 'https://hustlebutter.com/deluxe', note: 'Tattoo care essential' },
      { id: 'prod_hb_2', name: 'Hustle Butter CBD Foam Soap', imageUrl: '', price: '$14.99', affiliateLink: 'https://hustlebutter.com/soap', note: 'New formula', isNew: true, createdAt: Date.now() - 604800000 },
      { id: 'prod_hb_3', name: 'Hustle Butter Travel Kit', imageUrl: '', price: '$24.99', affiliateLink: 'https://hustlebutter.com/travel', note: 'On-the-go set' },
    ], sortOrder: 4, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_bishop', name: 'Bishop Rotary', category: 'machines',
    description: 'American-made rotary machines known for power and durability.',
    logoUrl: '', affiliateLink: 'https://bishoprotary.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_br_1', name: 'Bishop Power Wand Packer', imageUrl: '', price: '$649.00', affiliateLink: 'https://bishoprotary.com/packer', note: 'New release', isNew: true, createdAt: Date.now() - 172800000 },
      { id: 'prod_br_2', name: 'Bishop Power Wand Liner', imageUrl: '', price: '$629.00', affiliateLink: 'https://bishoprotary.com/liner', note: 'Crisp lines' },
      { id: 'prod_br_3', name: 'Bishop Power Pack Battery', imageUrl: '', price: '$199.00', affiliateLink: 'https://bishoprotary.com/battery', note: 'All-day runtime' },
    ], sortOrder: 5, active: true, createdAt: Date.now(),
  },
];

const CAT_OPTIONS: SupplyBrandRecord['category'][] = ['ink', 'needles', 'machines', 'aftercare', 'furniture', 'other'];

const EMPTY_BRAND: SupplyBrandRecord = {
  id: '', name: '', category: 'other', description: '', logoUrl: '',
  affiliateLink: '', commissionNote: '', products: [],
  sortOrder: 99, active: true, createdAt: Date.now(),
};

const EMPTY_PRODUCT: SupplyProduct = {
  id: '', name: '', imageUrl: '', price: '', affiliateLink: '', note: '',
};

export default function SupplyBrandsAdmin() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [brands, setBrands] = useState<SupplyBrandRecord[]>([]);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<SupplyBrandRecord | null>(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ brandId: string; product: SupplyProduct } | null>(null);
  const [addingProductBrandId, setAddingProductBrandId] = useState<string | null>(null);

  const refresh = async () => {
    const all = await db.supplyBrands.toArray();
    all.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    setBrands(all);
  };

  useEffect(() => { refresh(); }, []);

  const handleDeleteBrand = async (id: string) => {
    if (!confirm(t(lang, 'confirm_delete_brand'))) return;
    await db.supplyBrands.delete(id);
    setExpandedBrand(null);
    refresh();
  };

  const handleToggleFeatured = async (brand: SupplyBrandRecord) => {
    await db.supplyBrands.update(brand.id, { featured: !brand.featured });
    refresh();
  };

  const handleToggleActive = async (brand: SupplyBrandRecord) => {
    await db.supplyBrands.update(brand.id, { active: !brand.active });
    refresh();
  };

  const handleSaveBrand = async () => {
    if (!editingBrand || !editingBrand.name.trim()) return;
    if (editingBrand.id) {
      await db.supplyBrands.update(editingBrand.id, { ...editingBrand });
    } else {
      const id = 'brand_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      await db.supplyBrands.add({ ...editingBrand, id, products: [], createdAt: Date.now() });
    }
    setEditingBrand(null);
    setShowAddBrand(false);
    refresh();
  };

  const handleDeleteProduct = async (brandId: string, productId: string) => {
    if (!confirm(t(lang, 'confirm_delete_product'))) return;
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    const products = brand.products.filter(p => p.id !== productId);
    await db.supplyBrands.update(brandId, { products });
    refresh();
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !editingProduct.product.name.trim()) return;
    const brand = brands.find(b => b.id === editingProduct.brandId);
    if (!brand) return;
    const products = [...brand.products];
    if (editingProduct.product.id) {
      const idx = products.findIndex(p => p.id === editingProduct!.product.id);
      if (idx >= 0) products[idx] = editingProduct.product;
    } else {
      const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      products.push({ ...editingProduct.product, id, createdAt: Date.now() });
    }
    await db.supplyBrands.update(brand.id, { products });
    setEditingProduct(null);
    setAddingProductBrandId(null);
    refresh();
  };

  const handleToggleProductNew = async (brandId: string, product: SupplyProduct) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    const products = brand.products.map(p =>
      p.id === product.id ? { ...p, isNew: !p.isNew, createdAt: !p.isNew ? Date.now() : p.createdAt } : p
    );
    await db.supplyBrands.update(brandId, { products });
    refresh();
  };

  const handleResetSeed = async () => {
    if (!confirm('Reset all supply brands to seed data? Current data will be lost.')) return;
    await db.supplyBrands.clear();
    await db.supplyBrands.bulkAdd(SEED_BRANDS);
    refresh();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', marginBottom: 10, borderRadius: 10,
    border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 0 }}>
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>{'<'}</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t(lang, 'supply_brands_admin')}</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{t(lang, 'owner_only')}</p>
        </div>
      </div>

      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8 }}>
        <button onClick={() => { setEditingBrand({ ...EMPTY_BRAND }); setShowAddBrand(true); }}
          style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 13, fontWeight: 600 }}>
          + {t(lang, 'add_brand')}
        </button>
        <button onClick={handleResetSeed}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #475569', background: 'transparent', color: '#64748b', fontSize: 12 }}>
          {t(lang, 'reset_seed_data')}
        </button>
      </div>

      {/* Brand list */}
      <div style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {brands.map(brand => (
          <div key={brand.id} style={{ background: '#1e293b', borderRadius: 14, overflow: 'hidden', border: brand.featured ? '1px solid #fbbf2480' : '1px solid #334155' }}>
            <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setExpandedBrand(expandedBrand === brand.id ? null : brand.id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{brand.name}</span>
                <span style={{ fontSize: 10, background: '#334155', color: '#94a3b8', padding: '2px 6px', borderRadius: 4 }}>{brand.category}</span>
                {brand.featured && <span style={{ fontSize: 10, background: '#fbbf2420', color: '#fbbf24', padding: '2px 6px', borderRadius: 4 }}>{t(lang, 'featured_label')}</span>}
                {!brand.active && <span style={{ fontSize: 10, background: '#7f1d1d', color: '#fca5a5', padding: '2px 6px', borderRadius: 4 }}>Inactive</span>}
              </button>
              <span style={{ fontSize: 12, color: '#64748b' }}>{brand.clickCount || 0}</span>
              <span style={{ fontSize: 10, color: '#334155' }}>{t(lang, 'clicks')}</span>
              <button onClick={() => setEditingBrand({ ...brand })}
                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>Edit</button>
            </div>

            {expandedBrand === brand.id && (
              <div style={{ borderTop: '1px solid #334155', padding: 12 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <button onClick={() => handleToggleFeatured(brand)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: brand.featured ? '#fbbf2420' : '#334155', color: brand.featured ? '#fbbf24' : '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                    {brand.featured ? 'Unfeature' : t(lang, 'featured_label')}
                  </button>
                  <button onClick={() => handleToggleActive(brand)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: brand.active ? '#22c55e20' : '#334155', color: brand.active ? '#4ade80' : '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
                    {brand.active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => handleDeleteBrand(brand.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#7f1d1d', color: '#fca5a5', fontSize: 11, cursor: 'pointer', marginLeft: 'auto' }}>
                    {t(lang, 'delete_brand')}
                  </button>
                </div>

                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  {t(lang, 'add_product')} ({brand.products.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {brand.products.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', borderRadius: 10, padding: '8px 12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                          {p.isNew && <span style={{ fontSize: 9, background: '#22c55e20', color: '#4ade80', padding: '1px 4px', borderRadius: 3 }}>NEW</span>}
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{p.price} · {p.clickCount || 0} {t(lang, 'clicks')}</span>
                      </div>
                      <button onClick={() => handleToggleProductNew(brand.id, p)}
                        style={{ background: 'none', border: 'none', color: p.isNew ? '#4ade80' : '#64748b', fontSize: 10, cursor: 'pointer' }}>
                        {p.isNew ? 'NEW' : 'New?'}
                      </button>
                      <button onClick={() => setEditingProduct({ brandId: brand.id, product: { ...p } })}
                        style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteProduct(brand.id, p.id)}
                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>X</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  setAddingProductBrandId(brand.id);
                  setEditingProduct({ brandId: brand.id, product: { ...EMPTY_PRODUCT } });
                }}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px dashed #475569', background: 'transparent', color: '#64748b', fontSize: 12 }}>
                  + {t(lang, 'add_product')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Brand Edit Modal */}
      {(editingBrand || showAddBrand) && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) { setEditingBrand(null); setShowAddBrand(false); } }}>
          <div style={{ width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#1e293b', borderRadius: '20px 20px 0 0', padding: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{editingBrand?.id ? t(lang, 'edit_brand') : t(lang, 'add_brand')}</h3>
            <input placeholder={t(lang, 'add_brand')} value={editingBrand?.name || ''} onChange={e => setEditingBrand(prev => prev ? { ...prev, name: e.target.value } : null)} style={inputStyle} />
            <select value={editingBrand?.category || 'other'} onChange={e => setEditingBrand(prev => prev ? { ...prev, category: e.target.value as SupplyBrandRecord['category'] } : null)} style={inputStyle}>
              {CAT_OPTIONS.map(c => <option key={c} value={c}>{t(lang, c)}</option>)}
            </select>
            <input placeholder={t(lang, 'description')} value={editingBrand?.description || ''} onChange={e => setEditingBrand(prev => prev ? { ...prev, description: e.target.value } : null)} style={inputStyle} />
            <input placeholder={t(lang, 'affiliate_link')} value={editingBrand?.affiliateLink || ''} onChange={e => setEditingBrand(prev => prev ? { ...prev, affiliateLink: e.target.value } : null)} style={inputStyle} />
            <input placeholder={t(lang, 'commission_note')} value={editingBrand?.commissionNote || ''} onChange={e => setEditingBrand(prev => prev ? { ...prev, commissionNote: e.target.value } : null)} style={inputStyle} />
            <input placeholder={t(lang, 'sort_order')} type="number" value={editingBrand?.sortOrder || 99} onChange={e => setEditingBrand(prev => prev ? { ...prev, sortOrder: Number(e.target.value) } : null)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditingBrand(null); setShowAddBrand(false); }}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>Cancel</button>
              <button onClick={handleSaveBrand}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 700 }}>
                {t(lang, 'save_brand')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (addingProductBrandId || editingProduct.product.id) && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) { setEditingProduct(null); setAddingProductBrandId(null); } }}>
          <div style={{ width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#1e293b', borderRadius: '20px 20px 0 0', padding: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{editingProduct.product.id ? t(lang, 'edit_product') : t(lang, 'add_product')}</h3>
            <input placeholder={t(lang, 'add_product')} value={editingProduct.product.name} onChange={e => setEditingProduct(prev => prev ? { ...prev, product: { ...prev.product, name: e.target.value } } : null)} style={inputStyle} />
            <input placeholder="Price (e.g. $29.99)" value={editingProduct.product.price} onChange={e => setEditingProduct(prev => prev ? { ...prev, product: { ...prev.product, price: e.target.value } } : null)} style={inputStyle} />
            <input placeholder={t(lang, 'affiliate_link')} value={editingProduct.product.affiliateLink} onChange={e => setEditingProduct(prev => prev ? { ...prev, product: { ...prev.product, affiliateLink: e.target.value } } : null)} style={inputStyle} />
            <input placeholder="Note" value={editingProduct.product.note} onChange={e => setEditingProduct(prev => prev ? { ...prev, product: { ...prev.product, note: e.target.value } } : null)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditingProduct(null); setAddingProductBrandId(null); }}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>Cancel</button>
              <button onClick={handleSaveProduct}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 700 }}>
                {t(lang, 'save_product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

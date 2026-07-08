import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type SupplyReviewRecord } from '../db';
import { THEME } from '../lib/theme';
import { searchSupplyProducts, buildReviewExtractionPrompt, extractLocalKeywords, REVIEW_CATEGORIES } from '../lib/reviewLogic';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';

function getGuidedPlaceholder(lang: AppLanguage): string {
  const prompts: Record<string, string[]> = {
    en: [
      'Share your real experience, help fellow artists avoid pitfalls:',
      '',
      '• How long have you used this product? On what styles?',
      '• What brands did you compare it with? What are the differences?',
      '• Did it cause any client allergies or discomfort?',
      '• What\'s the biggest complaint? (Fading? Leaking? Noise?)',
      '• Would you buy it again? Why?',
    ],
    es: [
      'Comparte tu experiencia real, ayuda a otros artistas a evitar problemas:',
      '',
      '• ¿Cuánto tiempo has usado este producto? ¿En qué estilos?',
      '• ¿Con qué marcas lo comparaste? ¿Cuáles son las diferencias?',
      '• ¿Causó alergias o molestias a algún cliente?',
      '• ¿Cuál es la mayor queja? (¿Decoloración? ¿Fugas? ¿Ruido?)',
      '• ¿Lo comprarías de nuevo? ¿Por qué?',
    ],
    pt: [
      'Compartilhe sua experiência real, ajude outros artistas a evitar problemas:',
      '',
      '• Há quanto tempo você usa este produto? Em quais estilos?',
      '• Com quais marcas você comparou? Quais são as diferenças?',
      '• Causou alguma alergia ou desconforto nos clientes?',
      '• Qual é a maior reclamação? (Desbotamento? Vazamento? Ruído?)',
      '• Você compraria de novo? Por quê?',
    ],
    fr: [
      'Partagez votre expérience réelle, aidez les autres artistes à éviter les pièges :',
      '',
      '• Depuis combien de temps utilisez-vous ce produit ? Pour quels styles ?',
      '• Avec quelles marques l\'avez-vous comparé ? Quelles sont les différences ?',
      '• A-t-il causé des allergies ou de l\'inconfort chez les clients ?',
      '• Quel est le plus gros reproche ? (Délavage ? Fuite ? Bruit ?)',
      '• Le rachèteriez-vous ? Pourquoi ?',
    ],
    de: [
      'Teile deine echte Erfahrung und hilf anderen Künstlern, Fehler zu vermeiden:',
      '',
      '• Wie lange hast du dieses Produkt verwendet? Für welche Stile?',
      '• Mit welchen Marken hast du es verglichen? Was sind die Unterschiede?',
      '• Hat es bei Kunden Allergien oder Beschwerden verursacht?',
      '• Was ist die größte Beschwerde? (Verblassen? Auslaufen? Lärm?)',
      '• Würdest du es wieder kaufen? Warum?',
    ],
    th: [
      'แชร์ประสบการณ์จริงของคุณ ช่วยเพื่อนช่างสักหลีกเลี่ยงปัญหา:',
      '',
      '• คุณใช้ผลิตภัณฑ์นี้มานานแค่ไหน? ใช้กับสไตล์ไหน?',
      '• เปรียบเทียบกับแบรนด์อะไร? แตกต่างกันอย่างไร?',
      '• ทำให้ลูกค้าแพ้หรือไม่สบายหรือไม่?',
      '• ข้อเสียที่ใหญ่ที่สุดคืออะไร? (ซีด? รั่ว? เสียงดัง?)',
      '• คุณจะซื้ออีกไหม? ทำไม?',
    ],
    jp: [
      '実際の体験を共有して、仲間のアーティストが失敗を避けるのを助けましょう：',
      '',
      '• この製品をどのくらい使っていますか？どんなスタイルに？',
      '• どのブランドと比較しましたか？違いは何ですか？',
      '• クライアントにアレルギーや不快感を引き起こしましたか？',
      '• 一番の不満点は何ですか？（色あせ？漏れ？騒音？）',
      '• また買いますか？その理由は？',
    ],
  };
  return (prompts[lang] || prompts.en).join('\n');
}

type CategoryFilter = 'all' | SupplyReviewRecord['category'];

export default function SupplyReviewsPage() {
  const navigate = useNavigate();
  const [lang] = useState<AppLanguage>(detectInitialLanguage);
  const [reviews, setReviews] = useState<SupplyReviewRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showSheet, setShowSheet] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; studioName?: string } | null>(null);

  // Form state
  const [productSearch, setProductSearch] = useState('');
  const [productName, setProductName] = useState('');
  const [productId, setProductId] = useState<string | undefined>();
  const [category, setCategory] = useState<SupplyReviewRecord['category']>('ink');
  const [body, setBody] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [buyAgain, setBuyAgain] = useState<boolean | undefined>();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [copied, setCopied] = useState('');
  const [searchResults, setSearchResults] = useState<{ brandName: string; productId: string; productName: string; category: string }[]>([]);

  // Load reviews
  const loadReviews = useCallback(async () => {
    let all = await db.supplyReviews.orderBy('createdAt').reverse().toArray();
    if (categoryFilter !== 'all') {
      all = all.filter(r => r.category === categoryFilter);
    }
    setReviews(all);
  }, [categoryFilter]);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(u => {
        if (u) setCurrentUser({ id: u.id, name: u.name, studioName: u.studioName });
      });
    }
    loadReviews();
  }, [loadReviews]);

  // Product search
  useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      searchSupplyProducts(productSearch).then(setSearchResults);
    }, 200);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const selectProduct = (r: { brandName: string; productId: string; productName: string; category: string }) => {
    setProductName(`${r.brandName} - ${r.productName}`);
    setProductId(r.productId);
    setCategory(r.category as SupplyReviewRecord['category']);
    setProductSearch('');
    setSearchResults([]);
  };

  // AI extraction
  const handleAIExtract = async () => {
    if (!body.trim()) return;
    // Run local keyword extraction for instant feedback
    const localTags = extractLocalKeywords(body);
    setTags(localTags);

    // Build prompt for external AI
    const prompt = buildReviewExtractionPrompt(body, productName || 'Unknown', category);
    await navigator.clipboard.writeText(prompt);
    setCopied('ai');
    setTimeout(() => setCopied(''), 2000);
  };

  // Submit review
  const handleSubmit = async () => {
    if (!body.trim() || !productName.trim() || !currentUser) return;
    const review: SupplyReviewRecord = {
      id: 'spr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      productName: productName.trim(),
      productId: productId || undefined,
      category,
      body: body.trim(),
      pros: pros.trim() || undefined,
      cons: cons.trim() || undefined,
      tags,
      buyAgain,
      photos,
      artistId: currentUser.id,
      isAnonymous,
      helpfulCount: 0,
      createdAt: Date.now(),
    };
    await db.supplyReviews.add(review);
    // Reset form
    setProductName(''); setProductId(undefined); setBody(''); setPros(''); setCons('');
    setBuyAgain(undefined); setIsAnonymous(false); setPhotos([]); setTags([]); setCategory('ink');
    setShowSheet(false);
    loadReviews();
  };

  // Helpful count
  const handleHelpful = async (id: string) => {
    const r = await db.supplyReviews.get(id);
    if (r) {
      await db.supplyReviews.update(id, { helpfulCount: (r.helpfulCount || 0) + 1 });
      loadReviews();
    }
  };

  const formatDate = (ts: number) => {
    const d = Math.floor((Date.now() - ts) / 86400000);
    if (d === 0) return t(lang, 'supply_reviews_today');
    if (d === 1) return t(lang, 'supply_reviews_yesterday');
    if (d < 30) return t(lang, 'supply_reviews_days_ago').replace('{n}', String(d));
    return new Date(ts).toLocaleDateString(lang === 'jp' ? 'ja' : lang, { month: 'short', day: 'numeric' });
  };

  const catBgColor = (cat: string): string => {
    const m: Record<string, string> = { ink: '#7e22ce', needles: '#ea580c', machines: '#2563eb', aftercare: '#16a34a', furniture: '#ca8a04', other: '#475569' };
    return m[cat] || '#475569';
  };

  const filteredReviews = categoryFilter === 'all' ? reviews : reviews.filter(r => r.category === categoryFilter);

  return (
    <div style={{ minHeight: '100dvh', background: `radial-gradient(1200px 600px at 10% -20%, #ea580c 0%, ${THEME.bg.app} 45%)`, color: THEME.text.primary, padding: 24, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2, margin: 0 }}>{t(lang, 'supply_reviews')}</h2>
        <button onClick={() => navigate('/me')} style={{ border: `1px solid ${THEME.border.default}`, background: 'transparent', color: THEME.text.muted, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>{t(lang, 'back')}</button>
      </div>

      {/* Guidance Banner */}
      <div style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid #ea580c33', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: '#fdba74', lineHeight: 1.5, margin: 0 }} dangerouslySetInnerHTML={{ __html: t(lang, 'supply_reviews_guidance') }} />
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {REVIEW_CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategoryFilter(c.key as CategoryFilter)}
            style={{
              padding: '8px 14px', borderRadius: 20, border: 'none',
              background: categoryFilter === c.key ? '#ea580c' : '#1e293b',
              color: categoryFilter === c.key ? 'white' : '#94a3b8',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Review Cards */}
      {filteredReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 14, color: THEME.text.muted, marginBottom: 8 }}>{t(lang, 'supply_reviews_empty')}</p>
          <button onClick={() => setShowSheet(true)} style={emptyBtn}>{t(lang, 'supply_reviews_write_first')}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredReviews.map(r => (
            <div key={r.id} style={{ background: 'rgba(30,41,59,0.85)', border: `1px solid ${THEME.border.default}`, borderRadius: 14, padding: 14 }}>
              {/* Product + Category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: catBgColor(r.category), color: 'white', fontWeight: 600 }}>{r.category}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{r.productName}</span>
                {r.buyAgain !== undefined && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: r.buyAgain ? '#14532d' : '#7f1d1d', color: r.buyAgain ? '#4ade80' : '#fca5a5' }}>
                    {r.buyAgain ? t(lang, 'supply_reviews_buy_again') : t(lang, 'supply_reviews_not_buy_again')}
                  </span>
                )}
              </div>

              {/* Body */}
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#e2e8f0', marginBottom: 8, whiteSpace: 'pre-wrap' }}>{r.body}</p>

              {/* Pros / Cons */}
              {(r.pros || r.cons) && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  {r.pros && (
                    <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', borderRadius: 8, padding: 8 }}>
                      <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>{t(lang, 'supply_reviews_pros_label')}</span>
                      <p style={{ fontSize: 11, color: '#86efac', marginTop: 2 }}>{r.pros}</p>
                    </div>
                  )}
                  {r.cons && (
                    <div style={{ flex: 1, background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: 8 }}>
                      <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>{t(lang, 'supply_reviews_cons_label')}</span>
                      <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>{r.cons}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {r.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {r.tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#1e293b', color: '#94a3b8' }}>{t}</span>
                  ))}
                </div>
              )}

              {/* Photos */}
              {r.photos.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto' }}>
                  {r.photos.map((p, i) => (
                    <img key={i} src={p} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid #334155' }} />
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: THEME.text.subtle }}>
                  {r.isAnonymous ? t(lang, 'supply_reviews_anonymous_name') : currentUser?.name || 'Anonymous'} · {formatDate(r.createdAt)}
                </span>
                <button onClick={() => handleHelpful(r.id)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  👍 {r.helpfulCount || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowSheet(true)}
        style={{
          position: 'fixed', bottom: 100, right: 20,
          padding: '14px 22px', borderRadius: 28,
          border: 'none', background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
          color: 'white', fontSize: 15, fontWeight: 800,
          boxShadow: '0 8px 24px rgba(234,88,12,0.35)',
          cursor: 'pointer', zIndex: 40,
        }}>
        {t(lang, 'supply_reviews_write_first')}
      </button>

      {/* Post Sheet Overlay */}
      {showSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowSheet(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', background: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85dvh', overflowY: 'auto', zIndex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>{t(lang, 'supply_reviews_share')}</p>

            {/* Product Search */}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{t(lang, 'supply_reviews_product_name')}</p>
            <input placeholder={t(lang, 'supply_reviews_search_placeholder')} value={productSearch || productName}
              onChange={e => { setProductSearch(e.target.value); if (!e.target.value) setProductName(''); }}
              style={inputStyle} />
            {searchResults.length > 0 && (
              <div style={{ background: '#0f172a', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                {searchResults.map((r, i) => (
                  <div key={i} onClick={() => selectProduct(r)}
                    style={{ padding: '10px 12px', borderBottom: '1px solid #1e293b', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>{r.brandName} — {r.productName}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: catBgColor(r.category), color: 'white' }}>{r.category}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Category */}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, marginTop: 10 }}>{t(lang, 'supply_reviews_category_label')}</p>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
              {REVIEW_CATEGORIES.filter(c => c.key !== 'all').map(c => (
                <button key={c.key} onClick={() => setCategory(c.key as SupplyReviewRecord['category'])}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none',
                    background: category === c.key ? catBgColor(c.key) : '#0f172a',
                    color: category === c.key ? 'white' : '#94a3b8',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>{c.label}</button>
              ))}
            </div>

            {/* Body */}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{t(lang, 'supply_reviews_detail')}</p>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder={getGuidedPlaceholder(lang)}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }} />

            {/* AI Extract */}
            <button onClick={handleAIExtract} disabled={!body.trim()}
              style={{
                width: '100%', padding: 10, borderRadius: 10, marginTop: 6, marginBottom: 12,
                border: '1px solid #7e22ce80', background: copied === 'ai' ? '#22c55e' : '#312e81',
                color: copied === 'ai' ? 'white' : '#c4b5fd', fontSize: 13, fontWeight: 700, cursor: body.trim() ? 'pointer' : 'not-allowed', opacity: body.trim() ? 1 : 0.5,
              }}>
              {copied === 'ai' ? t(lang, 'supply_reviews_ai_copied') : t(lang, 'supply_reviews_ai_extract')}
            </button>

            {/* Auto-extracted tags */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                {tags.map((t, i) => (
                  <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#7e22ce33', color: '#c4b5fd' }}>{t}</span>
                ))}
                <button onClick={() => setTags([])} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 10, cursor: 'pointer' }}>{t(lang, 'supply_reviews_clear')}</button>
              </div>
            )}

            {/* Pros */}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{t(lang, 'supply_reviews_pros_label')}</p>
            <input value={pros} onChange={e => setPros(e.target.value)} placeholder={t(lang, 'supply_reviews_pros_placeholder')} style={inputStyle} />

            {/* Cons */}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{t(lang, 'supply_reviews_cons_label')}</p>
            <input value={cons} onChange={e => setCons(e.target.value)} placeholder={t(lang, 'supply_reviews_cons_placeholder')} style={inputStyle} />

            {/* Buy Again */}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, marginTop: 10 }}>{t(lang, 'supply_reviews_buy_again_q')}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[{ v: true, l: t(lang, 'supply_reviews_would_buy') }, { v: false, l: t(lang, 'supply_reviews_would_not_buy') }].map(opt => (
                <button key={String(opt.v)} onClick={() => setBuyAgain(buyAgain === opt.v ? undefined : opt.v)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, border: buyAgain === opt.v ? `1px solid ${opt.v ? '#22c55e' : '#ef4444'}` : '1px solid #334155',
                    background: buyAgain === opt.v ? (opt.v ? '#14532d' : '#7f1d1d') : '#0f172a',
                    color: buyAgain === opt.v ? (opt.v ? '#4ade80' : '#fca5a5') : '#94a3b8',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>{opt.l}</button>
              ))}
            </div>

            {/* Photos */}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{t(lang, 'supply_reviews_photos_optional')}</p>
            <input type="file" accept="image/*" multiple onChange={e => {
              const files = e.target.files;
              if (!files) return;
              Array.from(files).forEach(f => {
                const reader = new FileReader();
                reader.onload = () => { setPhotos(prev => [...prev, reader.result as string]); };
                reader.readAsDataURL(f);
              });
            }} style={{ marginBottom: 8 }} />
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={p} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 10, cursor: 'pointer' }}>x</button>
                  </div>
                ))}
              </div>
            )}

            {/* Anonymous */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '10px 12px', background: '#0f172a', borderRadius: 10 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{t(lang, 'supply_reviews_anonymous_label')}</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>{t(lang, 'supply_reviews_anonymous_desc')}</p>
              </div>
              <button onClick={() => setIsAnonymous(!isAnonymous)}
                style={{
                  width: 48, height: 28, borderRadius: 14, border: 'none',
                  background: isAnonymous ? '#ea580c' : '#334155',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}>
                <span style={{ position: 'absolute', top: 3, left: isAnonymous ? 23 : 3, width: 22, height: 22, borderRadius: 11, background: 'white', transition: 'left 0.2s' }} />
              </button>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!body.trim() || !productName.trim()}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: body.trim() && productName.trim() ? 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)' : '#334155',
                color: 'white', fontSize: 16, fontWeight: 800, cursor: body.trim() && productName.trim() ? 'pointer' : 'not-allowed', opacity: body.trim() && productName.trim() ? 1 : 0.5,
              }}>
              {t(lang, 'supply_reviews_submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #334155',
  background: '#0f172a', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8,
};

const emptyBtn: React.CSSProperties = {
  padding: '10px 24px', borderRadius: 10, border: 'none', background: '#ea580c', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
};

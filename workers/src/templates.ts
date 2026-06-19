// ============================================================
// Tattoo Shop Landing Page Templates — 4 styles
// Pure HTML + inline CSS, zero external deps
// Responsive: phone (<640) / tablet (640-1024) / desktop (1025+)
// ============================================================

export interface ShopData {
  studioName: string;
  city: string;
  state: string;
  phone: string;
  address: string;
  rating: number;
  reviewCount: number;
  bio: string;
  photos: string[];
  services: string[];
  placeId: string;
  slug: string;
  template: 'traditional' | 'minimal' | 'moody' | 'vintage' | 'edgy' | 'studio'
    | 'brutalist' | 'nature' | 'royal' | 'neon' | 'industrial' | 'woodcut'
    | 'watercolor' | 'gothic' | 'coastal' | 'urban' | 'japanese' | 'midnight'
    | 'cyberpunk' | 'botanical' | 'metallic' | 'sunset' | 'sakura' | 'tribal'
    | 'steampunk' | 'arctic' | 'desert' | 'punk' | 'celestial' | 'neonoir' | 'lavender'
    | 'biomechanical' | 'chicano' | 'maori' | 'trash-polka' | 'new-school'
    | 'halloween' | 'nordic' | 'tropical' | 'monochrome' | 'retro-wave';
  claimToken: string;
  claimed: boolean;
  priceRange?: string;
  website?: string;
  instagram?: string;
}

interface ThemeVars {
  bg: string;
  bgAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  card: string;
  border: string;
  fontHeading: string;
  fontBody: string;
  heroOverlay: string;
  starColor: string;
  borderRadius: string;
}

const THEMES: Record<string, ThemeVars> = {
  /* Free/Starter доступны 4 шаблона */
  minimal: {
    bg: '#ffffff', bgAlt: '#f5f5f0', text: '#1a1a1a', textMuted: '#888',
    accent: '#1a1a1a', accentHover: '#333', card: '#ffffff', border: '#e8e8e0',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.3))',
    starColor: '#1a1a1a', borderRadius: '0',
  },
  traditional: {
    bg: '#0a0a0a', bgAlt: '#1a1a1a', text: '#f5f0e8', textMuted: '#998e7e',
    accent: '#c41e1e', accentHover: '#d42e2e', card: '#141414', border: '#2a2a2a',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85))',
    starColor: '#c41e1e', borderRadius: '0',
  },
  vintage: {
    bg: '#f5f0e8', bgAlt: '#efe8dc', text: '#2c2418', textMuted: '#8a7e6e',
    accent: '#8b4513', accentHover: '#a0522d', card: '#faf5ee', border: '#dcd0c0',
    fontHeading: "'Playfair Display', serif", fontBody: "'EB Garamond', serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
    starColor: '#8b4513', borderRadius: '0',
  },
  moody: {
    bg: '#0d0d0d', bgAlt: '#1a1a1a', text: '#e8e0d8', textMuted: '#7a7066',
    accent: '#b8860b', accentHover: '#cc9a1a', card: '#141414', border: '#2a2420',
    fontHeading: "'Cinzel', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.9))',
    starColor: '#b8860b', borderRadius: '0',
  },
  /* Pro/Plus exclusive */
  edgy: {
    bg: '#0a0a0a', bgAlt: '#111', text: '#f0f0f0', textMuted: '#666',
    accent: '#ff0066', accentHover: '#ff1a75', card: '#111', border: '#222',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85))',
    starColor: '#ff0066', borderRadius: '4px',
  },
  studio: {
    bg: '#f8f8f8', bgAlt: '#ffffff', text: '#222', textMuted: '#777',
    accent: '#d4a574', accentHover: '#c49564', card: '#ffffff', border: '#e0e0e0',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
    starColor: '#d4a574', borderRadius: '0',
  },
  brutalist: {
    bg: '#000000', bgAlt: '#0a0a0a', text: '#ffffff', textMuted: '#888',
    accent: '#ffffff', accentHover: '#ccc', card: '#0a0a0a', border: '#222',
    fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8))',
    starColor: '#ffffff', borderRadius: '0',
  },
  nature: {
    bg: '#0f1a0e', bgAlt: '#1a2a18', text: '#e0ecd8', textMuted: '#7a8a72',
    accent: '#4a8c3f', accentHover: '#5a9c4f', card: '#1a2a18', border: '#2a3a28',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(15,26,14,0.7), rgba(15,26,14,0.9))',
    starColor: '#4a8c3f', borderRadius: '0',
  },
  royal: {
    bg: '#0e0a1a', bgAlt: '#1a1528', text: '#e8e0f0', textMuted: '#8a7aaa',
    accent: '#7c3aed', accentHover: '#8c4afd', card: '#1a1528', border: '#2a2040',
    fontHeading: "'Cinzel', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(14,10,26,0.7), rgba(14,10,26,0.9))',
    starColor: '#7c3aed', borderRadius: '0',
  },
  neon: {
    bg: '#0a0a12', bgAlt: '#12121e', text: '#f0f0f8', textMuted: '#666',
    accent: '#00ffff', accentHover: '#33ffff', card: '#12121e', border: '#1e1e3a',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,10,18,0.6), rgba(10,10,18,0.85))',
    starColor: '#00ffff', borderRadius: '4px',
  },
  industrial: {
    bg: '#121212', bgAlt: '#1c1c1c', text: '#d8d8d8', textMuted: '#6a6a6a',
    accent: '#4682b4', accentHover: '#5692c4', card: '#1c1c1c', border: '#282828',
    fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(18,18,18,0.7), rgba(18,18,18,0.9))',
    starColor: '#4682b4', borderRadius: '0',
  },
  woodcut: {
    bg: '#1a1410', bgAlt: '#26201a', text: '#e0d8cc', textMuted: '#8a8075',
    accent: '#cc9a4a', accentHover: '#dcaa5a', card: '#26201a', border: '#3a3028',
    fontHeading: "'Playfair Display', serif", fontBody: "'EB Garamond', serif",
    heroOverlay: 'linear-gradient(rgba(26,20,16,0.7), rgba(26,20,16,0.9))',
    starColor: '#cc9a4a', borderRadius: '0',
  },
  watercolor: {
    bg: '#f8f4f0', bgAlt: '#ffffff', text: '#2a2420', textMuted: '#8a8078',
    accent: '#e88d9a', accentHover: '#f09dac', card: '#ffffff', border: '#e8e0d8',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.3))',
    starColor: '#e88d9a', borderRadius: '12px',
  },
  gothic: {
    bg: '#0a0808', bgAlt: '#141010', text: '#d8d0c8', textMuted: '#6a6058',
    accent: '#800020', accentHover: '#900030', card: '#141010', border: '#2a1e1e',
    fontHeading: "'Cinzel', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,8,8,0.8), rgba(10,8,8,0.95))',
    starColor: '#800020', borderRadius: '0',
  },
  coastal: {
    bg: '#f0f5f5', bgAlt: '#ffffff', text: '#1a2a2a', textMuted: '#7a8a8a',
    accent: '#2a8a8a', accentHover: '#3a9a9a', card: '#ffffff', border: '#d8e8e8',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.25))',
    starColor: '#2a8a8a', borderRadius: '8px',
  },
  urban: {
    bg: '#0a0a0a', bgAlt: '#151515', text: '#f0f0f0', textMuted: '#666',
    accent: '#ff6600', accentHover: '#ff7722', card: '#151515', border: '#252525',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,10,10,0.6), rgba(10,10,10,0.85))',
    starColor: '#ff6600', borderRadius: '4px',
  },
  // ── NEW: v2 expansion (15 new) ──
  japanese: {
    bg: '#0f0a08', bgAlt: '#1a1410', text: '#f0e8e0', textMuted: '#8a7a6a',
    accent: '#cc3300', accentHover: '#dc4410', card: '#1a1410', border: '#2a1e18',
    fontHeading: "'Cinzel', serif", fontBody: "'Noto Sans JP', sans-serif",
    heroOverlay: 'linear-gradient(rgba(15,10,8,0.7), rgba(15,10,8,0.9))',
    starColor: '#cc3300', borderRadius: '4px',
  },
  midnight: {
    bg: '#080c14', bgAlt: '#101826', text: '#d8e0f0', textMuted: '#607090',
    accent: '#4a80d0', accentHover: '#5a90e0', card: '#101826', border: '#1a2840',
    fontHeading: "'Playfair Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(8,12,20,0.7), rgba(8,12,20,0.9))',
    starColor: '#4a80d0', borderRadius: '2px',
  },
  cyberpunk: {
    bg: '#0a0515', bgAlt: '#140a24', text: '#e0d8f0', textMuted: '#7a6a9a',
    accent: '#ff00aa', accentHover: '#ff22bb', card: '#140a24', border: '#281840',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,5,21,0.65), rgba(10,5,21,0.9))',
    starColor: '#ff00aa', borderRadius: '0',
  },
  botanical: {
    bg: '#0f1a12', bgAlt: '#1a2a1e', text: '#dce8d8', textMuted: '#6a8a6e',
    accent: '#5a9e6a', accentHover: '#6aae7a', card: '#1a2a1e', border: '#2a3a2e',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(15,26,18,0.7), rgba(15,26,18,0.9))',
    starColor: '#5a9e6a', borderRadius: '8px',
  },
  metallic: {
    bg: '#0e0e10', bgAlt: '#18181c', text: '#e0e0e4', textMuted: '#7a7a82',
    accent: '#9a9aaa', accentHover: '#b0b0bc', card: '#18181c', border: '#282830',
    fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(14,14,16,0.6), rgba(14,14,16,0.85))',
    starColor: '#9a9aaa', borderRadius: '2px',
  },
  sunset: {
    bg: '#1a0e0a', bgAlt: '#2a1810', text: '#f0e0d8', textMuted: '#9a7a6a',
    accent: '#ff6622', accentHover: '#ff7744', card: '#2a1810', border: '#3a2820',
    fontHeading: "'Playfair Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(26,14,10,0.6), rgba(26,14,10,0.85))',
    starColor: '#ff6622', borderRadius: '4px',
  },
  sakura: {
    bg: '#1a1018', bgAlt: '#2a1a24', text: '#f0e0e8', textMuted: '#9a7a8a',
    accent: '#e86a8a', accentHover: '#f47a9a', card: '#2a1a24', border: '#3a2830',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(26,16,24,0.65), rgba(26,16,24,0.88))',
    starColor: '#e86a8a', borderRadius: '12px',
  },
  tribal: {
    bg: '#050505', bgAlt: '#0d0d0d', text: '#e8e8e8', textMuted: '#666',
    accent: '#d4d4d4', accentHover: '#eee', card: '#0d0d0d', border: '#1a1a1a',
    fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(5,5,5,0.6), rgba(5,5,5,0.85))',
    starColor: '#d4d4d4', borderRadius: '0',
  },
  steampunk: {
    bg: '#14100a', bgAlt: '#1e1a14', text: '#e0d8cc', textMuted: '#8a8070',
    accent: '#b8862a', accentHover: '#c8963a', card: '#1e1a14', border: '#2e2820',
    fontHeading: "'Cinzel', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(20,16,10,0.7), rgba(20,16,10,0.9))',
    starColor: '#b8862a', borderRadius: '2px',
  },
  arctic: {
    bg: '#e8f0f5', bgAlt: '#f0f5fa', text: '#1a2a3a', textMuted: '#6a8a9a',
    accent: '#2a7aaa', accentHover: '#3a8aba', card: '#ffffff', border: '#d0dce8',
    fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2))',
    starColor: '#2a7aaa', borderRadius: '4px',
  },
  desert: {
    bg: '#e8e0d0', bgAlt: '#f0e8dc', text: '#2a2218', textMuted: '#8a7a62',
    accent: '#c4783a', accentHover: '#d4884a', card: '#f5f0e8', border: '#d4c8b4',
    fontHeading: "'Playfair Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.3))',
    starColor: '#c4783a', borderRadius: '0',
  },
  punk: {
    bg: '#0a0a0a', bgAlt: '#141010', text: '#f0f0f0', textMuted: '#666',
    accent: '#ffee00', accentHover: '#ffee44', card: '#141010', border: '#2a2020',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,10,10,0.5), rgba(10,10,10,0.8))',
    starColor: '#ffee00', borderRadius: '0',
  },
  celestial: {
    bg: '#080818', bgAlt: '#101028', text: '#e0d8f0', textMuted: '#6a6090',
    accent: '#c8a040', accentHover: '#d8b050', card: '#101028', border: '#202048',
    fontHeading: "'Cinzel', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(8,8,24,0.75), rgba(8,8,24,0.92))',
    starColor: '#c8a040', borderRadius: '4px',
  },
  neonoir: {
    bg: '#080808', bgAlt: '#111114', text: '#e0e0e0', textMuted: '#555',
    accent: '#ff2244', accentHover: '#ff3355', card: '#111114', border: '#222226',
    fontHeading: "'Playfair Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(8,8,8,0.7), rgba(8,8,8,0.9))',
    starColor: '#ff2244', borderRadius: '0',
  },
  lavender: {
    bg: '#f0ecf5', bgAlt: '#f8f4fa', text: '#2a203a', textMuted: '#8a7a9a',
    accent: '#8a6aca', accentHover: '#9a7ada', card: '#ffffff', border: '#d8d0e8',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2))',
    starColor: '#8a6aca', borderRadius: '10px',
  },
  // ── v3: 10 new themes ──
  biomechanical: {
    bg: '#0d0d0f', bgAlt: '#161618', text: '#e0e0e2', textMuted: '#6a6a72',
    accent: '#c0392b', accentHover: '#d4493b', card: '#161618', border: '#26262a',
    fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(13,13,15,0.7), rgba(13,13,15,0.9))',
    starColor: '#c0392b', borderRadius: '2px',
  },
  chicano: {
    bg: '#1a1410', bgAlt: '#261e18', text: '#e8ddd0', textMuted: '#8a7a6a',
    accent: '#c4956a', accentHover: '#d4a57a', card: '#261e18', border: '#3a2e28',
    fontHeading: "'Playfair Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(26,20,16,0.7), rgba(26,20,16,0.9))',
    starColor: '#c4956a', borderRadius: '0',
  },
  maori: {
    bg: '#080808', bgAlt: '#111111', text: '#e8e8e8', textMuted: '#666',
    accent: '#cc2222', accentHover: '#dc3333', card: '#111111', border: '#222',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(8,8,8,0.6), rgba(8,8,8,0.85))',
    starColor: '#cc2222', borderRadius: '0',
  },
  'trash-polka': {
    bg: '#0a0a0a', bgAlt: '#141414', text: '#f0f0f0', textMuted: '#666',
    accent: '#cc2244', accentHover: '#dc3355', card: '#141414', border: '#222',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,10,10,0.65), rgba(10,10,10,0.88))',
    starColor: '#cc2244', borderRadius: '0',
  },
  'new-school': {
    bg: '#0a0a20', bgAlt: '#151530', text: '#e8e8f0', textMuted: '#6a6a8a',
    accent: '#ff66cc', accentHover: '#ff77dd', card: '#151530', border: '#2a2a50',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,10,32,0.65), rgba(10,10,32,0.85))',
    starColor: '#ff66cc', borderRadius: '8px',
  },
  halloween: {
    bg: '#0a0808', bgAlt: '#141010', text: '#e8d8c8', textMuted: '#7a6a5a',
    accent: '#ff6600', accentHover: '#ff7722', card: '#141010', border: '#2a1e18',
    fontHeading: "'Cinzel', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,8,8,0.7), rgba(10,8,8,0.9))',
    starColor: '#ff6600', borderRadius: '0',
  },
  nordic: {
    bg: '#0c1018', bgAlt: '#161c28', text: '#d8e0e8', textMuted: '#5a6a7a',
    accent: '#7a9aaa', accentHover: '#8aaaba', card: '#161c28', border: '#222c3e',
    fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(12,16,24,0.65), rgba(12,16,24,0.88))',
    starColor: '#7a9aaa', borderRadius: '2px',
  },
  tropical: {
    bg: '#0a1414', bgAlt: '#142020', text: '#dce8e0', textMuted: '#5a7a6a',
    accent: '#ff7744', accentHover: '#ff8866', card: '#142020', border: '#24342e',
    fontHeading: "'DM Serif Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,20,20,0.6), rgba(10,20,20,0.85))',
    starColor: '#ff7744', borderRadius: '8px',
  },
  monochrome: {
    bg: '#080808', bgAlt: '#141414', text: '#cccccc', textMuted: '#555',
    accent: '#666666', accentHover: '#888888', card: '#141414', border: '#222',
    fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(8,8,8,0.5), rgba(8,8,8,0.8))',
    starColor: '#888888', borderRadius: '0',
  },
  'retro-wave': {
    bg: '#0a0a30', bgAlt: '#151545', text: '#e0d8f8', textMuted: '#6a5a9a',
    accent: '#ff6688', accentHover: '#ff7799', card: '#151545', border: '#2a2870',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(10,10,48,0.7), rgba(10,10,48,0.9))',
    starColor: '#ff6688', borderRadius: '4px',
  },
};
export const TEMPLATE_TIERS: Record<string, string> = {
  minimal: 'free', traditional: 'free', vintage: 'free', moody: 'free',
  edgy: 'pro', studio: 'pro', brutalist: 'pro', nature: 'pro',
  royal: 'pro', neon: 'pro', industrial: 'plus', woodcut: 'plus',
  watercolor: 'plus', gothic: 'plus', coastal: 'plus', urban: 'plus',
  // v2 expansion (15 new)
  japanese: 'pro', midnight: 'free', cyberpunk: 'pro', botanical: 'free',
  metallic: 'plus', sunset: 'pro', sakura: 'pro', tribal: 'free',
  steampunk: 'plus', arctic: 'free', desert: 'free', punk: 'pro',
  celestial: 'plus', neonoir: 'pro', lavender: 'free',
  biomechanical: 'pro', chicano: 'pro', maori: 'free', 'trash-polka': 'plus',
  'new-school': 'pro', halloween: 'free', nordic: 'free', tropical: 'pro',
  monochrome: 'free', 'retro-wave': 'plus',
};

// ---- Helpers ----

function stars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  if (half) s += '½';
  const empty = 5 - full - (half ? 1 : 0);
  for (let i = 0; i < empty; i++) s += '☆';
  return s;
}

function schemaOrg(d: ShopData): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: d.studioName,
    image: d.photos?.[0] || '',
    url: 'https://app.ink-flows.com/s/' + d.slug,
    telephone: d.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: d.address,
      addressLocality: d.city,
      addressRegion: d.state,
      addressCountry: 'US',
    },
    aggregateRating: d.rating ? {
      '@type': 'AggregateRating',
      ratingValue: d.rating,
      reviewCount: d.reviewCount || 0,
    } : undefined,
    priceRange: d.priceRange || '$$',
  });
}

function safe(val: string | undefined | null, fallback = ''): string {
  return (val || fallback)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function encodeUri(str: string): string {
  return encodeURIComponent(str);
}

// ---- Section Builders ----

function heroSection(d: ShopData, t: ThemeVars): string {
  const bgImage = d.photos?.[0]
    ? 'background-image: ' + t.heroOverlay + ', url(' + safe(d.photos[0]) + '); background-size: cover; background-position: center;'
    : 'background: ' + t.bgAlt + ';';
  return '' +
    '<header class="hero" style="' + bgImage + '">' +
      '<div class="hero-content">' +
        '<h1 class="hero-title" style="font-family: ' + t.fontHeading + '; color: ' + t.text + ';">' + safe(d.studioName) + '</h1>' +
        (d.bio ? '<p class="hero-sub" style="font-family: ' + t.fontBody + '; color: ' + t.textMuted + ';">' + safe(d.bio) + '</p>' : '') +
        '<div class="hero-meta" style="font-family: ' + t.fontBody + '; color: ' + t.textMuted + ';">' +
          (d.city ? '<span>📍 ' + safe(d.city) + ', ' + safe(d.state) + '</span>' : '') +
          (d.rating ? '<span style="color: ' + t.starColor + ';">' + stars(d.rating) + ' ' + d.rating + '</span>' : '') +
          (d.phone ? '<span>📞 ' + safe(d.phone) + '</span>' : '') +
        '</div>' +
        '<div class="hero-actions">' +
          (d.phone ? '<a href="tel:' + safe(d.phone) + '" class="btn-primary">Call Now</a>' : '') +
          '<button onclick="document.getElementById(\'booking\').scrollIntoView({behavior:\'smooth\'})" class="btn-secondary" style="display:inline-block;padding:0.85rem 2rem;border:2px solid ' + t.accent + ';color:' + t.accent + ';background:transparent;text-decoration:none;font-weight:600;font-size:1rem;border-radius:' + t.borderRadius + ';cursor:pointer;min-height:44px;display:inline-flex;align-items:center;justify-content:center;">Book Appointment</button>' +
        '</div>' +
      '</div>' +
    '</header>';
}

function bookingSection(d: ShopData, t: ThemeVars): string {
  return '' +
    '<section class="section booking" id="booking" style="background: ' + t.bgAlt + ';">' +
      '<div class="container" style="max-width: 600px;">' +
        '<h2 style="font-family: ' + t.fontHeading + '; color: ' + t.accent + '; margin: 0 0 0.5rem; text-align: center; font-size: 2rem;">Book an Appointment</h2>' +
        '<p style="font-family: ' + t.fontBody + '; color: ' + t.textMuted + '; text-align: center; margin-bottom: 1.5rem; font-size: 0.95rem;">Fill in your details and we\'ll get back to you.</p>' +
        '<form id="bookingForm" onsubmit="return submitBooking(event)" style="display:flex;flex-direction:column;gap:0.75rem;">' +
          '<input type="hidden" name="slug" value="' + d.slug + '">' +
          '<input type="text" name="name" placeholder="Your Name" required style="width:100%;padding:0.75rem 1rem;background:' + t.bg + ';border:1px solid ' + t.border + ';border-radius:' + t.borderRadius + ';color:' + t.text + ';font-size:0.95rem;font-family:' + t.fontBody + ';">' +
          '<input type="tel" name="phone" placeholder="Phone Number" required style="width:100%;padding:0.75rem 1rem;background:' + t.bg + ';border:1px solid ' + t.border + ';border-radius:' + t.borderRadius + ';color:' + t.text + ';font-size:0.95rem;font-family:' + t.fontBody + ';">' +
          '<input type="email" name="email" placeholder="Email (optional)" style="width:100%;padding:0.75rem 1rem;background:' + t.bg + ';border:1px solid ' + t.border + ';border-radius:' + t.borderRadius + ';color:' + t.text + ';font-size:0.95rem;font-family:' + t.fontBody + ';">' +
          '<textarea name="message" placeholder="What are you looking for? (style, size, placement...)" rows="3" style="width:100%;padding:0.75rem 1rem;background:' + t.bg + ';border:1px solid ' + t.border + ';border-radius:' + t.borderRadius + ';color:' + t.text + ';font-size:0.95rem;font-family:' + t.fontBody + ';resize:vertical;"></textarea>' +
          '<button type="submit" id="bookingBtn" style="width:100%;padding:0.85rem;background:' + t.accent + ';color:#fff;border:none;border-radius:' + t.borderRadius + ';font-size:1rem;font-weight:700;cursor:pointer;font-family:' + t.fontBody + ';">Send Request</button>' +
          '<p id="bookingMsg" style="display:none;font-family:' + t.fontBody + ';font-size:0.9rem;text-align:center;color:#34d399;">Request sent! We\'ll get back to you soon.</p>' +
        '</form>' +
      '</div>' +
    '</section>' +
    '<script>' +
    'async function submitBooking(e){e.preventDefault();var f=e.target;var btn=document.getElementById("bookingBtn");var msg=document.getElementById("bookingMsg");btn.disabled=true;btn.textContent="Sending...";try{var r=await fetch("/api/booking-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:f.slug.value,name:f.name.value,phone:f.phone.value,email:f.email.value,message:f.message.value})});if(r.ok){msg.style.display="block";f.reset()}else{alert("Something went wrong. Please try again.")}}catch(e){alert("Network error. Please try again.")}finally{btn.disabled=false;btn.textContent="Send Request"}}' +
    '</script>';
}

function aboutSection(d: ShopData, t: ThemeVars): string {
  const bio = d.bio || safe(d.studioName) + ' is a professional tattoo studio serving ' + safe(d.city) + ', ' + safe(d.state) + '. Stop by or call to book your next piece.';
  const mapLink = d.address
    ? '<p style="font-family: ' + t.fontBody + '; color: ' + t.textMuted + '; text-align: center; margin-top: 1rem;">' +
      '<a href="https://maps.google.com/?q=' + encodeUri(d.address + ', ' + d.city + ', ' + d.state) + '" target="_blank" rel="noopener" style="color: ' + t.accent + ';">' + safe(d.address) + '</a></p>'
    : '';
  return '' +
    '<section class="section about" style="background: ' + t.bg + ';">' +
      '<div class="container" style="max-width: 900px;">' +
        '<h2 style="font-family: ' + t.fontHeading + '; color: ' + t.accent + '; margin: 0 0 1.5rem; text-align: center; font-size: 2rem;">About</h2>' +
        '<p style="font-family: ' + t.fontBody + '; color: ' + t.text + '; line-height: 1.8; text-align: center; max-width: 700px; margin: 0 auto; font-size: 1.05rem;">' + bio + '</p>' +
        mapLink +
      '</div>' +
    '</section>';
}

function servicesSection(d: ShopData, t: ThemeVars): string {
  const services = d.services?.length ? d.services : ['Custom Tattoos', 'Cover-ups', 'Fine Line', 'Black & Grey', 'Color Work', 'Consultation'];
  const items = services.map(function(svc) {
    return '<div style="background: ' + t.card + '; border: 1px solid ' + t.border + '; border-radius: ' + t.borderRadius + '; padding: 1.25rem; text-align: center;">' +
      '<span style="font-family: ' + t.fontBody + '; color: ' + t.text + '; font-weight: 500;">' + safe(svc) + '</span></div>';
  }).join('\n');
  return '' +
    '<section class="section services" style="background: ' + t.bgAlt + ';">' +
      '<div class="container" style="max-width: 900px;">' +
        '<h2 style="font-family: ' + t.fontHeading + '; color: ' + t.accent + '; margin: 0 0 2rem; text-align: center; font-size: 2rem;">Services</h2>' +
        '<div class="services-grid">' + items + '</div>' +
      '</div>' +
    '</section>';
}

function instagramSection(handle: string, t: ThemeVars, claimed: boolean, claimUrl: string): string {
  if (!handle) return '';
  const cleanHandle = handle.replace(/^@/, '').trim();
  const embedUrl = 'https://www.instagram.com/' + cleanHandle + '/embed';

  // Show clean embed if claimed, otherwise show with gradient fade + CTA
  const content = claimed ? (
    '<iframe src="' + embedUrl + '" width="100%" height="520" frameborder="0" scrolling="no" allowtransparency="true" loading="lazy" style="display:block;"></iframe>'
  ) : (
    // Unclaimed: show IG profile link + 3 visible rows + CTA overlay
    '<div style="position:relative;">' +
      '<div style="overflow:hidden;max-height:200px;mask-image:linear-gradient(to bottom,black 0%,black 40%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,black 0%,black 40%,transparent 100%);">' +
        '<iframe src="' + embedUrl + '" width="100%" height="520" frameborder="0" scrolling="no" allowtransparency="true" loading="lazy" style="display:block;pointer-events:none;"></iframe>' +
      '</div>' +
      '<div style="position:absolute;bottom:0;left:0;right:0;text-align:center;padding:2rem 1rem 1rem;background:linear-gradient(transparent,' + t.bgAlt + ' 60%);">' +
        '<a href="' + claimUrl + '" style="display:inline-block;background:' + t.accent + ';color:#fff;padding:0.85rem 2rem;border-radius:12px;font-weight:700;font-size:1rem;text-decoration:none;">Claim to see all work →</a>' +
        '<p style="color:' + t.textMuted + ';font-size:0.8rem;margin-top:0.5rem;">This shop\'s Instagram is linked — claim to showcase it</p>' +
      '</div>' +
    '</div>'
  );

  return '' +
    '<section class="section instagram" style="background: ' + t.bgAlt + ';">' +
      '<div class="container" style="max-width:600px;">' +
        '<h2 style="font-family: ' + t.fontHeading + '; color: ' + t.accent + '; margin: 0 0 0.5rem; text-align: center; font-size: 2rem;">Our Work</h2>' +
        '<p style="font-family: ' + t.fontBody + '; color: ' + t.textMuted + '; text-align: center; margin-bottom: 1.5rem; font-size: 0.95rem;">' +
          '<a href="https://instagram.com/' + cleanHandle + '" target="_blank" rel="noopener" style="color: ' + t.accent + '; font-weight: 600;">@' + cleanHandle + '</a> on Instagram</p>' +
        '<div style="border-radius: ' + t.borderRadius + '; overflow: hidden; border: 1px solid ' + t.border + ';">' +
          content +
        '</div>' +
      '</div>' +
    '</section>';
}

function gallerySection(photos: string[], t: ThemeVars, studioName: string): string {
  if (!photos?.length) return '';
  const items = photos.slice(0, 12).map(function(p) {
    return '<a href="' + safe(p) + '" target="_blank" rel="noopener" style="border-radius: ' + t.borderRadius + ';">' +
      '<img src="' + safe(p) + '" alt="Tattoo work at ' + safe(studioName) + '" loading="lazy"></a>';
  }).join('\n');
  return '' +
    '<section class="section gallery" style="background: ' + t.bg + ';">' +
      '<div class="container" style="max-width: 1100px;">' +
        '<h2 style="font-family: ' + t.fontHeading + '; color: ' + t.accent + '; margin: 0 0 2rem; text-align: center; font-size: 2rem;">Work</h2>' +
        '<div class="gallery-grid">' + items + '</div>' +
      '</div>' +
    '</section>';
}

function mapSection(d: ShopData, t: ThemeVars): string {
  if (!d.placeId && !d.address) return '';
  const q = d.placeId ? 'place_id:' + d.placeId : encodeUri(d.address + ', ' + d.city + ', ' + d.state);
  return '' +
    '<section class="section map" style="background: ' + t.bgAlt + ';">' +
      '<div class="container">' +
        '<h2 style="font-family: ' + t.fontHeading + '; color: ' + t.accent + '; margin: 0 0 1.5rem; text-align: center; font-size: 2rem;">Find Us</h2>' +
        '<div style="border-radius: ' + t.borderRadius + '; overflow: hidden; border: 1px solid ' + t.border + ';">' +
          '<iframe width="100%" height="350" style="border:0; display: block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"' +
          ' src="https://maps.google.com/maps?q=' + q + '&t=m&z=14&output=embed"></iframe>' +
        '</div>' +
      '</div>' +
    '</section>';
}

function ctaSection(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const painPoints = [
    { icon: '🔍', label: 'Clients search for you online — your work has no home page', solution: 'Free website with your Instagram work showcased' },
    { icon: '📱', label: 'Clients book through DMs, texts, and phone calls — it\'s chaos', solution: 'Online booking that works 24/7' },
    { icon: '💸', label: '30% of clients don\'t show up — you lose hours and money', solution: 'Deposit-based bookings cut no-shows by 80%' },
  ];
  const painItems = painPoints.map(function(p) {
    return '<div style="display:flex;gap:0.75rem;align-items:flex-start;padding:1rem;border-radius:' + t.borderRadius + ';border:1px solid ' + t.border + ';background:' + t.card + ';">' +
      '<span style="font-size:1.25rem;flex-shrink:0;margin-top:0.1rem;">' + p.icon + '</span>' +
      '<div><p style="font-family:' + t.fontBody + ';color:' + t.text + ';font-size:0.9rem;font-weight:500;line-height:1.4;">' + p.label + '</p>' +
      '<p style="font-family:' + t.fontBody + ';color:' + t.accent + ';font-size:0.8rem;margin-top:0.25rem;">✅ ' + p.solution + '</p></div></div>';
  }).join('\n');

  return '' +
    '<section class="section cta" style="background: ' + t.bgAlt + '; padding: 4rem 2rem;">' +
      '<div class="container" style="max-width: 700px;">' +
        '<h2 style="font-family: ' + t.fontHeading + '; color: ' + t.text + '; font-size: 1.6rem; margin-bottom: 0.5rem; text-align: center;">Your work deserves to be seen</h2>' +
        '<p style="font-family: ' + t.fontBody + '; color: ' + t.textMuted + '; font-size: 1rem; margin-bottom: 1.5rem; text-align: center; line-height: 1.5;">Get a free website, showcase your Instagram, and let clients book directly. No credit card needed.</p>' +
        '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:2rem;">' + painItems + '</div>' +
        '<div style="text-align:center;">' +
          '<a href="https://ink-flows.com" class="btn-primary" style="display:inline-block;padding:1rem 2.5rem;background:' + t.accent + ';color:#fff;text-decoration:none;font-weight:700;font-size:1.05rem;border-radius:' + t.borderRadius + ';">Start Free Trial →</a>' +
          '<p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:0.8rem;margin-top:0.75rem;">Free plan available · No credit card · Join 500+ studios</p>' +
        '</div>' +
      '</div>' +
    '</section>';
}

function footerSection(d: ShopData, t: ThemeVars): string {
  return '' +
    '<footer style="background: ' + t.bgAlt + '; border-top: 1px solid ' + t.border + '; padding: 2rem; text-align: center; font-family: ' + t.fontBody + '; color: ' + t.textMuted + '; font-size: 0.9rem;">' +
      '<p style="margin: 0 0 0.5rem;">' + safe(d.studioName) + ' — ' + safe(d.city) + ', ' + safe(d.state) + '</p>' +
      '<p style="margin: 0;">Powered by <a href="https://ink-flows.com" style="color: ' + t.accent + '; text-decoration: none;">InkFlow</a></p>' +
    '</footer>';
}

function claimBannerEl(d: ShopData, t: ThemeVars, baseUrl: string): string {
  if (d.claimed) return '';
  const claimUrl = baseUrl + '/claim?slug=' + d.slug + '&token=' + d.claimToken;
  return '<div class="claim-banner" style="background: ' + t.accent + '; color: #fff;">' +
    '<span>Is this your shop? Claim it free — add your Instagram to showcase your work</span>' +
    '<a href="' + safe(claimUrl) + '" style="color: #fff; font-weight: 700; text-decoration: underline; margin-left: 0.5rem; white-space: nowrap;">Claim now →</a>' +
  '</div>';
}

// ---- Main Layout ----

function layout(content: string, d: ShopData, t: ThemeVars, baseUrl: string): string {
  const headingFont = t.fontHeading.split("'")[1]?.replace(/ /g, '+') || 'Inter';
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + safe(d.studioName) + ' — ' + safe(d.city) + ' Tattoo Shop</title>\n' +
    '<meta name="description" content="' + safe(d.studioName) + ' — tattoo studio in ' + safe(d.city) + ', ' + safe(d.state) + '. ' +
      (d.rating ? d.rating + ' stars. ' : '') + 'Call ' + safe(d.phone) + ' to book your appointment.">\n' +
    '<meta name="robots" content="index, follow">\n' +
    '<link rel="canonical" href="' + safe(baseUrl) + '/s/' + safe(d.slug) + '">\n' +

    '\n<!-- Open Graph -->\n' +
    '<meta property="og:title" content="' + safe(d.studioName) + ' — ' + safe(d.city) + ' Tattoo Shop">\n' +
    '<meta property="og:description" content="' + safe(d.studioName) + ' — tattoo studio in ' + safe(d.city) + ', ' + safe(d.state) + '. ' +
      (d.phone ? 'Call ' + d.phone : 'Book online') + '.">\n' +
    '<meta property="og:url" content="' + safe(baseUrl) + '/s/' + safe(d.slug) + '">\n' +
    '<meta property="og:type" content="business.business">\n' +
    '<meta property="og:image" content="' + (d.photos?.[0] ? safe(d.photos[0]) : safe(baseUrl) + '/og-tattoo.jpg') + '">\n' +
    '<meta property="og:locale" content="en_US">\n' +

    '\n<!-- Twitter Card -->\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + safe(d.studioName) + ' — ' + safe(d.city) + ' Tattoo Shop">\n' +
    '<meta name="twitter:description" content="' + safe(d.studioName) + ' — tattoo studio in ' + safe(d.city) + ', ' + safe(d.state) + '.">\n' +

    '\n<!-- Schema.org -->\n' +
    '<script type="application/ld+json">' + schemaOrg(d) + '</script>\n' +

    '\n<!-- Fonts -->\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=' + headingFont + ':wght@400;600;700&display=swap" rel="stylesheet">\n' +

    '\n<style>\n' +
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\n' +
    'html{scroll-behavior:smooth}\n' +
    'body{background:' + t.bg + ';color:' + t.text + ';font-family:' + t.fontBody + ';line-height:1.6;-webkit-font-smoothing:antialiased}\n' +
    'a{color:' + t.accent + '}\n' +
    'img{max-width:100%;height:auto;display:block}\n' +
    '.container{max-width:1100px;margin:0 auto;padding:0 1rem}\n' +
    '.section{width:100%;padding:4rem 2rem}\n' +
    '.hero{min-height:60vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:3rem 1.5rem}\n' +
    '.hero-content{max-width:800px;width:100%}\n' +
    '.hero-title{font-size:clamp(2.2rem,6vw,4rem);margin:0 0 0.5rem;letter-spacing:0.02em}\n' +
    '.hero-sub{font-size:1.15rem;margin:0 auto 1.5rem;max-width:600px;line-height:1.6}\n' +
    '.hero-meta{font-size:1rem;display:flex;gap:1.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:1.5rem}\n' +
    '.hero-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}\n' +
    '.btn-primary{display:inline-block;padding:0.85rem 2rem;background:' + t.accent + ';color:#fff;text-decoration:none;font-weight:600;font-size:1rem;border-radius:' + t.borderRadius + ';transition:background .2s,transform .15s;min-height:44px;display:inline-flex;align-items:center;justify-content:center}\n' +
    '.btn-primary:hover{background:' + t.accentHover + ';transform:translateY(-1px)}\n' +
    '.services-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}\n' +
    '.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem}\n' +
    '.gallery-grid a{display:block;overflow:hidden;border-radius:' + t.borderRadius + '}\n' +
    '.gallery-grid img{width:100%;height:250px;object-fit:cover;transition:transform .3s}\n' +
    '.gallery-grid img:hover{transform:scale(1.05)}\n' +
    '.claim-banner{position:sticky;top:0;z-index:100;padding:0.75rem 1rem;text-align:center;font-size:0.95rem;font-family:' + t.fontBody + '}\n' +
    '.cta-card{display:flex;gap:0.75rem;align-items:flex-start;padding:1rem;border-radius:' + t.borderRadius + ';border:1px solid ' + t.border + ';background:' + t.card + '}\n' +

    '\n/* Tablet */\n' +
    '@media(min-width:640px) and (max-width:1024px){\n' +
    '.hero{min-height:50vh;padding:4rem 2rem}\n' +
    '.services-grid{grid-template-columns:repeat(3,1fr)}\n' +
    '.gallery-grid{grid-template-columns:repeat(2,1fr)}\n' +
    '.gallery-grid img{height:220px}\n' +
    '}\n' +

    '\n/* Phone */\n' +
    '@media(max-width:639px){\n' +
    '.hero{padding:3rem 1rem;min-height:auto}\n' +
    '.hero-title{font-size:1.8rem!important}\n' +
    '.hero-sub{font-size:1rem!important}\n' +
    '.hero-meta{flex-direction:column;align-items:center;gap:0.5rem!important}\n' +
    '.hero-actions{flex-direction:column;align-items:stretch}\n' +
    '.hero-actions a{text-align:center}\n' +
    '.section{padding:2.5rem 1rem!important}\n' +
    '.services-grid{grid-template-columns:repeat(2,1fr);gap:0.75rem}\n' +
    '.services-grid div{padding:1rem!important}\n' +
    '.gallery-grid{grid-template-columns:1fr}\n' +
    '.gallery-grid img{height:200px}\n' +
    '.claim-banner{font-size:0.85rem;padding:0.6rem 0.75rem}\n' +
    '.claim-banner a{display:block;margin:0.3rem 0 0!important}\n' +
    '.cta .cta-card{flex-direction:column;gap:0.5rem}\n' +
    '}\n' +

    '\n/* Desktop */\n' +
    '@media(min-width:1025px){\n' +
    '.services-grid{grid-template-columns:repeat(3,1fr)}\n' +
    '.gallery-grid{grid-template-columns:repeat(3,1fr)}\n' +
    '}\n' +
    '</style>\n</head>\n<body>\n' + content + '\n</body>\n</html>';
}

// ---- Public API ----

export function renderShopPage(d: ShopData, baseUrl: string): string {
  const t = THEMES[d.template] || THEMES.traditional;
  const sections = [
    claimBannerEl(d, t, baseUrl),
    heroSection(d, t),
    bookingSection(d, t),
    aboutSection(d, t),
    servicesSection(d, t),
    instagramSection(d.instagram || '', t, d.claimed, baseUrl + '/claim?slug=' + d.slug + '&token=' + d.claimToken),
    gallerySection(d.photos, t, d.studioName),
    mapSection(d, t),
    ctaSection(d, t, baseUrl),
    footerSection(d, t),
  ];
  return layout(sections.join('\n'), d, t, baseUrl);
}

export const ALL_TEMPLATES = [
  { id: 'minimal', name: 'Minimal', tier: 'free', desc: 'Clean white, timeless' },
  { id: 'traditional', name: 'Traditional', tier: 'free', desc: 'Bold American red' },
  { id: 'vintage', name: 'Vintage', tier: 'free', desc: 'Warm retro feel' },
  { id: 'moody', name: 'Moody', tier: 'free', desc: 'Dark with gold' },
  { id: 'edgy', name: 'Edgy', tier: 'pro', desc: 'Neon pink on black' },
  { id: 'studio', name: 'Studio', tier: 'pro', desc: 'Gallery warm tones' },
  { id: 'brutalist', name: 'Brutalist', tier: 'pro', desc: 'Heavy black & white' },
  { id: 'nature', name: 'Nature', tier: 'pro', desc: 'Forest green' },
  { id: 'royal', name: 'Royal', tier: 'pro', desc: 'Deep purple & gold' },
  { id: 'neon', name: 'Neon', tier: 'pro', desc: 'Cyan on dark' },
  { id: 'industrial', name: 'Industrial', tier: 'plus', desc: 'Steel & concrete' },
  { id: 'woodcut', name: 'Woodcut', tier: 'plus', desc: 'Dark print-like' },
  { id: 'watercolor', name: 'Watercolor', tier: 'plus', desc: 'Soft pastels' },
  { id: 'gothic', name: 'Gothic', tier: 'plus', desc: 'Ornate dark' },
  { id: 'coastal', name: 'Coastal', tier: 'plus', desc: 'Light & breezy' },
  { id: 'urban', name: 'Urban', tier: 'plus', desc: 'Graffiti bold' },
  { id: 'japanese', name: 'Japanese', tier: 'pro', desc: 'Traditional irezumi red' },
  { id: 'midnight', name: 'Midnight', tier: 'free', desc: 'Deep blue night' },
  { id: 'cyberpunk', name: 'Cyberpunk', tier: 'pro', desc: 'Neon magenta cyber' },
  { id: 'botanical', name: 'Botanical', tier: 'free', desc: 'Sage green' },
  { id: 'metallic', name: 'Metallic', tier: 'plus', desc: 'Silver chrome' },
  { id: 'sunset', name: 'Sunset', tier: 'pro', desc: 'Warm orange glow' },
  { id: 'sakura', name: 'Sakura', tier: 'pro', desc: 'Cherry blossom pink' },
  { id: 'tribal', name: 'Tribal', tier: 'free', desc: 'Black & grey' },
  { id: 'steampunk', name: 'Steampunk', tier: 'plus', desc: 'Brass & bronze' },
  { id: 'arctic', name: 'Arctic', tier: 'free', desc: 'Cool ice blue' },
  { id: 'desert', name: 'Desert', tier: 'free', desc: 'Warm desert tones' },
  { id: 'punk', name: 'Punk', tier: 'pro', desc: 'High-contrast yellow' },
  { id: 'celestial', name: 'Celestial', tier: 'plus', desc: 'Gold on midnight' },
  { id: 'neonoir', name: 'Neonoir', tier: 'pro', desc: 'Red noir dramatic' },
  { id: 'lavender', name: 'Lavender', tier: 'free', desc: 'Soft purple' },
  { id: 'biomechanical', name: 'Biomechanical', tier: 'pro', desc: 'Metallic red & grey' },
  { id: 'chicano', name: 'Chicano', tier: 'pro', desc: 'Warm brown & gold' },
  { id: 'maori', name: 'Maori', tier: 'free', desc: 'Tribal red & black' },
  { id: 'trash-polka', name: 'Trash Polka', tier: 'plus', desc: 'Collage red chaos' },
  { id: 'new-school', name: 'New School', tier: 'pro', desc: 'Bright neon cartoon' },
  { id: 'halloween', name: 'Halloween', tier: 'free', desc: 'Orange & black' },
  { id: 'nordic', name: 'Nordic', tier: 'free', desc: 'Cool steel blue' },
  { id: 'tropical', name: 'Tropical', tier: 'pro', desc: 'Coral & teal' },
  { id: 'monochrome', name: 'Monochrome', tier: 'free', desc: 'Clean grey scale' },
  { id: 'retro-wave', name: 'Retro Wave', tier: 'plus', desc: '80s sunset neon' },
];

/** Guess template from photo style keywords (lightweight — no API call) */
export function guessTemplate(photos: string[], name: string): string {
  const n = name.toLowerCase();
  if (/traditional|american|old.school|flash|bold/i.test(n)) return 'traditional';
  if (/minimal|fine.line|clean|modern|pure/i.test(n)) return 'minimal';
  if (/dark|blackwork|shadow|goth|noir|iron/i.test(n)) return 'moody';
  if (/vintage|retro|golden|rose|old|heritage/i.test(n)) return 'vintage';
  if (/edgy|skull|flame|dragon|tiger|red|fire/i.test(n)) return 'edgy';
  if (/studio|gallery|art|collective/i.test(n)) return 'studio';
  if (/black|ink/i.test(n)) return 'brutalist';
  if (/green|nature|forest|leaf/i.test(n)) return 'nature';
  if (/royal|king|queen|crown|purple/i.test(n)) return 'royal';
  if (/neon|cyber|glow|electric/i.test(n)) return 'neon';
  if (/steel|iron|industrial|forge/i.test(n)) return 'industrial';
  if (/wood|carve|print|etch/i.test(n)) return 'woodcut';
  if (/water|color|custom|artistic/i.test(n)) return 'watercolor';
  if (/coastal|beach|ocean|wave|blue/i.test(n)) return 'coastal';
  if (/urban|city|street|graf/i.test(n)) return 'urban';
  if (/japan|irezumi|oriental|tokyo/i.test(n)) return 'japanese';
  if (/midnight|night|dark.blue|star/i.test(n)) return 'midnight';
  if (/cyber|futur|tech|digital/i.test(n)) return 'cyberpunk';
  if (/leaf|forest|garden|herb/i.test(n)) return 'botanical';
  if (/chrome|silver|metal|shiny|reflective/i.test(n)) return 'metallic';
  if (/sunset|dusk|orange|golden.hour/i.test(n)) return 'sunset';
  if (/cherry|blossom|pink|sakura|floral/i.test(n)) return 'sakura';
  if (/tribal|maori|polynesian|samoan/i.test(n)) return 'tribal';
  if (/steampunk|brass|bronze|gear|clockwork/i.test(n)) return 'steampunk';
  if (/ice|arctic|snow|frozen|glacier/i.test(n)) return 'arctic';
  if (/desert|cactus|southwest|sand/i.test(n)) return 'desert';
  if (/punk|grunge|anarchy|safety/i.test(n)) return 'punk';
  if (/celestial|astral|cosmic|galaxy|moon/i.test(n)) return 'celestial';
  if (/noir|film|dramatic|shadow.play/i.test(n)) return 'neonoir';
  if (/lavender|purple|violet|pastel.soft/i.test(n)) return 'lavender';
  if (/bio|mech|robot|cyborg|organic/i.test(n)) return 'biomechanical';
  if (/chicano|mexican|lowrider|script/i.test(n)) return 'chicano';
  if (/maori|tribal.curve|spiral|koru/i.test(n)) return 'maori';
  if (/trash|polka|collage|chaos|surreal/i.test(n)) return 'trash-polka';
  if (/new.school|cartoon|comic|fun|playful|bubble/i.test(n)) return 'new-school';
  if (/halloween|spooky|horror|bat|pumpkin/i.test(n)) return 'halloween';
  if (/nordic|viking|scandi|fjord|minimal.cold/i.test(n)) return 'nordic';
  if (/tropical|island|palm|beach|tiki|coral/i.test(n)) return 'tropical';
  if (/mono|greyscale|grayscale|black.white|no.color/i.test(n)) return 'monochrome';
  if (/retro|wave|80s|vapor|synth|neon.pastel/i.test(n)) return 'retro-wave';
  return 'minimal';
}

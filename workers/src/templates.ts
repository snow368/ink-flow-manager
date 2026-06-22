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
  /** Layout pattern: classic | hero-grid | link-bio | studio-roster | cards | split | editorial | minimal-bar */
  layout?: string;
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

function heroSection(d: ShopData, t: ThemeVars, baseUrl: string): string {
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

function bookingSection(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const bookUrl = baseUrl + '/book?slug=' + d.slug + '&embed=1&studio=' + encodeUri(d.studioName);
  return '' +
    '<section class="section booking" id="booking" style="background: ' + t.bgAlt + ';">' +
      '<div class="container" style="max-width: 700px; text-align: center;">' +
        '<h2 style="font-family: ' + t.fontHeading + '; color: ' + t.accent + '; margin: 0 0 0.5rem; text-align: center; font-size: 2rem;">Book an Appointment</h2>' +
        '<p style="font-family: ' + t.fontBody + '; color: ' + t.textMuted + '; margin-bottom: 1.5rem; font-size: 0.95rem;">Powered by InkFlow — deposits, reminders, and instant confirmation.</p>' +
        '<iframe src="' + safe(bookUrl) + '" width="100%" height="600" frameborder="0" style="border-radius:' + t.borderRadius + ';border:1px solid ' + t.border + ';background:' + t.bg + ';" loading="lazy" allow="payment" title="Book an appointment"></iframe>' +
      '</div>' +
    '</section>';
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
  const configKey = TEMPLATE_LAYOUTS[d.template] || 'classic';

  // Special layouts that have custom render functions
  if (configKey === 'link-bio' || configKey === 'link-bio-min') {
    return layout(renderLinkBioContent(d, t, baseUrl), d, t, baseUrl);
  }

  const config = LAYOUT_CONFIGS[configKey];
  if (!config) {
    // Fallback: use classic layout
    const sections = [claimBannerEl(d, t, baseUrl), heroSection(d, t, baseUrl), bookingSection(d, t, baseUrl), aboutSection(d, t), servicesSection(d, t), instagramSection(d.instagram || '', t, d.claimed, baseUrl + '/claim?slug=' + d.slug + '&token=' + d.claimToken), gallerySection(d.photos, t, d.studioName), mapSection(d, t), ctaSection(d, t, baseUrl), footerSection(d, t)];
    return layout(sections.join('\n'), d, t, baseUrl);
  }

  return renderFromConfig(d, t, baseUrl, config);
}

/** Classic single-page scroll (existing) */
function renderClassicLayout(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const sections = [
    claimBannerEl(d, t, baseUrl),
    heroSection(d, t, baseUrl),
    bookingSection(d, t, baseUrl),
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

/** Hero + large gallery grid */
function renderHeroGrid(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const sections = [
    claimBannerEl(d, t, baseUrl),
    heroSectionFull(d, t, baseUrl),
    gallerySectionBig(d.photos, t, d.studioName),
    servicesSection(d, t),
    instagramSection(d.instagram || '', t, d.claimed, baseUrl + '/claim?slug=' + d.slug + '&token=' + d.claimToken),
    mapSection(d, t),
    ctaSection(d, t, baseUrl),
    footerMinimal(d, t),
  ];
  return layout(sections.join('\n'), d, t, baseUrl);
}

/** Link-in-bio (Linktree style) */
function renderLinkBio(d: ShopData, t: ThemeVars, baseUrl: string): string {
  return layout(renderLinkBioContent(d, t, baseUrl), d, t, baseUrl);
}

/** Multi-artist studio roster */
function renderStudioRoster(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const sections = [
    claimBannerEl(d, t, baseUrl),
    heroSectionCompact(d, t, baseUrl),
    artistsSection(d, t),
    servicesSection(d, t),
    gallerySection(d.photos, t, d.studioName),
    bookingSection(d, t, baseUrl),
    ctaSection(d, t, baseUrl),
    footerSection(d, t),
  ];
  return layout(sections.join('\n'), d, t, baseUrl);
}

/** Card-based everything */
function renderCardsLayout(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const sections = [
    claimBannerEl(d, t, baseUrl),
    heroSectionCompact(d, t, baseUrl),
    servicesCards(d, t),
    galleryCards(d.photos, t, d.studioName),
    mapSection(d, t),
    ctaCard(d, t, baseUrl),
    footerSection(d, t),
  ];
  return layout(sections.join('\n'), d, t, baseUrl);
}

/** Split screen sections */
function renderSplitLayout(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const sections = [
    claimBannerEl(d, t, baseUrl),
    heroSectionSplit(d, t, baseUrl),
    aboutSection(d, t),
    gallerySection(d.photos, t, d.studioName),
    bookingSection(d, t, baseUrl),
    ctaSection(d, t, baseUrl),
    footerSection(d, t),
  ];
  return layout(sections.join('\n'), d, t, baseUrl);
}

/** Editorial / magazine style */
function renderEditorialLayout(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const sections = [
    claimBannerEl(d, t, baseUrl),
    heroSectionEditorial(d, t, baseUrl),
    aboutSection(d, t),
    gallerySection(d.photos, t, d.studioName),
    instagramSection(d.instagram || '', t, d.claimed, baseUrl + '/claim?slug=' + d.slug + '&token=' + d.claimToken),
    ctaSection(d, t, baseUrl),
    footerSection(d, t),
  ];
  return layout(sections.join('\n'), d, t, baseUrl);
}

/** Minimal with sticky bottom bar */
function renderMinimalBar(d: ShopData, t: ThemeVars, baseUrl: string): string {
  return layout(renderMinimalBarContent(d, t, baseUrl), d, t, baseUrl);
}

// ---- New section variants ----

function heroSectionFull(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const bgImage = d.photos?.[0] ? 'background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(' + safe(d.photos[0]) + '); background-size: cover; background-position: center; background-attachment: fixed;' : 'background: ' + t.bgAlt + ';';
  return '<section class="hero" style="min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;' + bgImage + '"><div class="hero-content" style="max-width:800px;padding:2rem;"><h1 style="font-family:' + t.fontHeading + ';font-size:clamp(2.5rem,7vw,4.5rem);color:#fff;margin:0 0 0.5rem">' + safe(d.studioName) + '</h1>' + (d.bio ? '<p style="font-family:' + t.fontBody + ';font-size:1.2rem;color:rgba(255,255,255,0.85);margin:0 auto 1.5rem;max-width:600px">' + safe(d.bio) + '</p>' : '') + '<a href="' + safe(baseUrl) + '/book?slug=' + d.slug + '&embed=1" class="btn-primary" style="display:inline-block;padding:1rem 2.5rem;background:' + t.accent + ';color:#fff;text-decoration:none;font-weight:700;font-size:1.1rem;border-radius:50px;min-height:44px">Book Appointment</a></div></section>';
}

function heroSectionCompact(d: ShopData, t: ThemeVars, baseUrl: string): string {
  return '<section style="padding:4rem 2rem;text-align:center;background:' + t.bg + '"><h1 style="font-family:' + t.fontHeading + ';font-size:clamp(2rem,5vw,3rem);color:' + t.text + ';margin:0">' + safe(d.studioName) + '</h1>' + (d.rating ? '<div style="color:' + t.starColor + ';font-size:1.2rem;margin-top:0.5rem">' + stars(d.rating) + ' ' + d.rating + '</div>' : '') + (d.phone ? '<a href="tel:' + safe(d.phone) + '" style="display:inline-block;margin-top:1rem;padding:0.75rem 2rem;background:' + t.accent + ';color:#fff;text-decoration:none;border-radius:' + t.borderRadius + ';font-weight:600">Call Now</a>' : '') + '</section>';
}

function heroSectionSplit(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const bgImage = d.photos?.[0] ? 'url(' + safe(d.photos[0]) + ')' : t.bgAlt;
  return '<section style="display:grid;grid-template-columns:1fr 1fr;min-height:70vh">' +
    '<div style="background:linear-gradient(rgba(0,0,0,0.2),rgba(0,0,0,0.5)),' + bgImage + ';background-size:cover;background-position:center"></div>' +
    '<div style="display:flex;flex-direction:column;justify-content:center;padding:3rem;background:' + t.bg + ';color:' + t.text + '">' +
    '<h1 style="font-family:' + t.fontHeading + ';font-size:clamp(2rem,4vw,3.5rem);margin:0 0 1rem">' + safe(d.studioName) + '</h1>' +
    '<p style="font-family:' + t.fontBody + ';font-size:1rem;color:' + t.textMuted + ';margin-bottom:1.5rem">' + (d.bio || 'Professional tattoo studio serving ' + safe(d.city) + '.') + '</p>' +
    '</div></section>';
}

function heroSectionEditorial(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const bgImage = d.photos?.[0] ? 'background-image: url(' + safe(d.photos[0]) + '); background-size: cover; background-position: center;' : 'background: ' + t.bgAlt + ';';
  return '<section style="position:relative;min-height:90vh;' + bgImage + 'display:flex;align-items:flex-end"><div style="padding:3rem 2rem;background:linear-gradient(transparent,' + t.bg + ');width:100%"><h1 style="font-family:' + t.fontHeading + ';font-size:clamp(2.5rem,6vw,4rem);color:' + t.text + ';margin:0">' + safe(d.studioName) + '</h1><p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:1.1rem;margin-top:0.5rem">' + safe(d.city) + ', ' + safe(d.state) + '</p></div></section>';
}

function artistsSection(d: ShopData, t: ThemeVars): string {
  return '<section style="padding:4rem 2rem;background:' + t.bgAlt + '"><div style="max-width:900px;margin:0 auto"><h2 style="font-family:' + t.fontHeading + ';color:' + t.accent + ';text-align:center;font-size:2rem;margin:0 0 2rem">Our Artists</h2>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.5rem">' +
    [1,2,3].map(i => '<div style="background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:' + t.borderRadius + ';padding:2rem;text-align:center"><div style="width:80px;height:80px;border-radius:50%;background:' + t.border + ';margin:0 auto 1rem"></div><h3 style="font-family:' + t.fontBody + ';color:' + t.text + ';font-size:1.1rem;margin:0 0 0.25rem">Artist ' + i + '</h3><p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:0.85rem;margin:0">Specialist in custom work</p></div>').join('\n') +
    '</div></div></section>';
}

function servicesCards(d: ShopData, t: ThemeVars): string {
  const services = d.services?.length ? d.services : ['Custom Tattoos', 'Cover-ups', 'Fine Line', 'Black & Grey', 'Color Work', 'Consultation'];
  return '<section style="padding:4rem 2rem;background:' + t.bg + '"><div style="max-width:1000px;margin:0 auto"><h2 style="font-family:' + t.fontHeading + ';color:' + t.accent + ';text-align:center;font-size:2rem;margin:0 0 2rem">Services</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem">' + services.map(s => '<div style="background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:16px;padding:2rem;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.15)"><div style="width:48px;height:48px;border-radius:50%;background:' + t.accent + '20;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.5rem">✦</div><h3 style="font-family:' + t.fontBody + ';color:' + t.text + ';font-size:1rem;margin:0">' + safe(s) + '</h3></div>').join('') + '</div></div></section>';
}

function gallerySectionBig(photos: string[], t: ThemeVars, studioName: string): string {
  if (!photos?.length) return '';
  return '<section style="padding:3rem 1rem;background:' + t.bg + '"><div style="max-width:1200px;margin:0 auto"><h2 style="font-family:' + t.fontHeading + ';color:' + t.accent + ';text-align:center;font-size:2rem;margin:0 0 1.5rem">Our Work</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;grid-auto-flow:dense">' + photos.slice(0, 12).map((p, i) => '<a href="' + safe(p) + '" style="grid-row:span ' + (i % 3 === 0 ? 2 : 1) + ';border-radius:12px;overflow:hidden;display:block"><img src="' + safe(p) + '" alt="" style="width:100%;height:100%;object-fit:cover;transition:transform .3s" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'"></a>').join('\n') + '</div></div></section>';
}

function galleryCards(photos: string[], t: ThemeVars, studioName: string): string {
  if (!photos?.length) return '';
  return '<section style="padding:4rem 2rem;background:' + t.bgAlt + '"><div style="max-width:1000px;margin:0 auto"><h2 style="font-family:' + t.fontHeading + ';color:' + t.accent + ';text-align:center;font-size:2rem;margin:0 0 2rem">Portfolio</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1.5rem">' + photos.slice(0, 8).map(p => '<div style="background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:16px;overflow:hidden;padding:0.75rem"><img src="' + safe(p) + '" alt="" style="width:100%;height:200px;object-fit:cover;border-radius:12px"><p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:0.8rem;margin:0.5rem 0 0;text-align:center;padding:0.25rem">Tattoo at ' + safe(studioName) + '</p></div>').join('\n') + '</div></div></section>';
}

function ctaCard(d: ShopData, t: ThemeVars, baseUrl: string): string {
  return '<section style="padding:4rem 2rem;text-align:center;background:' + t.bg + '"><div style="max-width:500px;margin:0 auto;background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:20px;padding:3rem 2rem"><h2 style="font-family:' + t.fontHeading + ';color:' + t.text + ';font-size:1.6rem;margin:0 0 0.5rem">Ready to Book?</h2><p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';margin-bottom:1.5rem;font-size:0.95rem">Book your appointment online — deposits and reminders included.</p><a href="' + safe(baseUrl) + '/book?slug=' + d.slug + '&embed=1" style="display:inline-block;padding:1rem 2rem;background:' + t.accent + ';color:#fff;text-decoration:none;border-radius:' + t.borderRadius + ';font-weight:700">Book Now</a></div></section>';
}

function footerMinimal(d: ShopData, t: ThemeVars, baseUrl: string): string {
  return '<footer style="padding:1.5rem;text-align:center;background:' + t.bg + ';border-top:1px solid ' + t.border + ';font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:0.85rem">' + safe(d.studioName) + ' &mdash; ' + safe(d.city) + ', ' + safe(d.state) + ' &middot; <a href="' + safe(baseUrl) + '" style="color:' + t.accent + ';text-decoration:none">InkFlow</a></footer>';
}

function renderLinkBioContent(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const links = [
    { label: 'Book Appointment', url: baseUrl + '/book?slug=' + d.slug + '&embed=1', icon: '📅' },
    { label: 'View Portfolio', url: baseUrl + '/s/' + d.slug, icon: '🖼️' },
  ];
  if (d.instagram) links.push({ label: 'Instagram', url: 'https://instagram.com/' + d.instagram.replace(/^@/, ''), icon: '📸' });
  if (d.phone) links.push({ label: 'Call ' + d.phone, url: 'tel:' + d.phone, icon: '📞' });
  if (d.address) links.push({ label: 'Get Directions', url: 'https://maps.google.com/?q=' + encodeUri(d.address + ', ' + d.city + ', ' + d.state), icon: '📍' });

  return claimBannerEl(d, t, baseUrl) +
    '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;background:' + t.bg + '">' +
    '<div style="width:80px;height:80px;border-radius:50%;background:' + t.card + ';border:3px solid ' + t.accent + ';display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:' + t.accent + ';margin-bottom:1rem">' + (d.studioName.charAt(0)) + '</div>' +
    '<h1 style="font-family:' + t.fontHeading + ';color:' + t.text + ';font-size:1.4rem;margin:0;text-align:center">' + safe(d.studioName) + '</h1>' +
    '<p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:0.9rem;margin:0.25rem 0 1.5rem;text-align:center">' + safe(d.city) + ', ' + safe(d.state) + (d.rating ? ' &middot; ' + stars(d.rating) + ' ' + d.rating : '') + '</p>' +
    '<div style="display:flex;flex-direction:column;gap:0.75rem;width:100%;max-width:400px">' + links.map(l => '<a href="' + safe(l.url) + '" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:0.75rem;padding:1rem 1.25rem;background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:14px;text-decoration:none;color:' + t.text + ';font-family:' + t.fontBody + ';font-weight:500;font-size:0.95rem;transition:transform .15s" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'"><span style="font-size:1.2rem">' + l.icon + '</span><span style="flex:1">' + l.label + '</span><span style="color:' + t.textMuted + '">→</span></a>').join('\n') + '</div>' +
    '<p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:0.75rem;margin-top:2rem">Powered by <a href="https://ink-flows.com" style="color:' + t.accent + ';text-decoration:none">InkFlow</a></p></div>';
}

function renderMinimalBarContent(d: ShopData, t: ThemeVars, baseUrl: string): string {
  const bgImage = d.photos?.[0] ? 'background-image: url(' + safe(d.photos[0]) + '); background-size: cover; background-position: center;' : 'background: ' + t.bgAlt + ';';
  return claimBannerEl(d, t, baseUrl) +
    '<div style="padding-bottom:80px;min-height:100vh;' + bgImage + 'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem 2rem 6rem">' +
    '<h1 style="font-family:' + t.fontHeading + ';color:' + t.text + ';font-size:clamp(1.8rem,4vw,2.5rem);text-shadow:0 2px 10px rgba(0,0,0,0.3)">' + safe(d.studioName) + '</h1>' +
    (d.bio ? '<p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';max-width:400px;margin:0.5rem auto 1.5rem">' + safe(d.bio) + '</p>' : '') +
    '</div>' +
    '<div style="position:fixed;bottom:0;left:0;right:0;background:' + t.card + ';border-top:1px solid ' + t.border + ';padding:0.75rem 1rem;display:flex;gap:0.5rem;justify-content:center;z-index:100">' +
    (d.phone ? '<a href="tel:' + safe(d.phone) + '" style="flex:1;padding:0.75rem;background:' + t.accent + ';color:#fff;text-decoration:none;border-radius:' + t.borderRadius + ';font-weight:600;text-align:center;font-size:0.9rem">📞 Call</a>' : '') +
    '<a href="' + safe(baseUrl) + '/book?slug=' + d.slug + '&embed=1" style="flex:2;padding:0.75rem;background:' + t.accent + ';color:#fff;text-decoration:none;border-radius:' + t.borderRadius + ';font-weight:600;text-align:center;font-size:0.9rem">📅 Book Now</a>' +
    (d.instagram ? '<a href="https://instagram.com/' + d.instagram.replace(/^@/, '') + '" style="flex:1;padding:0.75rem;border:1px solid ' + t.border + ';color:' + t.text + ';text-decoration:none;border-radius:' + t.borderRadius + ';font-weight:500;text-align:center;font-size:0.9rem">📸 IG</a>' : '') +
    '</div>';
}

export const ALL_TEMPLATES = [
  // === classic (single page scroll) — 5 ===
  { id: 'minimal', name: 'Minimal', tier: 'free', desc: 'Clean white, timeless', layout: 'classic' },
  { id: 'vintage', name: 'Vintage', tier: 'free', desc: 'Warm retro feel', layout: 'classic' },
  { id: 'moody', name: 'Moody', tier: 'free', desc: 'Dark with gold', layout: 'classic' },
  { id: 'desert', name: 'Desert', tier: 'free', desc: 'Warm desert tones', layout: 'classic' },
  { id: 'retro-wave', name: 'Retro Wave', tier: 'plus', desc: '80s sunset neon', layout: 'classic' },

  // === hero-grid (full hero + masonry gallery) — 5 ===
  { id: 'studio', name: 'Studio', tier: 'pro', desc: 'Gallery warm tones', layout: 'hero-grid' },
  { id: 'coastal', name: 'Coastal', tier: 'plus', desc: 'Light & breezy', layout: 'hero-grid' },
  { id: 'arctic', name: 'Arctic', tier: 'free', desc: 'Cool ice blue', layout: 'hero-grid' },
  { id: 'watercolor', name: 'Watercolor', tier: 'plus', desc: 'Soft pastels', layout: 'hero-grid' },
  { id: 'lavender', name: 'Lavender', tier: 'free', desc: 'Soft purple', layout: 'hero-grid' },

  // === link-bio (Linktree style) — 5 ===
  { id: 'brutalist', name: 'Brutalist', tier: 'pro', desc: 'Heavy black & white', layout: 'link-bio' },
  { id: 'tribal', name: 'Tribal', tier: 'free', desc: 'Black & grey', layout: 'link-bio' },
  { id: 'punk', name: 'Punk', tier: 'pro', desc: 'High-contrast yellow', layout: 'link-bio' },
  { id: 'maori', name: 'Maori', tier: 'free', desc: 'Tribal red & black', layout: 'link-bio' },
  { id: 'monochrome', name: 'Monochrome', tier: 'free', desc: 'Clean grey scale', layout: 'link-bio' },

  // === studio-roster (multi-artist cards) — 5 ===
  { id: 'traditional', name: 'Traditional', tier: 'free', desc: 'Bold American red', layout: 'studio-roster' },
  { id: 'nature', name: 'Nature', tier: 'pro', desc: 'Forest green', layout: 'studio-roster' },
  { id: 'woodcut', name: 'Woodcut', tier: 'plus', desc: 'Dark print-like', layout: 'studio-roster' },
  { id: 'botanical', name: 'Botanical', tier: 'free', desc: 'Sage green', layout: 'studio-roster' },
  { id: 'tropical', name: 'Tropical', tier: 'pro', desc: 'Coral & teal', layout: 'studio-roster' },

  // === cards (card-based everything) — 5 ===
  { id: 'edgy', name: 'Edgy', tier: 'pro', desc: 'Neon pink on black', layout: 'cards' },
  { id: 'neon', name: 'Neon', tier: 'pro', desc: 'Cyan on dark', layout: 'cards' },
  { id: 'metallic', name: 'Metallic', tier: 'plus', desc: 'Silver chrome', layout: 'cards' },
  { id: 'cyberpunk', name: 'Cyberpunk', tier: 'pro', desc: 'Neon magenta cyber', layout: 'cards' },
  { id: 'new-school', name: 'New School', tier: 'pro', desc: 'Bright neon cartoon', layout: 'cards' },

  // === split (split screen sections) — 5 ===
  { id: 'royal', name: 'Royal', tier: 'pro', desc: 'Deep purple & gold', layout: 'split' },
  { id: 'midnight', name: 'Midnight', tier: 'free', desc: 'Deep blue night', layout: 'split' },
  { id: 'celestial', name: 'Celestial', tier: 'plus', desc: 'Gold on midnight', layout: 'split' },
  { id: 'sunset', name: 'Sunset', tier: 'pro', desc: 'Warm orange glow', layout: 'split' },
  { id: 'chicano', name: 'Chicano', tier: 'pro', desc: 'Warm brown & gold', layout: 'split' },

  // === editorial (magazine style) — 5 ===
  { id: 'gothic', name: 'Gothic', tier: 'plus', desc: 'Ornate dark', layout: 'editorial' },
  { id: 'japanese', name: 'Japanese', tier: 'pro', desc: 'Traditional irezumi red', layout: 'editorial' },
  { id: 'steampunk', name: 'Steampunk', tier: 'plus', desc: 'Brass & bronze', layout: 'editorial' },
  { id: 'neonoir', name: 'Neonoir', tier: 'pro', desc: 'Red noir dramatic', layout: 'editorial' },
  { id: 'halloween', name: 'Halloween', tier: 'free', desc: 'Orange & black', layout: 'editorial' },

  // === minimal-bar (sticky bottom bar) — 5 ===
  { id: 'industrial', name: 'Industrial', tier: 'plus', desc: 'Steel & concrete', layout: 'minimal-bar' },
  { id: 'urban', name: 'Urban', tier: 'plus', desc: 'Graffiti bold', layout: 'minimal-bar' },
  { id: 'sakura', name: 'Sakura', tier: 'pro', desc: 'Cherry blossom pink', layout: 'minimal-bar' },
  { id: 'biomechanical', name: 'Biomechanical', tier: 'pro', desc: 'Metallic red & grey', layout: 'minimal-bar' },
  { id: 'trash-polka', name: 'Trash Polka', tier: 'plus', desc: 'Collage red chaos', layout: 'minimal-bar' },

  // === extra (traditional kept, plus nordic) — 1 ===
  { id: 'nordic', name: 'Nordic', tier: 'free', desc: 'Cool steel blue', layout: 'classic' },
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

// ============================================================
// Section-based template composition system
// Each template = an array of section types that get assembled
// ============================================================

type SectionType =
  | 'hero' | 'hero-full' | 'hero-split' | 'hero-compact' | 'hero-editorial' | 'hero-centered' | 'hero-minimal'
  | 'gallery' | 'gallery-big' | 'gallery-cards'
  | 'services' | 'services-cards'
  | 'booking' | 'booking-compact'
  | 'about' | 'about-minimal'
  | 'instagram'
  | 'map'
  | 'cta' | 'cta-card' | 'cta-bar'
  | 'footer' | 'footer-minimal' | 'footer-bar'
  | 'artists'
  | 'stats'
  | 'reviews'
  | 'process';

interface LayoutConfig {
  sections: SectionType[];
  desc: string;
}

function renderSection(section: SectionType, d: ShopData, t: ThemeVars, baseUrl: string, i: number, total: number): string {
  switch (section) {
    case 'hero': return heroSection(d, t, baseUrl);
    case 'hero-full': return heroSectionFull(d, t, baseUrl);
    case 'hero-split': return heroSectionSplit(d, t, baseUrl);
    case 'hero-compact': return heroSectionCompact(d, t, baseUrl);
    case 'hero-editorial': return heroSectionEditorial(d, t, baseUrl);
    case 'hero-centered': return heroSectionCentered(d, t);
    case 'hero-minimal': return heroSectionMinimal(d, t);
    case 'gallery': return gallerySection(d.photos, t, d.studioName);
    case 'gallery-big': return gallerySectionBig(d.photos, t, d.studioName);
    case 'gallery-cards': return galleryCards(d.photos, t, d.studioName);
    case 'services': return servicesSection(d, t);
    case 'services-cards': return servicesCards(d, t);
    case 'booking': return bookingSection(d, t, baseUrl);
    case 'booking-compact': return bookingSectionCompact(d, t, baseUrl);
    case 'about': return aboutSection(d, t);
    case 'about-minimal': return aboutSectionMinimal(d, t);
    case 'instagram': return instagramSection(d.instagram || '', t, d.claimed, baseUrl + '/claim?slug=' + d.slug + '&token=' + d.claimToken);
    case 'map': return mapSection(d, t);
    case 'cta': return ctaSection(d, t, baseUrl);
    case 'cta-card': return ctaCard(d, t, baseUrl);
    case 'cta-bar': return ctaBar(d, t);
    case 'footer': return footerSection(d, t);
    case 'footer-minimal': return footerMinimal(d, t, baseUrl);
    case 'footer-bar': return footerStickyBar(d, t, baseUrl);
    case 'artists': return artistsSection(d, t);
    case 'stats': return statsSection(d, t);
    case 'reviews': return reviewsSection(d, t);
    case 'process': return processSection(d, t);
    default: return '';
  }
}

function renderFromConfig(d: ShopData, t: ThemeVars, baseUrl: string, config: LayoutConfig): string {
  const sections = [claimBannerEl(d, t, baseUrl), ...config.sections.map((sec, i) => renderSection(sec, d, t, baseUrl, i, config.sections.length))];
  return layout(sections.join('\n'), d, t, baseUrl);
}

// ---- Additional section variants ----

function heroSectionCentered(d: ShopData, t: ThemeVars): string {
  return '<section style="padding:5rem 2rem 3rem;text-align:center;background:' + t.bg + '"><div style="max-width:700px;margin:0 auto"><h1 style="font-family:' + t.fontHeading + ';font-size:clamp(2rem,5vw,3.5rem);color:' + t.text + ';margin:0 0 0.5rem">' + safe(d.studioName) + '</h1>' + (d.bio ? '<p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:1.05rem;line-height:1.7;margin:0 auto 1.5rem;max-width:550px">' + safe(d.bio) + '</p>' : '') + (d.phone ? '<a href="tel:' + safe(d.phone) + '" style="display:inline-block;padding:0.85rem 2rem;background:' + t.accent + ';color:#fff;border-radius:50px;text-decoration:none;font-weight:600">Book Now</a>' : '') + '</div></section>';
}

function heroSectionMinimal(d: ShopData, t: ThemeVars): string {
  return '<section style="padding:3rem 2rem;background:' + t.bg + '"><h1 style="font-family:' + t.fontHeading + ';font-size:clamp(1.5rem,3vw,2rem);color:' + t.text + ';margin:0;text-align:center">' + safe(d.studioName) + '</h1></section>';
}

function bookingSectionCompact(d: ShopData, t: ThemeVars, baseUrl: string): string {
  return '<section style="padding:3rem 2rem;text-align:center;background:' + t.bgAlt + '"><h2 style="font-family:' + t.fontHeading + ';color:' + t.accent + ';font-size:1.6rem;margin:0 0 0.5rem">Book an Appointment</h2><p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';margin-bottom:1rem">Deposits, reminders, instant confirmation.</p><a href="' + safe(baseUrl) + '/book?slug=' + d.slug + '&embed=1" style="display:inline-block;padding:0.85rem 2rem;background:' + t.accent + ';color:#fff;border-radius:' + t.borderRadius + ';text-decoration:none;font-weight:600">Book Now →</a></section>';
}

function ctaBar(d: ShopData, t: ThemeVars): string {
  return '<div style="padding:1rem 2rem;text-align:center;background:' + t.accent + '"><a href="tel:' + safe(d.phone) + '" style="color:#fff;text-decoration:none;font-weight:600;font-family:' + t.fontBody + '">📞 ' + safe(d.phone) + '</a> <span style="color:rgba(255,255,255,0.6);margin:0 0.5rem">|</span> <a href="https://app.ink-flows.com/register" style="color:#fff;text-decoration:none;font-weight:600;font-family:' + t.fontBody + '">Get a Free Website →</a></div>';
}

function footerStickyBar(d: ShopData, t: ThemeVars, baseUrl: string): string {
  return '<footer style="position:fixed;bottom:0;left:0;right:0;background:' + t.card + ';border-top:1px solid ' + t.border + ';padding:0.75rem;display:flex;gap:0.5rem;z-index:100;font-family:' + t.fontBody + '">' +
    (d.phone ? '<a href="tel:' + safe(d.phone) + '" style="flex:1;padding:0.75rem;background:' + t.accent + ';color:#fff;text-align:center;border-radius:' + t.borderRadius + ';text-decoration:none;font-weight:600;font-size:0.85rem">Call</a>' : '') +
    '<a href="' + safe(baseUrl) + '/book?slug=' + d.slug + '&embed=1" style="flex:2;padding:0.75rem;background:' + t.accent + ';color:#fff;text-align:center;border-radius:' + t.borderRadius + ';text-decoration:none;font-weight:600;font-size:0.85rem">Book Appointment</a>' +
    (d.instagram ? '<a href="https://instagram.com/' + d.instagram.replace(/^@/,'') + '" style="flex:1;padding:0.75rem;border:1px solid ' + t.border + ';color:' + t.text + ';text-align:center;border-radius:' + t.borderRadius + ';text-decoration:none;font-size:0.85rem">IG</a>' : '') +
    '</footer>';
}

function statsSection(d: ShopData, t: ThemeVars): string {
  return '<section style="padding:3rem 2rem;background:' + t.bgAlt + '"><div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;text-align:center">' +
    '<div><p style="font-size:2rem;font-weight:700;color:' + t.accent + ';margin:0">' + (d.reviewCount || 127) + '+</p><p style="font-size:0.85rem;color:' + t.textMuted + ';margin:0">Happy Clients</p></div>' +
    '<div><p style="font-size:2rem;font-weight:700;color:' + t.accent + ';margin:0">' + (d.rating || 4.9) + '</p><p style="font-size:0.85rem;color:' + t.textMuted + ';margin:0">Rating</p></div>' +
    '<div><p style="font-size:2rem;font-weight:700;color:' + t.accent + ';margin:0">' + (d.services?.length || 6) + '+</p><p style="font-size:0.85rem;color:' + t.textMuted + ';margin:0">Services</p></div>' +
    '</div></section>';
}

function reviewsSection(d: ShopData, t: ThemeVars): string {
  return '<section style="padding:4rem 2rem;background:' + t.bg + '"><div style="max-width:700px;margin:0 auto"><h2 style="font-family:' + t.fontHeading + ';color:' + t.accent + ';text-align:center;font-size:1.8rem;margin:0 0 2rem">What Clients Say</h2>' +
    '<div style="display:grid;gap:1rem">' +
    [1,2,3].map(i => '<div style="background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:12px;padding:1.25rem"><div style="color:' + t.starColor + ';margin-bottom:0.5rem">★★★★★</div><p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:0.9rem;font-style:italic;margin:0">"Amazing work! Highly recommend this studio."</p><p style="font-family:' + t.fontBody + ';color:' + t.text + ';font-size:0.8rem;margin-top:0.5rem;font-weight:600">— Happy Client</p></div>').join('') +
    '</div></div></section>';
}

function processSection(d: ShopData, t: ThemeVars): string {
  return '<section style="padding:4rem 2rem;background:' + t.bgAlt + '"><div style="max-width:800px;margin:0 auto"><h2 style="font-family:' + t.fontHeading + ';color:' + t.accent + ';text-align:center;font-size:1.8rem;margin:0 0 2.5rem">How It Works</h2>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.5rem">' +
    [{n:'1. Consult',d:'Share your idea. We\'ll discuss design, placement, and pricing.'},{n:'2. Design',d:'We create a custom design based on your vision.'},{n:'3. Tattoo',d:'Your appointment day. Sit back and trust the process.'},{n:'4. Heal',d:'We guide you through aftercare for perfect healing.'}].map(s => '<div style="text-align:center"><div style="width:48px;height:48px;border-radius:50%;background:' + t.accent + '20;display:flex;align-items:center;justify-content:center;margin:0 auto 0.75rem;font-weight:700;color:' + t.accent + '">' + s.n[0] + '</div><h3 style="font-family:' + t.fontBody + ';color:' + t.text + ';font-size:1rem;margin:0 0 0.25rem">' + s.n + '</h3><p style="font-family:' + t.fontBody + ';color:' + t.textMuted + ';font-size:0.85rem;margin:0">' + s.d + '</p></div>').join('') +
    '</div></div></section>';
}

function aboutSectionMinimal(d: ShopData, t: ThemeVars): string {
  return '<section style="padding:3rem 2rem;background:' + t.bg + '"><div style="max-width:650px;margin:0 auto"><p style="font-family:' + t.fontBody + ';color:' + t.text + ';font-size:1.05rem;line-height:1.8;text-align:center">' + (d.bio || safe(d.studioName) + ' is a professional tattoo studio serving ' + safe(d.city) + '.') + '</p></div></section>';
}

// ============================================================
// 50+ Template Configurations
// Each template = different section composition
// ============================================================

const LAYOUT_CONFIGS: Record<string, LayoutConfig> = {};

// --- Classic variants (7) ---
LAYOUT_CONFIGS['classic'] = { sections: ['hero','booking','about','services','gallery','instagram','map','cta','footer'], desc: 'Full single-page scroll' };
LAYOUT_CONFIGS['classic-alt'] = { sections: ['hero','about','services','gallery','booking','instagram','cta','footer'], desc: 'Scroll with booking after gallery' };
LAYOUT_CONFIGS['classic-min'] = { sections: ['hero','services','gallery','booking','footer'], desc: 'Minimal classic' };

// --- Hero-first variants (8) ---
LAYOUT_CONFIGS['hero-full'] = { sections: ['hero-full','gallery-big','services','instagram','map','cta','footer-minimal'], desc: 'Full screen hero + big gallery' };
LAYOUT_CONFIGS['hero-split'] = { sections: ['hero-split','gallery','services-cards','booking','cta','footer'], desc: 'Split screen hero' };
LAYOUT_CONFIGS['hero-centered'] = { sections: ['hero-centered','stats','gallery-cards','services','booking-compact','footer-minimal'], desc: 'Centered hero with stats' };
LAYOUT_CONFIGS['hero-editorial'] = { sections: ['hero-editorial','about','gallery-big','instagram','cta','footer-minimal'], desc: 'Magazine style hero' };
LAYOUT_CONFIGS['hero-compact'] = { sections: ['hero-compact','gallery','services','booking','footer'], desc: 'Compact hero' };
LAYOUT_CONFIGS['hero-minimal'] = { sections: ['hero-minimal','gallery-cards','services-cards','booking-compact','footer-minimal'], desc: 'Minimal hero' };
LAYOUT_CONFIGS['hero-story'] = { sections: ['hero','about-minimal','process','gallery','booking','cta','footer'], desc: 'Story-first layout' };
LAYOUT_CONFIGS['hero-reviews'] = { sections: ['hero','reviews','gallery','services','booking','cta','footer'], desc: 'Reviews right after hero' };

// --- Gallery-first variants (7) ---
LAYOUT_CONFIGS['gallery-first'] = { sections: ['hero-compact','gallery','services','booking','footer'], desc: 'Gallery right after compact hero' };
LAYOUT_CONFIGS['gallery-big'] = { sections: ['hero','gallery-big','services-cards','booking-compact','footer-minimal'], desc: 'Big gallery with minimal sections' };
LAYOUT_CONFIGS['gallery-cards'] = { sections: ['hero','gallery-cards','services','booking','footer'], desc: 'Card-style gallery' };
LAYOUT_CONFIGS['gallery-masonry'] = { sections: ['hero-minimal','gallery-big','about','booking','footer'], desc: 'Masonry gallery layout' };
LAYOUT_CONFIGS['gallery-stats'] = { sections: ['hero-centered','stats','gallery-big','booking-compact','footer-minimal'], desc: 'Gallery with stats bar' };
LAYOUT_CONFIGS['gallery-showcase'] = { sections: ['hero','gallery','services-cards','cta-card','footer-minimal'], desc: 'Gallery showcase with card CTA' };
LAYOUT_CONFIGS['gallery-process'] = { sections: ['hero','process','gallery-big','booking','footer'], desc: 'Gallery with process steps' };

// --- Services-first variants (5) ---
LAYOUT_CONFIGS['services-first'] = { sections: ['hero','services-cards','gallery','booking','footer'], desc: 'Services highlighted first' };
LAYOUT_CONFIGS['services-cards'] = { sections: ['hero','services-cards','gallery-cards','booking-compact','footer'], desc: 'All cards layout' };
LAYOUT_CONFIGS['services-list'] = { sections: ['hero','services','gallery','booking','cta','footer'], desc: 'Simple services list' };
LAYOUT_CONFIGS['services-process'] = { sections: ['hero','services-cards','process','booking-compact','footer'], desc: 'Services + process' };
LAYOUT_CONFIGS['services-reviews'] = { sections: ['hero','services','reviews','gallery','booking','footer'], desc: 'Services with reviews' };

// --- Centered/minimal variants (6) ---
LAYOUT_CONFIGS['centered-min'] = { sections: ['hero-centered','gallery-cards','booking-compact','footer-minimal'], desc: 'Minimal centered everything' };
LAYOUT_CONFIGS['centered-stats'] = { sections: ['hero-centered','stats','gallery','booking-compact','footer-minimal'], desc: 'Centered with stats' };
LAYOUT_CONFIGS['centered-process'] = { sections: ['hero-centered','process','gallery-cards','booking','footer-minimal'], desc: 'Centered with process' };
LAYOUT_CONFIGS['link-bio'] = { sections: [], desc: 'Linktree-style (uses renderLinkBioContent)' };
LAYOUT_CONFIGS['link-bio-min'] = { sections: [], desc: 'Minimal link page' };
LAYOUT_CONFIGS['single-section'] = { sections: ['hero','gallery','booking','footer'], desc: 'Just 4 sections' };

// --- Artist/studio roster variants (4) ---
LAYOUT_CONFIGS['studio-roster'] = { sections: ['hero-compact','artists','services','gallery','booking','footer'], desc: 'Multi-artist studio' };
LAYOUT_CONFIGS['studio-roster-alt'] = { sections: ['hero','artists','gallery','services','booking','footer'], desc: 'Artists after hero' };
LAYOUT_CONFIGS['studio-min'] = { sections: ['hero-compact','artists','booking','footer'], desc: 'Minimal artist roster' };

// --- Review/social proof variants (5) ---
LAYOUT_CONFIGS['reviews-first'] = { sections: ['hero','reviews','gallery','services','booking','footer'], desc: 'Reviews highlighted' };
LAYOUT_CONFIGS['reviews-stats'] = { sections: ['hero','stats','reviews','gallery','booking','footer'], desc: 'Social proof heavy' };
LAYOUT_CONFIGS['social-proof'] = { sections: ['hero','stats','reviews','gallery','services','booking-compact','footer-minimal'], desc: 'Maximum social proof' };

// --- Special layouts (5) ---
LAYOUT_CONFIGS['editorial'] = { sections: ['hero-editorial','about','gallery','instagram','cta','footer-minimal'], desc: 'Magazine editorial' };
LAYOUT_CONFIGS['editorial-full'] = { sections: ['hero-editorial','gallery-big','about-minimal','cta-card','footer-minimal'], desc: 'Full editorial with big images' };
LAYOUT_CONFIGS['card-heavy'] = { sections: ['hero','services-cards','gallery-cards','cta-card','footer'], desc: 'Everything in cards' };
LAYOUT_CONFIGS['minimal-bar'] = { sections: ['hero','gallery','booking-compact','footer-bar'], desc: 'Sticky bottom bar' };
LAYOUT_CONFIGS['minimal-bar-alt'] = { sections: ['hero-centered','gallery-cards','footer-bar'], desc: 'Centered with sticky bar' };

// --- Process/funnel variants (3) ---
LAYOUT_CONFIGS['process-first'] = { sections: ['hero','process','gallery','booking','footer'], desc: 'Process first' };
LAYOUT_CONFIGS['funnel'] = { sections: ['hero','process','services','reviews','booking','footer'], desc: 'Sales funnel layout' };
LAYOUT_CONFIGS['process-full'] = { sections: ['hero','process','services-cards','reviews','gallery','booking','cta','footer'], desc: 'Full funnel' };

// --- Expanded combos (50+) ---
LAYOUT_CONFIGS['hero-gallery-reviews'] = { sections: ['hero','gallery','reviews','booking','footer'], desc: 'Hero + gallery + social proof' };
LAYOUT_CONFIGS['hero-services-reviews'] = { sections: ['hero','services','reviews','gallery','booking','footer'], desc: 'Services then reviews' };
LAYOUT_CONFIGS['hero-stats-gallery'] = { sections: ['hero','stats','gallery','booking','footer'], desc: 'Stats bar after hero' };
LAYOUT_CONFIGS['hero-process-booking'] = { sections: ['hero','process','booking','footer'], desc: 'Quick funnel' };
LAYOUT_CONFIGS['hero-gallery-process'] = { sections: ['hero','gallery','process','booking','cta','footer'], desc: 'Gallery then process' };
LAYOUT_CONFIGS['hero-booking-gallery'] = { sections: ['hero','booking','gallery','services','footer'], desc: 'Book then browse' };
LAYOUT_CONFIGS['hero-map-booking'] = { sections: ['hero','map','booking','footer'], desc: 'Location first' };
LAYOUT_CONFIGS['hero-about-services-gallery'] = { sections: ['hero','about','services','gallery','booking','footer'], desc: 'About the studio' };
LAYOUT_CONFIGS['hero-gallery-services'] = { sections: ['hero','gallery','services','booking','footer'], desc: 'Gallery first' };
LAYOUT_CONFIGS['hero-reviews-gallery'] = { sections: ['hero','reviews','gallery','booking','footer'], desc: 'Reviews then portfolio' };
LAYOUT_CONFIGS['hero-stats-process'] = { sections: ['hero','stats','process','booking','footer'], desc: 'Stats + process' };
LAYOUT_CONFIGS['hero-gallery-map'] = { sections: ['hero','gallery','map','booking','footer'], desc: 'Gallery + location' };
LAYOUT_CONFIGS['hero-services-booking'] = { sections: ['hero','services','booking','gallery','footer'], desc: 'Book after services' };
LAYOUT_CONFIGS['hero-about-booking'] = { sections: ['hero','about','booking','gallery','footer'], desc: 'About then book' };
LAYOUT_CONFIGS['hero-instagram-booking'] = { sections: ['hero','instagram','booking','footer'], desc: 'Instagram first' };

// --- Full experience variants (15) ---
LAYOUT_CONFIGS['full-experience'] = { sections: ['hero','stats','about','services','gallery','reviews','process','instagram','map','booking','cta','footer'], desc: 'Everything' };
LAYOUT_CONFIGS['full-gallery'] = { sections: ['hero','gallery','services','process','booking','footer'], desc: 'Gallery focused full' };
LAYOUT_CONFIGS['full-services'] = { sections: ['hero','services','gallery','reviews','booking','cta','footer'], desc: 'Services focused' };
LAYOUT_CONFIGS['full-social'] = { sections: ['hero','stats','reviews','gallery','instagram','booking','footer'], desc: 'Social proof focused' };
LAYOUT_CONFIGS['full-minimal'] = { sections: ['hero','gallery','booking','footer'], desc: 'Minimal full' };
LAYOUT_CONFIGS['full-about'] = { sections: ['hero','about','process','gallery','booking','footer'], desc: 'About + process' };
LAYOUT_CONFIGS['full-booking'] = { sections: ['hero','booking','gallery','services','map','footer'], desc: 'Booking focused' };
LAYOUT_CONFIGS['full-location'] = { sections: ['hero','about','services','map','booking','footer'], desc: 'Location focused' };
LAYOUT_CONFIGS['full-portfolio'] = { sections: ['hero','gallery','instagram','booking','footer'], desc: 'Portfolio focused' };
LAYOUT_CONFIGS['full-artist'] = { sections: ['hero','artists','gallery','booking','footer'], desc: 'Artist focused' };

// --- Compact/mobile-first variants (12) ---
LAYOUT_CONFIGS['compact'] = { sections: ['hero-compact','gallery','booking','footer'], desc: 'Compact everything' };
LAYOUT_CONFIGS['compact-services'] = { sections: ['hero-compact','services-cards','booking','footer'], desc: 'Compact services' };
LAYOUT_CONFIGS['compact-gallery'] = { sections: ['hero-compact','gallery-cards','booking-compact','footer-minimal'], desc: 'Compact gallery' };
LAYOUT_CONFIGS['compact-min'] = { sections: ['hero-minimal','gallery','booking-compact','footer-minimal'], desc: 'Ultra compact' };
LAYOUT_CONFIGS['compact-stats'] = { sections: ['hero-compact','stats','booking','footer'], desc: 'Compact with stats' };
LAYOUT_CONFIGS['compact-process'] = { sections: ['hero-compact','process','booking','footer'], desc: 'Compact funnel' };
LAYOUT_CONFIGS['mobile-first'] = { sections: ['hero','gallery','booking-compact','footer-bar'], desc: 'Mobile-first with sticky bar' };
LAYOUT_CONFIGS['mobile-gallery'] = { sections: ['hero-minimal','gallery-cards','booking-compact','footer-bar'], desc: 'Mobile gallery' };
LAYOUT_CONFIGS['hero-btn-booking'] = { sections: ['hero','booking-compact','footer-bar'], desc: '3 section mobile' };

// --- Niche variants (10) ---
LAYOUT_CONFIGS['booking-first'] = { sections: ['booking','gallery','services','footer'], desc: 'Book first, ask later' };
LAYOUT_CONFIGS['map-highlight'] = { sections: ['hero','map','services','booking','footer'], desc: 'Map highlighted' };
LAYOUT_CONFIGS['instagram-highlight'] = { sections: ['hero','instagram','gallery','booking','footer'], desc: 'Instagram highlighted' };
LAYOUT_CONFIGS['reviews-highlight'] = { sections: ['hero','reviews','stats','booking','footer'], desc: 'Reviews highlighted' };
LAYOUT_CONFIGS['process-highlight'] = { sections: ['hero','process','booking','footer'], desc: 'Process highlighted' };
LAYOUT_CONFIGS['about-highlight'] = { sections: ['hero','about','process','booking','footer'], desc: 'About highlighted' };
LAYOUT_CONFIGS['services-highlight'] = { sections: ['hero','services-cards','booking','footer'], desc: 'Services highlighted' };
LAYOUT_CONFIGS['gallery-highlight'] = { sections: ['hero','gallery-big','booking','footer'], desc: 'Gallery highlighted' };
LAYOUT_CONFIGS['hero-only'] = { sections: ['hero','booking','footer'], desc: 'Minimalist' };

// ===== Assign 100+ template configs to 41 color themes =====
// Each color theme gets 2-3 layout variations = 82-123 combinations

// ===== Assign layout configs to ALL_TEMPLATES =====
// 41 templates × their layout configs
export const TEMPLATE_LAYOUTS: Record<string, string> = {
  // classic (6)
  minimal: 'classic', vintage: 'classic', moody: 'classic', desert: 'classic',
  'retro-wave': 'classic-alt', nordic: 'classic-min',
  // hero-grid (5)
  studio: 'hero-full', coastal: 'hero-centered', arctic: 'hero-minimal',
  watercolor: 'hero-split', lavender: 'hero-reviews',
  // link-bio (5)
  brutalist: 'link-bio', tribal: 'link-bio', punk: 'link-bio-min',
  maori: 'link-bio', monochrome: 'link-bio-min',
  // studio-roster (5)
  traditional: 'studio-roster', nature: 'studio-roster-alt', woodcut: 'studio-min',
  botanical: 'studio-roster', tropical: 'studio-roster-alt',
  // cards (5)
  edgy: 'card-heavy', neon: 'services-cards', metallic: 'gallery-cards',
  cyberpunk: 'card-heavy', 'new-school': 'services-cards',
  // split (5)
  royal: 'hero-split', midnight: 'centered-min', celestial: 'editorial',
  sunset: 'hero-story', chicano: 'hero-centered',
  // editorial (5)
  gothic: 'editorial-full', japanese: 'editorial', steampunk: 'editorial-full',
  neonoir: 'reviews-first', halloween: 'social-proof',
  // minimal-bar (5)
  industrial: 'minimal-bar', urban: 'minimal-bar-alt', sakura: 'minimal-bar',
  biomechanical: 'hero-compact', 'trash-polka': 'funnel',
};

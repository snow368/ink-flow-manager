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
  template: 'dark' | 'clean' | 'bold' | 'classic';
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
  dark: {
    bg: '#0d0d0d', bgAlt: '#1a1a1a', text: '#f0f0f0', textMuted: '#888',
    accent: '#c9a84c', accentHover: '#dbb95d', card: '#1a1a1a', border: '#2a2a2a',
    fontHeading: "'Cinzel', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85))',
    starColor: '#c9a84c', borderRadius: '0',
  },
  clean: {
    bg: '#fafafa', bgAlt: '#ffffff', text: '#1a1a1a', textMuted: '#666',
    accent: '#2563eb', accentHover: '#1d4ed8', card: '#ffffff', border: '#e5e5e5',
    fontHeading: "'Playfair Display', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
    starColor: '#f59e0b', borderRadius: '12px',
  },
  bold: {
    bg: '#1a0a0a', bgAlt: '#2d1515', text: '#f5f0f0', textMuted: '#b08888',
    accent: '#e63946', accentHover: '#ff4d5a', card: '#2d1515', border: '#4a2525',
    fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(26,10,10,0.6), rgba(45,21,21,0.9))',
    starColor: '#e63946', borderRadius: '4px',
  },
  classic: {
    bg: '#f8f6f0', bgAlt: '#ffffff', text: '#2c2c2c', textMuted: '#888',
    accent: '#8b5a2b', accentHover: '#a06b35', card: '#ffffff', border: '#e0d8cc',
    fontHeading: "'EB Garamond', serif", fontBody: "'Inter', sans-serif",
    heroOverlay: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
    starColor: '#8b5a2b', borderRadius: '0',
  },
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
        '</div>' +
      '</div>' +
    '</header>';
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
          ' src="https://www.google.com/maps/embed/v1/place?key=AIzaSyDpzI8Wb-xHXJOUGK4_6qGIgWqNt2yW6gE&q=' + q + '"></iframe>' +
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
    '<span>Is this your shop?</span>' +
    '<a href="' + safe(claimUrl) + '" style="color: #fff; font-weight: 700; text-decoration: underline; margin-left: 0.5rem;">Claim this page →</a>' +
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
  const t = THEMES[d.template] || THEMES.classic;
  const sections = [
    claimBannerEl(d, t, baseUrl),
    heroSection(d, t),
    aboutSection(d, t),
    servicesSection(d, t),
    gallerySection(d.photos, t, d.studioName),
    mapSection(d, t),
    footerSection(d, t),
  ];
  return layout(sections.join('\n'), d, t, baseUrl);
}

/** Guess template from photo style keywords (lightweight — no API call) */
export function guessTemplate(photos: string[], name: string): string {
  if (!photos?.length) {
    const n = name.toLowerCase();
    if (/ink|dark|black|iron|steel/.test(n)) return 'dark';
    if (/golden|rose|classic|old/.test(n)) return 'classic';
    if (/red|fire|dragon|skull/.test(n)) return 'bold';
    return 'clean';
  }
  const urlStr = photos.join(' ').toLowerCase();
  let dark = 0, clean = 0, bold = 0, classic = 0;
  if (/dark|black|shadow|goth|noir/.test(urlStr)) dark += 2;
  if (/bright|white|clean|minimal|studio/.test(urlStr)) clean += 2;
  if (/red|bold|colorful|vibrant|skull|flame/.test(urlStr)) bold += 2;
  if (/vintage|classic|old|gold|warm/.test(urlStr)) classic += 2;
  if (/ink|dark|black|iron|steel/i.test(name)) dark += 1;
  if (/golden|rose|classic|old/i.test(name)) classic += 1;
  if (/red|fire|dragon|skull|tiger/i.test(name)) bold += 1;
  const scores = [
    { n: 'dark', s: dark },
    { n: 'clean', s: clean },
    { n: 'bold', s: bold },
    { n: 'classic', s: classic },
  ];
  scores.sort(function(a, b) { return b.s - a.s; });
  return scores[0].s > 0 ? scores[0].n : 'classic';
}

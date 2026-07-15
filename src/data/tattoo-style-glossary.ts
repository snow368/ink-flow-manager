/**
 * Tattoo Color & Style Meaning Glossary
 * Cross-cutting reference used by /meaning/style-guide and linked from symbol pages.
 * Last updated: 2026-07-14
 */

export interface GlossaryTerm {
  slug: string;
  name: string;
  meaning: string;
  note?: string;
}

export const COLOR_MEANINGS: GlossaryTerm[] = [
  { slug: 'red', name: 'Red', meaning: 'Passion, love, courage, and vitality.', note: 'In Chinese culture red signals luck and celebration; in Western warning contexts it can mean danger — context matters.' },
  { slug: 'blue', name: 'Blue', meaning: 'Calm, loyalty, and the infinite (sky and sea).', note: 'Often chosen for memorial and ocean-themed pieces.' },
  { slug: 'black', name: 'Black', meaning: 'Strength, mystery, protection, and mourning.', note: 'The backbone of traditional tattooing; blackwork uses it at scale.' },
  { slug: 'white', name: 'White', meaning: 'Purity, spirit, and new beginnings.', note: 'White ink is subtle and fades faster than pigment colors.' },
  { slug: 'green', name: 'Green', meaning: 'Nature, growth, renewal, and envy.', note: 'Common in botanical and Celtic designs.' },
  { slug: 'purple', name: 'Purple', meaning: 'Royalty, spirituality, and transformation.', note: 'Historically a costly pigment, still reads as regal.' },
  { slug: 'gold', name: 'Gold', meaning: 'Wealth, the divine, and achievement.', note: 'Used as accent in ornamental and religious pieces.' },
  { slug: 'orange', name: 'Orange', meaning: 'Energy, creativity, and warmth.', note: 'Pairs with red in sun and fire motifs.' },
];

export const STYLE_MEANINGS: GlossaryTerm[] = [
  { slug: 'watercolor', name: 'Watercolor', meaning: 'Free-flowing, brush-like color with no bold outline — artistic freedom.', note: 'Trend-driven; ages faster than outlined styles.' },
  { slug: 'geometric', name: 'Geometric', meaning: 'Precise lines and shapes — balance, the cosmos, modern spirituality.', note: 'Often paired with dotwork.' },
  { slug: 'minimalist', name: 'Minimalist', meaning: 'Simple single-line or small marks — restraint and clarity.', note: 'Small, discreet, easily hidden.' },
  { slug: 'realism', name: 'Realism', meaning: 'Photographic detail — memorials and lifelike portraits.', note: 'Needs an experienced artist; sun exposure fades it.' },
  { slug: 'blackwork', name: 'Blackwork', meaning: 'Solid black areas and bold contrast — bold, graphic statements.', note: 'Encompasses tribal, dotwork, and illustrative black.' },
  { slug: 'japanese', name: 'Japanese (Irezumi)', meaning: 'Traditional Japanese motifs (koi, dragons, waves) — narrative and nature spirits.', note: 'Follows a formal visual language; research before mixing motifs.' },
  { slug: 'neo-traditional', name: 'Neo-Traditional', meaning: 'Traditional base with modern color and depth — layered, illustrative.', note: 'Evolution of American traditional.' },
  { slug: 'tribal', name: 'Tribal', meaning: 'Polynesian, Māori, and other indigenous patterns — identity and heritage.', note: '⚠️ Sacred in origin; wear only with understanding and respect (see Cultural Respect note).' },
  { slug: 'dotwork', name: 'Dotwork', meaning: 'Builds shading from thousands of dots — patience and texture.', note: 'Often used in geometric and mandala pieces.' },
  { slug: 'fine-line', name: 'Fine Line', meaning: 'Thin, delicate lines — refined and contemporary.', note: 'Popular for minimal scripts and small icons.' },
  { slug: 'american-traditional', name: 'American Traditional', meaning: 'Bold outlines, limited palette, classic icons — permanence and heritage.', note: 'Also called "old school"; ages the most gracefully.' },
];

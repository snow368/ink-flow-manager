import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, type UserRecord, type StudioLocationRecord } from '../db';
import { getApiBaseUrl } from '../lib/backendApi';
import { detectInitialLanguage, t } from '../lib/i18n';

// 13 layout patterns matched to the worker's ALL_TEMPLATES + 5 new categories (60 new themes)
const LAYOUTS = [
  { key: 'gallery-focus', name: 'Gallery Focus', icon: '🖼️', desc: 'Gallery-first layouts that let your work take center stage before showing anything else.', count: 12 },
  { key: 'mobile-first', name: 'Mobile First', icon: '📱', desc: 'Compact, phone-optimized designs with easy thumb-reach CTAs.', count: 12 },
  { key: 'social-proof', name: 'Social Proof', icon: '⭐', desc: 'Reviews, testimonials, and stats placed prominently to build trust fast.', count: 12 },
  { key: 'process-funnel', name: 'Process Funnel', icon: '🔄', desc: 'Lead users through your process step-by-step toward booking.', count: 12 },
  { key: 'full-experience', name: 'Full Experience', icon: '🌟', desc: 'Comprehensive single-page sites with every section your studio needs.', count: 12 },
  { key: 'classic', name: 'Classic Scroll', icon: '📜', desc: 'Single-page scroll: hero, about, services, gallery, booking. Timeless layout for any studio.', count: 6 },
  { key: 'hero-grid', name: 'Hero Grid', icon: '🏞️', desc: 'Full-screen hero image + masonry gallery grid. Best for visual-heavy portfolios.', count: 5 },
  { key: 'link-bio', name: 'Link-in-Bio', icon: '🔗', desc: 'Instagram-optimized link page. Just logo + links to book, portfolio, and socials.', count: 5 },
  { key: 'studio-roster', name: 'Studio Roster', icon: '👥', desc: 'Multi-artist studio layout with individual artist cards, each with their own booking.', count: 5 },
  { key: 'cards', name: 'Card-Based', icon: '🃏', desc: 'Everything in cards: services, portfolio, info. Modern and scannable.', count: 5 },
  { key: 'split', name: 'Split Screen', icon: '↔️', desc: 'Split sections with image/text side-by-side. Clean editorial feel.', count: 5 },
  { key: 'editorial', name: 'Editorial', icon: '📰', desc: 'Magazine-style layout with large hero images and rich text sections.', count: 5 },
  { key: 'minimal-bar', name: 'Minimal Bar', icon: '⬇️', desc: 'Minimum content + sticky bottom bar with Call/Book/IG buttons. Ultra-clean.', count: 5 },
];

// 101 themes — each mapped to a layout + tier (matches worker templates.ts)
// layout assignments per ALL_TEMPLATES:
//   classic: minimal, vintage, moody, desert, retro-wave, nordic
//   hero-grid: studio, coastal, arctic, watercolor, lavender
//   link-bio: brutalist, tribal, punk, maori, monochrome
//   studio-roster: traditional, nature, woodcut, botanical, tropical
//   cards: edgy, neon, metallic, cyberpunk, new-school
//   split: royal, midnight, celestial, sunset, chicano
//   editorial: gothic, japanese, steampunk, neonoir, halloween
//   minimal-bar: industrial, urban, sakura, biomechanical, trash-polka
//   gallery-focus: americana, fine-line, blackwork, ornamental, geometric, stipple, etching, surrealism, illustrative, photorealism, dotwork, micro-realism
//   mobile-first: neo-tribal, patchwork, handpoke, minimal-line, single-needle, micro-tattoo, abstract, line-art, sketch, negative-space, white-ink, stick-poke
//   social-proof: letterhead, script, black-letter, old-school, flash, painterly, wash, charcoal, pastel, neo-academic, avant-garde, bauhaus
//   process-funnel: irezumi, hannya, dragon, koi, tiger, oni, phoenix, serpent, foo-dog, geisha, samurai, wave
//   full-experience: museum, gallery, collection, anthology, monograph, portfolio, retrospective, showcase, compilation, treasury, compendium, archive
const THEMES: { name: string; primary: string; bg: string; card: string; text: string; key: string; tier: string; desc: string; layout: string }[] = [
  // classic
  { name: 'Minimal', primary: '#1a1a1a', bg: '#ffffff', card: '#ffffff', text: '#1a1a1a', key: 'minimal', tier: 'free', desc: 'Clean white, timeless', layout: 'classic' },
  { name: 'Vintage', primary: '#8b4513', bg: '#f5f0e8', card: '#faf5ee', text: '#2c2418', key: 'vintage', tier: 'free', desc: 'Warm retro feel', layout: 'classic' },
  { name: 'Moody', primary: '#b8860b', bg: '#0d0d0d', card: '#141414', text: '#e8e0d8', key: 'moody', tier: 'free', desc: 'Dark with gold', layout: 'classic' },
  { name: 'Desert', primary: '#c4783a', bg: '#e8e0d0', card: '#f5f0e8', text: '#2a2218', key: 'desert', tier: 'free', desc: 'Warm desert tones', layout: 'classic' },
  { name: 'Retro Wave', primary: '#ff6688', bg: '#0a0a30', card: '#151545', text: '#e0d8f8', key: 'retro-wave', tier: 'plus', desc: '80s sunset neon', layout: 'classic' },
  { name: 'Nordic', primary: '#7a9aaa', bg: '#0c1018', card: '#161c28', text: '#d8e0e8', key: 'nordic', tier: 'free', desc: 'Cool steel blue', layout: 'classic' },
  // hero-grid
  { name: 'Studio', primary: '#d4a574', bg: '#f8f8f8', card: '#ffffff', text: '#222', key: 'studio', tier: 'pro', desc: 'Gallery warm tones', layout: 'hero-grid' },
  { name: 'Coastal', primary: '#2a8a8a', bg: '#f0f5f5', card: '#ffffff', text: '#1a2a2a', key: 'coastal', tier: 'plus', desc: 'Light & breezy', layout: 'hero-grid' },
  { name: 'Arctic', primary: '#2a7aaa', bg: '#e8f0f5', card: '#ffffff', text: '#1a2a3a', key: 'arctic', tier: 'free', desc: 'Cool ice blue', layout: 'hero-grid' },
  { name: 'Watercolor', primary: '#e88d9a', bg: '#f8f4f0', card: '#ffffff', text: '#2a2420', key: 'watercolor', tier: 'plus', desc: 'Soft pastels', layout: 'hero-grid' },
  { name: 'Lavender', primary: '#8a6aca', bg: '#f0ecf5', card: '#ffffff', text: '#2a203a', key: 'lavender', tier: 'free', desc: 'Soft purple', layout: 'hero-grid' },
  // link-bio
  { name: 'Brutalist', primary: '#ffffff', bg: '#000000', card: '#0a0a0a', text: '#ffffff', key: 'brutalist', tier: 'pro', desc: 'Heavy black & white', layout: 'link-bio' },
  { name: 'Tribal', primary: '#d4d4d4', bg: '#050505', card: '#0d0d0d', text: '#e8e8e8', key: 'tribal', tier: 'free', desc: 'Black & grey', layout: 'link-bio' },
  { name: 'Punk', primary: '#ffee00', bg: '#0a0a0a', card: '#141010', text: '#f0f0f0', key: 'punk', tier: 'pro', desc: 'High-contrast yellow', layout: 'link-bio' },
  { name: 'Maori', primary: '#cc2222', bg: '#080808', card: '#111111', text: '#e8e8e8', key: 'maori', tier: 'free', desc: 'Tribal red & black', layout: 'link-bio' },
  { name: 'Monochrome', primary: '#666666', bg: '#080808', card: '#141414', text: '#cccccc', key: 'monochrome', tier: 'free', desc: 'Clean grey scale', layout: 'link-bio' },
  // studio-roster
  { name: 'Traditional', primary: '#c41e1e', bg: '#0a0a0a', card: '#141414', text: '#f5f0e8', key: 'traditional', tier: 'free', desc: 'Bold American red', layout: 'studio-roster' },
  { name: 'Nature', primary: '#4a8c3f', bg: '#0f1a0e', card: '#1a2a18', text: '#e0ecd8', key: 'nature', tier: 'pro', desc: 'Forest green', layout: 'studio-roster' },
  { name: 'Woodcut', primary: '#cc9a4a', bg: '#1a1410', card: '#26201a', text: '#e0d8cc', key: 'woodcut', tier: 'plus', desc: 'Dark print-like', layout: 'studio-roster' },
  { name: 'Botanical', primary: '#5a9e6a', bg: '#0f1a12', card: '#1a2a1e', text: '#dce8d8', key: 'botanical', tier: 'free', desc: 'Sage green', layout: 'studio-roster' },
  { name: 'Tropical', primary: '#ff7744', bg: '#0a1414', card: '#142020', text: '#dce8e0', key: 'tropical', tier: 'pro', desc: 'Coral & teal', layout: 'studio-roster' },
  // cards
  { name: 'Edgy', primary: '#ff0066', bg: '#0a0a0a', card: '#111', text: '#f0f0f0', key: 'edgy', tier: 'pro', desc: 'Neon pink on black', layout: 'cards' },
  { name: 'Neon', primary: '#00ffff', bg: '#0a0a12', card: '#12121e', text: '#f0f0f8', key: 'neon', tier: 'pro', desc: 'Cyan on dark', layout: 'cards' },
  { name: 'Metallic', primary: '#9a9aaa', bg: '#0e0e10', card: '#18181c', text: '#e0e0e4', key: 'metallic', tier: 'plus', desc: 'Silver chrome', layout: 'cards' },
  { name: 'Cyberpunk', primary: '#ff00aa', bg: '#0a0515', card: '#140a24', text: '#e0d8f0', key: 'cyberpunk', tier: 'pro', desc: 'Neon magenta cyber', layout: 'cards' },
  { name: 'New School', primary: '#ff66cc', bg: '#0a0a20', card: '#151530', text: '#e8e8f0', key: 'new-school', tier: 'pro', desc: 'Bright neon cartoon', layout: 'cards' },
  // split
  { name: 'Royal', primary: '#7c3aed', bg: '#0e0a1a', card: '#1a1528', text: '#e8e0f0', key: 'royal', tier: 'pro', desc: 'Deep purple & gold', layout: 'split' },
  { name: 'Midnight', primary: '#4a80d0', bg: '#080c14', card: '#101826', text: '#d8e0f0', key: 'midnight', tier: 'free', desc: 'Deep blue night', layout: 'split' },
  { name: 'Celestial', primary: '#c8a040', bg: '#080818', card: '#101028', text: '#e0d8f0', key: 'celestial', tier: 'plus', desc: 'Gold on midnight', layout: 'split' },
  { name: 'Sunset', primary: '#ff6622', bg: '#1a0e0a', card: '#2a1810', text: '#f0e0d8', key: 'sunset', tier: 'pro', desc: 'Warm orange glow', layout: 'split' },
  { name: 'Chicano', primary: '#c4956a', bg: '#1a1410', card: '#261e18', text: '#e8ddd0', key: 'chicano', tier: 'pro', desc: 'Warm brown & gold', layout: 'split' },
  // editorial
  { name: 'Gothic', primary: '#800020', bg: '#0a0808', card: '#141010', text: '#d8d0c8', key: 'gothic', tier: 'plus', desc: 'Ornate dark', layout: 'editorial' },
  { name: 'Japanese', primary: '#cc3300', bg: '#0f0a08', card: '#1a1410', text: '#f0e8e0', key: 'japanese', tier: 'pro', desc: 'Traditional irezumi red', layout: 'editorial' },
  { name: 'Steampunk', primary: '#b8862a', bg: '#14100a', card: '#1e1a14', text: '#e0d8cc', key: 'steampunk', tier: 'plus', desc: 'Brass & bronze', layout: 'editorial' },
  { name: 'Neonoir', primary: '#ff2244', bg: '#080808', card: '#111114', text: '#e0e0e0', key: 'neonoir', tier: 'pro', desc: 'Red noir dramatic', layout: 'editorial' },
  { name: 'Halloween', primary: '#ff6600', bg: '#0a0808', card: '#141010', text: '#e8d8c8', key: 'halloween', tier: 'free', desc: 'Orange & black', layout: 'editorial' },
  // minimal-bar
  { name: 'Industrial', primary: '#4682b4', bg: '#121212', card: '#1c1c1c', text: '#d8d8d8', key: 'industrial', tier: 'plus', desc: 'Steel & concrete', layout: 'minimal-bar' },
  { name: 'Urban', primary: '#ff6600', bg: '#0a0a0a', card: '#151515', text: '#f0f0f0', key: 'urban', tier: 'plus', desc: 'Graffiti bold', layout: 'minimal-bar' },
  { name: 'Sakura', primary: '#e86a8a', bg: '#1a1018', card: '#2a1a24', text: '#f0e0e8', key: 'sakura', tier: 'pro', desc: 'Cherry blossom pink', layout: 'minimal-bar' },
  { name: 'Biomechanical', primary: '#c0392b', bg: '#0d0d0f', card: '#161618', text: '#e0e0e2', key: 'biomechanical', tier: 'pro', desc: 'Metallic red & grey', layout: 'minimal-bar' },
  { name: 'Trash Polka', primary: '#cc2244', bg: '#0a0a0a', card: '#141414', text: '#f0f0f0', key: 'trash-polka', tier: 'plus', desc: 'Collage red chaos', layout: 'minimal-bar' },
  // gallery-focus
  { name: 'Americana', primary: '#c0262d', bg: '#0a0a0a', card: '#151515', text: '#f0f0f0', key: 'americana', tier: 'free', desc: 'Classic red, white & blue', layout: 'gallery-focus' },
  { name: 'Fine Line', primary: '#1a1a2e', bg: '#f5f5f0', card: '#ffffff', text: '#1a1a1a', key: 'fine-line', tier: 'pro', desc: 'Delicate & precise', layout: 'gallery-focus' },
  { name: 'Blackwork', primary: '#ffffff', bg: '#050505', card: '#0d0d0d', text: '#e8e8e8', key: 'blackwork', tier: 'free', desc: 'Pure black & white', layout: 'gallery-focus' },
  { name: 'Ornamental', primary: '#a67c52', bg: '#0d0808', card: '#161010', text: '#e8ddd0', key: 'ornamental', tier: 'plus', desc: 'Intricate symmetry', layout: 'gallery-focus' },
  { name: 'Geometric', primary: '#2a7a9a', bg: '#0a0e14', card: '#121a24', text: '#d8e0ec', key: 'geometric', tier: 'pro', desc: 'Precision patterns', layout: 'gallery-focus' },
  { name: 'Stipple', primary: '#bf8f60', bg: '#0f0d0a', card: '#1a1612', text: '#e0d8cc', key: 'stipple', tier: 'pro', desc: 'Dotted shading & texture', layout: 'gallery-focus' },
  { name: 'Etching', primary: '#4a3a2a', bg: '#e8e2d8', card: '#f5f0ea', text: '#2a241e', key: 'etching', tier: 'plus', desc: 'Fine line print style', layout: 'gallery-focus' },
  { name: 'Surrealism', primary: '#c84ad8', bg: '#0a0818', card: '#14102a', text: '#e8e0f0', key: 'surrealism', tier: 'plus', desc: 'Dreamlike & imaginative', layout: 'gallery-focus' },
  { name: 'Illustrative', primary: '#2a5a8a', bg: '#f5f2ec', card: '#ffffff', text: '#1e1a16', key: 'illustrative', tier: 'pro', desc: 'Bold storytelling style', layout: 'gallery-focus' },
  { name: 'Photorealism', primary: '#6688aa', bg: '#0c0c0c', card: '#161616', text: '#e8e8e8', key: 'photorealism', tier: 'plus', desc: 'True-to-life detail', layout: 'gallery-focus' },
  { name: 'Dotwork', primary: '#c49a6a', bg: '#0a0808', card: '#141010', text: '#d8d0c8', key: 'dotwork', tier: 'free', desc: 'Pattern & precision', layout: 'gallery-focus' },
  { name: 'Micro Realism', primary: '#7a7a7a', bg: '#f0eeec', card: '#ffffff', text: '#1e1c1a', key: 'micro-realism', tier: 'pro', desc: 'Tiny precise realism', layout: 'gallery-focus' },
  // mobile-first
  { name: 'Neo Tribal', primary: '#0099ff', bg: '#0a0a0a', card: '#121212', text: '#f0f0f0', key: 'neo-tribal', tier: 'pro', desc: 'Modern tribal patterns', layout: 'mobile-first' },
  { name: 'Patchwork', primary: '#ff4488', bg: '#0a0a0a', card: '#151515', text: '#f0f0f0', key: 'patchwork', tier: 'free', desc: 'Mix of styles & colors', layout: 'mobile-first' },
  { name: 'Hand Poke', primary: '#8a7a5a', bg: '#f2ede4', card: '#ffffff', text: '#2a241e', key: 'handpoke', tier: 'free', desc: 'Raw handmade feel', layout: 'mobile-first' },
  { name: 'Minimal Line', primary: '#e8a0b0', bg: '#ffffff', card: '#ffffff', text: '#2a2a2a', key: 'minimal-line', tier: 'free', desc: 'Thin lines & simplicity', layout: 'mobile-first' },
  { name: 'Single Needle', primary: '#3a5a7a', bg: '#f5f3f0', card: '#ffffff', text: '#2a2826', key: 'single-needle', tier: 'pro', desc: 'Ultra-fine precision', layout: 'mobile-first' },
  { name: 'Micro', primary: '#c4957a', bg: '#fcf8f4', card: '#ffffff', text: '#2a2420', key: 'micro-tattoo', tier: 'pro', desc: 'Tiny & delicate', layout: 'mobile-first' },
  { name: 'Abstract', primary: '#aaff00', bg: '#0a0a0a', card: '#141414', text: '#f0f0f0', key: 'abstract', tier: 'plus', desc: 'Artistic & unconventional', layout: 'mobile-first' },
  { name: 'Line Art', primary: '#ff6b6b', bg: '#ffffff', card: '#ffffff', text: '#1a1a2e', key: 'line-art', tier: 'free', desc: 'Clean continuous lines', layout: 'mobile-first' },
  { name: 'Sketch', primary: '#6a5a4a', bg: '#e8e4dc', card: '#f8f4ec', text: '#2a2824', key: 'sketch', tier: 'pro', desc: 'Raw pencil-like strokes', layout: 'mobile-first' },
  { name: 'Negative Space', primary: '#ffffff', bg: '#080c1a', card: '#10142a', text: '#e0e4f0', key: 'negative-space', tier: 'plus', desc: 'Dark with bright accents', layout: 'mobile-first' },
  { name: 'White Ink', primary: '#cccccc', bg: '#050505', card: '#0a0a0a', text: '#e8e8e8', key: 'white-ink', tier: 'free', desc: 'Pale on deep black', layout: 'mobile-first' },
  { name: 'Stick n Poke', primary: '#6a5a4a', bg: '#f5f0e8', card: '#ffffff', text: '#2e2822', key: 'stick-poke', tier: 'free', desc: 'Earthy handmade vibe', layout: 'mobile-first' },
  // social-proof
  { name: 'Letterhead', primary: '#7a2a2a', bg: '#f5f0e8', card: '#fefaf5', text: '#2a2220', key: 'letterhead', tier: 'plus', desc: 'Elegant printed feel', layout: 'social-proof' },
  { name: 'Script', primary: '#c89a40', bg: '#0d0a08', card: '#181410', text: '#e8ddd0', key: 'script', tier: 'pro', desc: 'Warm gold lettering', layout: 'social-proof' },
  { name: 'Blackletter', primary: '#9a1a1a', bg: '#f8f4ec', card: '#ffffff', text: '#1e1a16', key: 'black-letter', tier: 'free', desc: 'Crimson & parchment', layout: 'social-proof' },
  { name: 'Old School', primary: '#1a4a7a', bg: '#0a0a0a', card: '#141414', text: '#f0ece8', key: 'old-school', tier: 'free', desc: 'Classic navy & gold', layout: 'social-proof' },
  { name: 'Flash', primary: '#ff4488', bg: '#0a0a18', card: '#15152a', text: '#f0e8f0', key: 'flash', tier: 'plus', desc: 'Hot pink pop art', layout: 'social-proof' },
  { name: 'Painterly', primary: '#4a7a5a', bg: '#f5f2ec', card: '#ffffff', text: '#2a2824', key: 'painterly', tier: 'pro', desc: 'Sage & canvas tones', layout: 'social-proof' },
  { name: 'Wash', primary: '#3a5a7a', bg: '#f0f2f5', card: '#ffffff', text: '#1a2a3a', key: 'wash', tier: 'free', desc: 'Soft indigo wash', layout: 'social-proof' },
  { name: 'Charcoal', primary: '#c48a3a', bg: '#0a0a0a', card: '#141414', text: '#e8e0d8', key: 'charcoal', tier: 'plus', desc: 'Smoky dark & amber', layout: 'social-proof' },
  { name: 'Pastel', primary: '#f0a0b0', bg: '#f8f4f0', card: '#ffffff', text: '#2a2a3a', key: 'pastel', tier: 'free', desc: 'Soft pink & mint', layout: 'social-proof' },
  { name: 'Neo Academic', primary: '#6a2a2a', bg: '#f5f2ee', card: '#ffffff', text: '#2a2220', key: 'neo-academic', tier: 'pro', desc: 'Scholarly burgundy', layout: 'social-proof' },
  { name: 'Avant Garde', primary: '#00ff88', bg: '#0a0a0a', card: '#151515', text: '#f0f0f0', key: 'avant-garde', tier: 'plus', desc: 'Bold lime & magenta', layout: 'social-proof' },
  { name: 'Bauhaus', primary: '#ffdd00', bg: '#0a0a0a', card: '#141414', text: '#f0f0f0', key: 'bauhaus', tier: 'pro', desc: 'Yellow black minimal', layout: 'social-proof' },
  // process-funnel
  { name: 'Irezumi', primary: '#cc2200', bg: '#0a0608', card: '#141012', text: '#e8d8d0', key: 'irezumi', tier: 'pro', desc: 'Japanese traditional red', layout: 'process-funnel' },
  { name: 'Hannya', primary: '#9a1a1a', bg: '#0a0808', card: '#141010', text: '#e8d0c8', key: 'hannya', tier: 'pro', desc: 'Dark mask aesthetic', layout: 'process-funnel' },
  { name: 'Dragon', primary: '#2a8a3a', bg: '#0a0a08', card: '#141412', text: '#e0e8d8', key: 'dragon', tier: 'free', desc: 'Jade green & black', layout: 'process-funnel' },
  { name: 'Koi', primary: '#e87a2a', bg: '#0a0808', card: '#141010', text: '#e8d8d0', key: 'koi', tier: 'free', desc: 'Orange & navy', layout: 'process-funnel' },
  { name: 'Tiger', primary: '#d4881a', bg: '#0a0806', card: '#141210', text: '#e8dcd0', key: 'tiger', tier: 'pro', desc: 'Amber & black stripe', layout: 'process-funnel' },
  { name: 'Oni', primary: '#aa2222', bg: '#0a0606', card: '#141010', text: '#e8d0c0', key: 'oni', tier: 'pro', desc: 'Crimson demon bold', layout: 'process-funnel' },
  { name: 'Phoenix', primary: '#cc4400', bg: '#0a0608', card: '#141014', text: '#e8d0d8', key: 'phoenix', tier: 'plus', desc: 'Scarlet & flame', layout: 'process-funnel' },
  { name: 'Serpent', primary: '#1a8a4a', bg: '#060a08', card: '#101412', text: '#d8e0d8', key: 'serpent', tier: 'plus', desc: 'Emerald dark scale', layout: 'process-funnel' },
  { name: 'Foo Dog', primary: '#cc3300', bg: '#0a0806', card: '#141210', text: '#e8ddd0', key: 'foo-dog', tier: 'plus', desc: 'Imperial red & gold', layout: 'process-funnel' },
  { name: 'Geisha', primary: '#e86a8a', bg: '#0a0808', card: '#141012', text: '#e8d8d8', key: 'geisha', tier: 'pro', desc: 'Cherry blossom soft', layout: 'process-funnel' },
  { name: 'Samurai', primary: '#aa2a2a', bg: '#080a0e', card: '#10141a', text: '#d8e0e8', key: 'samurai', tier: 'plus', desc: 'Steel blue & crimson', layout: 'process-funnel' },
  { name: 'Wave', primary: '#1a6a8a', bg: '#e8f0f5', card: '#ffffff', text: '#1a2a3a', key: 'wave', tier: 'free', desc: 'Cerulean woodblock', layout: 'process-funnel' },
  // full-experience
  { name: 'Museum', primary: '#6a5a4a', bg: '#f5f2ec', card: '#ffffff', text: '#2a2622', key: 'museum', tier: 'free', desc: 'Warm beige curated', layout: 'full-experience' },
  { name: 'Gallery', primary: '#2a2a2a', bg: '#ffffff', card: '#ffffff', text: '#1a1a1a', key: 'gallery', tier: 'free', desc: 'Pure white gallery', layout: 'full-experience' },
  { name: 'Collection', primary: '#c89a3a', bg: '#0a1412', card: '#14201e', text: '#dce8e4', key: 'collection', tier: 'plus', desc: 'Deep teal & gold', layout: 'full-experience' },
  { name: 'Anthology', primary: '#c89aaa', bg: '#0e0a10', card: '#1a1420', text: '#e8dce8', key: 'anthology', tier: 'plus', desc: 'Plum & rose gold', layout: 'full-experience' },
  { name: 'Monograph', primary: '#4a4a4a', bg: '#e8e6e2', card: '#faf8f6', text: '#2a2826', key: 'monograph', tier: 'free', desc: 'Slate & warm grey', layout: 'full-experience' },
  { name: 'Portfolio', primary: '#6a2a2a', bg: '#f5f2ee', card: '#ffffff', text: '#2a2420', key: 'portfolio', tier: 'free', desc: 'Cream & burgundy', layout: 'full-experience' },
  { name: 'Retrospective', primary: '#6a2a1a', bg: '#0a0808', card: '#141010', text: '#e8d8d0', key: 'retrospective', tier: 'pro', desc: 'Oxblood dramatic', layout: 'full-experience' },
  { name: 'Showcase', primary: '#2a8a8a', bg: '#0a0a0a', card: '#141414', text: '#e8e8e8', key: 'showcase', tier: 'pro', desc: 'Charcoal & teal', layout: 'full-experience' },
  { name: 'Compilation', primary: '#b8702a', bg: '#080a0a', card: '#101414', text: '#d8e0e0', key: 'compilation', tier: 'plus', desc: 'Navy & copper', layout: 'full-experience' },
  { name: 'Treasury', primary: '#c49a3a', bg: '#0a0c08', card: '#121610', text: '#e0e4d8', key: 'treasury', tier: 'plus', desc: 'Forest green & gold', layout: 'full-experience' },
  { name: 'Compendium', primary: '#5a6a5a', bg: '#e8e6e0', card: '#faf8f6', text: '#2a2a26', key: 'compendium', tier: 'free', desc: 'Stone & cedar', layout: 'full-experience' },
  { name: 'Archive', primary: '#4a5a6a', bg: '#e8eaec', card: '#ffffff', text: '#1a1c1e', key: 'archive', tier: 'pro', desc: 'Steel & white', layout: 'full-experience' },
];

export default function WebsiteWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [bio, setBio] = useState('');
  const [templateKey, setTemplateKey] = useState('portfolio');
  const [layoutKey, setLayoutKey] = useState('classic');
  const [themeKey, setThemeKey] = useState('minimal');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [customDomain, setCustomDomain] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [locations, setLocations] = useState<StudioLocationRecord[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [maxSteps, setMaxSteps] = useState(3);

  // Subscription / payment state
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    db.users.toArray().then(async users => {
      const u = users[0];
      if (!u) return;
      setUser(u);
      const bp = (u as any).bioProfile || {};
      setSlug(bp.slug || '');
      const savedTheme = (u as any).siteTheme || 'dark';
      setThemeKey(savedTheme);
      setBio((u as any).siteBio || '');

      const plan = u.plan || 'free';
      const isWebsitePlan = plan === 'website_basic' || plan === 'website_pro';
      // If website plan: add payment step (6 total: info→template→theme→preview→payment→domain)
      if (isWebsitePlan) {
        setMaxSteps(6);
        // Check subscription status
        await checkSubscription(u.id);
      } else if (plan === 'pro_plus' || plan === 'plus') {
        setMaxSteps(6); // info → template → theme → preview → locations → domain
      } else {
        setMaxSteps(5); // info → template → theme → preview → domain
      }
    });
    db.portfolio.count().then(setPortfolioCount);
    db.studioLocations.toArray().then(locs => {
      setLocations(locs);
      setSelectedLocations(new Set(locs.filter(l => l.name).map(l => l.id)));
    });
  }, []);

  // If returning from Stripe checkout (paid=1), re-check subscription
  useEffect(() => {
    if (searchParams.get('paid') === '1' && user) {
      // Poll subscription status after payment (Stripe webhook may take a moment)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await checkSubscription(user.id);
        if (subscriptionActive || attempts > 10) clearInterval(poll);
      }, 2000);
      // Clear URL param
      window.history.replaceState({}, '', window.location.pathname);
      return () => clearInterval(poll);
    }
  }, [searchParams, user]);

  const checkSubscription = async (userId: string) => {
    try {
      const base = getApiBaseUrl();
      if (!base) return;
      const res = await fetch(`${base}/api/subscription/status?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptionActive(data.active === true);
      }
    } catch { /* backend not available */ }
  };

  const handleCreateCheckout = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    setPaymentError('');
    const plan = user.plan || 'website_basic';
    const planTier = plan === 'website_pro' ? 'website_pro' : 'website_basic';
    try {
      const base = getApiBaseUrl();
      if (!base) { setPaymentError('Backend not available'); setCheckoutLoading(false); return; }
      const res = await fetch(`${base}/api/subscription/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          planTier,
          interval: 'year',
          successUrl: window.location.origin + '/website-wizard?paid=1',
          cancelUrl: window.location.origin + '/website-wizard',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url; // Redirect to Stripe
          return;
        }
      }
      const errData = await res.json().catch(() => ({}));
      setPaymentError(errData.error || 'Failed to create checkout');
    } catch (e: any) {
      setPaymentError(e.message || 'Network error');
    }
    setCheckoutLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const bp = { ...((user as any).bioProfile || {}), slug: slug.trim() || undefined };
    await db.users.update(user.id, {
      bioProfile: bp,
      siteTheme: themeKey,
      siteBio: bio.trim(),
      siteTemplate: templateKey,
      customDomain: customDomain.trim() || undefined,
      siteLocations: Array.from(selectedLocations),
    } as any);

    /* Sync to server */
    try {
      const base = getApiBaseUrl();
      if (base) {
        await fetch(`${base}/api/site-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-secret': localStorage.getItem('inkflow_api_secret') || '',
            'x-user-role': 'owner',
            'x-user-id': user.id,
          },
          body: JSON.stringify({
            artistId: user.id,
            slug: slug.trim(),
            template: templateKey,
            theme: themeKey,
            bio: bio.trim(),
            studioName: user.studioName || user.name,
            customDomain: customDomain.trim() || '',
            locations: Array.from(selectedLocations),
          }),
        });
      }
    } catch (e) {
      console.error('Site config sync failed (non-fatal):', e);
    }

    setSaving(false);
    setDone(true);
  };

  const theme = THEMES.find(t => t.key === themeKey) || THEMES[0];
  const previewUrl = slug ? `https://${slug}.ink-flows.com` : '';
  const domainUrl = customDomain.trim() ? `https://${customDomain.trim()}` : '';
  const isWebsitePlan = user?.plan === 'website_basic' || user?.plan === 'website_pro';

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Your site is live!</h2>
        {previewUrl && (
          <>
            <p style={{ color: '#94a3b8', marginBottom: 8 }}>Your page is live at:</p>
            <a href={previewUrl} target="_blank" rel="noopener"
              style={{ color: '#60a5fa', fontSize: 16, fontWeight: 600, textDecoration: 'underline', display: 'block', marginBottom: 4 }}>
              {previewUrl}
            </a>
            <button onClick={() => navigator.clipboard.writeText(previewUrl)}
              style={{ marginTop: 4, padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
              Copy Link
            </button>
            {domainUrl && (
              <>
                <p style={{ color: '#94a3b8', marginBottom: 4 }}>Custom domain:</p>
                <p style={{ color: '#22c55e', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{domainUrl}</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>DNS propagation may take a few minutes.</p>
              </>
            )}
          </>
        )}
        <br /><br />
        <button onClick={() => navigate('/me')}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, cursor: 'pointer' }}>
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 20 }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
        {Array.from({ length: maxSteps }, (_, i) => i + 1).map(s => (
          <div key={s} style={{
            width: 32, height: 32, borderRadius: 16,
            background: step >= s ? '#e11d48' : '#334155',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
          }}>{s}</div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
        {step === 1 ? 'Your Studio Info' : step === 2 ? 'Choose a Template' : step === 3 ? 'Choose a Theme' : step === 4 ? 'Preview' : step === 5 && isWebsitePlan ? 'Payment' : step === 5 ? 'Custom Domain' : step === 6 ? (isWebsitePlan ? 'Custom Domain' : 'Your Locations') : 'Custom Domain'}
      </h2>

      {/* Step 1: Info */}
      {step === 1 && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Studio Name</label>
          <input value={user?.studioName || ''} readOnly
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#64748b', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />

          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Your subdomain</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <input value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-z0-9_-]/g, '').toLowerCase())}
              placeholder="yourname"
              style={{ width: 120, padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 14, outline: 'none' }} />
            <span style={{ fontSize: 13, color: '#64748b' }}>.ink-flows.com</span>
          </div>

          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Bio / Description</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            placeholder="Tell clients about your studio, style, and experience..."
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />

          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Portfolio photos</label>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{portfolioCount} photos in portfolio. Add more from your profile.</p>

          <button onClick={() => setStep(2)}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Next: Choose Template →
          </button>
        </div>
      )}

      {/* Step 2: Layout */}
      {step === 2 && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, textAlign: 'center' }}>
            Choose how your site looks. Each layout has 5-6 unique themes (colors/fonts).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {LAYOUTS.map(l => {
              const selected = layoutKey === l.key;
              const layoutThemes = THEMES.filter(t => t.layout === l.key);
              const freeCount = layoutThemes.filter(t => t.tier === 'free').length;
              return (
                <div key={l.key} onClick={() => { setLayoutKey(l.key); setThemeKey(layoutThemes[0]?.key || 'minimal'); }}
                  style={{
                    padding: 16, borderRadius: 12, cursor: 'pointer',
                    border: selected ? '3px solid #22c55e' : '2px solid #334155',
                    background: selected ? '#16653420' : '#1e293b',
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{l.icon}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: selected ? '#22c55e' : 'white' }}>{l.name}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>{l.desc}</p>
                  <p style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                    {l.count} themes · {freeCount} free · {layoutThemes.length - freeCount} Pro/Plus
                  </p>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep(1)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={() => setStep(3)}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Next: Choose Theme →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Theme (filtered by selected layout) */}
      {step === 3 && (
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textAlign: 'center' }}>
            Layout: <strong>{LAYOUTS.find(l => l.key === layoutKey)?.name || 'Classic Scroll'}</strong>
            <span style={{ marginLeft: 8 }}>—</span>
            <span onClick={() => setStep(2)} style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', marginLeft: 4 }}>Change layout</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 500, margin: '0 auto' }}>
            {THEMES.filter(t => t.layout === layoutKey).map(t => {
              const isPro = t.tier !== 'free' && user?.plan !== 'website_pro';
              return (
                <div key={t.key} onClick={() => !isPro && setThemeKey(t.key)}
                  style={{
                    padding: 16, borderRadius: 12, cursor: isPro ? 'default' : 'pointer',
                    border: themeKey === t.key ? `3px solid ${t.primary}` : '3px solid transparent',
                    background: t.bg, color: t.text, opacity: isPro ? 0.5 : 1, position: 'relative',
                  }}>
                  {isPro && <div style={{ position: 'absolute', top: 2, right: 4, background: '#a855f7', color: '#fff', fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 4 }}>PRO</div>}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: t.primary }} />
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: t.card }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t.name}</p>
                </div>
              );
            })}
          </div>

          {/* Live preview */}
          <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid #334155', maxWidth: 300, margin: '16px auto 0' }}>
            <div style={{ background: theme.bg, padding: 16, color: theme.text }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', margin: 0 }}>{user?.studioName || 'Your Studio'}</p>
              <p style={{ fontSize: 11, color: theme.text + '88', textAlign: 'center', margin: '4px 0 8px' }}>📍 City, State</p>
              <div style={{ background: theme.primary, padding: 8, borderRadius: 8, textAlign: 'center', color: 'white', fontSize: 12, fontWeight: 600 }}>
                Book an Appointment
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, maxWidth: 400, margin: '16px auto 0' }}>
            <button onClick={() => setStep(2)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={() => setStep(4)}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Next: Preview →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 4 && (
        <div style={{ maxWidth: 350, margin: '0 auto' }}>
          {/* Full preview card */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #334155', marginBottom: 16 }}>
            <div style={{ background: theme.bg, color: theme.text }}>
              <div style={{ padding: 24, textAlign: 'center', background: theme.card }}>
                <div style={{ width: 60, height: 60, borderRadius: 30, background: theme.primary + '33', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎨</div>
                <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{user?.studioName || 'Your Studio'}</p>
                <p style={{ fontSize: 12, color: theme.text + '88', marginTop: 4 }}>{bio || 'Tattoo artist'}</p>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} style={{ aspectRatio: '1', background: theme.card, borderRadius: 4 }} />
                  ))}
                </div>
              </div>
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ background: theme.primary, padding: 12, borderRadius: 10, textAlign: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>
                  Book an Appointment
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(3)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={() => {
              const plan = user?.plan || 'free';
              if (isWebsitePlan) setStep(5); // payment step
              else if (plan === 'pro_plus' || plan === 'plus') setStep(5); // locations
              else setStep(6); // domain step (skip payment)
            }}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Next: {isWebsitePlan ? 'Payment →' : user?.plan === 'pro_plus' || user?.plan === 'plus' ? 'Locations →' : 'Domain →'}
            </button>
          </div>
          {!slug && <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginTop: 8 }}>Please enter a URL slug first</p>}
        </div>
      )}

      {/* Step 5: Payment (Website Basic/Pro only) */}
      {step === 5 && isWebsitePlan && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #334155', textAlign: 'center' }}>
            {subscriptionActive ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#4ade80' }}>Payment Complete!</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                  Your {user?.plan === 'website_pro' ? 'Website Pro' : 'Website Basic'} plan is active.
                </p>
                <button onClick={() => setStep(6)}
                  style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Next: Custom Domain →
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'white' }}>
                  {user?.plan === 'website_pro' ? 'Website Pro' : 'Website Basic'}
                </h3>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', margin: '8px 0' }}>
                  {user?.plan === 'website_pro' ? '$19.99' : '$9.99'}<span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>/year</span>
                </p>
                <div style={{ textAlign: 'left', margin: '16px 0', padding: '0 8px' }}>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>✓ {user?.plan === 'website_pro' ? 'Multi-page, all 101 templates & themes' : 'Single page, free templates'}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>✓ Subdomain (yourname.ink-flows.com)</p>
                  {user?.plan === 'website_pro' && <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>✓ Custom domain support</p>}
                  <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>✓ Online booking widget</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>✓ 14-day money-back guarantee</p>
                </div>
                {paymentError && (
                  <div style={{ background: '#7f1d1d', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <p style={{ fontSize: 12, color: '#fca5a5' }}>{paymentError}</p>
                  </div>
                )}
                <button onClick={handleCreateCheckout} disabled={checkoutLoading}
                  style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: checkoutLoading ? '#4b5563' : '#f59e0b', color: 'white', fontSize: 16, fontWeight: 700, cursor: checkoutLoading ? 'default' : 'pointer' }}>
                  {checkoutLoading ? 'Redirecting to Stripe...' : `Pay $${user?.plan === 'website_pro' ? '19.99' : '9.99'}/year →`}
                </button>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 12 }}>
                  Secure payment via Stripe. Cancel anytime.
                </p>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(4)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            {subscriptionActive && (
              <button onClick={() => setStep(6)}
                style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Next: Domain →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 5 (cont): Locations (Plus only) — separate condition so it doesn't conflict with payment step */}
      {step === 5 && (user?.plan === 'pro_plus' || user?.plan === 'plus') && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #334155' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📍 Your Studio Locations</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              Select which locations to show on your website. Each location gets its own booking link.
            </p>
            {locations.length === 0 ? (
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px dashed #475569' }}>
                <p style={{ fontSize: 12, color: '#64748b' }}>No locations yet. <a href="/locations" style={{ color: '#60a5fa' }}>Add locations first</a></p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {locations.map(loc => {
                  const isSel = selectedLocations.has(loc.id);
                  return (
                    <div key={loc.id} onClick={() => {
                      setSelectedLocations(prev => {
                        const next = new Set(prev);
                        if (next.has(loc.id)) next.delete(loc.id);
                        else next.add(loc.id);
                        return next;
                      });
                    }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: '#0f172a', border: isSel ? '2px solid #22c55e' : '1px solid #334155', cursor: 'pointer' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: isSel ? 'none' : '2px solid #475569', background: isSel ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>
                        {isSel ? '✓' : ''}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{loc.name}</p>
                        {loc.address && <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{loc.address}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ fontSize: 11, color: '#64748b' }}>Selected: {selectedLocations.size} locations</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(4)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={() => setStep(6)}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Next: Domain →
            </button>
          </div>
        </div>
      )}

      {/* Custom Domain (Step 5 for free/starter, Step 6 for Plus/website plans) */}
      {((step === 5 && user?.plan !== 'pro_plus' && user?.plan !== 'plus' && !isWebsitePlan) || (step === 6 && ((user?.plan === 'pro_plus' || user?.plan === 'plus') || isWebsitePlan))) && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #334155' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🌐 Custom Domain {(user?.plan === 'pro_plus' || user?.plan === 'plus') ? '(Plus)' : ''}</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              Use your own domain like <strong>booking.yourstudio.com</strong> instead of ink-flows.com/tattoo/yourname.
            </p>
            <input
              value={customDomain}
              onChange={e => { setCustomDomain(e.target.value); setDomainVerified(false); }}
              placeholder="booking.yourstudio.com"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />
            {customDomain && !domainVerified && (
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #334155' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', marginBottom: 6 }}>📋 DNS Setup Instructions</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>1. Go to your domain provider (GoDaddy, Namecheap, Cloudflare)</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>2. Add a CNAME record pointing to our server:</p>
                <div style={{ background: '#1e293b', borderRadius: 6, padding: 8, marginBottom: 8 }}>
                  <code style={{ fontSize: 11, color: '#60a5fa' }}>
                    {customDomain ? customDomain.split('.')[0] : 'booking'} → inkflow.pages.dev
                  </code>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>3. Come back and click Verify</p>
                <button onClick={() => setDomainVerified(true)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                  I've added the CNAME record — Verify
                </button>
              </div>
            )}
            {domainVerified && (
              <div style={{ background: '#16653420', borderRadius: 8, padding: 10, border: '1px solid #22c55e44', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>✅ Domain configured! SSL will provision automatically.</p>
              </div>
            )}
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #334155' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                💡 Don't have a domain yet? Get one from <strong>Namecheap</strong> for as low as $5.98/year.
              </p>
              <a href="https://www.namecheap.com/?aff=138601" target="_blank" rel="noopener"
                style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 6, background: '#2563eb', color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                Search Domains on Namecheap →
              </a>
              <p style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                Affiliate link — we earn a small commission at no extra cost to you.
              </p>
            </div>
            <p style={{ fontSize: 11, color: '#64748b' }}>
              Or publish without a domain (yourname.ink-flows.com).
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              const plan = user?.plan || 'free';
              if (isWebsitePlan) setStep(5);
              else if (plan === 'pro_plus' || plan === 'plus') setStep(5);
              else setStep(4);
            }}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={handleSave} disabled={saving || !slug || (isWebsitePlan && !subscriptionActive)}
              style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: (saving || !slug || (isWebsitePlan && !subscriptionActive)) ? '#4b5563' : '#22c55e', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Publishing...' : '🚀 Publish Website'}
            </button>
          </div>
          {!slug && <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginTop: 8 }}>Please enter a URL slug first</p>}
        </div>
      )}
    </div>
  );
}

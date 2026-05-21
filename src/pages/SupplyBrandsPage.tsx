import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type SupplyBrandRecord, type SupplyProduct } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { trackAffiliateClick, getClickStats } from '../lib/affiliateTracking';
import { getUserCountry } from '../lib/locationLogic';
import { SHIPS_TO_MAP } from '../lib/supplyShipsTo';

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
  // ── Ink (墨水) ──
  {
    id: 'brand_eternal_ink',
    name: 'Eternal Ink',
    category: 'ink',
    description: 'Organic, 100% vegan, bright radiant colors that resist fading. Industry standard for color work.',
    logoUrl: '',
    affiliateLink: 'https://eternaltattooink.com',
    commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_ei_1', name: 'Eternal Ink Black Liner 8oz', imageUrl: '', price: '$29.99', affiliateLink: 'https://eternaltattooink.com/black-liner', note: 'Best seller' },
      { id: 'prod_ei_2', name: 'Eternal Ink Color Set (12x1oz)', imageUrl: '', price: '$89.99', affiliateLink: 'https://eternaltattooink.com/color-set', note: 'New color range', isNew: true, createdAt: NOW - 5 * DAY },
    ],
    shipsTo: ['US', 'CA', 'MX', 'CO', 'PE', 'GB', 'IE', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'GR', 'AU', 'NZ'],
    sortOrder: 1, active: true, featured: true, createdAt: NOW,
  },
  {
    id: 'brand_intenze',
    name: 'Intenze',
    category: 'ink',
    description: 'Hundreds of colors, sterile/vegan-friendly, decades of industry trust. Often cited as global #1.',
    logoUrl: '',
    affiliateLink: 'https://intenzetattooink.com',
    commissionNote: 'Up to 7% commission',
    products: [
      { id: 'prod_iz_1', name: 'Intenze Zuper Black 12oz', imageUrl: '', price: '$34.99', affiliateLink: 'https://intenzetattooink.com/zuper-black', note: 'Industry staple' },
      { id: 'prod_iz_2', name: 'Intenze Color Set (14x1oz)', imageUrl: '', price: '$99.99', affiliateLink: 'https://intenzetattooink.com/color-set', note: 'Pro palette', isNew: true, createdAt: NOW - 10 * DAY },
    ],
    shipsTo: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'DK', 'SE', 'NO', 'PL', 'IE', 'IN', 'JP', 'BR', 'AU', 'NZ'],
    sortOrder: 2, active: true, featured: true, createdAt: NOW,
  },
  {
    id: 'brand_dynamic',
    name: 'Dynamic Ink',
    category: 'ink',
    description: 'Industry staple for black ink. Dynamic Black is the go-to for outlines, lettering, and grey washes.',
    logoUrl: '',
    affiliateLink: 'https://dynamiccolor.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_di_1', name: 'Dynamic Black 8oz', imageUrl: '', price: '$24.99', affiliateLink: 'https://dynamiccolor.com/black', note: '#1 black ink' },
      { id: 'prod_di_2', name: 'Dynamic Triple Black 8oz', imageUrl: '', price: '$27.99', affiliateLink: 'https://dynamiccolor.com/triple-black', note: 'Extra dark' },
    ],
    shipsTo: ['US', 'CA', 'GB', 'IE', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'DK', 'SE', 'NO', 'PL', 'LT', 'AU', 'NZ', 'ZA', 'PE', 'EC', 'SG', 'SA', 'PH', 'MX'],
    sortOrder: 3, active: true, featured: true, createdAt: NOW,
  },
  {
    id: 'brand_kuro_sumi',
    name: 'Kuro Sumi',
    category: 'ink',
    description: 'Japanese heritage; exceptional black & grey tones. Natural ingredients, favored for large-scale blackwork.',
    logoUrl: '',
    affiliateLink: 'https://kurosumi.com',
    commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_ks_1', name: 'Kuro Sumi Outlining Black 6oz', imageUrl: '', price: '$22.99', affiliateLink: 'https://kurosumi.com/outlining', note: 'Tribal/japanese' },
      { id: 'prod_ks_2', name: 'Kuro Sumi Grey Wash Set (6 bottles)', imageUrl: '', price: '$49.99', affiliateLink: 'https://kurosumi.com/grey-wash', note: 'Smooth gradients' },
    ],
    shipsTo: ['US', 'CA', 'GB', 'IE', 'DE', 'NL', 'AE', 'IN', 'AU', 'NZ'],
    sortOrder: 4, active: true, createdAt: NOW,
  },
  {
    id: 'brand_world_famous',
    name: 'World Famous Ink',
    category: 'ink',
    description: 'Vegan, cruelty-free, eco-conscious. Trendy color collections for portraits and modern designs.',
    logoUrl: '',
    affiliateLink: 'https://worldfamoustattooink.com',
    commissionNote: 'Up to 7% commission',
    products: [
      { id: 'prod_wf_1', name: 'World Famous Black Outline 8oz', imageUrl: '', price: '$26.99', affiliateLink: 'https://worldfamoustattooink.com/black', note: 'Vegan formula' },
      { id: 'prod_wf_2', name: 'World Famous Portrait Set (12x1oz)', imageUrl: '', price: '$79.99', affiliateLink: 'https://worldfamoustattooink.com/portrait', note: 'Realism focused' },
    ],
    sortOrder: 5, active: true, createdAt: NOW,
  },
  {
    id: 'brand_starbrite',
    name: 'StarBrite Colors',
    category: 'ink',
    description: '30+ year legacy. Stable, fade-resistant pigments across all skin tones. Smooth application.',
    logoUrl: '',
    affiliateLink: 'https://starbritecolors.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_sb_1', name: 'StarBrite Pro Starter Set (6x2oz)', imageUrl: '', price: '$59.99', affiliateLink: 'https://starbritecolors.com/starter', note: 'Veteran trusted' },
    ],
    sortOrder: 6, active: true, createdAt: NOW,
  },
  {
    id: 'brand_radiant',
    name: 'Radiant Colors',
    category: 'ink',
    description: 'Affordable yet professional-grade. Bright, consistent colors — great value for money.',
    logoUrl: '',
    affiliateLink: 'https://radiantcolors.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_rc_1', name: 'Radiant Colors Full Set (20x1oz)', imageUrl: '', price: '$69.99', affiliateLink: 'https://radiantcolors.com/full-set', note: 'Best value' },
    ],
    sortOrder: 7, active: true, createdAt: NOW,
  },
  {
    id: 'brand_panthera',
    name: 'Panthera Black',
    category: 'ink',
    description: 'Ultra-deep black ink specialist. Bold blackwork, crisp lines, minimal dilution needed.',
    logoUrl: '',
    affiliateLink: 'https://pantherablack.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_pb_1', name: 'Panthera XXX Black 8oz', imageUrl: '', price: '$28.99', affiliateLink: 'https://pantherablack.com/xxx', note: 'Ultra concentrated' },
    ],
    sortOrder: 8, active: true, createdAt: NOW,
  },
  {
    id: 'brand_solid_ink',
    name: 'Solid Ink',
    category: 'ink',
    description: 'Bold, vibrant colors trusted worldwide. Known for consistent quality across their 100+ color range.',
    logoUrl: '',
    affiliateLink: 'https://solidink.com',
    commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_si_1', name: 'Solid Ink Lining Black 12oz', imageUrl: '', price: '$27.99', affiliateLink: 'https://solidink.com/black', note: 'Popular choice' },
    ],
    shipsTo: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'NZ'],
    sortOrder: 9, active: true, createdAt: NOW,
  },
  // ── Needles (针) ──
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
    ],
    sortOrder: 10, active: true, createdAt: NOW,
  },
  {
    id: 'brand_cheyenne_needles',
    name: 'Cheyenne Cartridges',
    category: 'needles',
    description: 'Industry gold standard cartridges. Friction-reducing needle coating, E.O. gas sterilized.',
    logoUrl: '',
    affiliateLink: 'https://cheyennetattoo.com/cartridges',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_cn_1', name: 'Cheyenne Safety Cartridge Liners (Box 50)', imageUrl: '', price: '$44.99', affiliateLink: 'https://cheyennetattoo.com/cartridges/liners', note: 'Premium' },
      { id: 'prod_cn_2', name: 'Cheyenne Safety Cartridge Mags (Box 50)', imageUrl: '', price: '$47.99', affiliateLink: 'https://cheyennetattoo.com/cartridges/mags', note: 'Smooth shading' },
    ],
    sortOrder: 11, active: true, featured: true, createdAt: NOW,
  },
  {
    id: 'brand_electrum',
    name: 'Electrum FIRE',
    category: 'needles',
    description: 'Pressure-sealed membrane prevents backflow. Tight tolerances, minimal wobble, less skin trauma.',
    logoUrl: '',
    affiliateLink: 'https://electrumsupply.com',
    commissionNote: 'Up to 7% commission',
    products: [
      { id: 'prod_el_1', name: 'Electrum FIRE Cartridges (Box 50)', imageUrl: '', price: '$38.99', affiliateLink: 'https://electrumsupply.com/fire', note: 'Backflow protection' },
    ],
    sortOrder: 12, active: true, createdAt: NOW,
  },
  {
    id: 'brand_elite',
    name: 'ELITE Tattoo',
    category: 'needles',
    description: 'Three series (INFINI/ELITE 3/EVO) for realism, traditional, and speed work. 87+ configs per series.',
    logoUrl: '',
    affiliateLink: 'https://elitetattoo.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_et_1', name: 'ELITE INFINI Cartridges (Box 50)', imageUrl: '', price: '$36.99', affiliateLink: 'https://elitetattoo.com/infini', note: 'Realism specialist' },
      { id: 'prod_et_2', name: 'ELITE EVO Cartridges (Box 50)', imageUrl: '', price: '$34.99', affiliateLink: 'https://elitetattoo.com/evo', note: 'Speed work', isNew: true, createdAt: NOW - 6 * DAY },
    ],
    sortOrder: 13, active: true, createdAt: NOW,
  },
  {
    id: 'brand_stigma',
    name: 'Stigma',
    category: 'needles',
    description: 'Ergonomic, lightweight design — reduces hand fatigue. Broad machine compatibility at affordable pricing.',
    logoUrl: '',
    affiliateLink: 'https://stigmatattoosupply.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_sg_1', name: 'Stigma Pro Cartridges (Box 50)', imageUrl: '', price: '$29.99', affiliateLink: 'https://stigmatattoosupply.com/pro', note: 'Value pick' },
    ],
    sortOrder: 14, active: true, createdAt: NOW,
  },
  {
    id: 'brand_bishop_needles',
    name: 'Bishop Cartridges',
    category: 'needles',
    description: 'Optimized for rotary machines. Enhanced ink retention — fewer re-dips, faster sessions.',
    logoUrl: '',
    affiliateLink: 'https://bishoprotary.com/cartridges',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_bn_1', name: 'Bishop DaVinci Cartridges (Box 50)', imageUrl: '', price: '$41.99', affiliateLink: 'https://bishoprotary.com/davinci', note: 'Rotary optimized' },
    ],
    sortOrder: 15, active: true, createdAt: NOW,
  },
  {
    id: 'brand_black_claw',
    name: 'Black Claw',
    category: 'needles',
    description: 'Premium needles favored by blackwork and fine-line specialists. Exceptional sharpness and consistency.',
    logoUrl: '',
    affiliateLink: 'https://blackclawtattoo.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_bc_1', name: 'Black Claw Cartridges (Box 50)', imageUrl: '', price: '$44.99', affiliateLink: 'https://blackclawtattoo.com/cartridges', note: 'Fine-line specialist' },
    ],
    sortOrder: 16, active: true, createdAt: NOW,
  },
  {
    id: 'brand_inkjecta_needles',
    name: 'Inkjecta Needles',
    category: 'needles',
    description: 'Swedish precision manufacturing. High-end automated production for exact tolerances.',
    logoUrl: '',
    affiliateLink: 'https://inkjecta.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ij_1', name: 'Inkjecta Precision Cartridges (Box 50)', imageUrl: '', price: '$43.99', affiliateLink: 'https://inkjecta.com/cartridges', note: 'Swedish precision' },
    ],
    sortOrder: 17, active: true, createdAt: NOW,
  },
  {
    id: 'brand_mast',
    name: 'Mast Tattoo',
    category: 'needles',
    description: 'Popular mid-range brand. Good balance of quality and price, wide global distribution.',
    logoUrl: '',
    affiliateLink: 'https://masttattoo.com',
    commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_mt_2', name: 'Mast Pro Cartridges (Box 50)', imageUrl: '', price: '$24.99', affiliateLink: 'https://masttattoo.com/pro-cartridges', note: 'Best selling' },
      { id: 'prod_mt_3', name: 'Mast Tour Cartridges (Box 50)', imageUrl: '', price: '$27.99', affiliateLink: 'https://masttattoo.com/tour', note: 'Professional grade', isNew: true, createdAt: NOW - 8 * DAY },
    ],
    sortOrder: 18, active: true, createdAt: NOW,
  },
  {
    id: 'brand_eikon',
    name: 'Eikon Tattoo',
    category: 'needles',
    description: 'Hand-crafted Spanish cartridges. Aesthetic design, strict EU manufacturing standards.',
    logoUrl: '',
    affiliateLink: 'https://eikontattoo.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ek_1', name: 'Eikon Precision Cartridges (Box 50)', imageUrl: '', price: '$37.99', affiliateLink: 'https://eikontattoo.com/cartridges', note: 'Spanish crafted' },
    ],
    sortOrder: 19, active: true, createdAt: NOW,
  },
  {
    id: 'brand_peak_needles',
    name: 'Peak Needles',
    category: 'needles',
    description: 'Professional cartridges known for reliable quality. Wide range of configurations.',
    logoUrl: '',
    affiliateLink: 'https://peaktattoomachines.com/needles',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_pn_1', name: 'Peak Cartridges (Box 50)', imageUrl: '', price: '$31.99', affiliateLink: 'https://peaktattoomachines.com/cartridges', note: 'Pro choice' },
    ],
    sortOrder: 20, active: true, createdAt: NOW,
  },
  {
    id: 'brand_peach',
    name: 'Peach Tattoo Supply',
    category: 'needles',
    description: 'Major OEM needle manufacturer (Suzhou, est. 2001). 316L surgical steel, ISO 13485 certified. OEM for many global brands.',
    logoUrl: '',
    affiliateLink: 'https://peachtattoosupply.com',
    commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_pe_1', name: 'Peach Cog Series Cartridges (Box 50)', imageUrl: '', price: '$19.99', affiliateLink: 'https://peachtattoosupply.com/cog-series', note: 'Vibration-reducing' },
      { id: 'prod_pe_2', name: 'Peach Pro EN Cartridges (Box 50)', imageUrl: '', price: '$22.99', affiliateLink: 'https://peachtattoosupply.com/pro-en', note: 'Professional grade', isNew: true, createdAt: NOW - 6 * DAY },
    ],
    shipsTo: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'AU', 'JP', 'KR', 'BR', 'MX'],
    sortOrder: 21, active: true, createdAt: NOW,
  },
  {
    id: 'brand_da_vinci',
    name: 'Da Vinci',
    category: 'needles',
    description: 'Premium cartridges known for medical-grade precision. Trusted by top realism and portrait artists.',
    logoUrl: '',
    affiliateLink: 'https://davincitattoo.com',
    commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_dv_1', name: 'Da Vinci V2 Cartridges (Box 50)', imageUrl: '', price: '$42.99', affiliateLink: 'https://davincitattoo.com/cartridges', note: 'Medical-grade' },
    ],
    shipsTo: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'AU', 'JP', 'KR'],
    sortOrder: 22, active: true, createdAt: NOW,
  },
  // ── Machines (机器) ──
  {
    id: 'brand_cheyenne',
    name: 'Cheyenne',
    category: 'machines',
    description: 'Premium German-engineered tattoo machines. Precision, reliability, and ergonomic design.',
    logoUrl: '',
    affiliateLink: 'https://cheyennetattoo.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ch_1', name: 'Cheyenne SOL Nova Unlimited II', imageUrl: '', price: '$899.00', affiliateLink: 'https://cheyennetattoo.com/sol-nova', note: 'Wireless flagship' },
      { id: 'prod_ch_2', name: 'Cheyenne HAWK Pen', imageUrl: '', price: '$549.00', affiliateLink: 'https://cheyennetattoo.com/hawk-pen', note: 'Versatile workhorse' },
    ],
    sortOrder: 20, active: true, featured: true, createdAt: NOW,
  },
  {
    id: 'brand_bishop',
    name: 'Bishop Rotary',
    category: 'machines',
    description: 'American-made rotary machines known for legendary reliability. Up to 15hr battery life.',
    logoUrl: '',
    affiliateLink: 'https://bishoprotary.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_br_1', name: 'Bishop Power Wand Packer', imageUrl: '', price: '$649.00', affiliateLink: 'https://bishoprotary.com/packer', note: 'New release', isNew: true, createdAt: NOW - 2 * DAY },
      { id: 'prod_br_2', name: 'Bishop Power Wand Liner', imageUrl: '', price: '$629.00', affiliateLink: 'https://bishoprotary.com/liner', note: 'Crisp lines' },
    ],
    sortOrder: 21, active: true, featured: true, createdAt: NOW,
  },
  {
    id: 'brand_fk_irons',
    name: 'FK Irons',
    category: 'machines',
    description: 'Top-tier wireless machines. Flux Max powered by PowerBolt II, customizable stroke options.',
    logoUrl: '',
    affiliateLink: 'https://fkirons.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_fk_1', name: 'FK Irons Flux Max', imageUrl: '', price: '$749.00', affiliateLink: 'https://fkirons.com/flux-max', note: 'Premium wireless' },
      { id: 'prod_fk_2', name: 'FK Irons EXO', imageUrl: '', price: '$499.00', affiliateLink: 'https://fkirons.com/exo', note: 'Mid-range pick' },
    ],
    sortOrder: 22, active: true, createdAt: NOW,
  },
  {
    id: 'brand_musotoku',
    name: 'Musotoku',
    category: 'machines',
    description: 'Faulhaber brushless motor + direct drive. Compact, balanced, tuned per stroke length.',
    logoUrl: '',
    affiliateLink: 'https://musotoku.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_mt_1', name: 'Musotoku Mercury M-1', imageUrl: '', price: '$699.00', affiliateLink: 'https://musotoku.com/mercury-m1', note: 'Precision engineered' },
    ],
    sortOrder: 23, active: true, createdAt: NOW,
  },
  {
    id: 'brand_acus',
    name: 'ACUS',
    category: 'machines',
    description: 'Interchangeable drive heads for all stroke lengths. M1 Plus for larger hands, C2 for compact builds.',
    logoUrl: '',
    affiliateLink: 'https://acustattoo.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ac_1', name: 'ACUS M1 Plus', imageUrl: '', price: '$599.00', affiliateLink: 'https://acustattoo.com/m1-plus', note: 'Versatile stroke' },
      { id: 'prod_ac_2', name: 'ACUS C2', imageUrl: '', price: '$399.00', affiliateLink: 'https://acustattoo.com/c2', note: 'Compact ergonomic' },
    ],
    sortOrder: 24, active: true, createdAt: NOW,
  },
  {
    id: 'brand_dragonhawk',
    name: 'Dragonhawk',
    category: 'machines',
    description: 'Best entry-level wireless machines. Fold Pro customizable stroke, Mast Archer simple & reliable.',
    logoUrl: '',
    affiliateLink: 'https://dragonhawk.com',
    commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_dh_1', name: 'Dragonhawk Fold Pro', imageUrl: '', price: '$199.00', affiliateLink: 'https://dragonhawk.com/fold-pro', note: 'Best beginner wireless' },
      { id: 'prod_dh_2', name: 'Dragonhawk Mast Archer', imageUrl: '', price: '$129.00', affiliateLink: 'https://dragonhawk.com/mast-archer', note: 'Budget reliable' },
    ],
    sortOrder: 25, active: true, createdAt: NOW,
  },
  {
    id: 'brand_peak',
    name: 'Peak',
    category: 'machines',
    description: 'Adjustable stroke (2.4-4.2mm). Great for beginners and pros experimenting with styles.',
    logoUrl: '',
    affiliateLink: 'https://peaktattoomachines.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_pk_1', name: 'Peak Solice Pro V2', imageUrl: '', price: '$349.00', affiliateLink: 'https://peaktattoomachines.com/solice-pro', note: 'Adjustable stroke' },
    ],
    sortOrder: 26, active: true, createdAt: NOW,
  },
  {
    id: 'brand_darklab',
    name: 'Darklab',
    category: 'machines',
    description: 'Ergonomic design to reduce hand fatigue. Compatible with Ergo Shield disposable grips.',
    logoUrl: '',
    affiliateLink: 'https://darklabtattoo.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_dl_1', name: 'Darklab Ergo', imageUrl: '', price: '$279.00', affiliateLink: 'https://darklabtattoo.com/ergo', note: 'Ergo specialist' },
    ],
    sortOrder: 27, active: true, createdAt: NOW,
  },
  {
    id: 'brand_inkjecta',
    name: 'Inkjecta',
    category: 'machines',
    description: 'Swedish precision engineering. Flite Nano series — compact, lightweight, direct drive rotary.',
    logoUrl: '',
    affiliateLink: 'https://inkjecta.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ij_2', name: 'Inkjecta Flite Nano', imageUrl: '', price: '$599.00', affiliateLink: 'https://inkjecta.com/flite-nano', note: 'Swiss precision' },
    ],
    sortOrder: 28, active: true, createdAt: NOW,
  },
  {
    id: 'brand_vlad_blad',
    name: 'Vlad Blad',
    category: 'machines',
    description: 'Premium rotary machines. Ultron 3 and Avenger series — powerful, durable, artist-favored.',
    logoUrl: '',
    affiliateLink: 'https://vladblad.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_vb_1', name: 'Vlad Blad Ultron 3', imageUrl: '', price: '$649.00', affiliateLink: 'https://vladblad.com/ultron-3', note: 'Power rotary' },
      { id: 'prod_vb_2', name: 'Vlad Blad Avenger 3 Pro', imageUrl: '', price: '$549.00', affiliateLink: 'https://vladblad.com/avenger-3', note: 'Versatile workhorse' },
    ],
    sortOrder: 29, active: true, createdAt: NOW,
  },
  {
    id: 'brand_mast_machines',
    name: 'Mast Tattoo',
    category: 'machines',
    description: 'Best-selling mid-range pen machines. Archer, Tour, Flip Pro — popular globally for value.',
    logoUrl: '',
    affiliateLink: 'https://masttattoo.com',
    commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_ms_1', name: 'Mast Archer Wireless', imageUrl: '', price: '$149.00', affiliateLink: 'https://masttattoo.com/archer', note: 'Best value pen' },
      { id: 'prod_ms_2', name: 'Mast Flip Pro', imageUrl: '', price: '$219.00', affiliateLink: 'https://masttattoo.com/flip-pro', note: 'Adjustable stroke', isNew: true, createdAt: NOW - 5 * DAY },
    ],
    sortOrder: 30, active: true, createdAt: NOW,
  },
  {
    id: 'brand_ez',
    name: 'EZ Tattoo',
    category: 'machines',
    description: 'Adjustable stroke (3.0-5.0mm) with brushless motor + direct drive. Steady, responsive.',
    logoUrl: '',
    affiliateLink: 'https://eztattoosupply.com',
    commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_ez_1', name: 'EZ P3 Pro Turbo', imageUrl: '', price: '$329.00', affiliateLink: 'https://eztattoosupply.com/p3-pro', note: 'Adjustable stroke' },
    ],
    sortOrder: 31, active: true, createdAt: NOW,
  },
  {
    id: 'brand_stigma_rotary',
    name: 'Stigma-Rotary',
    category: 'machines',
    description: 'Premium adjustable rotary. Climber and Hyper V4 — versatile, ergonomic, long-lasting.',
    logoUrl: '',
    affiliateLink: 'https://stigma-rotary.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_sr_1', name: 'Stigma Hyper V4', imageUrl: '', price: '$449.00', affiliateLink: 'https://stigma-rotary.com/hyper-v4', note: 'Pro adjustable' },
    ],
    sortOrder: 32, active: true, createdAt: NOW,
  },
  {
    id: 'brand_critical',
    name: 'Critical Tattoo',
    category: 'machines',
    description: 'Torque series — reliable mid-range pen machines. Solid build quality for daily professional use.',
    logoUrl: '',
    affiliateLink: 'https://criticaltattoo.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ct_1', name: 'Critical Torque Pen', imageUrl: '', price: '$289.00', affiliateLink: 'https://criticaltattoo.com/torque', note: 'Daily workhorse' },
    ],
    sortOrder: 33, active: true, createdAt: NOW,
  },
  {
    id: 'brand_ambition',
    name: 'Ambition',
    category: 'machines',
    description: 'Ultra-budget pen machines. Popular among apprentices and as backup machines for pros.',
    logoUrl: '',
    affiliateLink: 'https://ambitiontattoo.com',
    commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_ab_1', name: 'Ambition Wireless Pen', imageUrl: '', price: '$79.00', affiliateLink: 'https://ambitiontattoo.com/wireless-pen', note: 'Budget wireless' },
    ],
    sortOrder: 34, active: true, createdAt: NOW,
  },
  {
    id: 'brand_workhorse',
    name: 'Workhorse Irons',
    category: 'machines',
    description: 'Legendary US-made coil machines. Dan Kubin, Seth Ciferri signatures — iconic frames for bold traditional work.',
    logoUrl: '',
    affiliateLink: 'https://workhorseirons.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_wh_1', name: 'Workhorse Dan Kubin Sidewinder', imageUrl: '', price: '$549.00', affiliateLink: 'https://workhorseirons.com/dan-kubin', note: 'Coil legend' },
    ],
    sortOrder: 35, active: true, createdAt: NOW,
  },
  // ── Aftercare (护理) ──
  {
    id: 'brand_hustle_butter',
    name: 'Hustle Butter',
    category: 'aftercare',
    description: 'Industry gold standard. 100% vegan, petroleum-free. Used during and after tattooing.',
    logoUrl: '',
    affiliateLink: 'https://hustlebutter.com',
    commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_hb_1', name: 'Hustle Butter Deluxe 5oz Tub', imageUrl: '', price: '$19.99', affiliateLink: 'https://hustlebutter.com/deluxe', note: 'Essential' },
      { id: 'prod_hb_2', name: 'Hustle Butter CBD Foam Soap', imageUrl: '', price: '$14.99', affiliateLink: 'https://hustlebutter.com/soap', note: 'New formula', isNew: true, createdAt: NOW - 7 * DAY },
    ],
    sortOrder: 30, active: true, featured: true, createdAt: NOW,
  },
  {
    id: 'brand_tattoo_goo',
    name: 'Tattoo Goo',
    category: 'aftercare',
    description: 'Petroleum-free, dermatologist tested. Color enhancement and faster healing. Made in USA.',
    logoUrl: '',
    affiliateLink: 'https://tattoogoo.com',
    commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_tg_1', name: 'Tattoo Goo 3-Piece Kit', imageUrl: '', price: '$24.99', affiliateLink: 'https://tattoogoo.com/kit', note: 'Soap+balm+lotion' },
      { id: 'prod_tg_2', name: 'Tattoo Goo Balm 0.75oz', imageUrl: '', price: '$8.99', affiliateLink: 'https://tattoogoo.com/balm', note: 'Portable' },
    ],
    sortOrder: 31, active: true, createdAt: NOW,
  },
  {
    id: 'brand_mad_rabbit',
    name: 'Mad Rabbit',
    category: 'aftercare',
    description: 'Shark Tank featured. Clean ingredients, lightweight gel. Excellent for color revival on older work.',
    logoUrl: '',
    affiliateLink: 'https://madrabbit.com',
    commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_mr_1', name: 'Mad Rabbit Tattoo Balm 2oz', imageUrl: '', price: '$24.99', affiliateLink: 'https://madrabbit.com/balm', note: 'Color revive' },
      { id: 'prod_mr_2', name: 'Mad Rabbit Soothing Gel', imageUrl: '', price: '$19.99', affiliateLink: 'https://madrabbit.com/gel', note: 'New release', isNew: true, createdAt: NOW - 4 * DAY },
    ],
    sortOrder: 32, active: true, createdAt: NOW,
  },
  {
    id: 'brand_after_inked',
    name: 'After Inked',
    category: 'aftercare',
    description: 'Non-petroleum, fragrance-free, fast-absorbing lotion. Famously used on INK MASTER.',
    logoUrl: '',
    affiliateLink: 'https://afterinked.com',
    commissionNote: 'Up to 7% commission',
    products: [
      { id: 'prod_ai_1', name: 'After Inked Lotion 3oz', imageUrl: '', price: '$14.99', affiliateLink: 'https://afterinked.com/lotion', note: 'INK MASTER choice' },
    ],
    sortOrder: 33, active: true, createdAt: NOW,
  },
  {
    id: 'brand_aquaphor',
    name: 'Aquaphor',
    category: 'aftercare',
    description: 'Trusted healing ointment for early tattoo healing phase. Fragrance-free, dermatologist recommended.',
    logoUrl: '',
    affiliateLink: 'https://aquaphorus.com',
    commissionNote: 'Up to 3% commission',
    products: [
      { id: 'prod_aq_1', name: 'Aquaphor Healing Ointment 7oz', imageUrl: '', price: '$12.99', affiliateLink: 'https://aquaphorus.com/healing', note: 'Healing phase' },
    ],
    sortOrder: 34, active: true, createdAt: NOW,
  },
  {
    id: 'brand_h2ocean',
    name: 'H2Ocean',
    category: 'aftercare',
    description: 'Sea-salt-based healing foam and lotion. Known for gentle, natural tattoo aftercare.',
    logoUrl: '',
    affiliateLink: 'https://h2ocean.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ho_1', name: 'H2Ocean Aftercare Kit', imageUrl: '', price: '$19.99', affiliateLink: 'https://h2ocean.com/kit', note: 'Sea salt formula' },
    ],
    sortOrder: 35, active: true, createdAt: NOW,
  },
  {
    id: 'brand_oras',
    name: "Ora's Amazing Herbal",
    category: 'aftercare',
    description: 'All-natural, organic tattoo aftercare. Handmade in small batches. Cult favorite for sensitive skin.',
    logoUrl: '',
    affiliateLink: 'https://orasamazingherbal.com',
    commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_oa_1', name: "Ora's Tattoo Salve 2oz", imageUrl: '', price: '$17.99', affiliateLink: 'https://orasamazingherbal.com/salve', note: 'All-natural' },
    ],
    shipsTo: ['US', 'CA', 'GB', 'AU', 'NZ'],
    sortOrder: 36, active: true, createdAt: NOW,
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
  const [search, setSearch] = useState('');
  const [clickStats, setClickStats] = useState({ total: 0, today: 0 });
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [shipsHereOnly, setShipsHereOnly] = useState(false);

  const refreshClickStats = async () => {
    const stats = await getClickStats();
    setClickStats({ total: stats.total, today: stats.today });
  };

  useEffect(() => {
    refreshClickStats();
    getUserCountry().then(setUserCountry);
  }, []);

  useEffect(() => {
    const load = async () => {
      let all = await db.supplyBrands.toArray();
      if (all.length === 0) {
        await db.supplyBrands.bulkAdd(SEED_BRANDS);
        all = SEED_BRANDS;
      } else {
        const existingIds = new Set(all.map(b => b.id));
        const missing = SEED_BRANDS.filter(b => !existingIds.has(b.id));
        if (missing.length > 0) {
          await db.supplyBrands.bulkAdd(missing);
          all.push(...missing);
        }
      }
      all = all.map(b => ({ ...b, shipsTo: b.shipsTo || SHIPS_TO_MAP[b.id] }));
      all.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
      setBrands(all.filter(b => b.active));
    };
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    let result = category === 'all' ? brands : brands.filter(b => b.category === category);
    if (q) result = result.filter(b => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.products.some(p => p.name.toLowerCase().includes(q)));
    if (shipsHereOnly && userCountry) result = result.filter(b => b.shipsTo?.includes(userCountry));
    return result;
  }, [brands, category, q, shipsHereOnly, userCountry]);

  const newProducts = useMemo(() => {
    const items: (SupplyProduct & { brandName: string; brandCategory: SupplyBrandRecord['category'] })[] = [];
    for (const b of brands) {
      if (shipsHereOnly && userCountry && !b.shipsTo?.includes(userCountry)) continue;
      for (const p of b.products) {
        if (!p.isNew) continue;
        if (category !== 'all' && b.category !== category) continue;
        if (q && !p.name.toLowerCase().includes(q) && !b.name.toLowerCase().includes(q)) continue;
      }
    }
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return items;
  }, [brands, category, q]);

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

      {/* Click stats bar */}
      {clickStats.total > 0 && (
        <div style={{ margin: '4px 20px 0', padding: '8px 14px', borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          <span style={{ color: '#64748b' }}>Clicks:</span>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>{clickStats.today} today</span>
          <span style={{ color: '#475569' }}>·</span>
          <span style={{ color: '#94a3b8' }}>{clickStats.total} total</span>
        </div>
      )}

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

      {/* Search + filter */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid #1e293b', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search brands or products..."
          value={search}
          onChange={e => { setSearch(e.target.value); setExpandedBrand(null); }}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #334155',
            background: '#1e293b',
            color: 'white',
            fontSize: 13,
            outline: 'none',
          }}
        />
        {userCountry && (
          <button
            onClick={() => setShipsHereOnly(!shipsHereOnly)}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: shipsHereOnly ? '2px solid #22c55e' : '2px solid #334155',
              background: shipsHereOnly ? '#22c55e20' : 'transparent',
              color: shipsHereOnly ? '#4ade80' : '#64748b',
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {shipsHereOnly ? 'Ships here' : 'All countries'}
          </button>
        )}
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
                      {userCountry && brand.shipsTo?.includes(userCountry) && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 600, background: '#22c55e20', color: '#4ade80' }}>Ships here</span>
                      )}
                      {userCountry && brand.shipsTo && !brand.shipsTo.includes(userCountry) && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 600, background: '#ef444420', color: '#f87171' }}>Not verified</span>
                      )}
                      {userCountry && !brand.shipsTo && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 600, background: '#47556920', color: '#64748b' }}>?</span>
                      )}
                      {brand.featured && <span style={{ fontSize: 10, background: '#fbbf2420', color: '#fbbf24', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Featured</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.description}</p>
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
                          <a href={p.affiliateLink} rel="noopener noreferrer" onClick={async e => { e.preventDefault(); e.stopPropagation(); await trackAffiliateClick({ brandId: brand.id, brandName: brand.name, productId: p.id, productName: p.name, affiliateLink: p.affiliateLink }); refreshClickStats(); const prods = brand.products.map(x => x.id === p.id ? { ...x, clickCount: (x.clickCount || 0) + 1 } : x); await db.supplyBrands.update(brand.id, { products: prods }); brand.products = prods; window.open(p.affiliateLink, '_blank', 'noopener,noreferrer'); }} style={{ padding: '8px 16px', borderRadius: 10, background: '#e11d48', color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0, cursor: 'pointer' }}>
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
              <a href={p.affiliateLink} rel="noopener noreferrer" onClick={async e => {
                e.preventDefault();
                const brand = brands.find(b => b.id.startsWith('brand_') && b.products.some(x => x.id === p.id));
                if (brand) {
                  await trackAffiliateClick({ brandId: brand.id, brandName: brand.name, productId: p.id, productName: p.name, affiliateLink: p.affiliateLink });
                  refreshClickStats();
                  const prods = brand.products.map(x => x.id === p.id ? { ...x, clickCount: (x.clickCount || 0) + 1 } : x);
                  await db.supplyBrands.update(brand.id, { products: prods });
                  p.clickCount = (p.clickCount || 0) + 1;
                }
                window.open(p.affiliateLink, '_blank', 'noopener,noreferrer');
              }} style={{ padding: '8px 16px', borderRadius: 10, background: '#e11d48', color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0, cursor: 'pointer' }}>
                {t(lang, 'buy')}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

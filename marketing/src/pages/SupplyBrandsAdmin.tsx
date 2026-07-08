import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type SupplyBrandRecord, type SupplyProduct } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';

const SEED_BRANDS: SupplyBrandRecord[] = [
  // ── Ink (墨水) ──
  {
    id: 'brand_eternal_ink', name: 'Eternal Ink', category: 'ink',
    description: 'Organic, 100% vegan, bright radiant colors that resist fading. Industry standard for color work.',
    logoUrl: '', affiliateLink: 'https://eternaltattooink.com', commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_ei_1', name: 'Eternal Ink Black Liner 8oz', imageUrl: '', price: '$29.99', affiliateLink: 'https://eternaltattooink.com/black-liner', note: 'Best seller' },
      { id: 'prod_ei_2', name: 'Eternal Ink Color Set (12x1oz)', imageUrl: '', price: '$89.99', affiliateLink: 'https://eternaltattooink.com/color-set', note: 'New color range', isNew: true, createdAt: Date.now() - 432000000 },
    ], sortOrder: 1, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_intenze', name: 'Intenze', category: 'ink',
    description: 'Hundreds of colors, sterile/vegan-friendly, decades of industry trust. Often cited as global #1.',
    logoUrl: '', affiliateLink: 'https://intenzetattooink.com', commissionNote: 'Up to 7% commission',
    products: [
      { id: 'prod_iz_1', name: 'Intenze Zuper Black 12oz', imageUrl: '', price: '$34.99', affiliateLink: 'https://intenzetattooink.com/zuper-black', note: 'Industry staple' },
      { id: 'prod_iz_2', name: 'Intenze Color Set (14x1oz)', imageUrl: '', price: '$99.99', affiliateLink: 'https://intenzetattooink.com/color-set', note: 'Pro palette', isNew: true, createdAt: Date.now() - 864000000 },
    ], sortOrder: 2, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_dynamic', name: 'Dynamic Ink', category: 'ink',
    description: 'Industry staple for black ink. Dynamic Black is the go-to for outlines, lettering, and grey washes.',
    logoUrl: '', affiliateLink: 'https://dynamiccolor.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_di_1', name: 'Dynamic Black 8oz', imageUrl: '', price: '$24.99', affiliateLink: 'https://dynamiccolor.com/black', note: '#1 black ink' },
      { id: 'prod_di_2', name: 'Dynamic Triple Black 8oz', imageUrl: '', price: '$27.99', affiliateLink: 'https://dynamiccolor.com/triple-black', note: 'Extra dark' },
    ], sortOrder: 3, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_kuro_sumi', name: 'Kuro Sumi', category: 'ink',
    description: 'Japanese heritage; exceptional black & grey tones. Natural ingredients, favored for large-scale blackwork.',
    logoUrl: '', affiliateLink: 'https://kurosumi.com', commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_ks_1', name: 'Kuro Sumi Outlining Black 6oz', imageUrl: '', price: '$22.99', affiliateLink: 'https://kurosumi.com/outlining', note: 'Tribal/japanese' },
      { id: 'prod_ks_2', name: 'Kuro Sumi Grey Wash Set (6 bottles)', imageUrl: '', price: '$49.99', affiliateLink: 'https://kurosumi.com/grey-wash', note: 'Smooth gradients' },
    ], sortOrder: 4, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_world_famous', name: 'World Famous Ink', category: 'ink',
    description: 'Vegan, cruelty-free, eco-conscious. Trendy color collections for portraits and modern designs.',
    logoUrl: '', affiliateLink: 'https://worldfamoustattooink.com', commissionNote: 'Up to 7% commission',
    products: [
      { id: 'prod_wf_1', name: 'World Famous Black Outline 8oz', imageUrl: '', price: '$26.99', affiliateLink: 'https://worldfamoustattooink.com/black', note: 'Vegan formula' },
      { id: 'prod_wf_2', name: 'World Famous Portrait Set (12x1oz)', imageUrl: '', price: '$79.99', affiliateLink: 'https://worldfamoustattooink.com/portrait', note: 'Realism focused' },
    ], sortOrder: 5, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_starbrite', name: 'StarBrite Colors', category: 'ink',
    description: '30+ year legacy. Stable, fade-resistant pigments across all skin tones.',
    logoUrl: '', affiliateLink: 'https://starbritecolors.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_sb_1', name: 'StarBrite Pro Starter Set (6x2oz)', imageUrl: '', price: '$59.99', affiliateLink: 'https://starbritecolors.com/starter', note: 'Veteran trusted' },
    ], sortOrder: 6, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_radiant', name: 'Radiant Colors', category: 'ink',
    description: 'Affordable yet professional-grade. Bright, consistent colors — great value for money.',
    logoUrl: '', affiliateLink: 'https://radiantcolors.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_rc_1', name: 'Radiant Colors Full Set (20x1oz)', imageUrl: '', price: '$69.99', affiliateLink: 'https://radiantcolors.com/full-set', note: 'Best value' },
    ], sortOrder: 7, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_panthera', name: 'Panthera Black', category: 'ink',
    description: 'Ultra-deep black ink specialist. Bold blackwork, crisp lines, minimal dilution needed.',
    logoUrl: '', affiliateLink: 'https://pantherablack.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_pb_1', name: 'Panthera XXX Black 8oz', imageUrl: '', price: '$28.99', affiliateLink: 'https://pantherablack.com/xxx', note: 'Ultra concentrated' },
    ], sortOrder: 8, active: true, createdAt: Date.now(),
  },
  // ── Needles (针) ──
  {
    id: 'brand_kwadron', name: 'Kwadron', category: 'needles',
    description: 'Premium cartridge needles with precision-machined tips. Consistent performance.',
    logoUrl: '', affiliateLink: 'https://kwadron.com', commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_kw_1', name: 'Kwadron Cartridge Liners (Box 50)', imageUrl: '', price: '$39.99', affiliateLink: 'https://kwadron.com/liners', note: '7RL to 14RL' },
      { id: 'prod_kw_2', name: 'Kwadron Cartridge Mags (Box 50)', imageUrl: '', price: '$42.99', affiliateLink: 'https://kwadron.com/mags', note: 'New gauge option', isNew: true, createdAt: Date.now() - 259200000 },
    ], sortOrder: 10, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_cheyenne_needles', name: 'Cheyenne Cartridges', category: 'needles',
    description: 'Industry gold standard. Friction-reducing coating, E.O. gas sterilized.',
    logoUrl: '', affiliateLink: 'https://cheyennetattoo.com/cartridges', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_cn_1', name: 'Cheyenne Safety Cartridge Liners (Box 50)', imageUrl: '', price: '$44.99', affiliateLink: 'https://cheyennetattoo.com/cartridges/liners', note: 'Premium' },
      { id: 'prod_cn_2', name: 'Cheyenne Safety Cartridge Mags (Box 50)', imageUrl: '', price: '$47.99', affiliateLink: 'https://cheyennetattoo.com/cartridges/mags', note: 'Smooth shading' },
    ], sortOrder: 11, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_electrum', name: 'Electrum FIRE', category: 'needles',
    description: 'Pressure-sealed membrane prevents backflow. Tight tolerances, minimal wobble.',
    logoUrl: '', affiliateLink: 'https://electrumsupply.com', commissionNote: 'Up to 7% commission',
    products: [
      { id: 'prod_el_1', name: 'Electrum FIRE Cartridges (Box 50)', imageUrl: '', price: '$38.99', affiliateLink: 'https://electrumsupply.com/fire', note: 'Backflow protection' },
    ], sortOrder: 12, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_elite', name: 'ELITE Tattoo', category: 'needles',
    description: 'Three series (INFINI/ELITE 3/EVO) for realism, traditional, and speed work.',
    logoUrl: '', affiliateLink: 'https://elitetattoo.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_et_1', name: 'ELITE INFINI Cartridges (Box 50)', imageUrl: '', price: '$36.99', affiliateLink: 'https://elitetattoo.com/infini', note: 'Realism specialist' },
      { id: 'prod_et_2', name: 'ELITE EVO Cartridges (Box 50)', imageUrl: '', price: '$34.99', affiliateLink: 'https://elitetattoo.com/evo', note: 'Speed work', isNew: true, createdAt: Date.now() - 518400000 },
    ], sortOrder: 13, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_stigma', name: 'Stigma', category: 'needles',
    description: 'Ergonomic, lightweight design. Broad machine compatibility at affordable pricing.',
    logoUrl: '', affiliateLink: 'https://stigmatattoosupply.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_sg_1', name: 'Stigma Pro Cartridges (Box 50)', imageUrl: '', price: '$29.99', affiliateLink: 'https://stigmatattoosupply.com/pro', note: 'Value pick' },
    ], sortOrder: 14, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_bishop_needles', name: 'Bishop Cartridges', category: 'needles',
    description: 'Optimized for rotary machines. Enhanced ink retention — fewer re-dips.',
    logoUrl: '', affiliateLink: 'https://bishoprotary.com/cartridges', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_bn_1', name: 'Bishop DaVinci Cartridges (Box 50)', imageUrl: '', price: '$41.99', affiliateLink: 'https://bishoprotary.com/davinci', note: 'Rotary optimized' },
    ], sortOrder: 15, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_black_claw', name: 'Black Claw', category: 'needles',
    description: 'Premium needles favored by blackwork and fine-line specialists. Exceptional sharpness and consistency.',
    logoUrl: '', affiliateLink: 'https://blackclawtattoo.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_bc_1', name: 'Black Claw Cartridges (Box 50)', imageUrl: '', price: '$44.99', affiliateLink: 'https://blackclawtattoo.com/cartridges', note: 'Fine-line specialist' },
    ], sortOrder: 16, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_inkjecta_needles', name: 'Inkjecta Needles', category: 'needles',
    description: 'Swedish precision manufacturing. High-end automated production for exact tolerances.',
    logoUrl: '', affiliateLink: 'https://inkjecta.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ij_1', name: 'Inkjecta Precision Cartridges (Box 50)', imageUrl: '', price: '$43.99', affiliateLink: 'https://inkjecta.com/cartridges', note: 'Swedish precision' },
    ], sortOrder: 17, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_mast', name: 'Mast Tattoo', category: 'needles',
    description: 'Popular mid-range brand. Good balance of quality and price, wide global distribution.',
    logoUrl: '', affiliateLink: 'https://masttattoo.com', commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_mt_2', name: 'Mast Pro Cartridges (Box 50)', imageUrl: '', price: '$24.99', affiliateLink: 'https://masttattoo.com/pro-cartridges', note: 'Best selling' },
      { id: 'prod_mt_3', name: 'Mast Tour Cartridges (Box 50)', imageUrl: '', price: '$27.99', affiliateLink: 'https://masttattoo.com/tour', note: 'Professional grade', isNew: true, createdAt: Date.now() - 691200000 },
    ], sortOrder: 18, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_eikon', name: 'Eikon Tattoo', category: 'needles',
    description: 'Hand-crafted Spanish cartridges. Aesthetic design, strict EU manufacturing standards.',
    logoUrl: '', affiliateLink: 'https://eikontattoo.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ek_1', name: 'Eikon Precision Cartridges (Box 50)', imageUrl: '', price: '$37.99', affiliateLink: 'https://eikontattoo.com/cartridges', note: 'Spanish crafted' },
    ], sortOrder: 19, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_peak_needles', name: 'Peak Needles', category: 'needles',
    description: 'Professional cartridges known for reliable quality. Wide range of configurations.',
    logoUrl: '', affiliateLink: 'https://peaktattoomachines.com/needles', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_pn_1', name: 'Peak Cartridges (Box 50)', imageUrl: '', price: '$31.99', affiliateLink: 'https://peaktattoomachines.com/cartridges', note: 'Pro choice' },
    ], sortOrder: 20, active: true, createdAt: Date.now(),
  },
  // ── Machines (机器) ──
  {
    id: 'brand_cheyenne', name: 'Cheyenne', category: 'machines',
    description: 'Premium German-engineered tattoo machines. Precision, reliability, and ergonomic design.',
    logoUrl: '', affiliateLink: 'https://cheyennetattoo.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ch_1', name: 'Cheyenne SOL Nova Unlimited II', imageUrl: '', price: '$899.00', affiliateLink: 'https://cheyennetattoo.com/sol-nova', note: 'Wireless flagship' },
      { id: 'prod_ch_2', name: 'Cheyenne HAWK Pen', imageUrl: '', price: '$549.00', affiliateLink: 'https://cheyennetattoo.com/hawk-pen', note: 'Versatile workhorse' },
    ], sortOrder: 20, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_bishop', name: 'Bishop Rotary', category: 'machines',
    description: 'American-made rotary machines known for legendary reliability. Up to 15hr battery.',
    logoUrl: '', affiliateLink: 'https://bishoprotary.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_br_1', name: 'Bishop Power Wand Packer', imageUrl: '', price: '$649.00', affiliateLink: 'https://bishoprotary.com/packer', note: 'New release', isNew: true, createdAt: Date.now() - 172800000 },
      { id: 'prod_br_2', name: 'Bishop Power Wand Liner', imageUrl: '', price: '$629.00', affiliateLink: 'https://bishoprotary.com/liner', note: 'Crisp lines' },
    ], sortOrder: 21, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_fk_irons', name: 'FK Irons', category: 'machines',
    description: 'Top-tier wireless machines. Flux Max powered by PowerBolt II, customizable stroke options.',
    logoUrl: '', affiliateLink: 'https://fkirons.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_fk_1', name: 'FK Irons Flux Max', imageUrl: '', price: '$749.00', affiliateLink: 'https://fkirons.com/flux-max', note: 'Premium wireless' },
      { id: 'prod_fk_2', name: 'FK Irons EXO', imageUrl: '', price: '$499.00', affiliateLink: 'https://fkirons.com/exo', note: 'Mid-range pick' },
    ], sortOrder: 22, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_musotoku', name: 'Musotoku', category: 'machines',
    description: 'Faulhaber brushless motor + direct drive. Compact, balanced, tuned per stroke length.',
    logoUrl: '', affiliateLink: 'https://musotoku.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_mt_1', name: 'Musotoku Mercury M-1', imageUrl: '', price: '$699.00', affiliateLink: 'https://musotoku.com/mercury-m1', note: 'Precision engineered' },
    ], sortOrder: 23, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_acus', name: 'ACUS', category: 'machines',
    description: 'Interchangeable drive heads for all stroke lengths. M1 Plus for larger hands.',
    logoUrl: '', affiliateLink: 'https://acustattoo.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ac_1', name: 'ACUS M1 Plus', imageUrl: '', price: '$599.00', affiliateLink: 'https://acustattoo.com/m1-plus', note: 'Versatile stroke' },
      { id: 'prod_ac_2', name: 'ACUS C2', imageUrl: '', price: '$399.00', affiliateLink: 'https://acustattoo.com/c2', note: 'Compact ergonomic' },
    ], sortOrder: 24, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_dragonhawk', name: 'Dragonhawk', category: 'machines',
    description: 'Best entry-level wireless machines. Fold Pro customizable stroke, Mast Archer simple & reliable.',
    logoUrl: '', affiliateLink: 'https://dragonhawk.com', commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_dh_1', name: 'Dragonhawk Fold Pro', imageUrl: '', price: '$199.00', affiliateLink: 'https://dragonhawk.com/fold-pro', note: 'Best beginner wireless' },
      { id: 'prod_dh_2', name: 'Dragonhawk Mast Archer', imageUrl: '', price: '$129.00', affiliateLink: 'https://dragonhawk.com/mast-archer', note: 'Budget reliable' },
    ], sortOrder: 25, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_peak', name: 'Peak', category: 'machines',
    description: 'Adjustable stroke (2.4-4.2mm). Great for beginners and pros experimenting with styles.',
    logoUrl: '', affiliateLink: 'https://peaktattoomachines.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_pk_1', name: 'Peak Solice Pro V2', imageUrl: '', price: '$349.00', affiliateLink: 'https://peaktattoomachines.com/solice-pro', note: 'Adjustable stroke' },
    ], sortOrder: 26, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_darklab', name: 'Darklab', category: 'machines',
    description: 'Ergonomic design to reduce hand fatigue. Compatible with Ergo Shield disposable grips.',
    logoUrl: '', affiliateLink: 'https://darklabtattoo.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_dl_1', name: 'Darklab Ergo', imageUrl: '', price: '$279.00', affiliateLink: 'https://darklabtattoo.com/ergo', note: 'Ergo specialist' },
    ], sortOrder: 27, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_inkjecta', name: 'Inkjecta', category: 'machines',
    description: 'Swedish precision engineering. Flite Nano series — compact, lightweight, direct drive rotary.',
    logoUrl: '', affiliateLink: 'https://inkjecta.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ij_2', name: 'Inkjecta Flite Nano', imageUrl: '', price: '$599.00', affiliateLink: 'https://inkjecta.com/flite-nano', note: 'Swiss precision' },
    ], sortOrder: 28, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_vlad_blad', name: 'Vlad Blad', category: 'machines',
    description: 'Premium rotary machines. Ultron 3 and Avenger series — powerful, durable, artist-favored.',
    logoUrl: '', affiliateLink: 'https://vladblad.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_vb_1', name: 'Vlad Blad Ultron 3', imageUrl: '', price: '$649.00', affiliateLink: 'https://vladblad.com/ultron-3', note: 'Power rotary' },
      { id: 'prod_vb_2', name: 'Vlad Blad Avenger 3 Pro', imageUrl: '', price: '$549.00', affiliateLink: 'https://vladblad.com/avenger-3', note: 'Versatile workhorse' },
    ], sortOrder: 29, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_mast_machines', name: 'Mast Tattoo', category: 'machines',
    description: 'Best-selling mid-range pen machines. Archer, Tour, Flip Pro — popular globally for value.',
    logoUrl: '', affiliateLink: 'https://masttattoo.com', commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_ms_1', name: 'Mast Archer Wireless', imageUrl: '', price: '$149.00', affiliateLink: 'https://masttattoo.com/archer', note: 'Best value pen' },
      { id: 'prod_ms_2', name: 'Mast Flip Pro', imageUrl: '', price: '$219.00', affiliateLink: 'https://masttattoo.com/flip-pro', note: 'Adjustable stroke', isNew: true, createdAt: Date.now() - 432000000 },
    ], sortOrder: 30, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_ez', name: 'EZ Tattoo', category: 'machines',
    description: 'Adjustable stroke (3.0-5.0mm) with brushless motor + direct drive. Steady, responsive.',
    logoUrl: '', affiliateLink: 'https://eztattoosupply.com', commissionNote: 'Up to 6% commission',
    products: [
      { id: 'prod_ez_1', name: 'EZ P3 Pro Turbo', imageUrl: '', price: '$329.00', affiliateLink: 'https://eztattoosupply.com/p3-pro', note: 'Adjustable stroke' },
    ], sortOrder: 31, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_stigma_rotary', name: 'Stigma-Rotary', category: 'machines',
    description: 'Premium adjustable rotary. Climber and Hyper V4 — versatile, ergonomic, long-lasting.',
    logoUrl: '', affiliateLink: 'https://stigma-rotary.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_sr_1', name: 'Stigma Hyper V4', imageUrl: '', price: '$449.00', affiliateLink: 'https://stigma-rotary.com/hyper-v4', note: 'Pro adjustable' },
    ], sortOrder: 32, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_critical', name: 'Critical Tattoo', category: 'machines',
    description: 'Torque series — reliable mid-range pen machines. Solid build quality for daily professional use.',
    logoUrl: '', affiliateLink: 'https://criticaltattoo.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ct_1', name: 'Critical Torque Pen', imageUrl: '', price: '$289.00', affiliateLink: 'https://criticaltattoo.com/torque', note: 'Daily workhorse' },
    ], sortOrder: 33, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_ambition', name: 'Ambition', category: 'machines',
    description: 'Ultra-budget pen machines. Popular among apprentices and as backup machines for pros.',
    logoUrl: '', affiliateLink: 'https://ambitiontattoo.com', commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_ab_1', name: 'Ambition Wireless Pen', imageUrl: '', price: '$79.00', affiliateLink: 'https://ambitiontattoo.com/wireless-pen', note: 'Budget wireless' },
    ], sortOrder: 34, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_workhorse', name: 'Workhorse Irons', category: 'machines',
    description: 'Legendary US-made coil machines. Dan Kubin, Seth Ciferri signatures — iconic frames for bold traditional work.',
    logoUrl: '', affiliateLink: 'https://workhorseirons.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_wh_1', name: 'Workhorse Dan Kubin Sidewinder', imageUrl: '', price: '$549.00', affiliateLink: 'https://workhorseirons.com/dan-kubin', note: 'Coil legend' },
    ], sortOrder: 35, active: true, createdAt: Date.now(),
  },
  // ── Aftercare (护理) ──
  {
    id: 'brand_hustle_butter', name: 'Hustle Butter', category: 'aftercare',
    description: 'Industry gold standard. 100% vegan, petroleum-free. Used during and after tattooing.',
    logoUrl: '', affiliateLink: 'https://hustlebutter.com', commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_hb_1', name: 'Hustle Butter Deluxe 5oz Tub', imageUrl: '', price: '$19.99', affiliateLink: 'https://hustlebutter.com/deluxe', note: 'Essential' },
      { id: 'prod_hb_2', name: 'Hustle Butter CBD Foam Soap', imageUrl: '', price: '$14.99', affiliateLink: 'https://hustlebutter.com/soap', note: 'New formula', isNew: true, createdAt: Date.now() - 604800000 },
    ], sortOrder: 30, active: true, featured: true, createdAt: Date.now(),
  },
  {
    id: 'brand_tattoo_goo', name: 'Tattoo Goo', category: 'aftercare',
    description: 'Petroleum-free, dermatologist tested. Color enhancement and faster healing. Made in USA.',
    logoUrl: '', affiliateLink: 'https://tattoogoo.com', commissionNote: 'Up to 8% commission',
    products: [
      { id: 'prod_tg_1', name: 'Tattoo Goo 3-Piece Kit', imageUrl: '', price: '$24.99', affiliateLink: 'https://tattoogoo.com/kit', note: 'Soap+balm+lotion' },
      { id: 'prod_tg_2', name: 'Tattoo Goo Balm 0.75oz', imageUrl: '', price: '$8.99', affiliateLink: 'https://tattoogoo.com/balm', note: 'Portable' },
    ], sortOrder: 31, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_mad_rabbit', name: 'Mad Rabbit', category: 'aftercare',
    description: 'Shark Tank featured. Clean ingredients, lightweight gel. Color revival for older work.',
    logoUrl: '', affiliateLink: 'https://madrabbit.com', commissionNote: 'Up to 10% commission',
    products: [
      { id: 'prod_mr_1', name: 'Mad Rabbit Tattoo Balm 2oz', imageUrl: '', price: '$24.99', affiliateLink: 'https://madrabbit.com/balm', note: 'Color revive' },
      { id: 'prod_mr_2', name: 'Mad Rabbit Soothing Gel', imageUrl: '', price: '$19.99', affiliateLink: 'https://madrabbit.com/gel', note: 'New release', isNew: true, createdAt: Date.now() - 345600000 },
    ], sortOrder: 32, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_after_inked', name: 'After Inked', category: 'aftercare',
    description: 'Non-petroleum, fragrance-free, fast-absorbing. Famously used on INK MASTER.',
    logoUrl: '', affiliateLink: 'https://afterinked.com', commissionNote: 'Up to 7% commission',
    products: [
      { id: 'prod_ai_1', name: 'After Inked Lotion 3oz', imageUrl: '', price: '$14.99', affiliateLink: 'https://afterinked.com/lotion', note: 'INK MASTER choice' },
    ], sortOrder: 33, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_aquaphor', name: 'Aquaphor', category: 'aftercare',
    description: 'Trusted healing ointment for early tattoo healing phase. Fragrance-free.',
    logoUrl: '', affiliateLink: 'https://aquaphorus.com', commissionNote: 'Up to 3% commission',
    products: [
      { id: 'prod_aq_1', name: 'Aquaphor Healing Ointment 7oz', imageUrl: '', price: '$12.99', affiliateLink: 'https://aquaphorus.com/healing', note: 'Healing phase' },
    ], sortOrder: 34, active: true, createdAt: Date.now(),
  },
  {
    id: 'brand_h2ocean', name: 'H2Ocean', category: 'aftercare',
    description: 'Sea-salt-based healing foam and lotion. Gentle, natural aftercare.',
    logoUrl: '', affiliateLink: 'https://h2ocean.com', commissionNote: 'Up to 5% commission',
    products: [
      { id: 'prod_ho_1', name: 'H2Ocean Aftercare Kit', imageUrl: '', price: '$19.99', affiliateLink: 'https://h2ocean.com/kit', note: 'Sea salt formula' },
    ], sortOrder: 35, active: true, createdAt: Date.now(),
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

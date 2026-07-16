// Shared UI string translations for the InkFlow marketing site.
// Covers navigation, footer, buttons, and other chrome text that appears
// on every page. Page-specific content lives in i18n/pages/*.ts.
//
// Keys use dot notation: "nav.features", "footer.company", etc.
// Spanish (es) translations reuse terminology consistent with the React
// app's existing i18n.ts where possible.

import type { Locale } from './config';

type Messages = Record<string, string>;

const en: Messages = {
  // ── Top nav ──
  'nav.features': 'Features',
  'nav.templates': 'Templates',
  'nav.freeTools': 'Free Tools',
  'nav.pricing': 'Pricing',
  'nav.compare': 'Compare',
  'nav.blog': 'Blog',
  'nav.meanings': 'Tattoo Meanings',
  'nav.business': 'Business',
  'nav.signIn': 'Sign In',
  'nav.startFreeTrial': 'Start Free Trial',

  // ── Features dropdown ──
  'feat.booking': 'Booking',
  'feat.payments': 'Deposits & Payments',
  'feat.waivers': 'Digital Waivers',
  'feat.crm': 'Client CRM',
  'feat.inventory': 'Inventory',
  'feat.aftercare': 'Aftercare',
  'feat.freeWebsite': 'Free Website',

  // ── Free Tools dropdown ──
  'tool.noShow': 'No-Show Cost Calculator',
  'tool.price': 'Tattoo Price Calculator',
  'tool.waiver': 'Free Waiver Generator',
  'tool.aftercare': 'Aftercare Email Generator',
  'tool.meaning': 'Tattoo Meaning Finder',
  'tool.commission': 'Commission Calculator',

  // ── Compare dropdown ──
  'cmp.studioPro': 'vs Tattoo Studio Pro',
  'cmp.tattoogenda': 'vs Tattoogenda',
  'cmp.booksy': 'vs Booksy',
  'cmp.vagaro': 'vs Vagaro',

  // ── Footer columns ──
  'footer.features': 'Features',
  'footer.compare': 'Compare',
  'footer.resources': 'Resources',
  'footer.company': 'Company',
  'footer.blog': 'Blog',
  'footer.pricing': 'Pricing',
  'footer.download': 'Download',
  'footer.about': 'About',
  'footer.contact': 'Contact',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',

  // ── Breadcrumb ──
  'breadcrumb.home': 'Home',

  // ── Language switcher ──
  'lang.label': 'Language',
};

const es: Messages = {
  // ── Top nav ──
  'nav.features': 'Funciones',
  'nav.templates': 'Plantillas',
  'nav.freeTools': 'Herramientas Gratuitas',
  'nav.pricing': 'Precios',
  'nav.compare': 'Comparar',
  'nav.blog': 'Blog',
  'nav.meanings': 'Significado de Tatuajes',
  'nav.business': 'Negocio',
  'nav.signIn': 'Iniciar Sesión',
  'nav.startFreeTrial': 'Comenzar Prueba Gratis',

  // ── Features dropdown ──
  'feat.booking': 'Reservas',
  'feat.payments': 'Depósitos y Pagos',
  'feat.waivers': 'Exenciones Digitales',
  'feat.crm': 'CRM de Clientes',
  'feat.inventory': 'Inventario',
  'feat.aftercare': 'Cuidado Posterior',
  'feat.freeWebsite': 'Sitio Web Gratuito',

  // ── Free Tools dropdown ──
  'tool.noShow': 'Calculadora de Costo de Inasistencias',
  'tool.price': 'Calculadora de Precio de Tatuaje',
  'tool.waiver': 'Generador de Exenciones Gratuito',
  'tool.aftercare': 'Generador de Correos de Cuidado Posterior',
  'tool.meaning': 'Buscador de Significado de Tatuajes',
  'tool.commission': 'Calculadora de Comisiones',

  // ── Compare dropdown ──
  'cmp.studioPro': 'vs Tattoo Studio Pro',
  'cmp.tattoogenda': 'vs Tattoogenda',
  'cmp.booksy': 'vs Booksy',
  'cmp.vagaro': 'vs Vagaro',

  // ── Footer columns ──
  'footer.features': 'Funciones',
  'footer.compare': 'Comparar',
  'footer.resources': 'Recursos',
  'footer.company': 'Empresa',
  'footer.blog': 'Blog',
  'footer.pricing': 'Precios',
  'footer.download': 'Descargar',
  'footer.about': 'Acerca de',
  'footer.contact': 'Contacto',
  'footer.privacy': 'Política de Privacidad',
  'footer.terms': 'Términos del Servicio',

  // ── Breadcrumb ──
  'breadcrumb.home': 'Inicio',

  // ── Language switcher ──
  'lang.label': 'Idioma',
};

export const ui: Record<Locale, Messages> = { en, es };

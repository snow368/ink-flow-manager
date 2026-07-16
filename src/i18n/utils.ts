// i18n helper utilities for Astro components.
// Usage in a .astro file:
//   ---
//   import { t } from '../i18n/utils';
//   const locale = (Astro.currentLocale as Locale) || DEFAULT_LOCALE;
//   ---
//   <a href="/pricing">{t(locale, 'nav.pricing')}</a>

import { DEFAULT_LOCALE, type Locale } from './config';
import { ui } from './ui';

/**
 * Translate a UI key for the given locale.
 * Falls back to English, then to the raw key (so missing keys are visible
 * during development rather than silently empty).
 */
export function t(locale: Locale, key: string): string {
  return ui[locale]?.[key] ?? ui[DEFAULT_LOCALE][key] ?? key;
}

/**
 * Derive the active locale from an Astro component frontmatter.
 * NOTE: `Astro.currentLocale` is only available inside `.astro` frontmatter,
 * NOT inside imported `.ts` modules — so callers must compute it in the
 * component and pass the result to `t()`:
 *   const locale = (Astro.currentLocale as Locale) || DEFAULT_LOCALE;
 *
 * Build a cross-locale URL for the current page path.
 * Used for the language switcher and hreflang alternates.
 * Strips any existing locale prefix, then prefixes `target` (unless it is
 * the default locale, which stays at the root).
 */
export function localeUrl(target: Locale, currentPath: string): string {
  // Strip leading slash and any locale prefix.
  let path = currentPath.replace(/^\/+/, '');
  for (const loc of ['es'] as const) {
    if (path.startsWith(loc + '/') || path === loc) {
      path = path.slice(loc.length).replace(/^\/+/, '');
      break;
    }
  }
  if (target === DEFAULT_LOCALE) {
    return path ? `/${path}` : '/';
  }
  return path ? `/${target}/${path}` : `/${target}`;
}

/**
 * Strip the locale prefix from a pathname, returning the canonical
 * (default-locale) path. e.g. "/es/pricing/" -> "/pricing/".
 */
export function stripLocale(pathname: string): string {
  let path = pathname.replace(/\/+$/, '');
  for (const loc of ['es'] as const) {
    if (path === `/${loc}` || path.startsWith(`/${loc}/`)) {
      path = path.slice(loc.length + 1);
      break;
    }
  }
  return path || '/';
}

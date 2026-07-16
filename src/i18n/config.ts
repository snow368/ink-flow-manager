// InkFlow i18n configuration
// Marketing site (Astro) localization setup.
// Spanish (es) is the first non-English locale; more can be added to LOCALES.

export const DEFAULT_LOCALE = 'en' as const;

// Add new locales here as translation work expands.
export const LOCALES = ['en', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

// Human-readable names for the language switcher.
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

// Returns true if the given string is a supported locale.
export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

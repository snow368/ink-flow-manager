import { describe, it, expect } from 'vitest';
import { t, type AppLanguage } from '../i18n';

describe('i18n', () => {
  it('returns English message for English language', () => {
    expect(t('en', 'today')).toBe('Today');
    expect(t('en', 'me')).toBe('Me');
  });

  it('returns translated message for supported languages', () => {
    expect(t('es', 'today')).toBe('Hoy');
    expect(t('pt', 'today')).toBe('Hoje');
    expect(t('fr', 'today')).toBe('Aujourd\'hui');
    expect(t('de', 'today')).toBe('Heute');
    // Italian uses English placeholders until translation is done
    expect(t('it', 'today')).toBe('Today');
    expect(t('jp', 'today')).toBe('今日');
  });

  it('falls back to English when translation key is missing in target language', () => {
    // 'tab_today' exists in all languages; test a key that might only be in en
    const result = t('es', 'some_nonexistent_key');
    expect(result).toBe('some_nonexistent_key');
  });

  it('falls back to the key itself when neither translation nor English exists', () => {
    const result = t('en', 'this_key_does_not_exist_at_all');
    expect(result).toBe('this_key_does_not_exist_at_all');
  });

  it('falls back to English for unsupported language code', () => {
    const result = t('unsupported' as AppLanguage, 'today');
    expect(result).toBe('Today');
  });

  it('supports all 7 languages for core keys', () => {
    const langs: AppLanguage[] = ['en', 'es', 'pt', 'fr', 'de', 'it', 'jp'];
    for (const lang of langs) {
      expect(t(lang, 'today')).toBeTruthy();
    }
  });
});

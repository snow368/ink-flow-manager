// Countries where tipping tattoo artists is common/expected.
// Cross-referenced: Wikipedia tipping customs + tattoo industry sources.
const TIPPING_COUNTRIES = new Set([
  // North America — 15-25% tipping expected
  'US', 'CA', 'MX',
  // UK & Ireland — 10-20% common and appreciated
  'GB', 'IE',
  // South America — propina/gorjeta is standard
  'BR', 'AR', 'CL', 'CO', 'PE',
  // Asia — accepted in tourist areas and tattoo studios
  'TH', 'IN',
]);

// Excluded (service included or no tipping culture):
// JP KR CN — tipping is rude/confusing
// DE FR ES PT IT NL BE AT CH — service included by law, minimal tipping
// DK SE NO FI — strong unions, fair wages, tipping discouraged
// AU NZ — high minimum wage, tipping not expected

export function isTippingCountry(code: string): boolean {
  return TIPPING_COUNTRIES.has(code?.toUpperCase());
}

// Static shipping data for seed brands.
// Country codes: ISO 3166-1 alpha-2
// Populated from web research of each brand's official shipping/distributor pages.
export const SHIPS_TO_MAP: Record<string, string[]> = {
  // ── Ink ──
  brand_world_famous: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'IE', 'AU', 'NZ', 'JP', 'KR', 'BR', 'MX', 'SG', 'ZA', 'AE', 'IN'],
  brand_starbrite: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'AE', 'IN', 'BR', 'MX', 'ZA', 'PH', 'TH'],
  brand_radiant: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'AE', 'IN', 'BR', 'MX'],
  brand_panthera: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'AU', 'NZ', 'JP', 'KR', 'BR', 'MX'],
  // ── Needles ──
  brand_kwadron: ['US', 'CA', 'GB', 'DE', 'ES', 'IT', 'NL', 'BE', 'CZ', 'FR', 'AT', 'SK', 'DK', 'LT', 'LV', 'EE', 'SI', 'HR', 'HU', 'RO', 'BG', 'LU', 'PL', 'AU', 'SG', 'AE', 'IN', 'LK'],
  brand_cheyenne_needles: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'CN', 'SG'],
  brand_electrum: ['US'],
  brand_elite: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'AE'],
  brand_stigma: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'AU', 'NZ', 'JP', 'KR', 'SG', 'AE', 'IN', 'BR', 'MX', 'ZA'],
  brand_bishop_needles: ['US', 'CA', 'MX', 'CO', 'CL', 'BR', 'PA', 'GB', 'DE', 'FR', 'ES', 'PT', 'BE', 'NL', 'FI', 'SE', 'CH', 'PL', 'LT', 'UA', 'TR', 'AU', 'NZ', 'JP', 'KR', 'CN', 'TW', 'MY', 'SG', 'TH', 'PH', 'VN', 'IN', 'IL', 'ZA'],
  brand_black_claw: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'PL', 'IT', 'ES', 'DK', 'SE', 'NO', 'AU', 'NZ'],
  brand_inkjecta_needles: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'AU', 'NZ', 'JP', 'KR', 'SG'],
  brand_eikon: ['CA', 'US', 'GB', 'DE', 'FR', 'NL', 'DK', 'SE', 'NO'],
  brand_peak_needles: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX'],
  // ── Machines ──
  brand_cheyenne: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'CN', 'SG'],
  brand_bishop: ['US', 'CA', 'MX', 'CO', 'CL', 'BR', 'PA', 'GB', 'DE', 'FR', 'ES', 'PT', 'BE', 'NL', 'FI', 'SE', 'CH', 'PL', 'LT', 'UA', 'TR', 'AU', 'NZ', 'JP', 'KR', 'CN', 'TW', 'MY', 'SG', 'TH', 'PH', 'VN', 'IN', 'IL', 'ZA'],
  brand_fk_irons: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX', 'AE'],
  brand_musotoku: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG'],
  brand_acus: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG'],
  brand_dragonhawk: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX', 'IN', 'AE', 'ZA'],
  brand_peak: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX'],
  brand_darklab: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX', 'AE'],
  brand_inkjecta: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'AU', 'NZ', 'JP', 'KR', 'SG'],
  brand_vlad_blad: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX', 'AE'],
  brand_mast_machines: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX', 'IN', 'AE'],
  brand_ez: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'CN', 'BR', 'UA'],
  brand_stigma_rotary: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'AT', 'BE', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG'],
  brand_critical: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG'],
  brand_ambition: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX', 'IN', 'AE'],
  brand_workhorse: ['US'],
  // ── Aftercare ──
  brand_hustle_butter: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'IE', 'AU', 'NZ', 'JP', 'KR', 'SG', 'AE', 'IN', 'BR', 'MX', 'ZA'],
  brand_tattoo_goo: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'AE', 'IN', 'ZA'],
  brand_mad_rabbit: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'AE'],
  brand_after_inked: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'SG', 'AE'],
  brand_aquaphor: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'BR', 'MX', 'IN', 'AE', 'ZA'],
  brand_h2ocean: ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'DK', 'SE', 'NO', 'PL', 'AU', 'NZ', 'JP', 'KR', 'SG', 'AE', 'BR', 'MX'],
};

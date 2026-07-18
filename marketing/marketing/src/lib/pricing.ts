export type RegionCode = 'US' | 'EU' | 'SEA' | 'LATAM' | 'OTHER';

export type MessagingPack = {
  id: 'pack_200' | 'pack_500' | 'pack_1500';
  messages: number;
  price: number;
  currency: string;
};

export type RegionPricing = {
  region: RegionCode;
  currency: string;
  smsUnitPrice: number;
  whatsappMarkupMultiplier: number;
  smsMarkupMultiplierRange: [number, number];
  packs: MessagingPack[];
  overageUnitPrice: number;
};

export type StorageTier = {
  id: 'pro_50gb' | 'plus_200gb' | 'plus_500gb' | 'extra_50gb' | 'extra_200gb';
  label: string;
  price: number;
  currency: string;
  includedGb: number;
  isAddon: boolean;
};

// Baseline pricing profile. Update monthly based on provider costs.
export const REGION_PRICING: Record<RegionCode, RegionPricing> = {
  US: {
    region: 'US',
    currency: 'USD',
    smsUnitPrice: 0.06,
    whatsappMarkupMultiplier: 1.5,
    smsMarkupMultiplierRange: [2.8, 3.5],
    packs: [
      { id: 'pack_200', messages: 200, price: 4.99, currency: 'USD' },
      { id: 'pack_500', messages: 500, price: 9.99, currency: 'USD' },
      { id: 'pack_1500', messages: 1500, price: 24.99, currency: 'USD' },
    ],
    overageUnitPrice: 0.06,
  },
  EU: {
    region: 'EU',
    currency: 'EUR',
    smsUnitPrice: 0.08,
    whatsappMarkupMultiplier: 1.5,
    smsMarkupMultiplierRange: [2.5, 3.2],
    packs: [
      { id: 'pack_200', messages: 200, price: 5.99, currency: 'EUR' },
      { id: 'pack_500', messages: 500, price: 11.99, currency: 'EUR' },
      { id: 'pack_1500', messages: 1500, price: 29.99, currency: 'EUR' },
    ],
    overageUnitPrice: 0.08,
  },
  SEA: {
    region: 'SEA',
    currency: 'USD',
    smsUnitPrice: 0.06,
    whatsappMarkupMultiplier: 1.5,
    smsMarkupMultiplierRange: [2.5, 4.0],
    packs: [
      { id: 'pack_200', messages: 200, price: 4.99, currency: 'USD' },
      { id: 'pack_500', messages: 500, price: 9.99, currency: 'USD' },
      { id: 'pack_1500', messages: 1500, price: 24.99, currency: 'USD' },
    ],
    overageUnitPrice: 0.06,
  },
  LATAM: {
    region: 'LATAM',
    currency: 'USD',
    smsUnitPrice: 0.09,
    whatsappMarkupMultiplier: 1.6,
    smsMarkupMultiplierRange: [3.0, 4.5],
    packs: [
      { id: 'pack_200', messages: 200, price: 5.99, currency: 'USD' },
      { id: 'pack_500', messages: 500, price: 12.99, currency: 'USD' },
      { id: 'pack_1500', messages: 1500, price: 29.99, currency: 'USD' },
    ],
    overageUnitPrice: 0.09,
  },
  OTHER: {
    region: 'OTHER',
    currency: 'USD',
    smsUnitPrice: 0.08,
    whatsappMarkupMultiplier: 1.6,
    smsMarkupMultiplierRange: [3.0, 4.0],
    packs: [
      { id: 'pack_200', messages: 200, price: 5.99, currency: 'USD' },
      { id: 'pack_500', messages: 500, price: 12.99, currency: 'USD' },
      { id: 'pack_1500', messages: 1500, price: 29.99, currency: 'USD' },
    ],
    overageUnitPrice: 0.08,
  },
};

export const STORAGE_TIERS: StorageTier[] = [
  { id: 'pro_50gb', label: 'Pro 50GB', price: 9.9, currency: 'USD', includedGb: 50, isAddon: false },
  { id: 'plus_200gb', label: 'Plus 200GB', price: 19.99, currency: 'USD', includedGb: 200, isAddon: false },
  { id: 'plus_500gb', label: 'Plus 500GB', price: 29.99, currency: 'USD', includedGb: 500, isAddon: false },
  { id: 'extra_50gb', label: 'Extra 50GB', price: 4.99, currency: 'USD', includedGb: 50, isAddon: true },
  { id: 'extra_200gb', label: 'Extra 200GB', price: 14.99, currency: 'USD', includedGb: 200, isAddon: true },
];

export function getRegionPricing(region: RegionCode): RegionPricing {
  return REGION_PRICING[region] || REGION_PRICING.OTHER;
}

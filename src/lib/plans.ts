// Plan definitions — single source of truth
export interface PlanDef {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  annualPrice?: number;
  annualLabel?: string;
  features: string[];
  limits: {
    artists: number;
    storageMb: number;
    smsPerMonth: number;
    sites: number; // free website pages
  };
  popular?: boolean;
}

export interface WebsitePlanDef {
  id: string;
  name: string;
  monthlyPrice: number;
  monthlyLabel: string;
  annualPrice: number;
  annualLabel: string;
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    features: [
      'Basic app tools',
      'Manual client management',
      'Local-only (no cloud)',
      'Basic appointment booking',
    ],
    limits: { artists: 1, storageMb: 50, smsPerMonth: 0, sites: 0 },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    priceLabel: '$9.99/mo',
    annualPrice: 99.99,
    annualLabel: '$99.99/yr',
    features: [
      'Online booking widget',
      'Digital waivers',
      'Client CRM + cloud sync',
      'SMS & email reminders',
      'Deposit collection',
      'Payment links',
      '1 free website page',
    ],
    limits: { artists: 1, storageMb: 200, smsPerMonth: 100, sites: 1 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    priceLabel: '$29.99/mo',
    annualPrice: 299.99,
    annualLabel: '$299.99/yr',
    popular: true,
    features: [
      'Everything in Starter',
      'Up to 5 artists',
      'Commission splitting',
      'Aftercare automation',
      'Inventory tracking',
      'Staff management',
      'Enhanced website (10 pages)',
    ],
    limits: { artists: 5, storageMb: 1000, smsPerMonth: -1, sites: 10 },
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 49.99,
    priceLabel: '$49.99/mo',
    annualPrice: 499.99,
    annualLabel: '$499.99/yr',
    features: [
      'Everything in Pro',
      'Multi-location management',
      'Cross-shop analytics',
      'Custom domain',
      'Priority support',
      'No InkFlow branding',
      'Unlimited website pages',
    ],
    limits: { artists: -1, storageMb: 5000, smsPerMonth: -1, sites: -1 },
  },
];

export const WEBSITE_PLANS: WebsitePlanDef[] = [
  {
    id: 'website_basic',
    name: 'Website Basic',
    monthlyPrice: 4.99,
    monthlyLabel: '$4.99/mo',
    annualPrice: 49.99,
    annualLabel: '$49.99/yr',
    features: [
      '1 landing page',
      'All 16 templates',
      'Booking request form',
      'Instagram gallery',
      'Google Maps embed',
      'InkFlow branding',
    ],
  },
  {
    id: 'website_pro',
    name: 'Website Pro',
    monthlyPrice: 9.99,
    monthlyLabel: '$9.99/mo',
    annualPrice: 99.99,
    annualLabel: '$99.99/yr',
    features: [
      'Multi-page website',
      'All 16 templates',
      'Booking request form',
      'Instagram gallery',
      'Custom domain',
      'No InkFlow branding',
    ],
  },
];

export function getPlan(id: string): PlanDef {
  return PLANS.find(p => p.id === id) || PLANS[0];
}

export function canUpgrade(current: string, target: string): boolean {
  const idx = PLANS.findIndex(p => p.id === current);
  const tIdx = PLANS.findIndex(p => p.id === target);
  return tIdx > idx;
}

export function canDowngrade(current: string, target: string): boolean {
  const idx = PLANS.findIndex(p => p.id === current);
  const tIdx = PLANS.findIndex(p => p.id === target);
  return tIdx < idx;
}

export function upgradablePlans(current: string): PlanDef[] {
  const idx = PLANS.findIndex(p => p.id === current);
  return PLANS.slice(idx + 1);
}

export function downgradablePlans(current: string): PlanDef[] {
  const idx = PLANS.findIndex(p => p.id === current);
  return PLANS.slice(0, idx);
}

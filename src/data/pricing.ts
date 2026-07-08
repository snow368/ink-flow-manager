// 营销站定价统一数据源 —— index.astro 和 pricing.astro 共用
// 改价格只需改这里

export interface PricingTier {
  id: string;
  name: string;
  monthly: number;
  monthlyLabel: string;
  annual: number;
  annualLabel: string;
  annualSaving: number;
  subtitle: string;
  features: string[];
  popular?: boolean;
  highlight?: string;
}

export const APP_PLANS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    monthlyLabel: '$0',
    annual: 0,
    annualLabel: '',
    annualSaving: 0,
    subtitle: 'Forever free',
    features: ['1 artist', 'Basic app tools', 'Local-only'],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthly: 9.99,
    monthlyLabel: '$9.99',
    annual: 99.99,
    annualLabel: '$99.99/yr',
    annualSaving: 19.89,
    subtitle: 'Per month — 1 artist',
    features: ['Online booking widget', 'Digital waivers', 'Client CRM + cloud sync', 'SMS & email reminders', 'Deposit collection', 'Payment links', 'Free website page'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 29.99,
    monthlyLabel: '$29.99',
    annual: 299.99,
    annualLabel: '$299.99/yr',
    annualSaving: 59.89,
    subtitle: 'Per month — 1 shop, up to 5 artists',
    popular: true,
    features: ['Everything in Starter', 'Up to 5 artists', 'Commission splitting', 'Aftercare automation', 'Inventory tracking', 'Staff management', 'Enhanced website (10 pages)'],
  },
  {
    id: 'plus',
    name: 'Plus',
    monthly: 49.99,
    monthlyLabel: '$49.99',
    annual: 499.99,
    annualLabel: '$499.99/yr',
    annualSaving: 99.89,
    subtitle: 'First shop + $15/additional',
    features: ['Everything in Pro', 'Multi-location', 'Cross-shop analytics', 'Custom domain', 'Priority support', 'No InkFlow branding', 'Unlimited website pages'],
  },
];

export const WEBSITE_PLANS: PricingTier[] = [
  {
    id: 'website_basic',
    name: 'Website Basic',
    monthly: 0.83,
    monthlyLabel: '$0.83',
    annual: 9.99,
    annualLabel: '$9.99/yr',
    annualSaving: 0,
    subtitle: 'per year',
    features: ['1-page landing page', 'All templates', 'Booking request form', 'Instagram gallery (from IG)', 'Google Maps embed', 'Subdomain (slug.ink-flows.com)'],
  },
  {
    id: 'website_pro',
    name: 'Website Pro',
    monthly: 1.66,
    monthlyLabel: '$1.66',
    annual: 19.99,
    annualLabel: '$19.99/yr',
    annualSaving: 0,
    subtitle: 'per year',
    popular: true,
    features: ['Multi-page website', 'All templates', 'Booking request form', 'Instagram gallery (from IG)', 'Custom domain', 'No InkFlow branding'],
  },
];

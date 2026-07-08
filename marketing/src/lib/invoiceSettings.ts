import { getCountryConfig, DEFAULT_TERMS_TEXT } from './invoiceConfig';

export interface InvoicePresetItem {
  name: string;
  price: number;
}

export interface InvoiceStudioSettings {
  studioName: string;
  studioAddress: string;
  studioPhone: string;
  licenseNumber: string;
  defaultTaxRate: number;
  defaultDueDays: number;
  customTerms: string;
  defaultPaymentMethod: string;
  defaultNotes: string;
  servicePresets: InvoicePresetItem[];
  productPresets: InvoicePresetItem[];
}

const KEY = 'inkflow_invoice_settings';

export function loadInvoiceSettings(): InvoiceStudioSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    studioName: '',
    studioAddress: '',
    studioPhone: '',
    licenseNumber: '',
    defaultTaxRate: -1,
    defaultDueDays: 30,
    customTerms: '',
    defaultPaymentMethod: 'cash',
    defaultNotes: '',
    servicePresets: [
      { name: 'Tattoo Session', price: 150 },
      { name: 'Custom Design', price: 80 },
      { name: 'Flash Tattoo', price: 100 },
      { name: 'Cover-up', price: 200 },
      { name: 'Touch-up', price: 50 },
      { name: 'Consultation', price: 30 },
    ],
    productPresets: [
      { name: 'Aftercare Kit', price: 25 },
      { name: 'Aftercare Balm', price: 12 },
      { name: 'Wrapping Film', price: 8 },
    ],
  };
}

export function saveInvoiceSettings(settings: InvoiceStudioSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function getEffectiveTaxRate(country: string, settings?: InvoiceStudioSettings): number {
  if (settings && settings.defaultTaxRate >= 0) return settings.defaultTaxRate;
  return getCountryConfig(country).defaultTaxRate;
}

export function getEffectiveTerms(settings?: InvoiceStudioSettings): string {
  if (settings?.customTerms?.trim()) return settings.customTerms;
  return DEFAULT_TERMS_TEXT;
}

export function isInvoiceSetupComplete(settings?: InvoiceStudioSettings): boolean {
  const s = settings || loadInvoiceSettings();
  return !!(s.studioName.trim() && s.studioAddress.trim());
}

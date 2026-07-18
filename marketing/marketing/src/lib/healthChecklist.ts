import { db, type HealthChecklistRecord, type HealthCheckItem } from '../db';

export const UNIVERSAL_CHECKLIST_ITEMS: HealthCheckItem[] = [
  { key: 'autoclave_log', label: 'Autoclave sterilization log up to date', required: true },
  { key: 'spore_test', label: 'Monthly spore test completed', required: true },
  { key: 'sharps_disposal', label: 'Sharps container properly sealed and labeled', required: true },
  { key: 'biohazard_disposal', label: 'Biohazard waste disposed per local regulations', required: true },
  { key: 'surface_disinfection', label: 'Work surfaces disinfected with hospital-grade solution', required: true },
  { key: 'hand_hygiene', label: 'Hand washing station stocked (soap, paper towels)', required: true },
  { key: 'glove_stock', label: 'Nitrile/latex gloves available and unexpired', required: true },
  { key: 'needle_stock', label: 'Needles sealed in original packaging, single-use', required: true },
  { key: 'ink_storage', label: 'Inks stored properly, caps on, no cross-contamination', required: true },
  { key: 'first_aid_kit', label: 'First aid kit accessible and stocked', required: true },
  { key: 'fire_extinguisher', label: 'Fire extinguisher inspected and accessible', required: true },
  { key: 'emergency_exit', label: 'Emergency exit clear and marked', required: true },
  { key: 'license_display', label: 'Business license / health permit displayed', required: true },
  { key: 'consent_forms', label: 'Client consent forms properly filed (digital or paper)', required: true },
  { key: 'aftercare_sheets', label: 'Aftercare instruction sheets available for clients', required: false },
  { key: 'floor_clean', label: 'Floors clean and free of debris', required: true },
  { key: 'ppe_stock', label: 'PPE (aprons, face shields) stocked', required: true },
  { key: 'cross_contamination_prevention', label: 'Barrier film on equipment, single-use covers', required: true },
];

export const COUNTRY_REGULATORY_LABELS: Record<string, Record<string, string>> = {
  US: { autoclave_log: 'Autoclave log per OSHA Bloodborne Pathogens Standard', license_display: 'State tattoo license displayed' },
  UK: { autoclave_log: 'Autoclave log per HSE / local council requirements', license_display: 'Local council tattoo registration displayed' },
  CA: { autoclave_log: 'Autoclave log per Health Canada guidelines', license_display: 'Provincial health permit displayed' },
  AU: { autoclave_log: 'Sterilization log per state health department', license_display: 'State tattoo license displayed' },
  DE: { autoclave_log: 'Autoklav-Logbuch nach Tätowiermittel-Verordnung', license_display: 'Gesundheitsamt-Genehmigung ausgehängt' },
  JP: { autoclave_log: '滅菌記録 (保健所指導)', license_display: '営業許可証を掲示' },
  CN: { autoclave_log: '灭菌记录 (卫生局要求)', license_display: '卫生许可证悬挂' },
  BR: { autoclave_log: 'Registro de esterilização (Vigilância Sanitária)', license_display: 'Alvará sanitário exposto' },
};

export function getChecklistItems(country?: string): HealthCheckItem[] {
  if (!country) return UNIVERSAL_CHECKLIST_ITEMS;
  const labels = COUNTRY_REGULATORY_LABELS[country.toUpperCase()] || {};
  return UNIVERSAL_CHECKLIST_ITEMS.map(item => ({
    ...item,
    label: labels[item.key] || item.label,
  }));
}

export async function createChecklist(artistId: string, country?: string, locationId?: string): Promise<string> {
  const id = 'hc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  await db.healthChecklists.add({
    id,
    artistId,
    locationId,
    country,
    name: `Health Inspection - ${new Date().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    items: getChecklistItems(country).map(i => ({ ...i, passed: undefined })),
    createdAt: Date.now(),
  });
  return id;
}

export async function getChecklists(artistId: string): Promise<HealthChecklistRecord[]> {
  return db.healthChecklists.where('artistId').equals(artistId).reverse().sortBy('createdAt');
}

export async function updateChecklistItem(
  checklistId: string,
  itemKey: string,
  passed: boolean,
  notes?: string,
): Promise<void> {
  const record = await db.healthChecklists.get(checklistId);
  if (!record) return;
  const items = record.items.map(i => i.key === itemKey ? { ...i, passed, notes } : i);
  const passedAll = items.every(i => i.passed !== false);
  await db.healthChecklists.update(checklistId, { items, passedAll });
}

export async function completeChecklist(checklistId: string, inspectorName?: string): Promise<void> {
  const now = Date.now();
  await db.healthChecklists.update(checklistId, {
    lastInspectionAt: now,
    nextInspectionDue: now + 30 * 24 * 60 * 60 * 1000,
    inspectorName,
  });
}

export function daysUntilNextInspection(checklist: HealthChecklistRecord): number | null {
  if (!checklist.nextInspectionDue) return null;
  return Math.ceil((checklist.nextInspectionDue - Date.now()) / (24 * 60 * 60 * 1000));
}

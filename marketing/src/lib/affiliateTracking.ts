import { db } from '../db';

export async function trackAffiliateClick(params: {
  brandId: string;
  brandName: string;
  productId?: string;
  productName?: string;
  affiliateLink: string;
  sourcePage?: 'supply_brands' | 'supply_new' | 'competitors' | 'other';
}) {
  const userId = localStorage.getItem('inkflow_current_user') || 'anonymous';
  const record = {
    id: `ac_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    brandId: params.brandId,
    brandName: params.brandName,
    productId: params.productId,
    productName: params.productName,
    affiliateLink: params.affiliateLink,
    sourcePage: params.sourcePage || 'supply_brands',
    clickedAt: Date.now(),
  };
  await db.affiliateClicks.add(record);
}

export async function getClickStats() {
  const all = await db.affiliateClicks.orderBy('clickedAt').reverse().toArray();

  const byBrand: Record<string, { brandName: string; count: number; lastClicked: number }> = {};
  for (const c of all) {
    if (!byBrand[c.brandId]) {
      byBrand[c.brandId] = { brandName: c.brandName, count: 0, lastClicked: 0 };
    }
    byBrand[c.brandId].count++;
    byBrand[c.brandId].lastClicked = Math.max(byBrand[c.brandId].lastClicked, c.clickedAt);
  }

  const sorted = Object.entries(byBrand)
    .map(([brandId, data]) => ({ brandId, ...data }))
    .sort((a, b) => b.count - a.count);

  const today = all.filter(c => {
    const d = new Date(c.clickedAt).toDateString();
    return d === new Date().toDateString();
  }).length;

  return { total: all.length, today, byBrand: sorted, recent: all.slice(0, 20) };
}

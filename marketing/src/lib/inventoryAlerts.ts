import { db, type InventoryRecord, type SupplyProduct } from '../db';

export interface LowStockAlert {
  item: InventoryRecord;
  recommendations: SupplyProduct[];
}

const CATEGORY_BRAND_MAP: Record<string, string> = {
  ink: 'ink',
  inks: 'ink',
  needle: 'needles',
  needles: 'needles',
  machine: 'machines',
  machines: 'machines',
  aftercare: 'aftercare',
  furniture: 'furniture',
};

// Get all items at or below reorder level
export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const items = await db.inventory.toArray();
  const lowItems = items.filter(i => i.quantity <= i.reorderLevel && i.quantity >= 0);
  if (lowItems.length === 0) return [];

  const brands = (await db.supplyBrands.toArray()).filter(b => b.active);
  const allProducts: { product: SupplyProduct; brandCategory: string }[] = [];
  for (const b of brands) {
    for (const p of b.products) {
      allProducts.push({ product: p, brandCategory: b.category });
    }
  }

  return lowItems.map(item => {
    const targetCategory = CATEGORY_BRAND_MAP[item.category?.toLowerCase() || ''] || item.category?.toLowerCase();
    const recs = allProducts
      .filter(p => p.brandCategory === targetCategory)
      .sort((a, b) => (b.product.isNew ? 1 : 0) - (a.product.isNew ? 1 : 0) || (b.product.clickCount || 0) - (a.product.clickCount || 0))
      .slice(0, 3)
      .map(p => p.product);
    return { item, recommendations: recs };
  });
}

// Get total count of low stock items
export async function getLowStockCount(): Promise<number> {
  const items = await db.inventory.toArray();
  return items.filter(i => i.quantity <= i.reorderLevel).length;
}

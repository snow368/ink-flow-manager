import { db } from '../db';

export const REVIEW_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'ink', label: 'Ink' },
  { key: 'needles', label: 'Needles' },
  { key: 'machines', label: 'Machines' },
  { key: 'aftercare', label: 'Aftercare' },
  { key: 'other', label: 'Other' },
] as const;

// Search SupplyBrand products by name
export async function searchSupplyProducts(query: string): Promise<{ brandName: string; productId: string; productName: string; category: string }[]> {
  if (!query.trim()) return [];
  const brands = await db.supplyBrands.toArray();
  const q = query.toLowerCase().trim();
  const results: { brandName: string; productId: string; productName: string; category: string }[] = [];
  for (const brand of brands) {
    for (const p of brand.products) {
      if (p.name.toLowerCase().includes(q)) {
        results.push({ brandName: brand.name, productId: p.id, productName: p.name, category: brand.category });
      }
    }
  }
  return results.slice(0, 8);
}

// Build AI extraction prompt
export function buildReviewExtractionPrompt(body: string, productName: string, category: string): string {
  return [
    `你是一位纹身耗材分析师。请分析以下纹身师的产品使用体验，提取结构化信息。`,
    ``,
    `## 产品信息`,
    `产品名: ${productName}`,
    `品类: ${category}`,
    ``,
    `## 纹身师体验原文`,
    body,
    ``,
    `## 要求`,
    `1. 提取 3-5 个关键标签 (如: #褪色快 #性价比高 #适合新手 #过敏反应 #流动性好)`,
    `2. 提炼 Pros (优点) 和 Cons (缺点)，每条不超过15个字`,
    `3. 判断纹身师"还会回购吗？" (yes/no/不确定)`,
    `4. 如果原文提到多个产品对比，标注对比品牌`,
    ``,
    `输出格式:`,
    `Tags: #tag1 #tag2 #tag3`,
    `Pros: 优点1; 优点2`,
    `Cons: 缺点1; 缺点2`,
    `BuyAgain: yes/no/uncertain`,
  ].join('\n');
}

// Simple local keyword-based tag extraction (no API needed)
export function extractLocalKeywords(body: string): string[] {
  const tags: string[] = [];
  const lower = body.toLowerCase();

  const patterns: [RegExp, string][] = [
    [/褪色|掉色|变色|fade/i, '#褪色'],
    [/过敏|红肿|反应|allerg/i, '#过敏'],
    [/漏墨|漏液|leak/i, '#漏墨'],
    [/不值|太贵|贵了|overpriced|expensive/i, '#性价比低'],
    [/性价比|值得|划算|value|worth/i, '#性价比高'],
    [/新手|入门|beginner/i, '#适合新手'],
    [/专业|pro|professional/i, '#专业级'],
    [/流畅|顺滑|smooth/i, '#流畅'],
    [/干得慢|干得慢|slow dry/i, '#干得慢'],
    [/遮盖|cover|opacity/i, '#遮盖力'],
    [/黑|black|dark/i, '#黑色'],
    [/彩色|颜色|color|bright/i, '#彩色'],
    [/噪音|noise|loud/i, '#噪音'],
    [/续航|电池|battery/i, '#续航'],
    [/握感|ergonomic|comfort/i, '#握感'],
    [/推荐|回购|buy again|repurchase/i, '#推荐回购'],
    [/不推荐|waste|regret|垃圾/i, '#不推荐'],
    [/愈合|heal|恢复/i, '#愈合'],
    [/气味|smell|scent|fragrance/i, '#气味'],
  ];

  for (const [pattern, tag] of patterns) {
    if (pattern.test(lower)) tags.push(tag);
  }

  return [...new Set(tags)].slice(0, 6);
}

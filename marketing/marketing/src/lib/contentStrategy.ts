import { db, type CompetitorRecord } from '../db';

// ── Types ──
export interface GapItem {
  feature: string;
  missingCount: number;
  basicCount: number;
  missingBy: string[];
  opportunityScore: number;
}

export interface ContentPiece {
  strategy: StrategyKey;
  type: string;
  title: string;
  body: string;
  cta: string;
  hashtags: string;
}

export type StrategyKey = 'problem_first' | 'comparison' | 'feature_spotlight' | 'vertical_saas' | 'roi' | 'social_proof' | 'compliance' | 'all_in_one';

export interface StrategyDef {
  key: StrategyKey;
  name: string;
  icon: string;
  desc: string;
  saasPattern: string;
  whenToUse: string;
}

// ── SaaS Marketing Strategy Frameworks ──
export const STRATEGIES: StrategyDef[] = [
  {
    key: 'problem_first',
    name: '痛点优先',
    icon: '🎯',
    desc: '先讲纹身师的真实痛点，再引出解决方案',
    saasPattern: 'Slack、Notion 等 PLG 产品的核心策略：让用户意识到"我现在用的不够好"',
    whenToUse: '竞品功能有明确缺失时最有效',
  },
  {
    key: 'comparison',
    name: '正面对比',
    icon: '⚔️',
    desc: '直接列出我们 vs 竞品的功能对比，让事实说话',
    saasPattern: 'ClickUp vs Monday、Figma vs Sketch 经典对比页策略',
    whenToUse: '功能覆盖全面，有明显优势时',
  },
  {
    key: 'feature_spotlight',
    name: '功能深挖',
    icon: '🔬',
    desc: '聚焦一个杀手级功能，深度展示差异化',
    saasPattern: 'Superhuman 的"最快邮件体验"、Linear 的"最快issue tracker"',
    whenToUse: '某功能竞品评分全是 missing/basic',
  },
  {
    key: 'vertical_saas',
    name: '垂直定位',
    icon: '🎯',
    desc: '强调"专为纹身师打造"，泛用型平台做不到',
    saasPattern: 'Shopify（电商专用）vs 通用建站工具的定位策略',
    whenToUse: '对比跨行业竞品（Vagaro、Booksy）时',
  },
  {
    key: 'roi',
    name: 'ROI / 省时',
    icon: '⏱️',
    desc: '量化时间节省 + 收入提升，用数据说服',
    saasPattern: 'HubSpot、Salesforce 的经典 ROI 计算器策略',
    whenToUse: '有功能链路整合优势时（如 POS→发票→发送一次完成）',
  },
  {
    key: 'social_proof',
    name: '社交证明',
    icon: '⭐',
    desc: '用户评价、案例、推荐语驱动决策',
    saasPattern: 'Capterra/G2 评论 + 用户故事策略',
    whenToUse: '积累了一定用户量后',
  },
  {
    key: 'compliance',
    name: '合规安全',
    icon: '🛡️',
    desc: '强调合规、数据安全、隐私保护（EU市场尤其重要）',
    saasPattern: 'Vanta、Drata 等合规SaaS的内容策略',
    whenToUse: '有批次追溯、墨水护照、数字同意书等合规功能时',
  },
  {
    key: 'all_in_one',
    name: '一站式完整',
    icon: '🔗',
    desc: '强调全链路覆盖，不需要拼5个工具',
    saasPattern: 'Notion（文档+表格+项目管理一体）的定位策略',
    whenToUse: '功能覆盖面广，对比需要组合多个工具的方案',
  },
];

// ── Gap Analysis ──
export async function runGapAnalysis(ourName = 'InkFlow Manager'): Promise<GapItem[]> {
  const competitors = await db.competitors.toArray();
  if (competitors.length === 0) return [];

  const featureMap = new Map<string, { missing: string[]; basic: string[] }>();

  for (const comp of competitors) {
    if (comp.status === 'archived') continue;
    for (const f of comp.features) {
      const key = f.name.toLowerCase().trim();
      if (!featureMap.has(key)) featureMap.set(key, { missing: [], basic: [] });
      const entry = featureMap.get(key)!;
      if (f.rating === 'missing') entry.missing.push(comp.name);
      else if (f.rating === 'basic') entry.basic.push(comp.name);
    }
  }

  const gaps: GapItem[] = [];
  for (const [feature, data] of featureMap) {
    const totalActive = competitors.filter(c => c.status !== 'archived').length;
    const missingCount = data.missing.length;
    const basicCount = data.basic.length;
    const opportunityScore = Math.round(((missingCount * 2 + basicCount) / (totalActive * 2)) * 100);
    if (opportunityScore >= 30) {
      gaps.push({ feature, missingCount, basicCount, missingBy: [...data.missing, ...data.basic], opportunityScore });
    }
  }

  gaps.sort((a, b) => b.opportunityScore - a.opportunityScore);
  return gaps;
}

// ── Content Generators ──
export async function generateContent(
  strategy: StrategyKey,
  ourName = 'InkFlow Manager',
): Promise<ContentPiece> {
  const gaps = await runGapAnalysis(ourName);
  const competitors = (await db.competitors.toArray()).filter(c => c.status !== 'archived');

  switch (strategy) {
    case 'problem_first': return genProblemFirst(gaps, ourName);
    case 'comparison': return genComparison(gaps, competitors, ourName);
    case 'feature_spotlight': return genFeatureSpotlight(gaps, ourName);
    case 'vertical_saas': return genVerticalSaaS(gaps, competitors, ourName);
    case 'roi': return genROI(gaps, ourName);
    case 'social_proof': return genSocialProof(ourName);
    case 'compliance': return genCompliance(gaps, ourName);
    case 'all_in_one': return genAllInOne(gaps, competitors, ourName);
  }
}

// ── Individual Strategy Generators ──
function genProblemFirst(gaps: GapItem[], ourName: string): ContentPiece {
  const topGaps = gaps.slice(0, 3);
  const painPoints = topGaps.map(g => `- 大多数平台${g.feature}功能薄弱或完全缺失，纹身师只能手动处理或用第三方工具拼凑`).join('\n');
  const solutions = topGaps.map(g => `- ${ourName} 内置完整${g.feature}，无需切换工具，3步完成`).join('\n');

  return {
    strategy: 'problem_first',
    type: '痛点帖',
    title: `还在手动${topGaps[0]?.feature || '管理'}？你的软件可能拖了后腿`,
    body: [
      `纹身师每天花在管理工作上的时间比纹身还多？`,
      ``,
      `市场常态：`,
      painPoints,
      ``,
      `${ourName} 的解决方案：`,
      solutions,
      ``,
      `不用等软件"以后会做这个功能"。我们已经做好了。`,
    ].join('\n'),
    cta: `免费试用 ${ourName}，体验完整的纹身店管理`,
    hashtags: '#纹身店管理 #TattooStudio #StudioManagement #TattooArtist',
  };
}

function genComparison(gaps: GapItem[], competitors: CompetitorRecord[], ourName: string): ContentPiece {
  const topFeatures = gaps.slice(0, 5);
  const compNames = competitors.slice(0, 5).map(c => c.name);

  let table = `| 功能 | ${ourName} | ${compNames.join(' | ')} |\n`;
  table += `|------|${compNames.map(() => '------').join('|')}|\n`;

  for (const g of topFeatures) {
    const ratings = compNames.map(n => {
      const c = competitors.find(x => x.name === n);
      const f = c?.features.find(x => x.name.toLowerCase().trim() === g.feature);
      if (!f) return '❓';
      if (f.rating === 'best') return '⭐领先';
      if (f.rating === 'good') return '✅不错';
      if (f.rating === 'basic') return '⚠️基础';
      return '❌缺失';
    });
    table += `| ${g.feature} | ✅领先 | ${ratings.join(' | ')} |\n`;
  }

  return {
    strategy: 'comparison',
    type: '对比帖',
    title: `${ourName} vs 竞品：功能全面对比`,
    body: [
      `选了错的软件，等于每天多花2小时做无用功。`,
      ``,
      `我们对比了 ${ourName} 和市场上 ${compNames.length} 个主流平台：`,
      ``,
      table,
      ``,
      `结论：${ourName} 是唯一在所有核心功能上全面覆盖的平台。`,
    ].join('\n'),
    cta: `点击查看完整对比 & 免费试用`,
    hashtags: '#TattooSoftware #StudioSoftware #纹身管理 #SaaS',
  };
}

function genFeatureSpotlight(gaps: GapItem[], ourName: string): ContentPiece {
  const best = gaps[0];
  if (!best) return genFallback(ourName);

  return {
    strategy: 'feature_spotlight',
    type: '功能深挖',
    title: `${best.feature}：为什么这是纹身店管理的刚需`,
    body: [
      `${best.feature} — 市场上 ${best.opportunityScore}% 的竞品要么没做，要么做得很弱。`,
      ``,
      `为什么重要？`,
      `纹身工作室每天都要处理${best.feature}，用通用工具拼凑意味着：`,
      `- 数据分散在多个平台`,
      `- 浪费时间来回切换`,
      `- 容易出错，影响客户体验`,
      ``,
      `${ourName} 的做法：`,
      `- 从预约到收款到发票，一个流程贯穿`,
      `- 自动记录，减少手动输入`,
      `- 为纹身师设计，不是给理发店改的`,
      ``,
      `这${best.missingBy.length}家竞品做不到：${best.missingBy.join('、')}`,
    ].join('\n'),
    cta: `体验 ${ourName} 的 ${best.feature} 功能 →`,
    hashtags: `#${best.feature.replace(/\s/g, '')} #TattooStudio #${ourName.replace(/\s/g, '')}`,
  };
}

function genVerticalSaaS(gaps: GapItem[], competitors: CompetitorRecord[], ourName: string): ContentPiece {
  const crossIndustry = competitors.filter(c => ['booking', 'pos'].includes(c.category));
  const crossNames = crossIndustry.map(c => c.name).join('、');

  return {
    strategy: 'vertical_saas',
    type: '垂直定位',
    title: `为什么纹身店不该用通用平台（${crossNames || 'Vagaro、Booksy'}）`,
    body: [
      `${crossNames || 'Vagaro、Booksy'} 是好产品 — 但它们是给理发店、美容院、美甲店设计的。`,
      ``,
      `纹身工作流的独特需求：`,
      `- 多session大项目追踪（花臂、大背需要多次预约）`,
      `- 墨水批次追溯和合规（EU法规要求）`,
      `- 数字同意书和过敏记录`,
      `- POS收银 + 发票一键生成`,
      `- 作品集和设计稿管理`,
      ``,
      `这些是通用平台永远做不好的，因为它们的核心用户是理发师。`,
      ``,
      `${ourName} 只做纹身。从第一天起就是。`,
    ].join('\n'),
    cta: `换到专为纹身师设计的平台 →`,
    hashtags: '#TattooArtist #TattooStudio #VerticalSaaS #BuiltForTattoo',
  };
}

function genROI(gaps: GapItem[], ourName: string): ContentPiece {
  const topGaps = gaps.slice(0, 3);
  const features = topGaps.map(g => g.feature).join('、');

  return {
    strategy: 'roi',
    type: 'ROI帖',
    title: `${ourName} 帮纹身师每周省出10+小时`,
    body: [
      `平均每个纹身师每周花在管理工作上的时间：12-16小时。`,
      ``,
      `这些时间花在哪？`,
      `- 手动排期和提醒客户`,
      `- 收款记账开发票`,
      `- 库存盘点和补货`,
      `- 客户跟进和回复消息`,
      ``,
      `${ourName} 把 ${features} 这些流程全部自动化。`,
      ``,
      `省下的时间 = 多接1-2个纹身 = 每月多赚$1000-3000。`,
      ``,
      `一年下来，等于多赚一辆车。`,
    ].join('\n'),
    cta: `算一下你每周能省多少时间 →`,
    hashtags: '#TattooBusiness #StudioOwner #ROI #TattooManagement',
  };
}

function genSocialProof(ourName: string): ContentPiece {
  return {
    strategy: 'social_proof',
    type: '社交证明',
    title: `${ourName} 用户怎么说`,
    body: [
      `"以前用3个App拼凑，现在一个就够了" — 某纹身工作室主理人`,
      ``,
      `"批次追溯功能让我们顺利通过了EU合规审核"`,
      ``,
      `"POS到发票一键搞定，结账从5分钟变成30秒"`,
      ``,
      `${ourName} 为全球纹身师打造。你的同行已经在用。`,
    ].join('\n'),
    cta: `加入 ${ourName} →`,
    hashtags: '#TattooCommunity #StudioLife #TattooArtist',
  };
}

function genCompliance(gaps: GapItem[], ourName: string): ContentPiece {
  const complianceFeatures = gaps.filter(g =>
    ['同意书', 'waiver', 'consent', '合规', 'compliance', '批次', 'batch', '墨水', 'ink passport'].some(k =>
      g.feature.toLowerCase().includes(k)
    )
  );

  if (complianceFeatures.length === 0) {
    return {
      strategy: 'compliance',
      type: '合规帖',
      title: `纹身店合规管理 — ${ourName} 替你考虑好了`,
      body: [
        `EU REACH 法规要求纹身店追踪墨水批次、保存同意书、提供售后护理指导。`,
        ``,
        `还在用纸质同意书和Excel记录批次号？`,
        `一次检查就能让你关门。`,
        ``,
        `${ourName} 内置：`,
        `- 数字同意书（拍照签名、合规存档）`,
        `- 墨水批次追溯（每session记录批号，审计无忧）`,
        `- 售后护理自动推送`,
      ].join('\n'),
      cta: `确保你的工作室合规 →`,
      hashtags: '#TattooCompliance #REACH #InkPassport #TattooStudio',
    };
  }

  const featStr = complianceFeatures.map(g => g.feature).join('、');

  return {
    strategy: 'compliance',
    type: '合规帖',
    title: `合规不是可选项 — ${ourName} 帮你轻松应对`,
    body: [
      `EU REACH 法规要求纹身店：`,
      `- 追踪每瓶墨水的批号和去向`,
      `- 保存客户同意书至少10年`,
      `- 记录每次使用的耗材`,
      ``,
      `${complianceFeatures.length}个竞品在${featStr}方面要么没做，要么勉强覆盖。`,
      ``,
      `${ourName} 从一开始就内置了完整合规流程 — 不需要额外工具，不需要手动表格。`,
    ].join('\n'),
    cta: `让合规不再头疼 →`,
    hashtags: '#TattooCompliance #REACH #StudioManagement',
  };
}

function genAllInOne(gaps: GapItem[], competitors: CompetitorRecord[], ourName: string): ContentPiece {
  const totalFeatures = gaps.length;
  const comprehensiveCount = gaps.filter(g => g.opportunityScore >= 50).length;

  return {
    strategy: 'all_in_one',
    type: '一站式帖',
    title: `一个平台取代 ${competitors.length} 个工具`,
    body: [
      `你的工作室现在可能这样：`,
      `- 日历App 管预约`,
      `- WhatsApp 回客户`,
      `- Excel 记库存`,
      `- 纸质同意书`,
      `- 独立POS机收款`,
      `- 手开发票`,
      ``,
      `5-6个工具，数据割裂，效率低下。`,
      ``,
      `${ourName} 一个平台覆盖以上所有。`,
      ``,
      `从客户第一次咨询 → 预约 → 同意书 → 纹身过程 → 收银 → 发票 → 售后跟进，全部打通。`,
      ``,
      `${totalFeatures}个功能模块，${comprehensiveCount}个行业领先 — 不需要拼凑。`,
    ].join('\n'),
    cta: `开始整合你的工具栈 →`,
    hashtags: '#AllInOne #TattooStudio #StudioTools #Productivity',
  };
}

function genFallback(ourName: string): ContentPiece {
  return {
    strategy: 'feature_spotlight',
    type: '通用帖',
    title: `${ourName} — 专为纹身师打造的管理平台`,
    body: [
      `市面上很多平台声称能做"纹身店管理"，但深入了解后发现它们只是把理发店的模板改了个名字。`,
      ``,
      `${ourName} 不同。我们从第一天起就只做纹身。`,
      `- 多session大项目追踪`,
      `- 墨水批次合规`,
      `- 数字同意书`,
      `- POS到发票一键完成`,
      `- 库存低预警+自动补货推荐`,
      ``,
      `不是给理发师设计的，是给纹身师的。`,
    ].join('\n'),
    cta: `免费试用 ${ourName} →`,
    hashtags: '#TattooArtist #TattooStudio #TattooSaaS',
  };
}

// ── Prompt Builder (for external AI) ──
export async function buildAIPrompt(strategy: StrategyKey, ourName = 'InkFlow Manager'): Promise<string> {
  const gaps = await runGapAnalysis(ourName);
  const competitors = (await db.competitors.toArray()).filter(c => c.status !== 'archived');
  const strategyDef = STRATEGIES.find(s => s.key === strategy);
  const topGaps = gaps.slice(0, 5).map(g => `- ${g.feature} (${g.opportunityScore}%竞品缺失或不足: ${g.missingBy.join(', ')})`).join('\n');
  const compSummary = competitors.map(c =>
    `${c.name}: ${c.description}\n优势: ${c.strengths || 'N/A'}\n弱点: ${c.weaknesses || 'N/A'}`
  ).join('\n\n');

  return [
    `你是一位SaaS营销策略专家。请基于以下竞品分析数据，为 ${ourName}（纹身店管理SaaS）撰写营销内容。`,
    ``,
    `## 采用的策略框架`,
    `${strategyDef?.name}: ${strategyDef?.desc}`,
    `SaaS行业参考: ${strategyDef?.saasPattern}`,
    ``,
    `## 市场缺口分析`,
    topGaps,
    ``,
    `## 竞品概况`,
    compSummary,
    ``,
    `## 要求`,
    `1. 采用上述策略框架`,
    `2. 强调我们的差异化卖点`,
    `3. 语气专业但亲切，直接对纹身师说话`,
    `4. 输出格式：标题 + 正文 + CTA + 推荐hashtags`,
    `5. 中文为主，可夹杂行业英文术语`,
  ].join('\n');
}

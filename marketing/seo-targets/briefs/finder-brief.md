# Tattoo Meaning Finder — SEO 补强 Brief（活副本）

> 目的：把已排 12 位的 `/free-tools/tattoo-meaning-finder` 按 E-E-A-T 铁律 + SERP gap 补强，坐实排名。
> 范围：仅活副本 `marketing/marketing/src/pages/free-tools/tattoo-meaning-finder.astro`，**不碰死副本**。

## 目标词
- 主：`tattoo meaning finder`
- 次：`tattoo meaning search tool` / `tattoo symbol finder` / `tattoo meaning dictionary`

## TOP10 SERP 抽样（2026-07-30，WebSearch）
- 工具类直接竞品：`tattoolead.com/tattoo-meaning-finder`、`wizgenerator.com/tools/tattoo-symbol-meaning-generator`
- 内容类竞品：`divinehivemind.com`、`signifika.com/tattoo`、`sortra.com/tattoo-meaning-guide`、`hontattoo.com`、`tattoostours.com`、`timleasetattoos.com`、`tattoobond.org`

## 差距矩阵（WebFetch 验证状态）
| 维度 | 竞品状态 | 我们现状 | 动作 |
|---|---|---|---|
| 文化准确性 / 避免误用 sacred symbol | sortra/divinehivemind = PARTIAL | 提了 cultural 但无深度 | 补「Cultural Accuracy & Respect」段 + 链文化页 |
| 工具 vs AI 生成器差异 | 竞品 ABSENT（他们就是 AI 生成器） | ABSENT | 补「Human-Curated, Not AI-Generated」差异化段 |
| studio workflow / artist 用途 | ABSENT | COVERED（已有区块） | 保持 + 强化 |
| 免费无注册实时搜索 | PARTIAL | COVERED | 保持 |
| 作者 + 来源透明度 | ABSENT（无作者无引用） | ABSENT | 补 E-E-A-T 段 + Sources（2 条） |

## 独家角度（信息增益）
1. **真人策展（12 年店长经验），非 AI 生成** —— 直接差异化 AI 生成器竞品（tattoolead/wizgenerator 质量可疑、无署名）。
2. **面向 artist 的咨询工作流** —— 竞品全是面向 wearer，我们是 artist-facing（已有「How Artists Use」区块）。
3. **文化尊重框架** —— 标注 sacred symbol 需谨慎使用，呼应 sortra/divinehivemind 但更落地。

## E-E-A-T 方案
- **author**：Sarah Chen（Founder & CEO, 12yr studio）— 复用 `authors.ts` founder，合法不编。
- **reviewer**：InkFlow tattoo-artist advisory panel（机构，不编个人姓名，遵守 authors.ts 警告）。
- **published** 2026-06-15 / **updated** 2026-07-30。
- **Article schema**：`<PageSchema type="article" data={...} />`（含 author Person + 日期）。
- **Sources（2 条，真实、非 Wikipedia）**：
  1. Britannica — Tattoo: Body Art, Cultural Significance & Design（https://www.britannica.com/topic/tattoo，已 WebFetch 验证存在）
  2. 站内示例：/tattoo-meaning/ocean/shark-tattoo-meaning（展示我们如何记录 cultural context，first-party 策展数据）

## FAQ（真实 PAA 改写，5 条）
1. What symbols are included? — 73 symbols across 15 categories（动态 `ALL_MEANINGS.length`）。
2. Is the tattoo meaning finder free? — Yes, free, no signup。
3. Are the meanings culturally accurate? — curated from cultural/historical sources, reviewed by studio artists; modern interpretations labeled; sacred symbols flagged for respectful use。
4. Can tattoo artists use this with clients? — Yes, consultation tool。
5. How is this different from AI tattoo meaning generators? — human-curated by studio owners, not AI-generated; each meaning tied to documented cultural/historical context。

## 校验
- `npx esbuild finder.astro --bundle --external:* --format=esm` OK
- `grep -c en.wikipedia.org` = 0
- PageSchema article 渲染（带 author + 日期）
- Sources 区块 2 条真实 URL 可点击

# 关键词研究方法论

## 适用分类
关键词研究

## 判断 KD（竞争度）的两种方法

### 方法 A：用工具（精确）

| 工具 | 费用 | KD 参考值 | 备注 |
|------|------|----------|------|
| Google Keyword Planner | 免费（需 Ads 账号） | 没有固定 KD 分，看建议出价 | 出价高 = 竞争高 |
| Ahrefs | $29/月起 | 0-100 分 | 行业标准 |
| Semrush | 免费版有限 | 0-100% | 跟 Ahrefs 算法不同 |
| Ubersuggest | 免费有限 | 0-100 分 | 不太精准但够用 |

KD 分只是参考，**不是绝对标准**。Ahrefs 的 KD 算法偏向 DA（域名权重），如果你的内容比对手好 10 倍，DA 低也能排名。

### 方法 B：手动判断（不需要工具）

> 打开 Google，搜这个词，看首页结果：

**低 KD 信号（可以做）：**
- ✅ Reddit / Quora / 论坛排在首页
- ✅ 排在前面的页面是博客文章，不是产品首页
- ✅ 没有或只有 1-2 个广告
- ✅ 排在前面的文章内容一般、甚至过时
- ✅ 搜索结果量少（< 5000 万条）

**高 KD 信号（暂时别碰）：**
- ❌ Forbes / Shopify / HubSpot 等大站排首页
- ❌ 结果全是 SaaS 产品的 Landing Page
- ❌ 4-5 个广告 + Google Shopping
- ❌ 有 Wikipedia 结果
- ❌ 搜索结果量极大（> 1 亿条）

---

## 关键词分组（同一意图优化）

不要零散做关键词。把**同一搜索意图**的关键词归组，一篇文章覆盖一组：

```
组：纹身工作室的 waiver 方案
├── "digital waiver for tattoo shop"        KD 12
├── "tattoo consent form app"               KD 8
├── "tattoo waiver software"                KD 15
├── "digital tattoo waiver form"            KD 10
└── "tattoo shop liability waiver app"      KD 6
→ 做一篇页面 《Digital Waivers for Tattoo Shops》，自然覆盖以上所有词
```

---

## 搜索意图分类

| 意图 | 搜什么 | 转化率 | 对应内容 |
|------|--------|--------|---------|
| **交易型** | "buy" / "pricing" / "best" | 最高 | 对比页、定价页 |
| **商业型** | "vs" / "review" / "alternative" | 高 | 替代品页、评测 |
| **信息型** | "how to" / "guide" / "what is" | 低 | 博客、指南 |
| **导航型** | 品牌名 / 产品名 | 极高（但需要品牌认知） | 品牌页 |

**优先级：先做商业型+交易型，再做信息型。**

---

## 关键词来源

| 来源 | 说明 |
|------|------|
| **Ahrefs / Semrush** | 搜核心词看 "Also rank for" 和 "Related" |
| **Google Search Console** | 看到你已经有的词的排名数据 |
| **Google "People also ask"** | 搜一个词看下面的相关问答 |
| **Google "Related searches"** | 搜索结果最底部 |
| **Reddit / 行业论坛** | 看目标用户在问什么 |
| **竞品网站** | 看竞品的页面标题，分析他们在做哪些词 |
| **ChatGPT / Claude** | 让 AI 列出相关信息型关键词做参考（需人工验证） |

---

## 实操流程

```
1. 确定 niche（纹身工作室管理软件）
2. 列出 5-10 个核心词（tattoo studio software, booking, POS...）
3. 对每个核心词用工具 / 手动查 KD
4. 筛出 KD < 20 的词
5. 按搜索意图分组
6. 按转化率排序（商业/交易优先）
7. 出关键词矩阵表
```

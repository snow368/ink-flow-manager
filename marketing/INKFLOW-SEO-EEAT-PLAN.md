# InkFlow.com — EEAT + Google SEO 合规执行方案

> 基于 2026-06-06 审计报告的 32 项发现，注入 EEAT 框架 + 最新 Google SEO 规则
> 目标站点：inkflow.com（Astro SSG + Cloudflare Pages）
> 知识库来源：F:/SEO_Project/framework/seo-execution-system.md、b2b-saas-skill.md、content-marketing-playbook.md、topic_cluster_pillar_2026.md

---

## 核心原则（来自知识库）

### 🌟 Last Click — SEO 不是内容工作，是产品工作

> "用户搜一个词，点进你的页面，问题全解决了，不用再点别的 = Last Click。产品不行，内容写得再花也是白搭。" — SEO Execution System

**对 InkFlow.com 的含义：** inkflow.com 不是"写博客引流"的站，是**产品官网**。每个页面的目标不是"让用户点更多页"，而是"让用户看完立刻注册/试用"。内容深度直接反映产品价值。

### 🏗️ 六站建站法（SEO Execution System 核心框架）

| 站 | InkFlow 当前状态 | 优先级 |
|----|----------------|--------|
| **站1** 关键词采集 | 已有关键词表（Audit 发现缺少城市词 + 长尾细分词） | 需补充 |
| **站2** 站点骨架 | 已有 40+ 页面，结构良好 | ✅ |
| **站3** 内容填充 | 博客 6 篇 + 功能页 + 工具页，数量够但 EEAT 不足 | 本计划核心 |
| **站4** 站内优化 | Schema 不完整、Breadcrumb 缺失、Alt 文本空白 | 亟需做 |
| **站5** 外链建设 | **完全未做** — 最大缺口 | 本计划补 |
| **站6** 上线监测 | 未配置 GA4/GSC | 需要配 |

### 📐 Topic Cluster + EEAT = 2026 SEO 地基

> "做 3-7 个深度 Cluster（每 Cluster 30-50 篇）而不是 15-20 个浅的。原创数据/研究最值钱（2025.12 Google 更新后通用 AI 内容损失 85-95% 流量）"

InkFlow 适合建的 Cluster：
| Pillar | 已做 | 需补充 |
|--------|------|--------|
| **Booking / Scheduling** | ✅ Features 页 + 1 博客 | 加城市落地页链到 booking |
| **Digital Waivers** | ✅ Feature 页 + 1 博客 | 加对比页（vs paper waivers）|
| **Studio CRM / Client Mgmt** | ✅ Feature 页 | 加 CRM 最佳实践博客 3-5 篇 |
| **POS & Payments** | ✅ Feature 页 | 加对比页（vs Square/Booksy）|
| **Tattoo Inventory** | ✅ Feature 页 + 1 博客 | 加分类库存指南 3-5 篇 |
| **Free Tools** | ✅ 5 工具 | 加大工具策略 + 引导试用 |

---

## EEAT 框架总览

每项改进都标注了对应的 EEAT 维度：

| 维度 | 要求 | 在 InkFlow 上的体现 | 知识库引用 |
|------|------|-------------------|-----------|
| 🧠 **E**xperience | 展示第一手使用经验 | 真实工作室案例、纹身师推荐语、实际使用数据 | 站3：加入实际作品/案例/数据 |
| 🎓 **E**xpertise | 证明行业专业度 | 详细的功能指南、纹身行业知识、博客作者背景 | 站3：引用来源/行业标准/专业知识 |
| 🏆 **A**uthoritativeness | 行业认可度 | 媒体引用、反向链接、行业合作 | 站5：外链建设 |
| 🔒 **T**rustworthiness | 透明可信 | 清晰定价、隐私政策、安全认证 | 站4：联系方式可见+政策齐全 |

---

## 第一阶段：基础设施（P0 — 立刻做）

### 1.0 [NEW] EEAT 信任信号基础设施

**当前状态：** 完全缺失
**影响页面：** 全站
**EEAT：** T（基础）

#### 需要添加：

**① 作者系统（全站）**
Astro 支持内容集合，为博客文章添加作者 frontmatter：

```astro
---
// blog/[slug].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }));
}
---
```

文章 frontmatter 模板：
```yaml
---
title: "How to Reduce Tattoo No-Shows"
author:
  name: "Sarah Chen"
  title: "Studio Operations Expert"
  avatar: "/images/authors/sarah-chen.jpg"
  bio: "10-year tattoo studio manager. Helped 200+ studios digitize operations."
  url: "https://linkedin.com/in/sarahchen"
published: 2026-06-10
updated: 2026-06-14
---
```

**为什么：** Google 明确表示作者信息是评估 EEAT 的关键信号。没有作者 → Expertise 分低。

**② 引用 & 数据来源（全站）**
所有博客和功能页面添加引用脚注：

```astro
<!-- 正文中的统计引用 -->
According to <a href="https://example.com/study">2025 Tattoo Industry Report</a>,
studios using digital waivers see 40% faster check-in times.
<cite>— Tattoo Industry Benchmark Report 2025</cite>
```

**③ 评价集成（EEAT 核心）**
当前首页已显示 G2 4.8/5、Capterra 4.7/5，但需补：
- 真实评价引用（带名字+头像+日期+平台链接）
- 评价 Widget 嵌入（G2 / Capterra 官方 badge）
- Studio case study（真实工作室名 + 数据）

```astro
---
// Testimonials 组件
const reviews = [
  {
    name: "Mike R.",
    studio: "Black Anchor Tattoo, Seattle",
    text: "InkFlow cut our no-show rate from 35% to 8% in the first month.",
    rating: 5,
    platform: "G2",
    date: "2026-05-20",
  }
]
---
```

---

### 1.1 Schema JSON-LD 全站部署

**原审计 P0-3：** 仅有 SEOHead 组件里的基础 `SoftwareApplication` Schema
**EEAT：** T（结构化数据帮助 Google 理解内容 → 信任）
**影响页面：** 全站

#### 当前状态
`SEOHead.astro` 只有一行 Schema：
```json
{
  "@type": "SoftwareApplication",
  "name": "InkFlow",
  "applicationCategory": "BusinessApplication"
}
```

#### 需要改为按页面类型注入不同 Schema

**① 创建独立 Schema 组件** `src/lib/schema.ts`

| 页面类型 | Schema | 关键字段 |
|---------|--------|---------|
| 🏠 首页 | `SoftwareApplication` + `Organization` | aggregateRating, review, offers, founder |
| 💰 定价页 | `OfferCatalog` | 每个 plan 一个 Offer |
| 📝 博客 | `Article` / `BlogPosting` | author, datePublished, headline, image |
| 🏪 功能页 | `SoftwareApplication` | featureList, screenshot, applicationSubCategory |
| 📄 关于页 | `Organization` + `Person` | founder, foundingDate, sameAs (social links) |
| ⚖️ 对比页 | `Product` + `ComparisonTable` | 对比双方功能、价格、评分 |
| 📊 免费工具 | `WebApplication` | 不要求注册即可使用 |
| ❓ FAQ | `FAQPage` | 每个 Q&A 一个条目 |

**② 首页 Organization Schema 补充**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "InkFlow",
  "description": "Complete tattoo studio management platform",
  "url": "https://inkflow.com",
  "logo": "https://inkflow.com/icons/icon-512.png",
  "foundingDate": "2024",
  "founder": { "@type": "Person", "name": "..." },
  "sameAs": [
    "https://instagram.com/inkflow",
    "https://facebook.com/inkflow"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127",
    "bestRating": "5"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "sales",
    "email": "hello@inkflow.com"
  }
}
```

**③ FAQ 页必须有 `FAQPage` Schema**
当前首页 FAQ 是 `<details>` 元素，Google 不自动解析。必须加：
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Is InkFlow really free for solo artists?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. Our Free plan supports solo artists with basic booking and client management..."
    }
  }]
}
```

**在 Astro 中实现：** 建一个 `Schema.astro` 组件，接受 `type` 参数，按类型输出 JSON-LD。

---

### 1.2 Sitemap 完善

**原审计 P0-5：** 基础 sitemap 需要加强
**EEAT：** T（发现性 → 信任信号）

当前用的是 `@astrojs/sitemap`，会自动生成 sitemap。但需要：

**① 配置 sitemap 优先级**
```javascript
// astro.config.mjs
sitemap({
  filter: (page) => !page.includes('/find-artist/'),
  serialize: (item) => ({
    ...item,
    changefreq: item.url === 'https://inkflow.com/' ? 'weekly' : 'monthly',
    priority: item.url === 'https://inkflow.com/' ? 1.0 : 0.8,
  }),
})
```

**② 为动态路由添加 sitemap 条目**
`/book/[city]` 和 `/meaning/[design]` 是动态路由，Astro SSG 需要 generateStaticParams 来生成具体 URL：

```astro
---
// /book/[city].astro
export async function getStaticPaths() {
  const cities = await getCities(); // 从数据文件读取
  return cities.map(c => ({ params: { city: c.slug } }));
}
---
```

**③ robots.txt 补充**
确认 `public/robots.txt` 引用正确的 sitemap URL。

---

## 第二阶段：EEAT 内容增强（P1 — 本周做）

### 2.1 Landing Page EEAT 升级

**原审计 P0-2：** 首页需要内容强化
**EEAT：** E + A + T（首页是 EEAT 核心展示位）

#### 当前首页已有：
- ✅ Hero section
- ✅ Feature grid
- ✅ Social proof bar (G2/Capterra/GetApp)
- ✅ Pricing preview
- ✅ FAQ section
- ✅ CTA

#### 需要补充的 EEAT 元素：

**① 真实案例数据（Experience）**
在 Feature grid 和 CTA 之间插入 "Real Results" section：
```astro
<section class="py-20">
  <h2>Real Studios, Real Results</h2>
  <div class="grid">
    <!-- Case study card 1 -->
    <div class="card">
      <img src="/images/case-studies/iron-will.jpg" alt="Iron Will Tattoo studio" />
      <blockquote>"InkFlow cut our admin time by 15 hours per week."</blockquote>
      <cite>— Jake Martinez, Owner @ Iron Will Tattoo, Austin TX</cite>
      <div class="stats">
        <span>↓ 80% no-shows</span>
        <span>↑ 40% repeat bookings</span>
      </div>
    </div>
    <!-- Case study card 2-3 -->
  </div>
</section>
```

**② Trust badges 加强（Trustworthiness）**
```
[256-bit SSL] [GDPR Compliant] [Stripe Partner] [PWA Ready] [HIPAA-compliant Waivers]
```

**③ Media/Press mentions（Authoritativeness）**
如果有任何媒体提到过 InkFlow：
```
"As featured in" — [Tattoo Industry Magazine] [Tattoodo] [ModTattoo]
```

**④ Numbers that count**
```
500+ Studios  |  50,000+ Appointments  |  98% Uptime  |  ⭐ 4.8/5 G2
```

---

### 2.2 关于页面 → EEAT 核心阵地

**当前状态：** `/about.astro` 已存在，但内容不详
**EEAT：** E + A + T（关于页面是证明创始团队专业度的最关键页面）

#### 必须包含的内容：

**① 创始团队背景（Expertise）**
```astro
---
const founders = [
  {
    name: "...",
    role: "CEO & Co-Founder",
    experience: "12 years tattoo industry",
    before: "Former studio owner",
    headshot: "/images/team/ceo.jpg",
    linkedin: "...",
  }
]
---
```

**为什么：** 纹身行业 SaaS 的创始人必须有行业经验才能证明 EEAT。如果创始人做过纹身师/开过工作室，一定要写出来。

**② 公司 timeline（Trustworthiness）**
```
2024 — InkFlow founded by [founder], former tattoo studio owner
      — Beta launch with 10 studios
2025 — 200 studios onboarded
      — Stripe integration launched
2026 — 500+ studios, 50k appointments/month
      — New AI aftercare automation
```

**③ Mission + Values 关联纹身行业**
```
"Our mission: free tattoo artists from admin so they can focus on art."
```
避免通用的 SaaS 套话，要用纹身行业的语言。

**④ Team page（如果有团队）**
照片 + 名字 + 角色 + 背景，尤其是背景跟 tattoo 行业相关的成员。

---

### 2.3 博客系统 EEAT 化

**原审计 P1-4：** 已存在博客，但无 EEAT 信号
**EEAT：** E + A（博客是展示专业度的核心方式）

#### 当前已有 6 篇博客文章：
- how-to-digitize-tattoo-waivers
- tattoo-aftercare-automation
- tattoo-inventory-guide
- multi-artist-commission-tracking
- reduce-no-shows-deposit-booking
- blog/index.astro

#### 需要补充：

**① 每篇文章添加作者信息**
```astro
---
// 在博客 layout 中
const { author } = Astro.props;
---
<div class="author-box">
  <img src={author.avatar} alt={author.name} class="rounded-full w-12 h-12" />
  <div>
    <p class="font-semibold">{author.name}</p>
    <p class="text-sm text-gray-400">{author.title}</p>
    <p class="text-xs text-gray-500">{author.bio}</p>
  </div>
</div>
```

**② 首段展示文章创作依据（Experience）**
每篇文章首段应包含"为什么作者有资格写这个":
> "Having managed tattoo inventory for 8 years across 3 studios, I've seen every supply chain pitfall..."

**③ 引用外部权威来源**
每篇文章至少 2-3 个外部引用（行业报告、统计、研究），增强 Expertise。

**④ 博客首页增加分类 + 标签**
```
Categories: Operations | Marketing | Technology | Business
Tags: #booking #waivers #inventory #aftercare
```

**⑤ 文章末尾的 CTA 加 EEAT 信号**
```astro
<div class="cta-box">
  <h3>Try It Free — No Credit Card Required</h2>
  <p>Join 500+ studios already using InkFlow to automate their operations.</p>
  <a href="/register">Start Free Trial</a>
  <p class="text-xs">Free plan available. 30-day Pro trial.</p>
</div>
```
不要只放 CTA，加一个 social proof 标签："Join 500+ studios"

---

### 2.4 免费工具 → Product-Led SEO + EEAT

**原审计 P2-7：** 免费工具是 Product-Led SEO 的核心
**EEAT：** E（免费工具展示产品经验）

#### 当前已有 5 个免费工具：
- Tattoo Price Calculator
- Aftercare Email Generator
- Tattoo Meaning Finder
- Free Waiver Generator
- No-Show Calculator

#### 需要补充：

**① 每个工具页面加用法说明（Experience）**
例：Tattoo Price Calculator
```astro
<h2>How to Price Tattoos: A Guide for Artists</h2>
<p>Based on 500+ studio pricing data, here's the formula...</p>
<div class="steps">
  <div>Step 1: Calculate hourly rate</div>
  <div>Step 2: Estimate session hours</div>
  <div>Step 3: Add supply costs</div>
</div>
```

**② 工具结果页导出/分享功能**
- 支持分享到社交媒体（增加曝光 → 反向链接）
- 结果页可打印
- 工具使用后的 CTA 链到产品功能页

**③ 工具使用数据做内容营销**
从 No-Show Calculator 收集匿名数据 → "InkFlow No-Show Report 2026" → 行业报告 → PR + 反向链接

**④ 每个工具页加 Schema `WebApplication`**
```json
{
  "@type": "WebApplication",
  "name": "Tattoo Price Calculator",
  "applicationCategory": "BusinessApplication",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
```

---

### 2.5 对比页 → 竞品 EEAT 策略

**原审计 P2-4：** 对比页已存在：booksy, vagaro, tattoogenda, tattoo-studio-pro
**EEAT：** A + T（对比页展示行业理解深度）

#### 需要补充：

**① 对比方式要中立客观（Trustworthiness）**
Google 惩罚"hate pages"（只说竞品坏话）。改为 feature comparison 格式：

```
| Feature | InkFlow | Booksy | Vagaro |
|---------|---------|--------|--------|
| Tattoo-specific CRM | ✅ Built for | ⚠️ Generic | ⚠️ Generic |
| Digital Waivers | ✅ Included | ❌ $20/mo addon | ❌ $15/mo addon |
| Commission Splitting | ✅ Auto | ❌ Manual | ✅ Basic |
```

**② 每个对比页加 `ComparisonTable` Schema**

**③ 在对比页底部加 "Can't decide?" section**
引导用户试用 InkFlow 的免费方案作为决策方式，而不是贬低竞品。

**④ 对比页标题策略**
```
InkFlow vs Booksy for Tattoo Artists (2026): Full Comparison
```
不要用 "Booksy Alternative" — 这样可能被 Google 视为 competitive targeting 过度。改为 feature-first 标题。

---

## 第三阶段：技术 SEO 强化（P1-P2 — 本周到下周）

### 3.1 Core Web Vitals 优化

**原审计 P2-5：** 当前是 Astro SSG + Tailwind，性能基础好

**① 字体优化**
当前首页加载 Google Fonts（Manrope + Noto Sans SC）：
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```
✅ 已有 preconnect。但需确认：
- 是否 `font-display: swap`？Google Fonts 默认已带
- 是否只加载需要的 weight (400,500,600,700,800 vs 只加载 600,700)？

**② Cumulative Layout Shift (CLS) 检查**
首页是否有未设置 width/height 的图片？
- Hero section 无图片 → CLS 低风险 ✅
- Author avatars 需要设置尺寸
- OG images 需要尺寸

**③ 图片优化（Astro 自带）**
使用 Astro's Image component `<Image />` 或 `<Picture />` 自动生成 webp + 尺寸：

```astro
---
import { Image } from 'astro:assets';
---
<Image src={author.avatar} alt={author.name} width={48} height={48} format="webp" />
```

### 3.2 Hreflang 配置

**原审计 P2-1：** SPA 版支持 7 种语言，Astro 版暂未配置

**当前 Astro 站点：** 只有英文
**建议：**
- 如果有多语言页面 → 加 `<link rel="alternate" hreflang="en" ... />`
- 如果只有英文 → 不需要 hreflang，但需确认没有 copied content

### 3.3 图片 Alt 文本统一策略

**原审计 P2-3：** 所有图片需要有意义 alt

创建 alt 生成规范：
```
Logo → "InkFlow tattoo studio management software logo"
Feature screenshot → "InkFlow booking calendar showing available time slots for tattoo appointments"
Headshot → "Sarah Chen, InkFlow studio operations expert with 10 years experience"
```

### 3.4 内部链接策略

**当前问题：** 页面之间缺乏主题聚类链接。

**需要建立 Topic Cluster 结构：**

```
Booking Pillar Page (/features/booking)
  ├── Smart Booking Features
  ├── Deposit Management
  ├── SMS Reminders
  └── Blog: How to Reduce No-Shows
      └── Blog: Deposit Best Practices

CRM Pillar Page (/features/crm)
  ├── Client History
  ├── Auto Follow-ups
  ├── Referrals
  └── Blog: Client Retention Strategies

Waivers Pillar Page (/features/waivers)
  └── Blog: How to Digitize Tattoo Waivers
  └── Free Tool: Free Waiver Generator
```

每个功能页底部加 "Related Articles" 和 "Related Tools" 区块。

### 3.5 Breadcrumb + JSON-LD 导航

**原审计 P1-9 + P0-6：** 缺面包屑导航

在 Astro 中创建面包屑组件：
```astro
---
interface BreadcrumbItem { label: string; href?: string }
const { items }: { items: BreadcrumbItem[] } = Astro.props;
const schema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": item.label,
    "item": item.href ? `https://inkflow.com${item.href}` : undefined,
  }))
};
---
<nav aria-label="Breadcrumb">
  <!-- breadcrumb UI -->
</nav>
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

---

## 知识库注入：站内优化自查清单（站4）

来源：`F:/SEO_Project/framework/seo-execution-system.md`

每页上线前对照检查：

```
□ Title:     含核心词 | <60字符 | 每个页唯一
□ Meta Desc: 含核心词+CTA | <160字符 | 每页唯一
□ H1:        含核心词 | 唯一 | 跟 Title 不同
□ H2-H3:     自然分布语义相关词
□ URL:       /keyword-slug | 短 | 无乱码
□ 图片 alt:  有 | 描述性 | 适当含词
□ 内链:      ≥2 条 | 锚文本自然 | 链向相关页
□ Schema:    按页面类型配
□ CTA:       每页至少 1 个（注册试用/预约演示）
```

---

## 知识库注入：InkFlow 关键词扩展方向（站1）

来源：`F:/SEO_Project/framework/seo-execution-system.md` — 站1 关键词采集

当前审计报告的页面清单仅列了路由名。按知识库方法，补充 InkFlow 应做的关键词分类：

### 信息型（→ 博客内容）
| 关键词 | 对应文章 |
|--------|---------|
| how to digitize tattoo waivers | ✅ 已有 |
| how to reduce tattoo no-shows | ✅ 已有 |
| best tattoo booking software 2026 | ❌ 需创建 |
| tattoo shop management software guide | ❌ 需创建 |
| how to manage tattoo appointments | ❌ 需创建 |
| tattoo studio software free vs paid | ❌ 需创建 |
| how to accept deposits for tattoos | ❌ 需创建 |
| tattoo aftercare automation | ✅ 已有 |
| tattoo inventory management tips | ✅ 已有 |

### 交易型（→ 功能/定价页，已匹配大部分）
| 关键词 | 页面 |
|--------|------|
| tattoo booking software | /features/booking |
| tattoo studio POS | /features/pos |
| digital waiver for tattoo shops | /features/waivers |
| tattoo client management software | /features/crm |
| tattoo inventory tracker | /features/inventory |

### 商业考察型（→ 对比页）
| 关键词 | 页面 |
|--------|------|
| InkFlow vs Booksy | ✅ /compare/booksy |
| Vagaro vs InkFlow | ✅ /compare/vagaro |
| tattoo studio software alternatives | ✅ /alternatives/ |
| best free tattoo booking app | ✅ /alternatives/ |
| InkFlow pricing vs competitors | ❌ 可加 |

### 本地型（→ 城市落地页）
| 关键词 | 页面 |
|--------|------|
| tattoo shops in [city] | ✅ /book/[city] |
| find tattoo artist [city] | ✅ /find-artist |
| best tattoo studio [city] | ❌ /best-tattoo/[city] |

---

## 知识库注入：内容生产节奏（站3）

来源：`F:/SEO_Project/framework/seo-execution-system.md`

### 当前节奏：Astro marketing 站已有 40+ 页面，基础够，缺深度

按知识库建议，后续 InkFlow 内容产量：
```
Month 1（当前）：
  6 篇 EEAT 博客（补作者信息 + 外部引用）
  5 个免费工具页完善（加用法说明 + Schema）
  3 个对比页升级（加 ComparisonTable Schema）
  →
  小计：14 页

Month 2：
  博客每周 1-2 篇（按 Topic Cluster）
  免费工具数据更新
  城市落地页补齐 5-10 页
  →
  小计：15-20 页
```

### 每周内容日历
```
周一：博客发布（同步社媒摘要）
周二：免费工具数据更新
周三：对比页/功能页升级
周四：内部链接整理 + Schema 检查
周五：EEAT 自检 + 下周排期
```

---

---

## 知识库注入：B2B SaaS 渠道混合策略

来源：`F:/SEO_Project/framework/b2b-saas-skill.md`

InkFlow 是典型的 B2B SaaS，不能只靠 SEO。B2B 核心逻辑链：

```
痛点（纹身师的管理难题）
  → 方案（InkFlow 产品）
  → 信任（Case Study + 数据 + 评价）
  → 转化（免费试用 / Demo）
  → 扩展（推荐 + 增购）
```

### 渠道混合矩阵

| 渠道 | 在 InkFlow 上的角色 | 当前状态 |
|------|--------------------|---------|
| 🔍 SEO | 认知/教育：纹身师搜"tattoo booking software"找来 | 本计划强化 |
| 📧 Cold Email | 直接触达：针对纹身工作室发冷邮件 | ⚠️ 未开始（知识库已有 cold email skill） |
| 📱 LinkedIn | B2B 信任：行业 KOL 背书 + content distribution | ⚠️ 未开始 |
| 📝 Content | 深度教育：博客/指南/工具 → 自然流量 | ✅ 已启动 |
| 🤝 Outreach | 合作：纹身行业媒体 + Influencer 合作 | ❌ 完全未做 |

**关键 insight：** SEO 是长线，Cold Email + Outreach 是中线。不要等 SEO 出结果才动其他渠道。

---

## 第四阶段：EEAT 持续构建（P2 — 每月迭代）

### 4.1 外部链接建设策略

**原审计 P1-4** 的延伸：不仅要有内容，还要有链接

**EEAT 链接策略（按优先级）：**
| 类型 | 策略 | EEAT 收益 |
|------|------|-----------|
| 🏆 纹身行业媒体 | 投稿 guest post + case study | A + E |
| 🏆 Tattoo 论坛/社区 | 在 r/tattoo、r/tattooartists 分享免费工具 | A + T |
| ⭐ 工具页被引用 | 免费工具（Price Calculator, Waiver Generator）自然获链接 | A |
| 📊 行业数据报告 | 从工具数据汇总 "Tattoo Industry No-Show Report 2026" | E + A |
| 🎓 教育类站点 | 投稿 "How to start a tattoo studio" 到教育博客 | E + A |

### 4.2 Google Business Profile + Local SEO

InkFlow 也是一个工具 SaaS，但它的用户是**本地纹身工作室**。

策略：
- 为 InkFlow（作为公司）创建 Google Business Profile
- 内容策略针对 "tattoo studio software" + "tattoo booking app" + city-based 长尾词
- `/book/[city]` 页面是 local SEO 入口
- `/find-artist` 页面优化 local keywords

### 4.3 内容更新频率

Google 关注内容新鲜度。需要建立更新日历：

| 频率 | 内容 |
|------|------|
| 每周 | 博客文章 1 篇（至少） |
| 每月 | 免费工具数据更新 |
| 每季 | 对比页更新（竞品功能变化） |
| 每半年 | 定价页更新 |
| 年度 | 首页数据更新（"500+ studios" → 更新数字） |

### 4.4 用户生成内容（UGC）→ EEAT 加速器

**EEAT 最高权重信号之一：真实用户反馈**

- Studio case study 页面（邀请客户写，提供模板）
- Testimonial 视频嵌入
- 评价平台主动管理（G2、Capterra 回复评价）
- 在功能页嵌入 G2 review widget 动态显示

---

## 执行优先级汇总

### 🔴 立即（本周）
| # | 任务 | 文件 | EEAT | KB来源 |
|---|------|------|------|--------|
| 1 | SEOHead 注入完整 Organization Schema | `SEOHead.astro` | T | 站4 |
| 2 | FAQ 页加 `FAQPage` Schema | `index.astro` + `Schema.astro` | T | 站4 |
| 3 | 首页加 "Real Results" case study section | `index.astro` | E | 站3 |
| 4 | 所有图片设置 width/height + alt | 全站 | T | 站4自查清单 |
| 5 | 创建 Breadcrumb 组件 + 部署 | `Breadcrumb.astro` | T | 站4 |
| 6 | 博客文章添加作者信息 + bio | `blog/*.astro` + layout | E+A | 站3 EEAT |
| 7 | 每页过站4自查清单 | 全站 | E+A+T | seo-execution-system |

### 🟡 本周
| # | 任务 | 文件 | EEAT | KB来源 |
|---|------|------|------|--------|
| 8 | 关于页面补创始团队 + timeline | `about.astro` | E+A+T | 站3 |
| 9 | 免费工具加用法说明 + Schema | `free-tools/*.astro` | E | 站3 + Product-Led SEO |
| 10 | 对比页加 ComparisonTable Schema | `compare/*.astro` | A+T | 站4 |
| 11 | 首页数据增强（trust badges, media mentions） | `index.astro` | A+T | EEAT框架 |
| 12 | Topic Cluster 内部链接实施 | 全站 feature pages | E | topic_cluster_2026 |
| 13 | 每个页面注入对应的 Schema 类型 | 全站 | T | 站4 |
| 14 | GA4 + GSC 配置 | `BaseLayout.astro` | T | 监测基建 |

### 🔵 下周
| # | 任务 | 文件 | EEAT | KB来源 |
|---|------|------|------|--------|
| 15 | 创建 Industry Report（从工具数据） | 新页面 | E+A | 站3 + Product-Led SEO |
| 16 | 填补关键词表缺口（城市词 + 长尾词） | keywords CSV | -- | 站1 |
| 17 | OG 图片自动生成 | `SEOHead.astro` | T | 站4 |
| 18 | 评价 widget 实时嵌入 | `index.astro` | A+T | EEAT框架 |
| 19 | Content calendar 建立 + 按站3节奏产出 | 博客 | E+A | 站3 内容节奏 |
| 20 | Performance 审计 + CWV 优化 | 全站 | T | 站4 |

### ⚪ 本月
| # | 任务 | 文件 | EEAT | KB来源 |
|---|------|------|------|--------|
| 21 | External link building 启动（GBP + 行业目录 + guest post） | 营销策略 | A | 站5 |
| 22 | Google Business Profile 创建 | 外部 | A+T | 站5 |
| 23 | UGC case study 征集（客户评价 + 推荐语） | 新页面 | E+A | EEAT框架 |
| 24 | Cold Email 序列启动（针对纹身工作室） | 营销 | -- | B2B SaaS Skill |
| 25 | 补 5-8 篇高优先级博客（按关键词表） | `blog/*.astro` | E+A | 站1→站3 |

---

## 附录 A：Google SEO 2026 关键规则检查

| 规则 | InkFlow 当前状态 | KB参考 |
|------|----------------|--------|
| ✅ Helpful Content System | Astro SSG 内容优先，基础好 | -- |
| ✅ Mobile-first indexing | Tailwind responsive ✅ | -- |
| ✅ Core Web Vitals | 需要审计 CWV 实际数据 | -- |
| ✅ Semantic HTML | h1-h6 层次需要检查 | 站4自查 |
| ✅ Schema.org structured data | 需要全站覆盖 **← 本计划核心** | 站4 |
| ✅ Page experience | 需要实际 Lighthouse 测试 | -- |
| ✅ E-E-A-T | **本计划核心目标** | EEAT框架 |
| ❌ Last Click 思维 | 部分页面的CTA不够清晰 | Core原则 |
| ❌ Topic Cluster | 页面间缺乏主题聚类内链 | topic_cluster_2026 |
| ❌ Content refresh | 内容发布后无更新机制 | 站6 |
| ❌ External links | 完全空白 **← 最大缺口** | 站5 |

**核心差异：** 原审计针对 SPA 版本（需 react-helmet、SSR 等）。Astro SSG 天生解决了大部分 SPA SEO 问题。**本计划专注于：** EEAT + Schema + Topic Cluster + 外链建设四个知识库指出的关键差距，同时融入 Last Click 原则确保内容质量。

---

## 附录 B：知识库引用索引

| 知识库文件 | 在本计划中的使用 |
|-----------|----------------|
| `seo-execution-system.md`（六站建站） | 内容节奏、优化清单、关键词方法、EEAT每站自检 |
| `b2b-saas-skill.md` | 渠道混合策略、ICP定义 |
| `content-marketing-playbook.md` | 博客模板、内容日历、社媒分发 |
| `topic_cluster_pillar_2026.md` | Topic Cluster 策略、内链架构 |
| `quality-audit-framework.md` | 页面质量检查维度 |

> 由 Claude 根据 SEO 知识库 + EEAT 框架 + Google 搜索质量评估指南生成
> 日期：2026-06-14
> 知识库：F:/SEO_Project/framework/ + F:/SEO_Project/docs/knowledge_base/

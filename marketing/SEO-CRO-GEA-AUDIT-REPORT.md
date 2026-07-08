
# InkFlow Manager — 全面 SEO / CRO / GEO 审计审查报告

> 审查日期: 2026-06-06
> 审查范围: 全部页面 + 公共组件 + 静态资源
> 参考来源: seo-knowledge-base/ 技术 SEO 规范 + 内容策略 + AEO + 排名因子 + Google 算法
> 项目类型: React SPA (PWA) 纯客户端渲染，无 SSR/SSG

---

## 执行摘要

InkFlow 是一个面向纹纹身艺术家工作室管理的 SaaS PWA 应用。核心问题：**这是一个 100% 客户端渲染的 SPA，完全没有面向搜索引擎的 landing/marketing 页面**。项目目前的架构定位是"内部工具"而非"可搜索的营销网站"。

- **P0 严重问题: 7 项** — 阻止任何 SEO 索引
- **P1 重要问题: 9 项** — 显著影响转化和排名
- **P2 优化建议: 8 项** — 长期竞争力提升

---

## P0 — 严重（必须立即修复）

### P0-1: index.html 缺少 meta title、meta description、Open Graph、Twitter Card

**问题描述:**
`index.html` 的 `<title>` 仅为 `"InkFlow"`，无任何 meta description。所有页面共享同一个 title，搜索引擎无法区分页面内容。

当前代码 (`index.html` 第 14 行):
```html
<title>InkFlow</title>
```
无任何 `<meta name="description">`、无 `<meta property="og:">`、无 `<meta name="twitter:">`。

**SEO 知识库来源:**
- [技术 SEO] Canonical URL: 每页必须有
- [技术 SEO] Sitemap / robots.txt 要求可索引页面
- [内容策略] Pillar Content 需要明确的页面标题

**建议修改:**
1. 安装 react-helmet-async 或使用 React Router的 `useEffect` 动态更新 document.title 和 meta
2. 为每个路由设置唯一 title + description:
   - `/register`: "InkFlow — Free Tattoo Studio Management Software" + description
   - `/pricing`: "InkFlow Pricing — Free to Pro Tattoo Studio Software"
   - `/book/:id`: "[Artist Name] — Book Tattoo Appointment"
3. 添加 OG 标签到 index.html 的 `<head>` 中（全局）:
```html
<meta property="og:title" content="InkFlow — Tattoo Studio Management Software" />
<meta property="og:description" content="Free tattoo studio management. Booking, portfolio, POS, payments, client CRM." />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

---

### P0-2: 没有 SEO Landing / Marketing 页面（首页完全不可搜索）

**问题描述:**
项目的 `/` 路由直接跳转到 `/register`（已登录用户）或 `/today`。没有营销 landing page。`App.tsx` 第 153-154 行:
```tsx
if (location.pathname === '/') {
  navigate(stored ? '/today' : '/register', { replace: true });
}
```
这意味着搜索引擎爬虫访问首页只会看到一个空壳或 redirect，没有任何内容可索引。

对于 SaaS 产品，这是致命问题。没有 landing page = 零 organic search traffic。

**SEO 知识库来源:**
- [内容策略] 内容类型金字塔: Pillar Content = 首页、功能页、定价页
- [技术 SEO] 首页必须有 Organization, WebSite, BreadcrumbList Schema
- [GEO] AEO 内容: 用户搜索 "best tattoo booking software 2026" 需要有人被引用

**建议修改:**
1. 创建 marketing landing page (`src/pages/LandingPage.tsx`)，作为 `/` 的默认展示
2. 结构遵循 CRO 3 秒原则:
   - 客户导向 headline: "Tattoo Studio Management, Simplified"
   - 单一 subhead
   - 3 benefit pillars (Booking, Portfolio, POS)
   - ONE primary CTA ("Get Started Free")
   - 信任信号条 (logo bar: "Trusted by 500+ studios")
3. 将注册/登录入口作为 secondary CTA 放在 nav bar
4. 创建独立的 FeaturesPage、AboutPage、ContactPage
5. 只有已登录用户访问 `/today` 才跳到 dashboard

---

### P0-3: 无 Schema JSON-LD 结构化数据

**问题描述:**
项目中完全没有 JSON-LD Schema 标记。搜索 `@type`、`JSON-LD`、`jsonld` 未发现任何相关代码。

**SEO 知识库来源:**
- [技术 SEO] Schema 标记清单: 首页必须 Organization + WebSite + BreadcrumbList
- [技术 SEO] 定价页必须有 Offer Schema
- [技术 SEO] 功能页必须有 SoftwareApplication Schema
- [技术 SEO] FAQ 页必须有 FAQPage Schema

**建议修改:**
创建 `src/lib/schema.ts` 工具函数，为各页面注入:
```tsx
// Landing Page
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "InkFlow",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Tattoo studio management software",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "127" }
}

// Pricing Page
{
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  "name": "InkFlow Pricing Plans",
  "offers": [ /* 每个 plan 一个 Offer */ ]
}
```

---

### P0-4: 无 robots.txt 文件

**问题描述:**
项目中无 `robots.txt` 文件。虽然 Cloudflare Pages（`_headers` 存在）默认不屏蔽爬虫，但没有明确指示 sitemap 位置。

**SEO 知识库来源:**
- [技术 SEO] robots.txt: 允许爬取所有公开页面，阻止 admin/draft

**建议修改:**
创建 `public/robots.txt`:
```
User-agent: *
Allow: /
Allow: /book/
Allow: /embed/
Allow: /r/
Allow: /intake/
Allow: /pay/
Allow: /bio/
Allow: /portal/
Disallow: /register
Disallow: /today
Disallow: /clients
Disallow: /me
Disallow: /appointment/
Disallow: /session/
Disallow: /inventory
Disallow: /leads
Disallow: /settings
Sitemap: https://inkflow.com/sitemap.xml
```

---

### P0-5: 无 sitemap.xml

**问题描述:**
项目无 sitemap。SPA 无法静态生成 sitemap。

**SEO 知识库来源:**
- [技术 SEO] Sitemap: 动态生成，包含所有可索引页面

**建议修改:**
1. 在 server `index.mjs` 中添加 `/sitemap.xml` 端点，动态生成
2. 包含所有公开路由: `/book/:id`, `/embed/:id`, `/r/:slug`, `/intake/:id`, `/pay/:id`, `/bio/:id`, `/portal/:id`, `/confirm/:id/:bookingId`
3. 对于 landing page 创建后，也要包含在内

---

### P0-6: 无 Canonical URL

**问题描述:**
`index.html` 无 `<link rel="canonical">`。SPA 所有路由共享同一 HTML，搜索引擎可能视为重复内容。

**建议修改:**
每个页面通过 JS 动态设置:
```tsx
<link rel="canonical" href={window.location.href} />
```

---

### P0-7: public 目录缺少 favicon.ico 和 SEO 图标

**问题描述:**
`public/icons/` 下只有 icon-192.png 和 icon-512.png。缺少:
- `favicon.ico` (浏览器标签页)
- `apple-touch-icon` 的正确尺寸 (180x180)
- `site.webmanifest` 的正确配置

manifest.json 中 `short_name` 仅 7 字符，iOS 可能截断。`description` 仅 "Tattoo Studio Management" 太简短，无关键词。

**SEO 知识库来源:**
- [技术 SEO] 图片优化 + favicon 完整性

**建议修改:**
1. 添加 `public/favicon.ico`
2. 完善 manifest.json:
```json
{
  "name": "InkFlow — Tattoo Studio Management Software",
  "short_name": "InkFlow",
  "description": "Free tattoo studio management with online booking, portfolio, POS, payments, and client CRM for tattoo artists."
}
```
3. 添加 `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` 到 index.html

---

## P1 — 重要（显著影响转化和排名）

### P1-1: 无导航栏（Navigation）和 Footer

**问题描述:**
项目完全没有全局导航栏 (navbar) 和 footer。`TabBar` (`src/components/TabBar.tsx`) 只是 app 内部的底部 Tab 栏（Today/Clients/Me），不包含任何 marketing 链接。

这意味着:
- 用户无法从 app 内部跳转到 Pricing、About、Contact 页面
- 没有 SEO 内部链接结构
- 无法引导外部流量到关键转化页面

**建议修改:**
1. 创建 `src/components/Navbar.tsx`（桌面/移动端响应式）
2. 在 LandingPage 中展示完整导航: Features, Pricing, About, Contact, CTA
3. 在已登录状态的 App 中保留 TabBar 但增加 "Home" 或 "Website" 返回 marketing 页面的入口
4. 创建 `src/components/Footer.tsx`，包含: About 链接, Privacy Policy, Terms, Contact, Social Links

---

### P1-2: Pricing Page 缺少 SEO 转化要素

**问题描述:**
`src/pages/PricingPage.tsx` 是一个 app 内部的定价比较页面（移动端风格），缺少:
1. 无 meta title/description（SPA 无 SSR）
2. 无 Schema Offer 标记
3. 无社会证明（客户评价、评分）
4. 无 FAQ section 消除疑虑
5. 无对比表格之外的内容（如 "Why choose InkFlow" 信任段落）
6. 4 个 plan 的命名混乱: Free / Solo / Pro / Pro+ 但 Solo 和 Pro 同价 ($9.90/$29.90)
7. "Coming soon" 锁定了 2/4 个 plan，CRO 最差实践
8. 无对比竞品表格

**SEO 知识库来源:**
- [技术 SEO] 定价页必须有 Offer Schema + BreadcrumbList
- [内容策略] 对比页/替代页是高优先级内容类型
- [CRO] 定价页必须有社会证明 + FAQ

**建议修改:**
1. 添加 OG 和 meta tags
2. 添加 JSON-LD OfferSchema 标记每个 plan
3. 在底部添加 FAQ section（Schema: FAQPage）
4. 添加客户评价/评分区域
5. 创建 "InkFlow vs Booksy" 对比页
6. 对 locked plans 显示 "Notify me" 而非直接锁定

---

### P1-3: ClientBookingPage / Public 页面无 SEO 优化

**问题描述:**
`ClientBookingPage` (`/book/:artistId`) 和 `EmbedBookingPage` (`/embed/:artistId`) 是重要的公开页面（客户预约用），但:
1. 无 meta title/description 针对每个艺术家
2. 无 Open Graph 数据（分享链接时预览空白）
3. 无 Artist 信息的结构化数据
4. 无 LocalBusiness / Person Schema
5. 预约表单页面没有 "Back to artist profile" 等 breadcrumb

**SEO 知识库来源:**
- [技术 SEO] 每页必须有 canonical + meta description
- [GEO] Artist 页面是 local SEO 入口

**建议修改:**
1. 为 `/book/:artistId` 动态设置 title: "[Artist Name] — Book Tattoo Appointment | InkFlow"
2. 注入 Organization Schema + LocalBusiness（如有地址）
3. 添加 OG 数据: og:title = artist name, og:image = artist avatar

---

### P1-4: 无 Blog / Content 页面

**问题描述:**
根据 SEO 知识库的"内容类型金字塔"，SaaS 必须有:
- Pillar Content（首页、功能页、定价页）
- Cluster Content（深度文章、指南）
- Support Content（FAQ、对比、博客）

项目完全没有 Blog 或 Content 页面，意味着:
- 零 blog traffic
- 无内容到产品的转化漏斗
- 无法获取反向链接（无内容可被引用）

**SEO 知识库来源:**
- [内容策略] 内容类型金字塔
- [排名因子] 反向链接: 通过免费工具、模板、行业报告获取自然链接
- [AEO] FAQ + 对比页 + 行业数据报告是高优先级

**建议修改:**
1. 创建 `/blog` 索引页面
2. 创建 3-5 篇 pillar articles:
   - "How to Manage Your Tattoo Studio in 2026"
   - "Tattoo Booking Software: Complete Guide for Artists"
   - "How to Reduce Tattoo No-Shows by 40%"
3. 每篇文章至少 3-5 个内链到产品页面
4. 创建 FAQ 页面（配合 FAQPage Schema）

---

### P1-5: 无隐私政策/条款页面

**问题描述:**
项目有 `_headers` 设置了安全策略，但无 Privacy Policy、Terms of Service、Cookie Policy 页面。

这对 SaaS 是合规问题，也影响:
- Google Trust 信号
- App Store / PWA install 审核
- Stripe/PayPal 商家账户合规

**建议修改:**
1. 创建 `src/pages/PrivacyPolicy.tsx` 和 `src/pages/TermsOfService.tsx`
2. 在 Footer 中添加链接
3. 注册页面必须有勾选同意条款的 checkbox
4. 添加 Privacy/ToS 页面链接到 LeadConfirmationPage 和 ClientBookingPage 表单

---

### P1-6: Bio Page 无 SEO 增强

**问题描述:**
`ArtistProfilePage` 生成 `/bio/:artistId` 和 `/slug` 形式的 bio page，但没有:
1. 无独立的 bio page 组件（只有配置页面）
2. 无 Server-Side Generated bio page（纯 SPA，爬虫看到的 bio 内容是空的）
3. 无 JSON-LD Person Schema
4. 无 `<meta name="robots" content="index,follow">`

**SEO 知识库来源:**
- [技术 SEO] SPA 需 SSR/SSG 使 SEO 关键页面可索引
- [GEO] Artist bio page 是 local SEO 核心

**建议修改:**
1. 创建 `src/pages/BioPage.tsx` 作为独立的公开 bio 页面
2. 使用 React Router 的 route 匹配 `/bio/:artistId` 和 `/:slug`
3. 在 bio page 中注入 Schema:
   - Person Schema for artist
   - SocialProfile
   - LocalBusiness (如果有地址)
4. 考虑未来迁移到 SSR 框架或使用 prerender 方案

---

### P1-7: i18n 文案中嵌入的关键词缺乏 SEO 优化

**问题描述:**
`src/lib/i18n.ts` 中有大量文案，但部分 key-value 可以嵌入更多 SEO 关键词:

正面发现: `Verification.tsx` 中的 `TATTOO_KEYWORDS` 数组已经包含了多语言 tattoo 关键词（中/日/韩/西/葡），但:
1. 这些关键词仅用于 Verification 评分，未用于 SEO 页面内容
2. 文案中 "Tattoo Studio Management" 出现频率低
3. i18n 中大量英文硬编码（非 i18n key），如 `src/pages/PricingPage.tsx` 中硬编码 "Free", "Solo", "Pro", "Pro+" 等

**建议修改:**
1. 将 `TATTOO_KEYWORDS` 列表提取为 `src/lib/seo-keywords.ts` 供全站使用
2. Landing page 文案中自然嵌入关键词: "tattoo booking software", "tattoo studio management", "tattoo client CRM"
3. 为多语言版本创建 hreflang 配置（已有 7 种语言支持）
4. Pricing page 硬编码文案迁移到 i18n 文件

---

### P1-8: 无 Google Search Console / Analytics 集成

**问题描述:**
项目中没有:
- Google Analytics / GA4 代码
- Google Search Console 验证 meta tag
- Google Tag Manager
- Bing Webmaster Tools

**SEO 知识库来源:**
- [技术 SEO] 可抓取性和搜索监控是基础

**建议修改:**
1. 在 index.html `<head>` 添加 Google Tag Manager 或 GA4
2. 添加 GSC 验证: `<meta name="google-site-verification" content="..." />`
3. 考虑添加 Bing 验证
4. 设置 Search Console Sitemap 提交

---

### P1-9: 无 Breadcrumb 导航

**问题描述:**
所有页面无 breadcrumb 导航。用户无法看到自己在网站中的位置。

**SEO 知识库来源:**
- [技术 SEO] 每页必须有 BreadcrumbList Schema
- [内容策略] 面包屑导航: Home > Features > Booking Software

**建议修改:**
1. 创建 `src/components/Breadcrumb.tsx`
2. 为每个页面注入 BreadcrumbList JSON-LD

---

## P2 — 优化建议（长期竞争力提升）

### P2-1: Hreflang 配置

**当前状态:** 7 种语言支持 (en/es/pt/fr/de/th/jp)，但无 hreflang 实现。

**建议修改:**
```html
<link rel="alternate" hreflang="en" href="https://inkflow.com/" />
<link rel="alternate" hreflang="es" href="https://inkflow.com/es/" />
<link rel="alternate" hreflang="x-default" href="https://inkflow.com/" />
```

### P2-2: Open Graph / Social Sharing 优化

**当前状态:** 无 OG 标签。

**建议修改:**
为每个公开页面设置:
```html
<meta property="og:title" content="Artist Name | Tattoo Studio" />
<meta property="og:description" content="Book appointments, view portfolio..." />
<meta property="og:image" content="https://inkflow.com/og/{slug}.png" />
<meta property="og:url" content="https://inkflow.com/bio/{slug}" />
```

### P2-3: 图片 alt 文本优化

**当前状态:** `Portfolio.tsx` 第 300 行: `<img alt="">` — 所有图片 alt 为空。

**建议修改:**
```tsx
alt={`${user.name} tattoo portfolio - ${selected.tags.join(', ')}`}
```
bio page 的 avatar 和 portfolio 图片也需要有意义的 alt。

### P2-4: 创建 "Alternatives" 对比页

**SEO 知识库来源:**
- [内容策略] 竞品对比/替代页: "InkFlow vs Booksy", "InkFlow vs Tattoo Smart"
- 优先级: ⭐⭐⭐⭐⭐

**建议修改:**
创建 `src/pages/AlternativesPage.tsx`，内容:
- InkFlow vs Booksy for Tattoo Artists
- InkFlow vs Tattoo Smart vs Square Appointments
- 对比表格 + JSON-LD SoftwareApplication

### P2-5: Performance / Core Web Vitals

**当前状态:** 使用 React SPA + Tailwind CSS，构建工具是 Vite，PWA 有 Service Worker。但:
1. 所有 JS  bundle 一次性加载（无 code splitting 策略优化）
2. Lazy loading 有做（React.lazy），但首屏仍加载所有路由 chunks

**建议修改:**
1. 使用 Vite 的 `rollupOptions.output.manualChunks` 进一步拆分
2. 对 LCP 关键资源（hero image）使用 `<link rel="preload">`
3. 所有 `<img>` 添加 `width` 和 `height` 属性防止 CLS

### P2-6: 添加 Structured Data 到 Public Pages

**建议添加 Schema 的页面:**

| 页面 | Schema 类型 |
|------|-----------|
| Bio / Artist Profile | Person + LocalBusiness |
| Booking Page | Service + Offer |
| Portfolio | ImageObject |
| Waiver Sign | 无（敏感页面，不建议索引） |

### P2-7: 创建 Resources / Tools 页面

**SEO 知识库来源:**
- [排名因子] Product-Led SEO: 免费工具/计算器带来自然流量

**建议修改:**
创建 `src/pages/ResourcesPage.tsx`:
- Free Tattoo Contract Template (PDF download)
- Tattoo Deposit Calculator
- Tattoo Aftercare Checklist
- 每个资源页都有内链到产品页面

### P2-8: 添加 `prefetch` / `preconnect` 优化

**当前状态:** `index.html` 无 `preconnect` 到后端 API 或 CDN。

**建议修改:**
```html
<link rel="preconnect" href="https://r2.innkflow.com" />
<link rel="dns-prefetch" href="https://api.innkflow.com" />
```

---

## 页面审查清单

| 页面 | 路由 | meta title | meta desc | OG tags | Schema | Breadcrumb | Notes |
|------|------|-----------|-----------|---------|--------|-----------|-------|
| Landing | `/` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | **首页直接跳转到注册** |
| Register | `/register` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | App 内部页，可 noindex |
| Login | `/register` (tab) | 同上 | 同上 | 无 ❌ | 无 ❌ | 无 ❌ | 同上 |
| Dashboard | `/today` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 仅已登录 |
| Clients | `/clients` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 仅已登录 |
| Pricing | `/pricing` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无社会证明 |
| Portfolio | `/portfolio` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 仅已登录 |
| ArtistProfile | `/artist-profile` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 仅已登录 |
| ClientBooking | `/book/:id` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | **公开重要页面** |
| EmbedBooking | `/embed/:id` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | **公开重要页面** |
| ClientPayment | `/pay/:id` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | **公开重要页面** |
| Bio Page | `/bio/:id` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无独立页面 |
| Leads | `/leads` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 仅已登录 |
| WaiverSign | `/waiver/:id` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 仅已登录 |
| PublicWaiverSign | `/public-waiver/:id` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 公开但敏感 |
| ClientPortal | `/portal/:id` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 仅已登录 |
| ConfirmBooking | `/confirm/:id/:bid` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 公开确认页 |
| IntakePage | `/intake/:id` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 公开但敏感 |
| LeadConfirmation | `/lead-confirm/:token` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 公开确认页 |
| Me (Settings) | `/me` | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 无 ❌ | 仅已登录 |

---

## 导航栏和 Footer 审查

### 当前状态
- 仅有 `TabBar` 底部导航栏: Today | Clients | Me
- 无任何 marketing 页面链接
- 无任何 Footer
- 无任何面包屑导航

### 建议结构

```
[Desktop Navbar]
Logo | Features | Pricing | About | Contact | [Get Started] [Login]

[Bio Page Navbar]
Logo | [Artist Name] | Book | Links (Instagram, etc.)

[Footer]
Logo | About | Features | Pricing | Blog | Contact
Privacy Policy | Terms of Service | Cookie Policy
© 2026 InkFlow
```

---

## src/assets/ 文案审查

**发现:** 项目没有 `src/assets/` 目录。所有文案硬编码在组件中或通过 i18n 管理。

### i18n 文案 SEO 关键词嵌入情况

**已做的:**
- `Verification.tsx`: `TATTOO_KEYWORDS` 数组包含多语言 tattoo 关键词
- `i18n.ts`: 有 "Tattoo Intake Form", "Tattoo Studio Management" 等 key

**需要改进的:**
1. Landing Page 文案尚未创建 — 需要嵌入: "tattoo booking software", "tattoo studio management", "tattoo client management", "tattoo appointment scheduling", "tattoo POS system"
2. Pricing Page 硬编码文案未国际化
3. Feature 描述缺少 SEO 关键词:
   - "Client management" → "Tattoo Client CRM & Management"
   - "Appointment calendar" → "Tattoo Appointment Scheduling & Calendar"
   - "POS + split payment" → "Tattoo POS & Payment Processing"
4. 多语言文案需要检查翻译中的关键词准确性

---

## 总结行动优先级

### 第一周（P0）
1. 创建 SEO Landing Page
2. 添加 react-helmet 动态 meta
3. 创建 robots.txt + sitemap
4. 添加 Schema JSON-LD 基础设施
5. 添加 favicon 和完整 PWA icons

### 第二周（P1）
6. 创建 Navbar + Footer 组件
7. 优化 Pricing Page（添加 FAQ + 社会证明）
8. 为公开页面（Booking, Payment）添加 meta + OG
9. 创建 Privacy Policy + Terms of Service
10. 添加 GA4 + GSC

### 第三周（P1-P2）
11. 创建 Blog 基础设施 + 3 篇 pillar articles
12. 创建 FAQ 页面 + FAQPage Schema
13. 创建 "Alternatives" 对比页
14. 添加 Breadcrumb 组件
15. 修复所有图片 alt 文本

### 第四周+（P2）
16. 创建 Resources/Tools 页面
17. Hreflang 配置
18. OG 图片生成
19. Performance 优化 (CWV)
20. 多语言 SEO hreflang

---

*报告生成于 2026-06-06，基于 InkFlow Manager 项目代码库完整审查。*

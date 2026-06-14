# 技术 SEO 规范

> SaaS 网站技术 SEO 的实施标准。

## URL 结构

```
https://inkflow.com/                          # 首页
https://inkflow.com/blog/                     # 博客索引
https://inkflow.com/blog/<slug>               # 博客文章
https://inkflow.com/blog/<slug>/              # 推荐加尾部斜杠
https://inkflow.com/features/<feature-name>   # 功能页
https://inkflow.com/alternatives/<competitor> # 对比/替代页
https://inkflow.com/pricing/                  # 定价页
https://inkflow.com/about/                    # 关于页
https://inkflow.com/contact/                  # 联系页
https://inkflow.com/resources/<resource>      # 资源/工具页
```

### URL 规则
- 全小写，用连字符分隔（`tattoo-booking-software`，不用下划线）
- 包含核心关键词
- 简短（≤60 字符）
- 去掉停用词（a, the, and, or）
- 不改 URL（URL 一旦发布就不改，301 重定向代价大）

## Internal Linking（内部链接）

### 链接策略
1. **每篇博客文章至少 3-5 个内链**
   - 链接到相关产品页（功能页、定价页）
   - 链接到互补内容（同主题其他文章）
   - 链接到首页（品牌锚点）

2. **产品页也要内链**
   - 首页 → 功能页（导航栏）
   - 功能页 → 对比页（"vs competitors"）
   - 对比页 → 定价页（"start free"）

3. **面包屑导航**
   ```
   Home > Blog > Tattoo Studio Tips > How to Book Appointments
   ```

### Schema 标记清单

| 页面类型 | 必须有的 Schema |
|---------|----------------|
| 首页 | Organization, WebSite, BreadcrumbList |
| 博客文章 | Article, BreadcrumbList |
| FAQ 页 | FAQPage |
| 对比/替代页 | SoftwareApplication, BreadcrumbList |
| 定价页 | Offer, BreadcrumbList |
| 关于页 | About, BreadcrumbList |
| 产品功能页 | SoftwareApplication, BreadcrumbList |

### JSON-LD 示例

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "InkFlow",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Tattoo studio management software",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

## Core Web Vitals 目标

| 指标 | 目标值 | 当前 Astro 状态 |
|------|--------|----------------|
| LCP | ≤ 2.5s | ✅ Astro 静态页面通常 ≤1s |
| INP | ≤ 200ms | ✅ 低 JS 注入 |
| CLS | ≤ 0.1 | ✅ 静态布局，几乎无偏移 |

## 其他技术要点

1. **Canonical URL**: 每页必须有，避免重复内容
2. **Hreflang**: 如果做多语言（7 种语言），正确设置 hreflang
3. **Sitemap**: 动态生成，包含所有可索引页面
4. **robots.txt**: 允许爬取所有公开页面，阻止 admin/draft
5. **404 页面**: 自定义 404，包含搜索框和热门链接
6. **HTTPS**: 强制 HTTPS，HTTP → HTTPS 301
7. **图片优化**: WebP/AVIF 格式，lazy loading，明确 width/height

## 更新记录

| 日期 | 事件 |
|------|------|
| 2026-06-06 | 初始化 |

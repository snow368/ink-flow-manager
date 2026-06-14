# 网站执行者 Agent (Execution Agent)

## 职责
域名注册、网站架构搭建、技术 SEO 实施、发布内容、提交 sitemap。

## 触发条件
- 手动触发：说 "继续 SEO 执行"
- 依赖：Content Agent 产出内容初稿后

## 工作流程

### Step 1: 域名与网站架构
1. **域名检查**: 确认主域名和 SEO 用域名
2. **URL 结构设计**:
   ```
   inkflow.com/                   # 首页（核心品牌词）
   inkflow.com/blog/              # 博客
   inkflow.com/blog/<slug>        # 文章
   inkflow.com/alternatives/      # 对比页
   inkflow.com/features/          # 功能页
   inkflow.com/pricing/           # 定价页
   ```
3. **Sitemap**: 生成并提交 sitemap.xml
4. **robots.txt**: 配置允许爬取的目录

### Step 2: 页面技术 SEO 实施
每个页面必须包含：
- [ ] `<title>` tag（≤60 字符，包含关键词）
- [ ] `<meta name="description">`（≤160 字符）
- [ ] Canonical URL
- [ ] Open Graph tags（分享预览）
- [ ] Twitter Card tags
- [ ] H1 标签（唯一，包含核心关键词）
- [ ] Structured Data (JSON-LD)
  - Organization schema（首页）
  - WebPage schema（内容页）
  - FAQPage schema（FAQ 页）
  - BreadcrumbList schema
  - Product/SaaSApp schema
- [ ] 图片 alt text
- [ ] 内部链接网络（每页至少 3-5 个内链）
- [ ] 移动端适配（确认响应式）

### Step 3: 内容发布
1. 将 Content Agent 产出的 `.md` 转为 Astro 页面
2. 应用 `SEOHead.astro` 组件（已有）
3. 添加 Internal Link 组件
4. 构建验证：`npm run build` 确保无错误
5. 预览确认：检查 meta tags、schema、排版

### Step 4: 提交与监控
1. 提交 sitemap 到 Google Search Console
2. 提交 sitemap 到 Bing Webmaster
3. 请求 index 关键页面
4. 设置基础监控（如有条件）：
   - Google Search Console 索引状态
   - Core Web Vitals
   - 点击率 /  impressions

### Step 5: 技术审计
运行技术 SEO 检查：
- 404 页面检查
- 重定向链检查
- 重复内容检查
- 加载速度（Lighthouse 或 PageSpeed Insights）
- 结构化数据验证（Rich Results Test）

## 技术栈参考
- 项目路径: `D:\ink-flow-manager\marketing\`
- 框架: Astro (已有 SEOHead 组件)
- 页面模板: `marketing/src/pages/*.astro`
- SEO 组件: `marketing/src/components/SEOHead.astro`

## 产出位置
- 新建页面: `D:\ink-flow-manager\marketing\src\pages\<slug>.astro`
- 执行记录: `D:\ink-flow-manager\seo-targets\inkflow-manager\execution\YYYY-MM-DD-log.md`

## 注意事项
- 改代码前先用 git status 确认工作区干净
- 发布前必须跑 `npm run build`
- SEOHead 组件已有，新页面只需 import 并传入 props
- 内部链接要形成网：文章页→功能页→定价页→首页
- 每次只改一个页面，改完验证再下一个

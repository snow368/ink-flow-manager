# InkFlow (ink-flows.com) — Foley SEO 2026 因素审计报告

- **审计日期**：2026-07-18
- **审计依据**：Daniel Foley Carter「MOST IMPORTANT SEO FACTORS FOR 2026」（已入库 `data/seo-knowledge-feeds/seo-technical/foley-seo-factors-2026-2026-07-17.md`）
- **审计方法**：线上实测 `curl`（Googlebot UA + 原始 DOM 抓取）、robots/sitemap 解析
- **限制说明**：沙箱到 Cloudflare 边缘偶发 SSL 握手失败（curl exit 35），内页逐页抓取受限；首页 / robots / sitemap 稳定可取，足以验证 foley「可在线验证」的核心维度（1 URL 可访问性、2 URL 渲染）。维度 3/5/6/7 需 GSC 数据，由用户侧验证。

---

## 一、在线实测结果（Foley 7 维度逐项）

| 维度 | 检查项 | 结果 | 证据 |
|------|--------|------|------|
| **1. URL 可访问性** | robots.txt HTTP 200 | ✅ 通过 | `curl /robots.txt` → 200，`Allow: /` |
| 1 | 允许 AI 爬虫 | ✅ 通过 | 显式 `Allow:` GPTBot / OAI-SearchBot / Claude-SearchBot / PerplexityBot / Google-Extended |
| 1 | 导航在原始 DOM | ✅ 通过 | 首页 65 个 `<a href="/">` 标准锚点，无需 JS 即可访问 |
| 1 | sitemap 存在且完整 | ✅ 通过 | `sitemap-index.xml` → `sitemap-0.xml`，**170 URLs** |
| 1 | 渲染资源可访问 | ⚠️ 偶发 | 沙箱侧偶发 SSL exit 35（建议监控 CF TLS 边缘健康） |
| **2. URL 渲染** | SSG 静态 HTML | ✅ 通过 | 首页 44KB 静态 HTML，内容在原始 DOM（非 SPA 空壳，b9fe941 修复生效） |
| 2 | Title/Desc/Canonical 在源码 | ✅ 通过 | 三者均存在于原始 HTML 源码 |
| 2 | 非纯 CSR | ✅ 通过 | 仅 1 个 `module` script（Astro island），关键内容 SSR/SSG |
| 2 | LLM/Agent 输出完整 | ✅ 通过 | 原始 HTML 含 H1/功能列表/CTA，纯文本 Agent 可读 |
| **4. 内容质量** | 开头清晰说明提供什么 | ✅ 通过 | 首页 H1 + 功能摘要清晰 |
| 4 | E-E-A-T 信号 | ❌ 缺失 | 历史审计(07-14)：53 页 Person 作者 100% 缺、10 对比页信任层(评分/quote/Capterra)全缺 |
| 4 | 内容深度 | ⚠️ 部分 | 内链 <3 占 28%、薄页(<400词) 占 32%（07-14 审计） |
| **3. 用户行为信号** | Navboost / 品牌搜索 | ⏸ GSC | 需 Search Console 数据 |
| **5. 域名聚合质量** | PageRank 分布 / 信任 | ⏸ GSC | 需 Search Console 数据 |
| **6. 无效内容削减** | 已抓取未索引 / 爬取预算 | ⏸ GSC | 需 Search Console Coverage + Crawl Stats |
| **7. 站点行为模式** | URL 突增 / 质量突变 | ⏸ GSC | 对比 170 页上线前后 |

---

## 二、发现的问题与修复

### 🔴 P2 — 首页 Title 双写 "InkFlow | InkFlow"

- **实测**：`Tattoo Studio Management Software — All-in-One | InkFlow | InkFlow`
- **根因**：`src/components/SEOHead.astro:47` 无条件拼接 ` | InkFlow`：
  ```astro
  <title>{title} | InkFlow</title>
  ```
  但首页（及部分页面）传入的 `title` 已含 "InkFlow"，导致重复。
- **影响**：标题冗余、品牌词重复浪费 SERP 像素、轻微 CTR / 专业度损耗。
- **修复方案**（SEOHead.astro 第 47 / 51 / 58 行统一处理）：
  ```astro
  ---
  const { title } = Astro.props;
  const fullTitle = title.includes('InkFlow') ? title : `${title} | InkFlow`;
  ---
  <title>{fullTitle}</title>
  <meta property="og:title" content={fullTitle} />
  <meta name="twitter:title" content={fullTitle} />
  ```
  > 备选：直接把首页 title 改为不含后缀的 `Tattoo Studio Management Software — All-in-One`。

### 🟠 P1 — E-E-A-T 信号全站缺失

- 引用 07-14 on-page 审计：Person 作者 100% 缺、10 对比页信任层（评分 / quote / Capterra 徽章）全缺。
- foley 维度 4 明确要求 E-E-A-T 子标准（作者 / 署名 / 引用 / 来源 / 成立年份）。
- 需按 `seo-saas` 工作流补强：作者署名 + 真实引用 + Capterra / G2 徽章（V3 / V5 引用必须真实，严禁编造）。

### 🟡 P3 — 偶发 SSL 握手失败

- 沙箱侧偶发 `curl exit 35`（SSL connect error），首页 / robots / sitemap 多次重试可成功。
- 证书有效（robots / 首页 / `-k` 均能取），属沙箱到 CF 边缘 TLS 握手不稳定，非站点配置缺陷。
- 建议：在 CF 侧监控 TLS 边缘健康；不影响线上用户 / 爬虫（正式爬虫重试机制健全）。

---

## 三、需用户侧 GSC 验证的维度（foley 3 / 5 / 6 / 7）

1. **用户行为信号**：C-R-A-P-S（点击率 / 停留 / 跳出 / 重复访问 / pogo-sticking）、品牌搜索量趋势
2. **域名聚合**：PageRank 在 170 URL 间的分布、整体索引质量、外链引荐域强度
3. **无效内容削减**：Coverage 报告中「已抓取-未索引」URL 数、参数化 URL、合并相似页
4. **站点行为模式**：170 页上线后 URL 数量突增是否触发质量审查、内容质量是否一致

---

## 四、下一步建议

1. **【可立即做】** 修 `SEOHead.astro` 消除 Title 双写（P2）。
2. **【内容层】** 按 `seo-saas` 补 E-E-A-T（作者 / 引用 / Capterra）— 优先级 P1。
3. **【用户侧】** 登录 GSC 补维度 3 / 5 / 6 / 7 数据，回填本报告。
4. 全站 170 页逐一抓取受沙箱 SSL 限制，建议本地用 `scratch/audit_pages.py` 跑（已建，见 07-14 日志）。

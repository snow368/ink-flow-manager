# InkFlow E-E-A-T 真实素材需求清单（部署前必填）

> 关联：foley_seo 2026 审计 + 07-14 站内审计 → InkFlow 全站 E-E-A-T 信任层缺失
> （Person 作者 100% 缺、10 对比页信任层全缺）。本清单列出**上线前必须由你提供的真实素材**。
> E-E-A-T 信号**不能编造**（Google 会识别虚构作者，反而伤害信誉）。

---

## 0. 已完成的基建（本会话）

| 文件 | 状态 | 说明 |
|---|---|---|
| `src/data/authors.ts` | ✅ 新建 | 集中作者数据，当前为 `TODO` 占位 |
| `src/components/AuthorByline.astro` | ✅ 新建 | 署名 UI + Person schema 注入，**占位安全**（name 含 `TODO` 时自动跳过渲染+不注入 schema） |
| `src/components/SEOHead.astro` | ✅ 修复 | Title 双写 bug（`InkFlow \| InkFlow`）已修 |
| 25 个 compare/features 页面 | ✅ 接入 `<AuthorByline>` | 含 booksy + tattoo-booking-software 两个示范页 + 23 个批量接入 |
| `npm run build` | ✅ 通过 | 176 页构建无报错 |

> ⚠️ **占位安全机制**：在 `authors.ts` 仍为空 `TODO` 时，`AuthorByline` 不渲染任何内容、也不注入 Person schema —— 所以**现在部署不会暴露占位文本，也不会有坏 UI**，只是 E-E-A-T 信号尚未生效。填实作者数据后即自动上线。

## 0.5 ⚠️ 重要修正：既有硬编码 byline 需整合（避免重复署名 + 补齐 Person schema）

审计发现：站内**已有**硬编码署名 `Written by Sarah Chen, Founder & CEO at InkFlow`，分布在 **20 个源文件**（`about.astro`、`alternatives/best-tattoo-website-builders`、`blog/*`（aftercare 系列 + website 系列）、`features/tattoo-*-website.astro` 共 4 个）。
- 这些页面**有可见署名但无 Person 结构化数据**（商业页 Person schema = 0%）→ foley P1 在结构化层仍不达标。
- 其中 4 个 features 页（artist/portfolio/studio/website-builder）**同时被本会话接入了 `<AuthorByline>`**（占位）。若直接填 `authors.ts`，这 4 页会出现**两条 byline（硬编码 Sarah Chen + 组件 byline）**。

**整合方案（填 authors.ts 前必须做）**：
1. 确认 `Sarah Chen` 是否为真实作者名（是 → `authors.ts` 的 `founder.name = "Sarah Chen"`；否 → 换成真实姓名，并同步改下面硬编码处）。
2. 把 20 个硬编码 `Written by Sarah Chen…` 块**替换为** `<AuthorByline authorId="founder" reviewerId="reviewer" datePublished="…" dateModified="…" />`，删除硬编码文本。
3. 给 `authors.ts` 补 `bio` / `image`（`public/images/authors/founder.jpg`）/ `sameAs`（LinkedIn 等）—— 这样署名 + Person schema 统一由组件发出，无重复、且结构化 E-E-A-T 上线。
4. 未被硬编码覆盖、仅由本会话接入 `<AuthorByline>` 的页面（如 booksy / vagaro / 多数 compare + 其余 features）直接受益，无需改。

---

## 1. 作者实名数据（填 `src/data/authors.ts`）

### founder（主笔 / 作者）
- `name`：真实姓名（如 `Jane Doe`）——**不能**用 TODO / 虚构
- `jobTitle`：真实职位（如 `Founder & CEO, InkFlow`）
- `bio`：一句话简介，突出纹身行业 / SaaS 经验
- `image`：头像文件路径 → 需把真实头像放到 `public/images/authors/founder.jpg`（建议 200×200 WebP）
- `sameAs`：真实权威主页 URL 数组（如 LinkedIn、`https://ink-flows.com/about`、个人站），**至少 1 个**

### reviewer（审核人）
- `name`：真实审核人姓名
- `jobTitle`：真实职位（如 `Product Lead`）
- `image`：`public/images/authors/reviewer.jpg`（同上）
- `bio` / `sameAs`：可选

> 填好 `authors.ts` 后，**所有 25 个已接入页面自动获得署名 + Person schema**，无需逐页改。

---

## 2. 真实客户引用（V3 规则 — **仅厂商页 / features 页**）

SERP TOP10 v2 规则 **V3** 要求**厂商页（`features/*.astro`）**放**真实客户 quote**。需你提供 **2–3 条**：
- 经客户**授权**的真实原话（verbatim，不要改写语气）
- 注明：工作室名 / 角色（如 `Owner, @BlueDragon Tattoo`）/ 使用场景
- 🚨 **放置位置仅限 `features/` 厂商页**。**对比页（`compare/alternatives`）严禁放客户 quote** —— 榜单页范式（**L7 反向规则**）要求全编辑口吻、无店主引述，硬塞反而违 SERP 范式、伤害排名。
- 🚨 **严禁编造 quote 或冒用他人评价**

---

## 3. Capterra / G2 真实主页 URL（V5 规则 — 徽章 / 外链）

V5 要求引用真实 Capterra / G2 页面。需你提供：
- InkFlow 在 **Capterra** 的真实评测主页 URL（如 `https://www.capterra.com/p/xxxxx/InkFlow/`）
- InkFlow 在 **G2** 的真实评测主页 URL（如 `https://www.g2.com/products/inkflow/reviews`）
- 若尚未开通 → 先去 Capterra / G2 **认领 / 创建 InkFlow 商家页**，积累真实评价后再挂徽章
- 🚨 URL 必须真实可访问，**严禁编造**

---

## 4. 已接入 E-E-A-T 署名的页面（25 个）

### compare/（6）
- ✅ `booksy.astro`（示范）
- ✅ `best-tattoo-studio-software.astro`
- ✅ `best-tattoo-waiver-app.astro`
- ✅ `tattoo-studio-pro.astro`
- ✅ `tattoogenda.astro`
- ✅ `vagaro.astro`

### features/（19）
- ✅ `tattoo-booking-software.astro`（示范）
- ✅ `index.astro`
- ✅ `tattoo-aftercare-software-automation.astro`
- ✅ `tattoo-artist-website.astro`
- ✅ `tattoo-booking-page.astro`
- ✅ `tattoo-client-portal.astro`
- ✅ `tattoo-competitor-intelligence.astro`
- ✅ `tattoo-compliance-software.astro`
- ✅ `tattoo-crm-software.astro`
- ✅ `tattoo-inventory-management.astro`
- ✅ `tattoo-marketing-automation.astro`
- ✅ `tattoo-payment-processing.astro`
- ✅ `tattoo-portfolio-website.astro`
- ✅ `tattoo-referral-program.astro`
- ✅ `tattoo-studio-analytics.astro`
- ✅ `tattoo-studio-website.astro`
- ✅ `tattoo-supply-brands.astro`
- ✅ `tattoo-waiver-software.astro`
- ✅ `tattoo-website-builder.astro`

### 排除（无需 E-E-A-T）
- `features/tattoo-pos-system.astro` → 纯跳转桩页（meta-refresh 到 payment-processing），无内容，正确排除

---

## 5. 部署步骤（你本地终端执行，沙箱无法 push）

```bash
cd D:/ink-flow-manager/marketing
git add -A
git commit -m "feat(seo): add E-E-A-T author byline infra + fix title double-write"
git push
```

- ⚠️ **当前分支为 `main`**（git 实测；历史 memory 记成 `master`，以实测为准）。`git push` 推当前分支即可。
- ⚠️ 沙箱 SSH 被拒，无法代 push；请在**本地终端**执行。
- push 后 Cloudflare Pages（项目 `ink-flow`）自动构建部署到 **ink-flows.com**。
- 注意：`git add -A` 会包含仓库内其他既有未提交改动（本次构建前已有 150+ 文件改动）。若只想提交 E-E-A-T 部分，可改为 `git add src/data/authors.ts src/components/AuthorByline.astro src/components/SEOHead.astro src/pages/compare src/pages/features` 后单独 commit。
- `authors.ts` 仍为 TODO 时部署安全（见第 0 节占位安全机制），但 Person schema 不出现——**填实后**才算真正 E-E-A-T 上线。

---

## 6. 上线验证

1. 本地 `npm run build && npm run preview`，抽查页面源码含 `application/ld+json` 的 `Person` schema（作者填实后）。
2. GSC → 富媒体结果测试 → 确认 `Article` / `Person` 被识别。
3. 部署后 `curl -s https://ink-flows.com/compare/booksy | grep -i "Written by"` 验证署名渲染。

---

## 7. 仍未完成（后续）

- **blog / alternatives / free-tools / meaning** 页面的 E-E-A-T 接入（按"每页必做"原则后续补，本会话仅覆盖商业页 compare+features）。
- **V3 客户 quote / V5 Capterra 徽章** 的具体 UI 组件（当前仅作者署名层；quote 与徽章需另建信任区区块，且必须接真实数据）。
- **外链建设**（geoly 反模式已入库；正道：G2 / Capterra / 行业媒体 guest post，见 `seo-backlink-audit`）。

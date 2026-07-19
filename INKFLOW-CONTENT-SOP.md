# InkFlow 内容生产 SOP（v2.2 · 全链路，经源文档核对 + 用户决策修订）

> **定位**：把分散在仓库 SEO 知识库里的维度，consolidate 成「每页必做动作」。
> 这是内容生产（新建 / 改写页面）的**唯一执行标准**，取代 `INKFLOW-CONTENT-PLAYBOOK.md` 的"内容流程"定位（旧文件保留作参考，不再作为权威）。
> E-E-A-T 信号实现细节见 `INKFLOW-SEO-EEAT-PLAN.md`；每日任务计划见 `seo-targets/CONTENT_INVENTORY.md`。
>
> **本地路径**：`marketing/src/...`（仓库根 `src/` 是孤儿，不部署）。
> **部署分支**：`main`（`.github/workflows/deploy.yml` 只监听 `main`）。
> **知识库来源（已逐条核对）**：`seo-knowledge-base/*`、`seo-knowledge/*`、`seo-targets/briefs/*`、`src/pages/alternatives/best-tattoo-website-builders.astro`（线上 @graph 真实格式）。

---

## 0. 核心原则（写每页前默念）

1. **Last Click 思维**：页面目标是让用户看完立刻解决问题 / 注册，不是诱导点更多页。〔KB: EEAT 计划 §核心原则〕
2. **先价值，后 SEO**：第一目标解决真实问题，第二目标才被发现。绝不为了塞词牺牲可读性。〔KB: content-seo.md §1〕
3. **深度 > 广度**：一篇 3000 字高质量文 > 三篇 1000 字泛泛文。〔KB: content-seo.md §2〕
4. **差异化角度（信息增益）**：每页至少一个"只有你能写"的元素（真实工作室数据 / 案例 / InkFlow 功能用法）。〔KB: content-seo.md §3 / content-matrix #13〕
5. **AEO 优先于传统 SEO（2026）**：抢 AI 引用 > 抢排名。〔KB: ranking-factors.md / aeo.md〕
6. **E-E-A-T 是地基**：无具名作者、无引用、无日期 = 不被信任 = 不上线。〔KB: EEAT 计划〕

---

## 1. 写前研究（★ 原 SOP 完全缺失，新增）

> 旧 PLAYBOOK 从"关键词"直接跳到"模板"，跳过研究。本步是 v2 最重要补强。

### 1.1 SERP / 竞品差距分析（每词必做）
- 搜目标主词，看 **Top 10 排的是什么内容格式**（全是 Blog=信息型；全是 LP=商业型；全是对比=交易型）。〔KB: content-matrix #2〕
- **SERP 特征盘点**：该词是否出现 Featured Snippet / People Also Ask / 图片包 / 视频包？出现即意味着 Google 偏好结构化 / 视觉化答案，写作时主动对齐。〔KB: aeo.md / content-matrix 七〕
- 记录竞品：标题 / H1 / 内容长度 / 是否有 FAQ / 覆盖的子话题。
- 找**内容缺口**：竞品没写的角度、没覆盖的子话题、信息增益点。
- 产出：一份 gap note（参考样例 `seo-targets/briefs/aftercare-cluster-gap-analysis.md`）。

### 1.2 正式 Content Brief（每簇 / 每页必写，禁止直接动笔）
- 用模板 `seo-targets/briefs/CLUSTER_BRIEF_TEMPLATE.md`，复制为 `seo-targets/briefs/{cluster}-cluster-brief.md`。
- **必填字段**（逐页）：目标主词、副关键词（含 People-Also-Ask 真实问法）、路径、页面类型、目标字数、Title(≤60)、Meta(≤160)、H1、BLUF 开头、大纲、关键词融入位置、Featured Snippet 目标(40–60 字)、Schema 类型、内链计划、审核人。〔KB: CLUSTER_BRIEF_TEMPLATE §4〕
- **字数 = SERP 驱动，不写死固定区间**（v2.2 修正，用户决策）〔KB: content-matrix + SERP 实测〕：
  - **规则**：目标字数 = **SERP Top 10 平均篇幅 × 1.3（约多 30%）**，向上取整到百。宁可比竞品多一点，绝不为了凑数硬填到某个上限（如 4000）。
  - **例**：某对比词 Top 10 平均 1500 字 → 目标 ≈ 2000 字，不必写 4000（这正是此前 1500–2000 vs 2000–4000 之争的解法）。
  - **最小地板（防薄页）**：指南 / Pillar ≥ 1200；博客 ≥ 800；对比 / 替代品 ≥ 1200；功能页 ≥ 1000；低于地板即内容不足，需补信息增益而非注水。
  - **最大上限**：**无**。写够即止，覆盖完实体 / PAA 即停，绝不注水到固定值。
  - **来源**：§1.1 SERP 分析必须记录 Top 10 平均篇幅，Brief「目标字数」据此填，禁止拍脑袋写 2000–4000 之类固定区间。
- **防生搬硬套检查（5 条，动笔前必须全过）**〔KB: CLUSTER_BRIEF_TEMPLATE §5.1〕：
  1. 本簇主意图 TOFU 还是 MOFU/BOFU？（决定角度形态与 CTA 强弱）
  2. 每页「页面类型」都标了吗（指南/对比/工具/列表）？（禁止全簇套同一结构）
  3. 薄页（kw<10）是否并入支柱而非硬开页？
  4. 目标字数是否按 **SERP Top10 × 1.3** 算（见上，勿填固定区间）？
  5. 跨簇链接是否留待对应簇 Brief 回填（不提前写死断链）？

### 1.3 搜索意图深度校验
- 意图分类（任选其一保持一致）：
  - 3 类：购买词（交易，最高转化）/ 痛点词（信息，低竞争）/ 场景词（商业，高竞争）。〔KB: content-matrix 二〕
  - 4 类：信息 / 交易 / 商业考察 / 本地。〔KB: PLAYBOOK Step1〕
- **实体与语义覆盖**：提取核心实体 + People Also Ask 真实问法，大纲须逐一覆盖，不堆砌关键词。〔KB: content-matrix #14 / aeo.md〕
- **硬规则**：页面格式必须匹配 SERP 首页格式（意图错配 = 不被收录也白写）。

### 1.4 原创数据 / 一手研究计划
- 每页规划至少一个「只有 InkFlow 能写」的元素：真实工作室案例、用户使用数据、功能实测截图。〔KB: content-matrix #13 / EEAT 计划 §2.4〕
- **无真实数据支撑的论断 → 删除，绝不编造。** 这是 E-E-A-T 的硬通货。

**研究交付物清单（动笔前须齐）：** ① gap note ② 逐页 Brief（含 §1.2 字段）③ 意图+实体覆盖表 ④ 原创数据/案例来源落实。

---

## 2. 写前校验（Brief 就绪、动笔前最后一关）

| 校验项 | 不过 = 不动笔 |
|--------|--------------|
| 意图与页面类型匹配 SERP？ | ❌ |
| 薄页已并入支柱？ | ❌ |
| 字数按类型定（非统一数）？ | ❌ |
| 信息增益点明确（不重复竞品）？ | ❌ |
| 原创数据 / 案例来源落实？ | ❌ |
| 实体 / PAA 已覆盖进大纲？ | ❌ |
| 跨簇链接已留位（不写死断链）？ | ⚠️ 允许留 TODO |

---

## 3. 写作标准（★ 原 SOP 只有模板、无标准；以下均来自 KB 并已核对）

### 3.1 BLUF 直接回答法则（最重要）
- **首段直接给核心答案**（答案优先结构，非"背景铺垫→最后结论"）。〔KB: content-matrix 七〕
- **每个 H2 下的第一段 = 直接回答问题，40–60 字**，AI 可直接引用。〔KB: aeo.md §1 / content-matrix #8〕
- 反例："在当今快节奏的纹身行业……" → 正例："纹身预约软件是帮纹身师在线排期、收定金、管客户的系统。"

### 3.2 段落自包含
- 抽走任意一段，读者不依赖上下文也能看懂。〔KB: content-matrix #9〕

### 3.3 列表 / 表格优先
- 每页至少 1 个列表或表格；AI 提取准确率比纯段落高 30–40%。〔KB: content-matrix #10 / aeo.md §3〕

### 3.4 差异化角度（信息增益）
- TOFU 信息簇：找竞品无系统覆盖的 POV（可作 Featured Snippet）。〔KB: CLUSTER_BRIEF_TEMPLATE §1〕
- MOFU/BOFU 商业簇：角度通常是「最清晰结构 / 最可信比较 / 最强信任」，而非新奇观点。〔同上〕
- 信息增益实例（写时必备其一）：InkFlow 真实客户数据、工作室访谈引语、功能实测截图、行业一手报告。〔KB: content-matrix #13〕

### 3.5 AEO 问题-答案对 + FAQPage
- 每个 H2 标题就是一个可能的问题；答案直接给。〔KB: content-seo.md §5〕
- FAQ：3–5 个**真实**问题 + `FAQPage` Schema（AI 最爱引用 FAQ）。〔KB: aeo.md §4 / content-matrix #11〕

### 3.6 实体 / 语义覆盖
- 整合 People Also Ask 里的真实问法；自然语言覆盖核心实体与同义词，不堆砌关键词。〔KB: content-matrix #14〕

### 3.7 可读性与品牌 ToV
- 短段落（2–4 句）、大量 H2/H3、结论前置。〔KB: content-seo.md §4〕
- ToV：专业但不枯燥、展示纹身行业知识、真诚不夸大、避免过度营销。〔KB: content-seo.md Tone〕

### 3.8 站外 AI 引用信号（写作时顺带经营，维度 #14）
- AI 不只读你网站，还读 G2 评论、Reddit 讨论、媒体提及。写作时在相关处自然带品牌与真实数据，便于被第三方引用。〔KB: content-matrix #14〕

---

## 4. E-E-A-T 注入（★ 全页强制，不注入 = 不上线）

> **事实源**：线上已上线格式见 `src/pages/alternatives/best-tattoo-website-builders.astro`（即 CONTENT_INVENTORY 提到的 "B5" 参照页），Day 1 的 aftercare 页**复用该 @graph 格式**。实现细节也可参考 `INKFLOW-SEO-EEAT-PLAN.md`，但该文档 §1.0 的博客 frontmatter 模板已过期（见 §9 冲突①），以**线上部署**为准。

### 4.1 作者块（每页必填，以线上部署为准）
- **姓名**：Sarah Chen
- **职称（jobTitle）**：`Founder & CEO at InkFlow`（线上 JSON-LD 实测值；EEAT 方案文档写的 "Studio Operations Expert" 已过期，见 §9）
- **/about 链接**：`https://ink-flows.com/about`
- **sameAs（社媒）**：`https://linkedin.com/in/sarahchen-inkflow`
- **头像（avatar）**：作者头像图须设 width/height。〔KB: EEAT 计划 §1.0〕
- **首段创作依据**：正文首段或作者区须写清"作者凭什么有资格写"（如行业年限 / 工作室经验）。〔KB: EEAT 计划 §2.3 ②〕

### 4.2 审核人（Reviewer）
- 具名 + 资质（来源：`CLUSTER_BRIEF_TEMPLATE §2`，**非** EEAT 计划）。
- 线上参照页当前 `reviewedBy` 复用 Sarah Chen（作者=审核人）；若实际有独立审核人，用真实具名。

### 4.3 引用（citation，≥2 条）
- 真实、稳定、可点击的一手来源，放 JSON-LD `citation` 数组 + 正文脚注 `<cite>`。〔KB: EEAT 计划 §1.0 / CLUSTER_BRIEF_TEMPLATE §2〕
- **YMYL / 健康类（aftercare 必遵守）**：用 **NHS / AAD / Mayo** 等医疗机构来源；**禁用 Wikipedia**，避免仅用厂商博客。〔KB: CLUSTER_BRIEF_TEMPLATE §2〕
- 非医疗页可引权威非医疗源（如 Google 开发者文档 / web.dev），但仍须 ≥2 条可核验。
- ⚠️ 当前 aftercare 页仅 1 条（NHS）→ Day 1 须补第 2 条（如 AAD 或 Mayo 的 aftercare 指南）。

### 4.4 日期
- `datePublished` + `dateModified`（线上初版两值相同）；每 6 个月复核更新 `dateModified`。〔KB: EEAT 计划 / CLUSTER_BRIEF_TEMPLATE §2〕

### 4.5 JSON-LD 真实格式（Day 1 照抄此结构，替换 name/url/citation）
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "name": "Tattoo Aftercare Guide (2026)",
      "url": "https://ink-flows.com/blog/tattoo-aftercare-guide",
      "datePublished": "2026-07-16",
      "dateModified": "2026-07-16",
      "author": { "@type": "Person", "name": "Sarah Chen", "jobTitle": "Founder & CEO at InkFlow", "url": "https://ink-flows.com/about", "sameAs": "https://linkedin.com/in/sarahchen-inkflow" },
      "reviewedBy": { "@type": "Person", "name": "Sarah Chen", "jobTitle": "Founder & CEO at InkFlow" },
      "citation": [
        "https://www.nhs.uk/conditions/tattoos/",
        "https://www.aad.org/public/everyday-care/skin-care-secrets/tattoos/tattoo-aftercare"
      ]
    },
    {
      "@type": "Article",
      "headline": "Tattoo Aftercare Guide (2026)",
      "author": { "@type": "Person", "name": "Sarah Chen", "jobTitle": "Founder & CEO at InkFlow", "url": "https://ink-flows.com/about" }
    }
  ]
}
```
> 第二节点按页面类型替换：`Article`（博客/指南）、`ItemList`（榜单/对比列表）、`BreadcrumbList`（面包屑）、`FAQPage`（FAQ）。〔KB: content-matrix 一 / EEAT 计划 §1.1〕
> ⚠️ 上例节点①用 `WebPage` 是照 B5 参照页格式；aftercare 是博客，节点①按 content-matrix 应改用 `BlogPosting`，待 §9③ 拍板（节点②类型也待定）。

---

## 5. 技术 & 内链（★ 治理层）

### 5.1 Schema（按页面类型选，以 `content-matrix 一` 为准；对照附录 A）
- 首页 `SoftwareApplication`+`Organization`；功能页 `SoftwareApplication`；博客/指南 `Article`+`BreadcrumbList`（建议加 `FAQPage`）；对比/替代 `FAQPage`；定价 `Product`+`Offer`；工具 `WebPage`；关于 `Organization`；联系 `ContactPage`。〔KB: content-matrix 一〕
- ⚠️ 与 `EEAT 计划 §1.1` 的类型差异见 §9 冲突③，**以本表（content-matrix 一）为现行标准**。

### 5.2 内链治理（R1–R6 + 真实集群 link map，v2.2 重写）

> ⚠️ v2.2 重写：内链必须指向**真实存在**的 URL。下面按实际集群枚举真实 link map，并规定「目标页不存在时怎么办」。空谈 Hub-and-Spoke 拓扑而无真实 URL = 不可执行。

#### 真实存在的集群（含真实 URL，已查 `src/pages`）
**Cluster A — Aftercare（内容簇，7 页已上线）**
- Pillar：`/blog/tattoo-aftercare-guide` ✅
- Spokes（6，均 ✅）：`/blog/aftercare-products`、`/blog/aftercare-issues`、`/blog/aftercare-color-tattoo`、`/blog/aftercare-second-skin`、`/blog/aftercare-timeline`、`/blog/aftercare-activities`
- Hub：`/blog/topic/aftercare` ❌ **源码缺失**（`src/pages/blog/topic/` 仅有 `website-builder`，无 aftercare）→ 这是真实缺口，Day 2 不是「补链」而是「先建 hub 再补链」（见 §9⑥）。

**Cluster B — Website Builder / B5（内容簇，已上线 + E-E-A-T）**
- Hub：`/blog/topic/website-builder` ✅
- Pillar：`/features/free-tattoo-website` ✅
- Spokes（✅）：`/features/{tattoo-artist-website,tattoo-studio-website,tattoo-portfolio-website}`、`/alternatives/best-tattoo-website-builders`、`/features/tattoo-website-builder`、`/blog/{how-to-make-a-tattoo-website,tattoo-website-design-ideas,tattoo-portfolio-website-examples}`

**跨簇功能页（存在，可作内容页内链目标；但自身暂无内容簇）**
`/features/tattoo-{booking-page,booking-software,crm-software,inventory-management,waiver-software,client-portal,compliance-software,marketing-automation,payment-processing,portfolio-website,pos-system,referral-program,studio-analytics,studio-website,supply-brands,competitor-intelligence,aftercare-software-automation,website-builder,artist-website}` —— 均 ✅ 存在，是 R4（每博客 ≥3 功能链接）的真实目标。

**未来内容簇（longtail 16 簇中除 aftercare 外 14 个，均 ❌ 未写页）**
`ideas / placement / small / problems / color / coverup / removal / meaning / cost / pain / styles / quotes / other / prep / trends` —— 目前**无任何页**，内链暂不涉及；写未来簇时见下方「目标页不存在铁律」。

#### 各集群 link map（真实指向）
- **Cluster A（Aftercare）**：
  - 每 spoke → Pillar（`/blog/tattoo-aftercare-guide`）≥1 描述性锚（两者均存在 ✅）
  - 每 spoke ↔ 2–3 个 sibling spoke 横向互链（均存在 ✅）
  - Pillar → 每 spoke（相关阅读区）
  - spoke/Pillar → Hub `/blog/topic/aftercare`：❌ hub 不存在 → **暂不链**，写 `<!-- TODO: link /blog/topic/aftercare after Day 2 创建 -->`；过渡期可链 `/blog` 索引页（存在 ✅）
  - 跨簇：aftercare 页 → 存在的功能页（如 `/features/tattoo-aftercare-software-automation`、`/features/tattoo-booking-software`）✅
- **Cluster B（B5）**：标准 Hub-and-Spoke，所有 URL 均存在，按 `CLUSTER_BRIEF_TEMPLATE §3.1` 互链即可。

#### 🚫 目标页不存在时的铁律（防断链，R1–R6 仍适用）
1. **绝不写指向不存在页面的内部链接**（404 内链比少链更伤 SEO）。
2. 目标页属「未来簇 / 待建 hub」→ 用 HTML 注释留位 `<!-- TODO: link {url} when published (Day X) -->`，并记进 `CONTENT_INVENTORY` 对应 Day。
3. 过渡期链接退而求其次到**已存在的上一级真实页**（如 spoke 暂链 `/blog` 而非不存在的 hub）。
4. 跨簇只链**今天已存在**的页；未来簇页之间互链仅限同簇且同批创建时。
5. 「内容区 ≥3 内链」可用「存在的功能页 + 同簇 spoke + pillar」凑足，不必硬凑不存在的页。

### 5.3 技术基线
- **Canonical**：每页必须有，防重复内容。〔KB: technical-seo.md / content-matrix 十〕
- **URL**：全小写、连字符、含核心词、≤60 字符、去掉停用词；**URL 发布后不改**（301 代价大）。〔KB: technical-seo.md〕
- **图片**：alt 描述性 + 适当含词；明确 `width/height`；WebP/AVIF + lazy。〔KB: EEAT 计划 / technical-seo.md〕
- **noindex 规则**：薄页 / 重复页 / 草稿 / 测试页加 `noindex`。
- **CWV 目标**：LCP≤2.5s、INP≤200ms、CLS≤0.1（Astro 静态页通常天然达标，仍须 build 后抽查）。〔KB: technical-seo.md / content-matrix 十〕

---

## 6. 编辑 QA（发布前必过）

- **事实核查**：数据、引用、案例均可核验；无来源论断退回补或删。
- **合规（YMYL / 健康类，纹身 aftercare 必做）**〔来源：Google YMYL 评估准则 + CLUSTER_BRIEF_TEMPLATE §2〕：
  - 医疗 / 护理声明须有**一手权威来源**（NHS / AAD / Mayo 等），禁 Wikipedia。
  - 页面加**健康免责声明**（如："本文为信息参考，不替代专业纹身师 / 医师建议"）。
  - 健康类内容**额外强化 E-E-A-T**（作者须展示行业经验 / 资质）。
- **可访问性**：heading 顺序正确（H1→H2→H3 不跳级）、alt 完整、正文对比度达标。
- **上线前检查清单**（见附录 E）。
- **Build 验证（红线）**：`cd marketing && npm run build` 必须 **0 错误** 才允许 push。〔KB: CONTENT_INVENTORY 红线〕

---

## 7. 发布 & 度量

- **提交（红线）**：改完必须 `git push origin main`（不是 master）；直接在 `main` 小步提交，不自建分支大改。〔KB: CONTENT_INVENTORY 红线〕
- **收录推送**：IndexNow 推送新 URL。
- **KPI（按页面类型，写页时即定目标）**〔KB: content-matrix 六〕：
  - TOFU / 信息页：**AI Overview 出现率**（是否被 AI 引用）。
  - 商业 / 交易页：**5–10% CVR**（注册 / 试用）。
  - 全局：**非品牌词应占总自然流量 ≥60%**（长尾占比）。
- **时间线**：Day 1 收录 → Week 4 进前 50 → Week 8 进前 10。〔KB: content-matrix 六〕
- **监测**：Week 4 起用 GSC 查收录与排名；排名下滑触发第 8 步更新。

---

## 8. 更新 & 新鲜度

- **衰减监控**：GSC 排名下滑 / 流量掉 = 触发更新，不是等季度。〔KB: EEAT 计划 §4.3〕
- **更新节奏**〔KB: EEAT 计划 §4.3〕：
  | 频率 | 内容 |
  |------|------|
  | 每周 | 博客 ≥1 篇（或更新旧文） |
  | 每月 | 免费工具数据更新 |
  | 每季 | 对比页更新（竞品功能变化） |
  | 每半年 | 定价页更新；全站 E-E-A-T 日期复核 |
  | 年度 | 首页数据更新（"500+ studios" → 真实数字） |
- **更新动作**：改完同样过第 6 步 QA + build 0 错误 + `push origin main`；`dateModified` 同步更新。

---

## 9. 已知 KB 内部冲突与待确认（执行前必须拍板）

> 以下为仓库内文档彼此矛盾之处。SOP 已选「现行标准」并标注，但请用户最终确认，避免 Day 1 注入错值。

| # | 冲突点 | 文档 A 说 | 文档 B 说 | SOP 采用 | 待确认 |
|---|--------|-----------|-----------|----------|--------|
| ① | Sarah Chen 职称 | EEAT 方案 §1.0：`Studio Operations Expert` | 线上部署：`Founder & CEO at InkFlow` | **线上部署值** | 是否同步修订 EEAT 方案文档？ |
| ② | 站点域名 | EEAT 方案：`inkflow.com` | 线上 JSON-LD：`ink-flows.com` | **ink-flows.com**（与部署一致） | ✅ 已确认：正式域名 = ink-flows.com（用户 2026-07-18 拍板） |
| ③ | Schema 类型 | EEAT 方案 §1.1：`BlogPosting` / `Product+ComparisonTable` / `WebApplication` / `OfferCatalog` | content-matrix 一：`Article+BreadcrumbList` / `FAQPage` / `WebPage` / `Product+Offer` | **content-matrix 一** | 旧 EEAT 方案是否作废？ |
| ④ | 字数区间 | content-matrix 一：固定 1500–2000 | brief 模板：固定 2000–4000 | **取消固定区间** | ✅ 已改为 SERP 驱动（Top10×1.3，见 §1.2），无固定上限（用户决策） |
| ⑤ | JSON-LD 结构 | EEAT 方案 §1.1：独立多块（无 @graph） | 线上部署：单 `@graph` 包裹 | **@graph**（与部署一致） | 全站统一 @graph？ |
| ⑥ | Aftercare Hub 缺失 | CONTENT_INVENTORY 称 `/blog/topic/aftercare` 已部署 | `src/pages/blog/topic/` 实际无 aftercare 文件（仅 website-builder） | **视为真实缺口** | Day 2 先建 hub 再补链；同时核实 inventory 状态描述 |

---

## 附录 A — 页面类型 × 格式 × Schema × 字数 × 意图 对照表〔KB: content-matrix 一，现行〕

| 类型 | 内容格式 | Schema | 漏斗 | 意图 | 字数（最小地板，非上限） |
|------|---------|--------|------|------|------|
| 首页/Landing | Hero+功能网格+How It Works+CTA | `SoftwareApplication`+`Organization` | BOFU | 品牌/商业 | ≥1500 |
| 功能页 | Problem→Solution→Features→数据→FAQ | `SoftwareApplication` | MOFU | 商业 | ≥1000 |
| 对比页 | Verdict→对比表→定价→场景→FAQ | `FAQPage` | BOFU | 交易 | ≥1200 |
| 替代品页 | 问题→替代方案表→迁移→CTA | `FAQPage` | BOFU | 交易 | ≥1200 |
| 博客/指南 | 首段答案→分段→列表/表格→FAQ | `Article`+`BreadcrumbList`（建议`FAQPage`） | TOFU | 信息 | ≥800（指南≥1200） |
| 定价页 | 层级→功能矩阵→FAQ | `Product`+`Offer` | BOFU | 交易 | — |
| 免费工具 | 界面→用法→数据→FAQ | `WebPage` | TOFU | 外链 | ≥800 |
| 工具榜单 | 横向评测→优劣→排名推荐 | `FAQPage` | MOFU | 商业/交易 | ≥1200 |
| 教程页 | Step-by-step+截图→H3分步→信任→转化 | `Article` | TOFU | 信息 | ≥800 |
| 关于页 | 故事→团队→数据→CTA | `Organization` | — | 导航 | ≥500 |
| 联系页 | 表单→信息 | `ContactPage` | — | 导航 | ≥200 |

> ⚠️ **字数 v2.2 起改为 SERP 驱动（见 §1.2）**：上表数字仅为「最小地板」，低于则内容过薄需补；**无上限**，目标 = SERP Top10 平均 ×1.3，写够即止，绝不硬凑到固定值（如 4000）。

---

## 附录 B — 14 维写作技术维度速查〔KB: content-matrix 三，已核对〕

| # | 维度 | 规则要点 |
|---|------|---------|
| 1 | 关键词选择（5 维评分） | KD/意图/商业价值/搜索量/匹配度，每项 1–10（KB: keyword-research §1.3） |
| 2 | 搜索意图判断 | SERP 首页格式决定页面类型 |
| 3 | TOFU/MOFU/BOFU | 80% 精力做商业/交易，20% 信息（TOFU 因 AI 推荐复活）（KB: content-matrix #3） |
| 4 | 关键词分组做一页 | 同意图词归组，H1 主词、H2/H3 长尾 |
| 5 | Title 公式 | `{目标词} — {价值} \| InkFlow` ≤60 字 |
| 6 | Description 公式 | `{价值}+{功能}+CTA` ≤160 字 |
| 7 | H1–H3 层级 | H1=主词、H2=子话题、H3=功能点 |
| 8 | 首段 BLUF | 每段第一句 40–60 字给答案 |
| 9 | 段落自包含 | 抽走一段能独立理解 |
| 10 | 列表和表格 | 每页至少 1 个 |
| 11 | FAQ | 3–5 真实问题 + FAQPage Schema |
| 12 | 内链 | 每页 3–5 条，描述性锚文本 |
| 13 | 信息增益 | 每页至少 1 个"只有你能写"的元素 |
| 14 | AI 引用来源 | AI 也读 G2/Reddit/媒体提及，须经营站外信号 |

---

## 附录 C — Content Brief 模板要点（引用，不重写）

完整模板：`seo-targets/briefs/CLUSTER_BRIEF_TEMPLATE.md`。必含：簇概览（薄页并入决策）、独家角度（按意图适配）、E-E-A-T 通用块（§2）、Schema 计划 + 内链拓扑（§3.1）、逐页 Brief（先 Pillar 再 Spoke，§4）、内链矩阵（§5）、防生搬硬套检查（§5.1）。

---

## 附录 D — 内链规则 R1–R6 + Hub-and-Spoke（引用，不重写）

详见 `seo-knowledge/internal-linking-rules.md` 与 `seo-targets/briefs/CLUSTER_BRIEF_TEMPLATE.md §3.1`。核心：内容区 ≥3 内链、描述性锚文本、Spoke→Pillar 硬规则、Pillar→/blog→/、每页 BreadcrumbList。

---

## 附录 E — 上线前检查清单（合并版）

```
□ Title: 含核心词 | ≤60 字 | 每页唯一
□ Meta: 含核心词+CTA | ≤160 字 | 唯一
□ H1: 含核心词 | 唯一 | 与 Title 不同
□ H2–H3: 自然分布语义相关词，不跳级
□ 首段 BLUF: 直接给答案，40–60 字
□ 段落自包含 + 列表/表格 ≥1
□ URL: /keyword-slug | 短 | 小写连字符 | 发布后不改
□ 图片 alt: 描述性+含词 | 明确 width/height
□ 内链: 内容区 ≥3 条 | 描述性锚文本 | 过 R1–R6 + Hub-and-Spoke
□ Schema: 按页面类型（附录 A）| 含 BreadcrumbList
□ E-E-A-T: 具名作者(Sarah Chen, Founder & CEO)+审核人+≥2 真实引用+日期+@graph
□ FAQ: 3–5 真实问题 + FAQPage Schema（适用页）
□ 信息增益: 每页 ≥1 个"只有你能写"的元素
□ 合规: 健康类加免责声明+一手医疗来源(NHS/AAD/Mayo，YMYL)
□ Canonical: 存在且正确 | 薄/重复页 noindex
□ CTA: 每页 ≥1（注册/试用/了解更多）
□ Build: cd marketing && npm run build → 0 错误
□ Push: git push origin main（不是 master）
```

---

## 附录 F — 红线（不可违反，违反 = 改动不上线）〔KB: CONTENT_INVENTORY 第四节〕

1. 改完必须 `git push origin main`（不是 master）。
2. 本地编辑路径 = `marketing/src/...`（根 `src/` 不部署）。
3. 每页 E-E-A-T 强制：Sarah Chen 具名作者（Founder & CEO at InkFlow）+ 审核人 + ≥2 真实引用 + 日期 + `@graph` JSON-LD。
4. `cd marketing && npm run build` 必须 0 错误再 push。
5. 直接在 `main` 小步提交，不自建分支大改。

---

> 本 SOP 为 v2.2，consolidate 自仓库已有 KB（content-seo / aeo / keyword-methodology / technical-seo / ranking-factors / content-matrix / internal-linking-rules / CLUSTER_BRIEF_TEMPLATE）+ 线上已部署 JSON-LD 真实格式。旧 `INKFLOW-CONTENT-PLAYBOOK.md` 保留作参考，内容流程以本文件为准。
> 维护：随 KB 更新而更新；每次改 SOP 在文末「更新记录」加一行。

### 更新记录
| 日期 | 事件 |
|------|------|
| 2026-07-18 | v2 初版：补写前研究 / 写作标准 / 发布后治理 / YMYL 合规四层 |
| 2026-07-18 | v2.1 修订：核对源文档修正 E-E-A-T 作者块/JSON-LD 真实格式、字数以 content-matrix 一为准、Schema 以 content-matrix 一为准、审核人出处改 brief 模板、健康免责声明改 YMYL 准则；新增 §9 KB 内部冲突与待确认 |
| 2026-07-18 | v2.2 修订（用户决策）：① 域名锁定 ink-flows.com（§9② 解决）；② 字数改为 SERP 驱动 Top10×1.3、取消固定区间（§9④ 解决、§1.2/附录A 改写）；③ §5.2 内链重写——枚举真实集群 link map + 目标页不存在铁律 + 标记 Aftercare Hub 缺失为真实缺口（§9⑥） |

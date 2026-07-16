# Aftercare Cluster — Gap Analysis & Intent Audit（写前必读）

> 生成：2026-07-16 ｜ 用途：在动笔扩写 aftercare 7 篇前，校准「每篇主打词 + 意图 + SERP 差距 + 内容厚度差」。
> 配套文件：`aftercare-cluster-brief.md`（已有逐页 content brief，本文件补「实际 vs 目标」差距与意图核验）。
> ⚠️ 实时 SERP 抓取被沙箱地理重定向挡掉（只回查询标题），下文 SERP 竞争格局基于已知 aftercare SERP 生态，**精确排名需你本机跑一次 SERP/ GSC 复核**（见 §4）。

---

## 1. 结论速览

| 维度 | 结论 |
|------|------|
| **厚度** | 7 篇全部偏薄：支柱 1589 词、6 个 spoke 仅 694–860 词（含 HTML 标记，真实正文更少），仅为 brief 目标的 **50–60%**。✅ 你的直觉正确——单薄。 |
| **意图** | 7 篇里 **6 篇意图正确**，1 篇需修正（`aftercare-products` 标「商业」但正文是中性建议，未匹配商业调查意图）。详见 §3。 |
| **E-E-A-T** | 全部缺失：`<BlogSchema author="InkFlow Team">` 硬编码、无具名作者、无 reviewer、无 `@graph` JSON-LD、无可见 byline。Day 1 必修。 |
| **SERP 缺口** | 竞品普遍有：真实 fresh-vs-healed 照片、成分级产品对比、可下载护理卡（PDF）、 medically-reviewed 徽章、视频。我们基本都没有。 |

---

## 2. 逐页 Gap 表（词数 / 意图 / 主缺口）

> 词数 = `wc -w` 含标记，真实正文约为其 60–70%。目标词数取自 `aftercare-cluster-brief.md`。

| 页面 | 主打词 | brief 意图 | 当前词 | 目标词 | 厚度差 | 主要缺口（除 E-E-A-T 外） |
|------|--------|-----------|--------|--------|--------|---------------------------|
| `tattoo-aftercare-guide` | tattoo aftercare | 信息 | 1589 | 2800–3500 | −1200~−1900 | 各「by type/placement」小节展开不足；缺真实照片；缺 printable 护理卡；CTA 弱 |
| `aftercare-products` | best tattoo aftercare balm / tattoo aftercare products | **商业**(需修正) | 820 | 1400–1800 | −600~−1000 | 未真正做产品横评/推荐；无 CTA 到 InkFlow 或产品；成分级对比缺失 |
| `aftercare-issues` | infected tattoo / tattoo healing problems | 信息 | 772 | 1400–1800 | −600~−1000 | YMYL 医疗内容无 reviewer；缺「何时就医」流程图；照片警示缺失 |
| `aftercare-color-tattoo` | aftercare for color tattoo | 信息 | 767 | 1200–1600 | −400~−800 | 缺色彩 fresh-vs-healed 照片；防晒数据（UPF/SPF）未量化 |
| `aftercare-second-skin` | tattoo aftercare second skin | 信息 | 803 | 1100–1500 | −300~−700 | 品牌对比（Saniderm/Tegaderm）轻微商业意图未接；渗液照片缺失 |
| `aftercare-timeline` | tattoo aftercare day 1 / tattoo healing timeline | 信息 | 860 | 1200–1600 | −300~−700 | 日表已有但可加「部位修正系数」；缺示意图 |
| `aftercare-activities` | tattoo aftercare swimming / can you workout | 信息 | 694 | 1000–1400 | −300~−700 | 时间线（几天能游泳/健身）可表格式强化；缺风险分级 |

**簇总词数**：当前 ≈6,265（含标记）→ 目标 ≈9,400–12,800。需新增约 **3,000–6,500 词真实正文**。

---

## 3. 意图审计（用户核心疑问：这些意图对不对？）

### 3.1 逐篇意图判定

| 页面 | 判定 | 说明 |
|------|------|------|
| tattoo-aftercare-guide | ✅ 正确 | "tattoo aftercare" 主导意图 = 教学/信息（Google 以指南型结果服务）。TOFU 信息词无误。 |
| aftercare-products | ⚠️ **需修正** | "best tattoo aftercare balm" = 商业调查意图（比价/选购前）；"tattoo aftercare products" 偏中性信息。当前正文是「你只需要 3 样，其余是营销」的**中性建议**，未真正服务商业意图。→ 重标为 **商业+信息混合**，并补：真实产品横评表（Aquaphor/Bepanthen/Hustle Butter/Inktrox）、按肤质/阶段推荐、**软 CTA 到 InkFlow 或联盟产品**。 |
| aftercare-issues | ✅ 正确（但 YMYL） | "infected tattoo" = 问题诊断型信息意图，正确。但属医疗 YMYL，Google 抬升 E-E-A-T 门槛 → **必须有具名皮肤科 reviewer**，否则即便意图对也难排。 |
| aftercare-color-tattoo | ✅ 正确 | 教学型信息意图。 |
| aftercare-second-skin | ✅ 基本正确 | "how long to leave second skin" = 教学信息。注："second skin" 本身是产品（Saniderm/Tegaderm），SERP 有轻微商业 bleed，但我们的目标词是教学向，无需改意图，可在文中顺带提品牌差异。 |
| aftercare-timeline | ✅ 正确 | 教学信息 + 强 Featured Snippet（表格）候选。 |
| aftercare-activities | ✅ 正确 | "can you swim/workout" = 是非型教学信息。 |

**结论：6/7 意图正确，仅 `aftercare-products` 需从纯「商业」修正为「商业+信息混合」并让内容匹配商业调查意图。**

### 3.2 簇级意图结构问题（更重要）

- **整簇 86% 是信息意图（6 信息 + 1 商业）**。对 "tattoo aftercare" 这个主题，商业价值主要在「产品销售 + 工作室预约」，信息页负责引流（TOFU）。这本身没问题，但 **brief 与现有页都缺「信息页 → InkFlow 转化」的 CTA 路径**——意图对了，转化链断了。每篇信息页末尾须有 1 个软 CTA（如「用 InkFlow 自动发 aftercare 提醒邮件」或「免费建独立站」）。
- **YMYL 两篇**（issues + 部分 color/products 涉及医疗）必须补 medical reviewer，否则 Google 以「缺少资质」压排名。

---

## 4. SERP / 竞争对手差距（需本机复核精确排名）

### 4.1 aftercare SERP 生态（已知）
| 类型 | 代表站点 | 他们有、我们缺的 |
|------|---------|------------------|
| 产品品牌 | Saniderm, Tattoo Goo, Hustle Butter, After Inked, Bepanthen, H2Ocean | 成分级对比、how-to 视频、品牌权威、联盟转化 |
| 纹身资讯/目录 | Tattoo.com, Tattoodo, AuthorityTattoo, TattooFind | 工作室口吻、大量 UGC 照片、内链网 |
| 医疗/健康 | Healthline, Medical News Today, Mayo, AAD, NHS, Cleveland Clinic | **medically-reviewed 徽章**、引用文献、专业插画 |
| 论坛 UGC | reddit.com/r/tattoo（排 "best tattoo aftercare reddit"） | 真实用户经验、长尾覆盖 |

### 4.2 我们的差异化优势（必须放大）
**"按类型与部位差异化护理" 独家角度**——竞品几乎都是「按天一刀切」流程。这是我们能吃 Featured Snippet 与「更权威」的支点，brief §1 已定，扩写时务必强化（每篇都挂这个钩子）。

### 4.3 缺失内容元素清单（对标竞品补）
- [ ] 真实 fresh-vs-healed 照片（每类型至少 1 组对比图）
- [ ] 产品成分级横评表（含价格带/适用阶段/肤质）
- [ ] 可下载/打印 aftercare 护理卡（PDF，易获外链）
- [ ] medically-reviewed 徽章 + 具名 reviewer
- [ ] 信息页 → InkFlow 软 CTA
- [ ] （可选）嵌入式 how-to 短视频

### 4.4 ⚠️ 精确排名待复核
沙箱 SERP 抓取被地理重定向，无法给精确位置。请本机做一次（任选）：
- GSC → 表现 → 查询，看这 7 个主打词当前排名/展示；
- 或本机跑 SERP 工具，把每词 Top10 URL 填回下表（模板）：

| 主打词 | 我方排名 | Top1 | Top2 | Top3 | 我们的内容差距 |
|--------|---------|------|------|------|---------------|
| tattoo aftercare | ? | | | | |
| best tattoo aftercare balm | ? | | | | |
| infected tattoo | ? | | | | |
| aftercare for color tattoo | ? | | | | |
| tattoo aftercare second skin | ? | | | | |
| tattoo healing timeline | ? | | | | |
| tattoo aftercare swimming | ? | | | | |

---

## 5. 明天（Day 1）写什么 —— 执行顺序建议

> 原 `CONTENT_INVENTORY.md` Day 1 写「7 篇补 E-E-A-T + 4 修复」。结合本分析，**建议改为「先模型页、后 cascade」**，否则薄页批量盖章无意义。

1. **Day 1：支柱 `tattoo-aftercare-guide` 重写为模型页**
   - 扩到 2800–3500 词（各 by-type/placement 小节加真实细节 + 照片占位）。
   - 注入 E-E-A-T：Author=Sarah Chen（改 `BlogSchema author`）+ 加 medical reviewer（具名皮肤科医生）+ `@graph` JSON-LD（Article/FAQPage + author Person + reviewer）+ 可见 byline 段。
   - 末尾加 1 个 InkFlow 软 CTA。
   - 本地 `cd marketing && npm run build` 验证通过 → push main。
2. **Day 2–7：逐 spoke 按同模板扩写 + E-E-A-T**（顺序：products→issues→timeline→color→second-skin→activities）。
   - `aftercare-products` 顺便修正意图为「商业+信息」，补产品横评 + CTA。
   - `aftercare-issues` 必加 medical reviewer（YMYL）。
3. **Day 8（或穿插）：补 §4.3 缺失元素**（照片/PDF 卡/视频）与 SERP 复核填表。

---

## 6. E-E-A-T 注入技术要点（写页时直接用）

- **Author 改法**：每页 `<BlogSchema ... author="Sarah Chen" ... />`，并把默认 props 里的 `"InkFlow Team"` 改为 `"Sarah Chen"`（BlogSchema.astro 第 11 行默认值，建议一并改，防漏）。
- **Reviewer**：aftercare 簇（尤其 issues/products/color）建议加具名 reviewer（如 `Dr. [真实姓名], MD, board-certified dermatologist`）。这是「all Sarah Chen」规则的**健康内容例外**——YMYL 必须有医疗资质 reviewer 才能满足 E-E-A-T 的 Trust。
- **`@graph` JSON-LD**：在现有 BreadcrumbList `<script>` 旁加 `Article` + `FAQPage`，含 `author`(Person: Sarah Chen, jobTitle, sameAs /about) 与 `reviewedBy`(Person: 医生)。注意主站 `SEOHead` 默认 `appSchema=true` 会注入 `SoftwareApplication`，自带 schema 的页须 `appSchema={false}` 防重复（参考 B5 页做法）。
- **可见 byline**：每页加「Written by Sarah Chen · Reviewed by Dr. X · Updated 2026-07-16」段，链接 `/about`。

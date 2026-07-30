# Shark Species Cluster — Content Brief（簇级）

> 流水线：TOP10 SERP 差距分析 → 本 Brief → 建页（先 Pillar 已上线，再 3 Spoke）→ 注入 Meta/Title/H1/Schema/内链。
> 范围：3 个核心 spoke（great-white / hammerhead / shark-tooth），自 shark 柱页（已部署）分出。
> 调研日期：2026-07-30。E-E-A-T 作者 Sarah Chen、reviewer（sea-life = National Geographic）由页面模板自动注入。

---

## 0. 簇概览

| 页面 | 类型 | slug | 决策 |
|------|------|------|------|
| shark（柱页，已上线） | 指南 | `sea-life/shark-tattoo-meaning` | 已建 |
| great-white | 指南（物种页） | `sea-life/great-white-tattoo-meaning` | **新建** |
| hammerhead | 指南（物种页） | `sea-life/hammerhead-tattoo-meaning` | **新建** |
| shark-tooth | 指南（文化母题页） | `sea-life/shark-tooth-tattoo-meaning` | **新建** |

实际产出 = 3 页（柱页吸收薄页为小节，不另开页）。

---

## 1. 独家角度（Exclusive Angle）

本簇主意图 = TOFU 信息（物种含义 + 文化），但每个 spoke 吃下竞品**未系统覆盖**的真实信息增益：

- **great-white**：① 科学准确性（Carcharodon carcharias、最大掠食性鱼类、反荫蔽、区域恒温、35mph/1.8t 咬合力、70+ 年寿命、雌性约 30 岁才性成熟→慢繁殖）；②「 apex 却易危」悖论（IUCN 易危、CITES、美/地中海岸禁捕、兼捕压力）→ 把图腾写成对海洋顶级掠食者的敬意，而非怪兽；③ 辟谣「鲨鱼必须不停游动」（lamnid 多为强制冲压呼吸，但非所有鲨都如此，隐喻≠生物事实）。
- **hammerhead**：① 锤头（cephalofoil）的真实功能（流体动力、加宽嗅囊、宽间距眼→更宽视野+前侧景深、更多电感受器官探测埋沙猎物）→ 翻译为「远见 / 守护觉察 / 防御」；② 辟谣「360° 全景」(Britannica 仅证更宽视野+前侧景深，非完整环形)；③ 个体性（唯一外形=非从众）；④ 受威胁血统（多种锤头鲨 IUCN 受威胁）。
- **shark-tooth（niho mano）**：波利尼西亚母题语法深度——不是「一颗牙=力量」，而是三角列=护盾、'aumakua（守护祖先神）、lōkahi（三三角=团结/责任 kuleana）、萨摩亚 tatau 边缘、夏威夷脚踝传说、以及「非波人佩戴需尊重考据」的免责。竞品只浅提保护/力量，文化语法是 ABSENT。

---

## 2. E-E-A-T 通用块（全簇复用，模板自动注入）

- Author：Sarah Chen（Founder & CEO, InkFlow；12 年纹身店运营）— 自动。
- Reviewer（sea-life）：National Geographic（Cultural heritage authority）— 自动。
- 真实引用（2+，禁 Wikipedia）：
  - Great white → National Geographic, *Great white shark facts* (https://www.nationalgeographic.com/animals/fish/facts/great-white-shark) + IUCN Red List (https://www.iucnredlist.org)。
  - Hammerhead → Britannica, *Hammerhead shark* (https://www.britannica.com/animal/hammerhead-shark) + IUCN Red List。
  - Shark tooth → Polynesian Tattoo Symbols, *Shark teeth / niho* (https://www.polynesiantattoosymbols.com/symbol-shark-teeth.html)。
- 发布/更新：published 2026-07-12；3 spoke updated 2026-07-30（写入 EEAT_UPDATED）。
- 第一手经验信号：EEAT_EXPERIENCE（500+ 店含义 intake）由模板注入。

---

## 3. Schema 计划

| 页面 | 类型 | Schema |
|------|------|--------|
| 3 spoke | 指南 | `Article` + `FAQPage`（由模板自动注入，slug 驱动） |
| 全簇 | — | 每页 `BreadcrumbList`（Home › Tattoo Meanings › Sea Life › Symbol，模板自动） |

### 3.1 内链拓扑（强制）

1. **Spoke → Pillar**：每 spoke 的 `relatedSymbols` 含 `'shark'`（显式回链柱页）。
2. **Pillar → Spoke**：shark 柱页 `relatedSymbols` 已含 great-white/hammerhead/shark-tooth（部署后自动成链）。
3. **Spoke ↔ Spoke**：三 spoke 互列彼此于 `relatedSymbols`（横向凝聚）。
4. **向上链**：由模板 header/footer + BreadcrumbList 自动带（Home / Tattoo Meanings / Sea Life）。
5. **More Meanings**：同分类（sea-life）自动互链，含 shark。

---

## 4. 逐页 Brief

### 4.1 Spoke — Great White Shark

| 字段 | 值 |
|------|-----|
| 主词 | great white shark tattoo meaning |
| 副词 | great white tattoo symbolism, great white shark tattoo, apex predator tattoo |
| 路径 | `/tattoo-meaning/ocean/great-white-tattoo-meaning` |
| 类型 | 指南（TOFU 信息） |
| 字数 | 数据层 ~2500–3500（结构化字段） |

**H1**：Great White Shark Tattoo Meaning ｜ **Title**（≤60）：Great White Shark Tattoo Meaning & Symbolism ｜ **Meta**（≤160）：Great white shark tattoo meaning: power, dominance, fearlessness. Explore the science, the apex-but-vulnerable paradox, Jaws, and cultural roots.
**大纲（BLUF 开头）**：含义速答 → 科学（Carcharodon carcharias / 反荫蔽 / 区域恒温 / 35mph / 1.8t 咬力 / 慢繁殖）→ apex 却易危（IUCN 易危 / CITES / 禁捕 / 兼捕）→ Jaws 恐惧叙事的翻转 → vs hammerhead 怎么选 → 辟谣「不停游动」→ 风格与 placement。
**FAQ 来源**：真实 PAA/竞品聚合（what does it mean / spiritual / vs hammerhead / conservation / style / placement / man vs woman）。
**内链**：↑ shark（pillar）；→ hammerhead / shark-tooth / whale。

### 4.2 Spoke — Hammerhead Shark

| 字段 | 值 |
|------|-----|
| 主词 | hammerhead shark tattoo meaning |
| 副词 | hammerhead tattoo symbolism, hammerhead shark meaning, unique perspective tattoo |
| 路径 | `/tattoo-meaning/ocean/hammerhead-tattoo-meaning` |
| 类型 | 指南（TOFU 信息） |

**H1**：Hammerhead Shark Tattoo Meaning ｜ **Title**：Hammerhead Shark Tattoo Meaning & Symbolism ｜ **Meta**：Hammerhead shark tattoo meaning: vision, perspective, protective awareness. Explore the cephalofoil, the 360-awareness myth, individuality, and cultural roots.
**大纲**：含义速答 → 锤头真实功能（cephalofoil：流体/嗅/电感受/视野）→ 远见·守护觉察·防御 → 个体性（唯一外形）→ 波利尼西亚/夏威夷传统（aumakua / 海之秩序神）→ 受威胁血统（IUCN 受威胁锤头鲨）→ 风格与 placement。
**内链**：↑ shark；→ great-white / shark-tooth / whale。

### 4.3 Spoke — Shark Tooth (Niho Mano)

| 字段 | 值 |
|------|-----|
| 主词 | shark tooth tattoo meaning |
| 副词 | niho mano, polynesian shark teeth, shark tooth tattoo symbolism |
| 路径 | `/tattoo-meaning/ocean/shark-tooth-tattoo-meaning` |
| 类型 | 指南（文化母题，TOFU） |

**H1**：Shark Tooth Tattoo Meaning (Niho Mano) ｜ **Title**：Shark Tooth Tattoo Meaning & Niho Mano Symbolism ｜ **Meta**：Shark tooth tattoo meaning (niho mano): protection, strength, guidance. Explore the Polynesian motif's grammar — aumakua, lokahi unity, Samoan/Hawaiian roots.
**大纲**：含义速答（不止一颗牙，而是护盾语法）→ 'aumakua 家族守护 → lōkahi 三三角团结（kuleana 双向责任）→ 萨/夏/马克萨斯多语法（tatau 边缘 / 脚踝传说 / 家族专属组合 / 大溪地日）→ 尊重佩戴（非波人考据）→ 风格与 placement（带状 forearm/calf/chest border）。
**内链**：↑ shark；→ great-white / hammerhead / whale。

---

## 5. 内链矩阵（全簇）

| 从 → 到 | 锚文本 | 位置 |
|---------|--------|------|
| shark → great-white / hammerhead / shark-tooth | 物种名 | Related Shark Designs（柱页已有） |
| 每 spoke → shark | Shark | Related {name} Designs |
| great-white ↔ hammerhead ↔ shark-tooth | 物种名 | 互相 relatedSymbols |
| 每 spoke → /tattoo-meaning/ocean（Sea Life 向上链） | Sea Life | 模板 breadcrumb |
| 每 spoke → /（首页） | InkFlow | 模板 header/footer |

---

## 6. 下一步

1. 已按 Brief 注入 3 词条 + EEAT_UPDATED。
2. esbuild 解析校验（0 Wikipedia、73 slug）。
3. commit main → 用户本机 `git push origin main:production`。

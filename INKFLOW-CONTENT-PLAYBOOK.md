# InkFlow 建站操作手册

> 从找词到内容上线，每一步怎么做
> 知识库框架：六站建站法（SEO Execution System）

---

## 📋 总流程速览

```
周一      周二      周三      周四      周五
找词+KD → 标intent → 定page_type → 写内容 → 优化+发布
```

---

## Step 1：找词 + KD（站1）

### 目标
建一个 InkFlow 专属的关键词表，50-100 词起步。

### 词根脑暴（30 分钟）
InkFlow 是 SaaS，词根跟 Peach 完全不同。按 4 个 Cluster 来想：

| Cluster | 词根 | 示例 |
|---------|------|------|
| **Booking** | tattoo booking, tattoo appointment, tattoo scheduling, book tattoo | "tattoo booking software", "tattoo appointment app" |
| **Waivers** | tattoo waiver, digital consent, tattoo intake form, release form | "tattoo waiver app", "digital tattoo consent form" |
| **CRM** | tattoo client management, tattoo CRM, tattoo studio management | "tattoo client software", "tattoo studio management" |
| **Payments** | tattoo deposit, tattoo payment, commission split | "tattoo deposit software", "tattoo payment processing" |
| **通用** | tattoo studio, tattoo shop, tattoo artist | "best tattoo studio software", "tattoo shop app" |

### Intent 分类

| Intent | 说明 | InkFlow 示例 |
|--------|------|-------------|
| 🔍 **信息型** | 用户想了解知识，不想买 | "how to digitize tattoo waivers", "what is tattoo CRM" |
| 🛒 **交易型** | 用户想买/注册 | "tattoo booking software", "tattoo studio management software" |
| ⚖️ **商业考察** | 用户在对比产品 | "InkFlow vs Booksy", "best tattoo booking app 2026" |
| 📍 **本地型** | 用户找附近纹身店 | "tattoo shop austin"（链到 booking funnel） |

### Page Type 映射

| Intent | 页面类型 | URL 示例 |
|--------|---------|---------|
| 信息型 | Blog / Guide | `/blog/how-to-digitize-tattoo-waivers` |
| 交易型 | Feature 页 / Landing | `/features/booking`, `/pricing` |
| 商业考察 | 对比页 | `/compare/booksy` |
| 本地型 | 城市落地页 | `/book/austin` |

---

## Step 2：内容模板（站3）

### 博客模板（信息型）

```markdown
---
title: "How to [解决什么问题]"
description: "[含核心词 + CTA]"
author: [名字]
pub_date: YYYY-MM-DD
category: [Booking/Waivers/CRM/Payments]
---

## [H1: 含核心词]
[简短引语：为什么你有资格写这个]

## H2: 问题/痛点
- 场景描述
- 数据支撑

## H2: 解决方案（含核心词 + 相关词）
- 方案 A
- 方案 B

## H2: InkFlow 怎么做（软推广）
> CTA: Try InkFlow free → 

## H2: FAQ（含 FAQPage Schema）
Q: 常见问题？

## 结尾 CTA
Join 500+ studios. Start free.
```

### Feature 页模板（交易型）

```
┌──────────────────────────────────────────┐
│ Hero: H1 含核心词 + 一句话描述           │
│  CTA: Start Free Trial                   │
├──────────────────────────────────────────┤
│ Feature 1: 标题 + 描述 + 截图            │
│ Feature 2: 截图 + 标题 + 描述（交替）    │
│ Feature 3: 标题 + 描述 + 截图            │
├──────────────────────────────────────────┤
│ Related Articles（→ 博客 cluster 页）     │
│ Related Features（→ 其他 feature 页）     │
├──────────────────────────────────────────┤
│ CTA: Try InkFlow Free                    │
│ Footer                                   │
└──────────────────────────────────────────┘
```

### 对比页模板（商业考察型）

```
┌──────────────────────────────────────────┐
│ Hero: H1 "InkFlow vs X"                 │
├──────────────────────────────────────────┤
│ Feature Comparison Table                 │
│  ├ 价格对比                              │
│  ├ 功能对比（纹身专精/waivers/aftercare）│
│  └ 评分对比                              │
├──────────────────────────────────────────┤
│ 深度分析段落 × 3                         │
│  (1) 价格差异的分析                      │
│  (2) 功能差异的分析                      │
│  (3) 为什么 InkFlow 更适合纹身师         │
├──────────────────────────────────────────┤
│ CTA: Try InkFlow Free →                  │
└──────────────────────────────────────────┘
```

---

## Step 3：每页发布前检查清单（站4）

每页上线前逐一打勾：

```
□ Title: 含核心词 | <60字符 | 每页唯一
  → "Tattoo Booking Software — InkFlow | Free Trial"
  → "How to Reduce No-Shows — InkFlow Blog"

□ Meta Description: 含核心词+CTA | <160字符
  → "Reduce no-shows by 80% with InkFlow's deposit-based tattoo booking
     software. Free plan available. Start your trial today."

□ H1: 含核心词 | 唯一 | 跟 Title 不同
  → Title: "Tattoo Booking Software — InkFlow"
  → H1: "Smart Booking Software for Tattoo Studios"

□ H2-H3: 自然分布语义相关词
  → deposit scheduling, automated reminders, multi-artist calendar

□ URL: /keyword-slug | 短 | 小写连字符
  → /features/booking ✓
  → /features/booking-software-for-studios ✗（太长）

□ 图片 alt: 有 | 描述性 | 适当含词
  → "InkFlow booking calendar deposit settings screenshot"
  → "InkFlow automated SMS reminder tattoo appointment"

□ 内链: ≥2 条 | 锚文本自然 | 链向相关页
  → From /features/booking → 链到 /blog/reduce-no-shows
  → From /blog/reduce-no-shows → 链回 /features/booking

□ Schema: 按页面类型配
  → Feature 页: SoftwareApplication
  → Blog: Article + author
  → Compare: Product + ComparisonTable
  → FAQ: FAQPage

□ CTA: 每页至少 1 个
  → "Start Free Trial" 或 "Read More" 或 "See Features →"
```

---

## Step 4：KD ≤ 30 优先内容清单

按 Cluster 列出当前缺的高优先级内容：

### 🔴 Booking Cluster（3-5 篇）
| 关键词 | KD | Intent | URL | 状态 |
|--------|----|--------|-----|------|
| tattoo booking software | 待查 | 交易型 | /features/booking | ✅ 已有 |
| best tattoo appointment app | 待查 | 商业考察 | /blog/best-tattoo-appointment-app | ❌ 缺 |
| how to set up tattoo online booking | 待查 | 信息型 | /blog/how-to-set-up-online-booking | ❌ 缺 |
| tattoo deposit scheduling | 待查 | 信息型 | /blog/tattoo-deposit-scheduling-guide | ❌ 缺 |
| reduce tattoo no-shows | — | 信息型 | /blog/reduce-no-shows-deposit-booking | ✅ 已有 |

### 🔴 Waivers Cluster（3-5 篇）
| 关键词 | KD | Intent | URL | 状态 |
|--------|----|--------|-----|------|
| digital tattoo consent form | 待查 | 交易型 | /features/waivers | ✅ 已有 |
| best tattoo waiver app | 待查 | 商业考察 | /blog/best-tattoo-waiver-app | ❌ 缺 |
| tattoo waiver software free | 待查 | 交易型 | /free-tools/free-waiver-generator | ✅ 已有 |
| how to digitize tattoo waivers | — | 信息型 | /blog/how-to-digitize-tattoo-waivers | ✅ 已有 |

### 🔴 CRM Cluster（3-5 篇）
| 关键词 | KD | Intent | URL | 状态 |
|--------|----|--------|-----|------|
| tattoo client management software | 待查 | 交易型 | /features/crm | ✅ 已有 |
| tattoo studio CRM | 待查 | 交易型 | /features/crm | ✅ 已有 |
| tattoo client follow-up automation | 待查 | 信息型 | /blog/client-follow-up-automation | ❌ 缺 |
| how to manage tattoo clients | 待查 | 信息型 | /blog/tattoo-client-management-tips | ❌ 缺 |

### 🔴 Deposits Cluster（2-3 篇）
| 关键词 | KD | Intent | URL | 状态 |
|--------|----|--------|-----|------|
| tattoo deposit collection software | 待查 | 交易型 | /features/payments | ✅ 新建 |
| how to collect tattoo deposits | 待查 | 信息型 | /blog/tattoo-deposit-collection-guide | ❌ 缺 |
| tattoo commission split software | 待查 | 交易型 | /features/payments | ✅ 已有 |

---

## Step 5：每周节奏（站3 内容节奏）

| 日 | 上午 | 下午 |
|---|------|------|
| 周一 | 找 5 个低 KD 词 | 定 intent + page_type |
| 周二 | 按模板写初稿 | 加 EEAT：作者/引用/案例 |
| 周三 | 写初稿 | 写初稿 |
| 周四 | 优化：自查清单过一遍 | 加 Schema + 内链 |
| 周五 | 发布 + 同步社媒摘要 | 复盘：搜索排名变化 |

---

## 附录：Astro 操作速查

```bash
# 新建博客
cp marketing/src/pages/blog/how-to-digitize-tattoo-waivers.astro \
   marketing/src/pages/blog/[new-slug].astro
# 改 frontmatter + 内容

# 本地预览
cd marketing && npm run dev

# 构建检查
npm run build

# 部署（推 GitHub 后自动）
git push
```

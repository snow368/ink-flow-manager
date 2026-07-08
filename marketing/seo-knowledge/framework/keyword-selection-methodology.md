# 关键词选取方法论（2026）

---

## 适用分类
关键词研究, 方法论

## 一、选词的核心标准

选词不是只看 KD，而是综合 5 个维度打分：

| 维度 | 权重 | 说明 |
|------|------|------|
| **KD（竞争度）** | ⭐⭐⭐⭐⭐ | 当前 DR 能不能做？0-15 起步，15-30 积累期 |
| **搜索意图** | ⭐⭐⭐⭐⭐ | 商业/交易型 > 信息型。搜这个词的人是想买还是想学？ |
| **商业价值** | ⭐⭐⭐⭐ | 这个词带来注册的概率有多大？对比页 > 功能页 > 博客 |
| **搜索量** | ⭐⭐⭐ | 太低的词做了没流量，太高的词做不上去 |
| **内容匹配度** | ⭐⭐⭐ | 这个词能不能自然融入我们已有的内容结构？ |

### 评分系统

每个词按 5 项打分（1-10 分），总分 50：

```
举例：digital tattoo consent form app
  KD 5-10            → 9 分（非常低）
  商业型               → 8 分（用户在找产品）
  商业价值高           → 8 分（直接功能匹配）
  月搜索量 200-500    → 6 分（中等）
  内容易匹配          → 9 分（正好有 Waivers 功能页）
  总分 40/50 ✅ 做
```

---

## 二、搜索意图判断

### 4 种意图 + 对应的内容类型

| 意图 | 搜什么 | 转化率 | 对应内容 | 例子 |
|------|--------|--------|---------|------|
| **交易型** | vs / best / review / pricing | 10-20% | 对比页、替代品页 | "tattoo studio pro alternatives" |
| **商业型** | software / app / system / tool | 6-10% | 功能页 | "tattoo booking software" |
| **信息型** | how to / guide / what is | 0.5-2% | 博客 | "how to digitize tattoo waivers" |
| **导航型** | 品牌名 / 产品名 | — | 品牌页 | "inkflow" |

### 快速判断意图的方法
```
搜这个词 → 看 Google 首页结果类型：

全是 Landing Page / Product Page → 商业型
全是 Blog / Guide → 信息型
全是 Compare / vs → 交易型
全是品牌页 → 导航型
```

**原则：** 前期 80% 精力做商业型+交易型，20% 做信息型。

---

## 三、竞争度判断（不花钱的方法）

### 手动 KD 检查表
```
打开 Google，搜这个词 → 看首页：

✅ 低 KD（可以做）：
  □ Reddit/Quora/论坛排首页
  □ 博客文章排名，不是产品首页
  □ 只有 0-2 个广告
  □ 搜索结果 <5000 万条
  □ 内容过时的文章还在前排

❌ 高 KD（暂时别碰）：
  □ Forbes/HubSpot/Shopify 排首页
  □ Wikipedia 在首页
  □ 全是 Landing Page
  □ 4+ 个广告
  □ 搜索结果 >1 亿条
```

---

## 四、关键词分组（聚合做一页）

不要零散做关键词。把**同一搜索意图**的词归组，一页覆盖一组。

```
组：纹身工作室的 Waiver 方案
  ├── "digital tattoo consent form app"       KD 5-10  商业型
  ├── "digital waiver for tattoo shop"        KD 5-10  商业型
  ├── "tattoo consent form digital"           KD 10-15 商业型
  ├── "best tattoo waiver app ipad"           KD 5-10  交易型
  → 做一篇页面 《Digital Waivers for Tattoo Studios》
  → 1 页覆盖 4 个词
```

### 怎么分组
```
1. 找出相关词（Ahrefs/手动搜相关搜索）
2. 看搜索意图 — 同一意图的放一组
3. 选 KD 最低的做 H1
4. 其他做 H2/H3
5. 一页只做一个意图
```

---

## 五、竞品关键词差距分析

### 手动操作步骤
```
1. 找出 3 个主要竞品
   → Tattoo Studio Pro / Tattoogenda / Booksy

2. 搜竞品排的词
   用 site:competitor.com 看他们有哪些页面
   或者用 Ahrefs（如果有的话）
   
3. 找到"他们排了、你没做的词"
   这些就是你的机会
```

### 操作用 AITDK
安装 AITDK 插件 → 打开竞品网站 → Traffic Analysis 看他们的 top keywords → 直接抄他们有流量你没做的词。

---

## 六、InkFlow 选词执行流程

### 每月一次的关键词审计

```
Step 1: 列出当前已做的关键词
  → 看哪些排上去了、哪些没排
  → GSC 查哪些词带来流量

Step 2: 找新词机会
  → AITDK 看竞品新增了什么词
  → Reddit r/tattoo 找新话题
  → Ahrefs（如有）看 Related

Step 3: 打分排序
  → 按 5 维度打分
  → KD 0-15 排最前
  → 商业/交易型优先

Step 4: 分配到内容日历
  → 最高分的排这周
  → 对比页优先于功能页优先于博客
```

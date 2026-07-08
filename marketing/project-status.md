# InkFlow Project Status
# Last updated: 2026-06-10

## P0.6 ✅ — i18n Italian 补齐 (2026-06-10)
- Italian 从 570→717 keys，与 English 完全对齐
- 补齐 147 个缺失 key：session/checkin/respond/review/referral/outreach/lead_revise/new_client
- 所有语言（en/es/pt/fr/de/it/jp）统一 717 keys
- `npx tsc --noEmit` ✅

## P0.3 ✅ — Quota 移到后端 (2026-06-10)
- **后端** `server/index.mjs`:
  - 新增 `quotas.json` 持久化存储（plan, storageLimitMb, storageUsedMb）
  - `GET /api/quota/:artistId` — 查询配额/用量
  - `POST /api/quota/check` — 检查是否超限（requireAuth）
  - `POST /api/quota/report` — 上报存储用量变更
  - `POST /api/quota/set-plan` — 管理员改 plan
- **前端** `src/lib/quota.ts`:
  - 重写为优先走后端 API，离线 fallback 本地 Dexie 估算
  - `canAddStorage()`: 先调 `POST /api/quota/check`，不可用则本地算
  - 新增 `reportStorageDelta(artistId, plan, deltaBytes)`: 上传/删除图片后上报
  - 新增 `getStorageUsage(user, artistId)`: 从服务端获取用量
- **调用点更新**:
  - `IntakePage.tsx` — 上传后调用 `reportStorageDelta`
  - `ClientPaymentPage.tsx` — 上传后调用 `reportStorageDelta`
- **测试**: `npx tsc --noEmit` ✅ 0 error, `node -c server/index.mjs` ✅

## Portfolio / Image Management (完整方案)
- DB v31~v33: PortfolioRecord 加 clientId, sessionId, source, sortOrder, serviceType, isFlash, isSold
- 四种视图：All Photos / Timeline / By Session / By Client
- 拖拽排序（sortOrder + HTML5 drag-and-drop），Reorder 模式
- 图片编辑器（7 种滤镜 + 亮度/对比度滑块）
- 服务类型关联（Tattoo/Piercing/Consultation 等），点图直接预约
- Flash 作品标记已售/可约，Flash 筛选视图
- Session 页面一键 "Add to Portfolio"（session 照片自动同步）
- 公开作品集页 `/portfolio/:artistId`（Flash 筛选，服务类型 Booking 预填）
- 复制公开链接按钮
- Booking 页面顶部画廊 + `?style=` URL 参数预填

## Case Studies Page
- Hermes 新建 `/case-studies` 页面（802行），假数据 Demo 用
- 含功能价值板块（12个功能卡片：以前→现在→省）
- TS 编译错误已修复（`THEME.card`/`btn` 引用问题）
- 混合页模式：功能价值 + 案例研究，等有真实案例再拆

## SEO Tags
- Hermes 加了 index.html SEO meta/OG/Twitter Card/JSON-LD
- manifest.json 加了 PWA categories

## 竞对调研 (2026-06-08)
- 完成 19 个竞对的图片管理功能调研
- InkFlow 是目前唯一同时具备：公开作品集 + 按客户分组 + 按 Session 分组 + Timeline 的方案
- 竞对均无 Session 分组和 Timeline 视图
- 差距项：嵌入代码(iframe)、图片编辑（已补齐）

## 免费建站/落地页 (2026-06-08)
- `/tattoo/:slug` SEO 落地页上线
- LocalBusiness JSON-LD Schema 自动生成
- Portfolio 展示 + Reviews + Booking CTA
- 动态 meta title/description
- 数据来自 User.bioProfile、Portfolio、Reviews
- 下一步：自定义颜色/字体、自定义域名绑定、程序化城市页

## InkFlow Outreach (F:\inkflow app\InkFlow_Project\inkflow_harvests)
- server.ts: 3 tables (inkflow_candidates, inkflow_targets, inkflow_outreach_logs)
- InkFlowOutreach.tsx: stats, DM funnel, target detail, paid conversion
- Visibility: only snow368@gmail.com email in Firebase auth
- Auto-filter: followers 1k-10k, bio contains team/staff/artists/studio, posts >= 3
- Paid conversion: case_study -> paid(pro/$99) or churned(free)
- MRR auto-calculated from targets with plan != free AND subscription_status = active
- Quick actions: contacted/replied/scheduled/trialing/case_study/paid/churned/rejected
- DM templates: English + Chinese, 4 stages (intro/pitch/followUp/close)
- Bug fixes: imported Star, Filter, ExternalLink, UserCheck from lucide-react

## SEO KB (D:\ink-flow-manager\seo-knowledge)
- 42+ sources auto-classified by content type
- Pipeline: user shares link -> AI extracts -> classifies -> writes to sources/ -> updates readme
- Next: domain/keyword/site architecture phase

## Peach Brand (Shopify peachtattoosupplies.com)
- 3 product lines: 主线粉绿, Men灰白, PMU粉透明
- 30 IG accounts, 1 post/day per account
- Bot: bot-worker-cloak.ts, timezone-based working windows
- Manual simulation: typing speed EN 50-120ms/cn 150-350ms, random 1-3s pause
- User dislikes code changes without data; wait for results first

## Tattoo Outreach
- Pipeline: IG DM -> cold email -> forum
- Target: 1k-10k followers, 3+ employees, 2+ posts/week, 10+ reviews
- Free-to-case-study exchange
- KOL: 5-10 artists 1k-50k followers

## Niche Agent (TODO)
- High-margin niche tool finder. Cost ¥50-300, sell €80-600, net >20%
- Selection: niche with 0-2 sellers, Amazon <100 results, reviews >15% negative
- Validation gates: demand/competitor/market/supply-chain/profit/technical
- Record: idea + process + conclusion

## Image Processor (TODO)
- Fal.ai Flux + IP-Adapter for image-to-image style injection
- Next: pipeline code -> API key -> inject style library

## Directives
- 「继续 SEO 执行」= start domain/keyword/site architecture phase
- 「继续学 SEO」= continue content collection/learning
- 「继续 InkFlow」= return to PWA dev
- 「继续 image-processor」= start image pipeline

# ink-flows.com 架构与部署铁律（改动前必读）

> 本文件是 ink-flows.com 的**唯一权威架构说明**。任何改动前先读这一份，不要凭记忆、不要去错仓库。
> 最后一次校订：2026-07-25。今天因"推错仓库"浪费数小时，根因就是没有这份落盘文档。

---

## ⛔ 0. 一句话结论（最重要）
**Cloudflare 读的是 `ink-flow-manager.git`，不是 `inkflow-marketing.git`。**
工作目录 = `D:/ink-flow-manager`。改代码、构建、推送都只在这里做。

---

## 1. 仓库与账号（具体值，照抄）

| 项 | 值 | 说明 |
|---|---|---|
| **LIVE 源 GitHub 仓库** | `snow368/ink-flow-manager.git` | Cloudflare Pages 实际连接、自动部署的就是它 |
| **本地工作目录** | `D:/ink-flow-manager` | 所有 ink-flows 生产改动在此 |
| **Cloudflare 项目名** | `inkflow-marketing` | 注意：项目名含 "marketing"，但仓库是 `ink-flow-manager.git`，**名字不同，别搞混** |
| **自定义域** | `ink-flows.com` / `www.ink-flows.com` / `inkflow-marketing.pages.dev` | |
| **CF 账号** | `owlink.liu@gmail.com`（Account ID `5ee6e81f1376d7f00c9dcfa141991816`） | **与 harvests 系列同一账号**（harvests.pages.dev / cloud-api / ai-core 都是这个） |
| **部署分支** | `main` | Cloudflare 监听 `main`，push 即自动重建 |
| **本地代理推送** | `git -c http.sslBackend=openssl -c http.proxy=socks5h://127.0.0.1:10808 push ...` | V2RayN 10808=SOCKS5；直连常遇 `TLS unexpected eof`，加重试即可 |

### ⚠️ 死仓库（绝不要再碰）
- `D:/ink-flows`（GitHub `snow368/inkflow-marketing.git`）——**Cloudflare 不读它**。
  之前误把 shark 推到这里，全部白做。已从该仓库删除 `2f4c325`，GitHub main 已指回 `ee14d68`。
- 它现在只是本地副本/草稿，不再驱动线上。任何生产改动**不要**从 `D:/ink-flows` 推。

---

## 2. 代码结构（具体路径，照抄）

构建链：`根目录 npm run build` → `scripts/build-marketing.mjs` → 在 `marketing/` 装依赖并构建 → 最终构建**两层嵌套** `marketing/marketing/`（Astro 项目）→ 输出拷到根 `dist/`（Cloudflare 读这个）。

> 注意嵌套层级：**两层** `marketing/marketing/`。历史曾误判为三层或扁平，实测两层正确。
> 根目录 `marketing/src/`（一层）是空壳，不参与构建；改一层无效。

| 用途 | 确切路径 |
|---|---|
| **Tattoo 含义数据** | `marketing/marketing/src/data/tattoo-meanings.ts` |
| **含义页路由** | `marketing/marketing/src/pages/meaning/[symbol].astro` → 线上 `/meaning/[symbol]/` |
| **画廊组件** | `marketing/marketing/src/components/GallerySection.astro` |
| **画廊 SVG（公开）** | `marketing/marketing/public/gallery/real/*.svg` + 兜底 `marketing/marketing/public/gallery/shark.svg` |
| **构建入口脚本** | `scripts/build-marketing.mjs`（根目录） |
| **Astro 配置（嵌套层）** | `marketing/marketing/astro.config.mjs` |
| **构建输出** | 根目录 `dist/`（Cloudflare Pages build output dir） |

### 路由与 slug 约定
- 当前线上 URL 是旧单层：`/meaning/shark/`（slug=`shark`）。
- 计划中的改名 `/meaning/` → `/tattoo-meaning/` + 全量 301 **留到最后做**，不要现在动。
- 不要擅自引入 hub-and-spoke（`/meaning/ocean/shark-tattoo-meaning/`）——那是另一套未部署的分叉（B 线），与 LIVE 不兼容。

---

## 3. 改动检查清单（动手前逐条过）

1. [ ] 确认在 `D:/ink-flow-manager`，不在 `D:/ink-flows`。
2. [ ] 确认基于 `main` 建分支（`git checkout -B mybranch main`），不基于本地落后分支。
3. [ ] 改的文件路径在 `marketing/marketing/src/`（两层），不是一层、不是三层、不是扁平 `src/`。
4. [ ] 数据改 `tattoo-meanings.ts`；页面改 `[symbol].astro`；新增组件放 `components/`。
5. [ ] 本地构建验证：`cd D:/ink-flow-manager && npm run build`，看 `dist/meaning/...` 是否生成、有无报错。
6. [ ] 提交只 `git add` 相关文件，**不要 `git add -A`**（仓库里有嵌套垃圾目录）。
7. [ ] 推送：`git push origin mybranch:main`（**fast-forward，绝不 `--force`**）。
8. [ ] 推完去 `https://ink-flows.com/meaning/<slug>/` 确认上线。

---

## 4. 部署/推送命令（可直接复制）

```powershell
# 本地构建验证
cd D:/ink-flow-manager
npm run build

# 推送（遇 TLS unexpected eof 加重试，或加显式代理）
git push origin mybranch:main
# 若 EOF：
git -c http.sslBackend=openssl -c http.proxy=socks5h://127.0.0.1:10808 push origin mybranch:main
```

### 绕过 GitHub 的备用部署（网络卡死时）
沙箱 `wrangler` 缓存的 `owlink.liu@gmail.com` 账号能看到 `inkflow-marketing` 项目，
且 `api.cloudflare.com` 直连可达（403=到达）。可在沙箱用 wrangler 直接推 dist 绕过 GitHub：
```bash
cd D:/ink-flow-manager
env -u HTTPS_PROXY -u HTTP_PROXY -u ALL_PROXY npx wrangler pages deploy dist --project-name=inkflow-marketing
```

---

## 5. 历史事故记录（避免重犯）

- **2026-07-25 推错仓库**：shark 全套工作在 `D:/ink-flows`（inkflow-marketing.git）做完、build、push，但 Cloudflare 读的是 `ink-flow-manager.git` → 上线失败。后发现真源是 `ink-flow-manager`，已把 shark 搬过去（提交 `5e47b37`），推送 `18a8b76..5e47b37` 成功上线。
- **force-push 覆盖生产（同日早）**：曾误判 main 是旧线让用户 `git push origin master:main --force` 覆盖 176 页生产。后用户用 `git push origin ee14d68:main --force` 救回（那是修自己错误的例外，非日常操作）。
- **铁律**：日常业务推送只 fast-forward（`git push origin x:main`），**绝不 `--force`**。

---

## 6. 当前生产状态（2026-07-25 收口）

- 生产 `main` = `5e47b37`（含 18a8b76 的 B5/EEAT/blog + shark 标杆页）。
- shark 页：`https://ink-flows.com/meaning/shark/`（4 张 SVG 线稿画廊 + 🦈 表情）。
- 待办：7-27 20:00 自动复查 shark 排名；`/meaning/`→`/tattoo-meaning/` 改名留最后。

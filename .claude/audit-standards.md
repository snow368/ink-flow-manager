# Audit Standards for ink-flow-manager

本文档定义了 ink-flow-manager 的质量审核标准。审核 bot 加载此文件后，按以下标准逐项检查代码库。

---

## A. PWA 技术标准

参考：Lighthouse PWA 审计、Web Vitals

### A1. Lighthouse PWA 自动化检查（12 项）

参考：Lighthouse PWA 审计（Chrome DevTools），权重和阈值

**CRITICAL 项（缺少任一项直接 Red 0-49）：**

- [ ] HTTPS 全站启用（无 mixed content）
- [ ] Service Worker 注册成功，包含 fetch handler（非仅 cache）
- [ ] manifest.json 包含 name, short_name, start_url, display（standalone/fullscreen）, icons
- [ ] manifest icons: 至少 192×192 + 512×512（maskable 支持更佳）

**重要项（BASELINE 项，影响 PWA 可安装提示）：**

- [ ] Splash Screen: manifest 含 name + background_color + 512×512 图标
- [ ] `<meta name="theme-color">` 设置（与 manifest background_color 一致）
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [ ] Content sized correctly for viewport（无水平溢出）
- [ ] start_url 离线返回 200（非 404，非离线恐龙）
- [ ] 弱网 4G 下交互时间 < 10 秒

**增强项（GREEN 90-100 所需）：**

- [ ] HTTP → HTTPS 自动重定向
- [ ] 无 JS 时仍有 fallback 内容（非白屏）
- [ ] Maskable icon（adaptive icon，Android）
- [ ] 所有页面有独立 URL（可深层链接）

**3 项手动验证（Lighthouse 不自动检测）：**

- [ ] 跨浏览器测试通过（Chrome, Safari, Firefox）
- [ ] 页面切换有过渡动画（非生硬跳转）
- [ ] 每个页面可独立刷新（不丢状态、不白屏）

**Lighthouse PWA 评分带：**
| 分数 | 等级 | 含义 |
|------|------|------|
| 90-100 | 🟢 Green | PWA 最佳实践达标 |
| 50-89 | 🟠 Orange | 有可改进项 |
| 0-49 | 🔴 Red | 关键项缺失（通常缺 SW 或 manifest） |

### A2. Web Vitals 性能
- [ ] LCP (Largest Contentful Paint) < 2.5 秒
- [ ] INP (Interaction to Next Paint) < 200 毫秒（替代 FID）
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] TTFB (Time to First Byte) < 800 毫秒
- [ ] 首屏 JS bundle < 500KB（未压缩）
- [ ] 无渲染阻塞资源（CSS/JS）

### A3. 安全性
- [ ] 无硬编码 API key / secret
- [ ] 无 eval() 或 innerHTML 动态拼接用户输入
- [ ] Stripe publishable key 使用环境变量
- [ ] 数据库操作无 SQL 拼接（Dexie 用索引参数）

### A4. 响应式
- [ ] 320px 宽度下无水平滚动条（WCAG 1.4.10 Reflow）
- [ ] 1920px 宽度下内容合理居中/铺满
- [ ] 触控目标（按钮、链接）≥ 44×44 CSS px（WCAG 2.5.5）
- [ ] 触控目标间距 ≥ 8px（避免误触）
- [ ] safe-area-inset-bottom 有处理
- [ ] 横屏下界面可用（WCAG 1.3.4 Orientation）

---

## B. 纹身工作室领域标准

基于竞品研究（Tattoo Studio Pro、BookedIN）和行业最佳实践。

### B1. 离线就绪
- [ ] 断网时核心流程不白屏：查看今日预约 ✓、客户签到 ✓、签同意书 ✓
- [ ] 离线时操作排队，恢复网络后同步
- [ ] 离线时有视觉提示（OfflineBanner）

### B2. 操作效率
- [ ] 签到流程 ≤ 2 步（扫描 → 确认）
- [ ] 快速结账 ≤ 3 步（选预约 → 加项目 → 收款）
- [ ] 客户搜索 < 1 次页面跳转
- [ ] 今日视图默认显示当天、无需手动选择日期

### B3. 同意书合规
- [ ] 含身份验证（ID 照片采集）
- [ ] 含健康筛查（至少 7 项，Yes 时展开追问）
- [ ] 含签名 + 审计追踪（设备、时间、笔迹点数）
- [ ] 含照片授权条款
- [ ] 含术后护理确认（嵌入同意书）
- [ ] 按国家/地区加载适用法律模板（JP/BR/DE/US/UK/CA/AU）
- [ ] 同意书记录保留（BR: 5年）

### B4. 多人多店
- [ ] owner 可查看所有店铺数据
- [ ] artist 只能查看自己的预约和客户
- [ ] 切换店铺时数据正确过滤
- [ ] LocationSelector 在所有核心页面可用

### B5. 各国法规参考

**日本：**
- 2020 年最高裁判決：纹身不属于医疗行为，无 保健所 强制检查清单
- 行业自规范（日本 Tattooist Association / JTA），无国家许可制度
- アートメイク（医美纹绣）仍需医师资格（2023 年厚労省通知）
- → 审核时参考国际标准（US state license + EU tattoo safety）作为实践基准

**巴西：**
- São Paulo CVS Portaria TCLE 要求：RG/CPF 验证、健康筛查、5 年记录保存
- 未成年人纹身禁止（除法院授权外）
- 同意书双份（工作室 + 客户各一份）

**美国：**
- 各州 tattoo license 要求不同（OR/WA/CA 最严格）
- 未成年人禁止（多数州，含父母同意也不行）
- OSHA Bloodborne Pathogens Standard 适用

**欧盟：**
- EU Tattoo Safety Guidelines (ResAP 2008/1)
- REACH 法规限制纹身墨水化学物质（2022年起）
- GDPR 适用所有客户数据

### B6. 数据隐私
- [ ] 健康数据存本地（IndexedDB），不上传云端
- [ ] 客户个人信息不暴露在公开链接
- [ ] 无第三方追踪脚本收集客户数据

---

## C. 通用 UX 标准

参考：Nielsen's 10 Usability Heuristics、Material Design、iOS HIG

### C1. 系统状态可见
- [ ] 加载中有 spinner/skeleton/文字提示（非白屏）
- [ ] 操作结果有反馈（成功/失败提示）
- [ ] 网络状态有提示（OfflineBanner）

### C2. 贴近用户场景
- [ ] 主要操作按钮在拇指可达区域（屏幕下半部）
- [ ] 表单自动聚焦到第一个输入框
- [ ] 数字输入拉出数字键盘

### C3. 防错设计
- [ ] 删除/取消操作有确认步骤
- [ ] 改约需要艺术家审批（非直接改库）
- [ ] 余额不足时给出提示（非静默失败）
- [ ] 表单必填项有标记和验证

### C4. 一致性
- [ ] 颜色使用 THEME 常量（而非裸 hex）
- [ ] 间距使用统一值（4/8/12/16/20/24）
- [ ] 圆角统一（8/10/12/14）
- [ ] 按钮样式统一（主/次/危险操作）

### C5. 可及性（WCAG 2.1 AA 移动端重点）

参考：WCAG 2.1 AA + 2.2 草案触控标准

**感知（Perceivable）：**
- [ ] 1.4.3 文字颜色对比度 ≥ 4.5:1（正文）/ 3:1（≥18px 粗体或 ≥24px）
- [ ] 1.4.4 文字可缩放至 200%（无内容/功能丢失）
- [ ] 1.4.10 Reflow：320px 宽度无水平滚动（= A4 项）
- [ ] 1.3.4 Orientation：支持横竖屏，不强制锁定方向

**操作（Operable）：**
- [ ] 2.5.5 触控目标 ≥ 44×44 CSS px（Level AAA: 2.5.5）
- [ ] 2.5.8 (2.2 草案) 触控目标 ≥ 24×24 px 绝对最小，推荐 44-48px
- [ ] 触控目标间距 ≥ 8px（防止误触）
- [ ] 2.5.2 Pointer Cancellation：在 up 事件完成操作，可取消（不触发 down 事件）
- [ ] 2.1.1 键盘导航：Tab/Enter/Esc 可用
- [ ] 2.3.1 无闪光（>3 次/秒）避免光敏癫痫

**理解（Understandable）：**
- [ ] 3.3.2 输入框有关联 label（非仅 placeholder）
- [ ] 3.2.3 导航一致性（相同顺序出现在每页）
- [ ] 3.2.4 相同功能图标/按钮标识一致

**健壮（Robust）：**
- [ ] 4.1.1 HTML 无严重嵌套/解析错误
- [ ] 图片有 alt 文本
- [ ] 自定义组件有 ARIA 标签

### C6. i18n 完整度
- [ ] 6 种语言 (en/es/pt/fr/de/th/jp) 的 i18n 键数量一致
- [ ] 无 UI 硬编码文字（检查所有 tsx 文件中的英文字符串）
- [ ] 日期格式本地化
- [ ] 数字/货币格式本地化

---

## D. 代码质量标准

### D1. TypeScript
- [ ] tsc --noEmit 零错误
- [ ] 无 `as any` 类型断言（除非有充分理由）
- [ ] 接口定义完整，字段注释清晰
- [ ] 无未使用变量/导入

### D2. 项目结构
- [ ] 页面组件在 src/pages/
- [ ] 可复用组件在 src/components/
- [ ] 业务逻辑在 src/lib/
- [ ] 类型定义集中在 db.ts

### D3. 安全编码
- [ ] 无 console.log 泄露敏感信息
- [ ] URL 参数做编码处理
- [ ] 文件上传有大小限制
- [ ] IndexedDB 查询使用索引

### D4. 无冗余
- [ ] 无未引用的文件
- [ ] 无被注释掉的代码块
- [ ] import 按 react → 第三方 → 本地 排序

---

## 审核等级标识

| 等级 | 含义 | 标记 |
|------|------|------|
| 🔴 严重 | 影响安全、数据完整性、法律合规 | MUST FIX |
| 🟡 警告 | 影响用户体验、性能、可维护性 | SHOULD FIX |
| 🔵 建议 | 改进建议，非阻塞 | NICE TO HAVE |
| ✅ 通过 | 符合标准 | PASS |

审核报告按文件组织，每个问题引用具体行号。

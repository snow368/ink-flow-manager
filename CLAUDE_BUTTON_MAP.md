# InkFlow PWA — 按钮功能完全清单

> 覆盖全部 47 个页面，每个交互元素及其行为

---

## Register (`/register`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "Login" / "Register" 切换 | 文字 | 切换登录/注册模式 |
| Name input | 输入框 | 注册模式必填 |
| Email input | 输入框 | 必填 |
| 角色选择按钮 | 按钮组 | 多选: "I'm a Tattoo Artist" / "I Own a Studio" / "I'm Staff" |
| "Register" / "Login" | 提交按钮 | 注册: 创建 UserRecord→写入 IndexedDB→导航到 /today; 登录: 按 email 查找→更新 deviceId→导航到 /today |
| "Already have an account?" | 文字链接 | 切换模式 |

---

## Today (`/today`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "Day" / "Week" / "Multi" | 按钮组 | 切换时间线视图模式 |
| "Share" | 按钮 | 复制 booking 链接到剪贴板 |
| "📅" | 按钮 | 下载 ICS 日历文件 |
| "Register" (POS) | 按钮 | 导航到 `/pos` |
| "+" 浮动按钮 | 按钮 | 导航到 `/appointment/new` |
| Due Leads 卡片: "Open Leads" | 链接 | 导航到 `/leads` |
| Due Leads: "Done +1d/3d/7d" | 按钮 | 延期 follow-up 到 N 天后 |
| Review Invites: "View All" | 链接 | 导航到 `/review-invites` |
| Review Invites: "Copy Invite" | 按钮 | 复制 review 邀请文案到剪贴板→标记已邀请 |
| Review Invites: "Follow Up" | 按钮 | 复制 follow-up 文案→标记已跟进 |
| Waiting List 卡片 | 点击 | 导航到 `/leads` |
| Reminders: "Auto" | 复选框 | 启用自动发送提醒 |
| Reminders: "Send All" | 按钮 | 批量发送所有待发提醒 |
| 每条 Reminder: "WhatsApp" | 按钮 | 打开 WhatsApp 提醒 URL→标记已发送 |
| 每条 Reminder: "Dismiss" | 按钮 | 标记已发送(不实际发送) |
| 每条 Reminder: "SMS" | 按钮 | 通过 Twilio/`sms:` 发送 |
| 每条 Reminder: "WA" | 按钮 | 通过 Twilio WhatsApp API 发送 |
| New Bookings: "↻ Refresh" | 按钮 | 从 Worker 重新拉取待确认 booking |
| 每条 Pending Booking: "Accept" | 按钮 | 创建 ClientRecord + AppointmentRecord→调用 acceptBookingApi |
| 每条 Pending Booking: "✕" | 按钮 | 调用 ackBooking 标记已读 |
| Low Stock 卡片 | 点击 | 导航到 `/inventory` |
| Recently Completed: "Send Aftercare" | 按钮 | 打开 aftercare WhatsApp URL |
| Recently Completed: "Request Google Review" | 按钮 | 打开 review 请求 WhatsApp URL |
| Recently Completed: "Dismiss" | 按钮 | 清除完成通知 |
| Deposit Reminders: "Open Leads" | 链接 | 导航到 `/leads` |
| Deposit Reminders: "Copy Reminder" | 按钮 | 复制催款文案到剪贴板 |
| Deposit Reminders: "Done +1d" | 按钮 | 延期 1 天 |
| Client Outreach: Birthday "Copy" | 按钮 | 复制生日问候文案 |
| Client Outreach: Birthday "WA" | 按钮 | 打开 WhatsApp 生日消息 |
| Client Outreach: Year-away "Copy" | 按钮 | 复制重新互动文案 |
| Client Outreach: Year-away "WA" | 按钮 | 打开 WhatsApp 重新互动消息 |
| 14 天日期栏: 日期按钮 | 按钮 | 设置选中日期 |
| 日期栏: drag-drop | 拖放 | 将 appointment 拖到新日期→reschedule |
| 预约卡片: "📅 Calendar" | 按钮 | 打开 Google Calendar URL (新标签) |
| 预约卡片: "QR" | 按钮 | 显示 QR 码签到弹窗 (含"Close"按钮) |
| 预约卡片: "Waiver" | 按钮 | 导航到 `/waiver/:id` (仅 waiver 未完成时) |
| 预约卡片: "Deposit" | 按钮 | 更新状态为 `deposit_paid` |
| 预约卡片: "Confirm" | 按钮 | 更新状态为 `ready` |
| 预约卡片: "Start" | 按钮 | 导航到 `/session/:id` |
| 预约卡片: "Checkout" | 按钮 | 导航到 `/pos?appointmentId=:id` |
| 预约卡片: "Done" | 按钮 | 更新状态为 `done` |
| 预约卡片: "Cancel" | 按钮 | 更新状态为 `cancelled` |
| 预约卡片: "No Show" | 按钮 | 取消 + 增加 client.noShowCount |
| Reschedule Request: "Approve" | 按钮 | 接受预约的新日期/时间 |
| Reschedule Request: "Reject" | 按钮 | 清除 rescheduleRequest |
| Week/Multi 视图: 跨天/跨 artist 拖放 | 拖放 | 拖到其他日期/其他 artist→更新记录 |
| 冲突解决弹窗: 建议时间按钮 | 按钮 | 选择新时间→完成移动 |
| 冲突解决弹窗: "Cancel" | 按钮 | 关闭弹窗 |

---

## Clients (`/clients`)

| 元素 | 类型 | 行为 |
|------|------|------|
| 搜索框 | 输入框 | 按名称过滤客户列表 |
| Tag 过滤按钮: "All"/"VIP"/"New"/"At Risk" | 按钮组 | 切换过滤器 |
| Sort 下拉 | 选择框 | 按名称/日期/最近到访排序 |
| "Import" | 按钮 | 隐藏 file input→CSV 导入客户 |
| "Find Duplicates" | 按钮 | 调用 `clientMerge` 检测重复 |
| "+" 浮动按钮 | 按钮 | 导航到 `/client/new` |
| 客户卡片行 | 点击 | 导航到 `/client/:id` |
| 快捷操作: "Book" | 按钮 | 导航到 `/appointment/new?clientId=...` |
| 快捷操作: "WhatsApp" | 按钮 | 打开 `wa.me` |
| 快捷操作: "Invoice" | 按钮 | 导航到创建发票 |

---

## Client Detail (`/client/:id`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "← Back" | 按钮 | 导航到 `/clients` |
| "Edit" | 按钮 | 切换可编辑模式 |
| "Save" | 按钮 | 保存客户信息到 IndexedDB |
| "Book" | 按钮 | 导航到 `/appointment/new?clientId=...` |
| WhatsApp | 按钮 | 打开 `wa.me` |
| Invoice | 按钮 | 导航到创建发票 |
| 生日: date input + Save/Cancel | 输入+按钮 | 更新生日 |
| Tag: "Edit" toggle | 切换 | 显示/隐藏标签编辑 |
| Tag: "Add Tag" | 输入框 | 添加自定义标签 |
| Tag: 快捷标签按钮 | 按钮 | 快速添加 VIP/New/At Risk |
| 图片: 点击 | 点击 | 全屏展开图片 |
| 合并重复: 按钮 | 按钮 | 触发合并流程 |
| 发票行 | 点击 | 导航到 `/invoice/:id` |
| "Delete Client" | 按钮 | 确认后从 IndexedDB 删除 |

---

## New Client Form (`/client/new`)

| 元素 | 类型 | 行为 |
|------|------|------|
| Name input | 输入框 | 必填 |
| Phone input | 输入框 | 可选 (400ms 防抖查重) |
| Email input | 输入框 | 可选 (400ms 防抖查重) |
| 过敏 toggle 按钮 | 按钮组 | Yes/No 逐项切换 |
| 自定义过敏: input + "Add" | 输入框+按钮 | 添加到过敏列表 |
| "Save" | 提交按钮 | 创建 ClientRecord→导航到 `/clients` |

---

## Appointment Form (`/appointment/new`)

| 元素 | 类型 | 行为 |
|------|------|------|
| 客户选择 | 下拉 | 搜索/选择客户 |
| 日期预设: "Tomorrow"/"Day after"/"In 3 days"/"Custom" | 按钮组 | 设置预约日期 |
| 时长预设: "30min"/"45min"/"1hr"/.../ "3hr" | 按钮组 | 设置持续时间 |
| "Custom" 时长 toggle | 切换 | 显示自定义时长输入 |
| 类型选择 | 下拉 | consultation / new_tattoo / touch_up 等 |
| 身体部位 toggle 按钮 | 按钮组 | arm/leg/back/chest 等 |
| 订金比例快速选择: "25%"/"30%"/"50%" | 按钮组 | 设置订金金额 |
| 订金 on/off toggle | 切换 | 启用/禁用订金 |
| "Use next available" | 按钮 | 自动填充下一个空闲时段 |
| Series: "Add to series" toggle | 切换 | 显示系列名称输入 |
| "Create Appointment" (底部固定) | 提交按钮 | 验证字段→保存到 IndexedDB→导航到 `/today` |
| 冲突检测 | 自动 | 时间重叠时显示警告 |

---

## Session (`/session/:appointmentId`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "Pause" | 按钮 | 暂停计时器 |
| "Resume" | 按钮 | 恢复计时器 |
| "Voice On" / "Voice Off" | 按钮 | 启动/停止语音识别 |
| 库存物品按钮 | 按钮 | 标记为已消耗 |
| "Finish Session" | 按钮 | 打开结算弹窗 |
| 结算弹窗: 消耗品 "-"/"+" | 按钮 | 调整数量 |
| "Confirm & Finish" | 按钮 | 保存 session + 消耗品→导航到 `/pos?appointmentId=...` |
| "Skip (No Deduct)" | 按钮 | 完成但不扣库存→导航到 POS |
| "Cancel, Return to Session" | 按钮 | 关闭弹窗 |
| "X" 关闭 | 按钮 | 停止相机→导航到 `/today` |
| Error: "Go back" | 按钮 | 返回前一页 |

---

## Waiver (`/waiver/:appointmentId`)

| 元素 | 类型 | 行为 |
|------|------|------|
| 健康问题: "Yes"/"No" | 按钮组 | 设置 healthAnswers 数组 |
| 跟进文本输入 | 输入框 | "Yes" 时显示 |
| 出生日期 input | 日期输入 | 年龄验证 |
| "Capture or upload ID photo" | 按钮 | 触发 file input (相机/相册) |
| ID 照片 "Remove" | 按钮 | 清除 ID 照片 |
| 签名画布 | 画布 | 鼠标/触控签名 |
| "Clear Signature" | 按钮 | 清除画布 |
| "Sign & Confirm" | 提交按钮 | 保存 WaiverRecord + 签名→更新 appointment 状态→导航到 `/today` |

---

## Me (`/me`)

| 元素 | 类型 | 行为 |
|------|------|------|
| 语言选择 | 下拉 | 设置 UI 语言 |
| 国家选择 | 下拉 | 设置国家配置 |
| "Upgrade to Pro/Plus" | 按钮 | 打开升级弹窗 (含"Close"按钮) |
| Studio name | 点击编辑 | 行内编辑 |
| Commission rate | 点击编辑 | 数字输入 |
| Stations: "Add Station" | 按钮 | 添加工位 (含颜色选择器) |
| Stations: "Remove" | 按钮 | 删除工位 |
| 各导航按钮 (约 25 个) | 链接 | 导航到对应子页面 (见 Route Map) |
| "Review Invites" | 链接 | 导航到 `/review-invites` |
| Review links: 行内编辑 | 输入框 | 编辑 Google/平台2/平台3 链接 |
| "Export Data" | 按钮 | 导出全部 IndexedDB 数据为 JSON |
| "Import Data" | 按钮 | 隐藏 file input→JSON 导入 |
| Dev: "Fill Demo Data" | 按钮 | 填充演示数据 |
| Dev: "Seed Multi-Location" | 按钮 | 创建多门店种子数据 |
| Dev: "Reset All Data" | 按钮 | 确认后清空 IndexedDB |
| "Logout" | 按钮 | 清除 localStorage→导航到 `/register` |
| Booking link: "Share" | 按钮 | 原生 Share API |
| Consumable: "Add Preset" | 按钮 | 添加消耗品预设 |
| Consumable: "Remove" | 按钮 | 删除预设 |

---

## Leads Pipeline (`/leads`)

| 元素 | 类型 | 行为 |
|------|------|------|
| 状态过滤: "All"/"New"/"Contacted"/"Booked"/"Lost"/"Won" | 标签页 | 过滤列表 |
| "Sync Payments" | 按钮 | POST 到 Worker 同步支付状态 |
| 转化仪表板: "7d"/"30d" toggle | 按钮 | 切换时间范围 |
| Intake link: "Copy" | 按钮 | 复制 intake 链接 |
| 各渠道: "Copy" | 按钮 | 复制渠道 booking 链接 |
| Ad spend inputs | 输入框 | 按渠道输入广告支出 |
| "Copy Best Creative Link" | 按钮 | 复制最优创意 URL |
| Follow-up presets CRUD | 增删改 | 管理预设跟进文案 |
| Due-today: "Scroll to lead" | 按钮 | 滚动到对应线索 |
| 线索卡片: "Contacted"/"Booked"/"Lost" | 按钮 | 更新状态 |
| "Convert to Client" | 按钮 | 创建 ClientRecord→导航到创建预约 |
| "Copy Client Update Link" | 按钮 | 复制线索状态链接 |
| Payment: 方式选择/金额输入/附件 | 表单 | 支付信息采集 |
| "Copy Deposit Link" | 按钮 | 复制订金链接 |
| "Copy Pay Link" | 按钮 | 复制全款链接 |
| "Copy Status Link" | 按钮 | 复制支付状态链接 |
| "Copy Payment Message" | 按钮 | 复制催款消息 |
| "Copy 24h/48h Reminder" | 按钮 | 复制催款提醒 |
| "Save Draft" | 按钮 | 保存草稿 |
| "Approve as Paid" | 按钮 | 标记已支付 |
| "Refund" | 按钮 | 标记已退款 |
| 预设跟进按钮 | 按钮 | 套用跟进模板 |
| "AI Recommend" | 按钮 | 生成 AI 跟进建议 |
| "Clear Follow-up" | 按钮 | 清除 follow-up 数据 |
| "Suggest 3 Real Slots" | 按钮 | 生成 3 个可约时段 |
| "Copy Slot Message" | 按钮 | 复制时段消息 |
| 快速记录: "Contacted"/"Awaiting"/"Booked" | 按钮 | 记录操作类型 |
| "Save Quick Log" | 按钮 | 保存活动记录到 IndexedDB |
| Revision history: "Set as Final" | 按钮 | 将版本标记为最终版 |

---

## Invoices (`/invoices`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "+ New Invoice" | 按钮 | 展开内联创建表单 |
| 客户选择 / Walk-in name | 输入 | 选择或输入客户 |
| 服务/产品预设按钮 | 按钮 | 添加行项目 |
| 行项目: "Remove" | 按钮 | 移除 |
| "Add Item" | 按钮 | 添加自定义行项目 |
| 支付方式选择 | 下拉 | 选择支付方式 |
| Tip input | 输入框 | 小费金额 |
| Split payments 区域 | 表单 | 分批付款记录 |
| Notes textarea | 文本域 | 备注 |
| "Create Invoice" | 提交 | 保存到 IndexedDB |
| "Generate from POS" | 按钮 | 打开 POS 交易选择器 |
| 过滤标签: "All"/"Pending"/"Paid"/"Cancelled" | 标签页 | 过滤 |
| 发票行 | 点击 | 导航到 `/invoice/:id` |

---

## Invoice Detail (`/invoice/:id`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "Mark as Paid" | 按钮 | 更新 paymentStatus→paid |
| "Record Payment" | 按钮 | 打开分期付款表单 |
| "Cancel" | 按钮 | 更新 status→cancelled |
| "Print" | 按钮 | 打印对话框 |
| "WhatsApp" | 按钮 | 通过 WhatsApp 分享 |
| "Email" | 按钮 | 通过邮件客户端分享 |
| "Share" | 按钮 | 原生 Share API |
| "Copy" | 按钮 | 复制发票详情到剪贴板 |
| "View POS Transaction" | 按钮 | 跳转到关联 POS 交易 |
| "Back to Invoices" | 按钮 | 导航到 `/invoices` |
| "Setup" | 按钮 | 导航到 `/invoice-settings` |

---

## POS (`/pos`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "Refund" | 按钮 | 切换退款模式面板 |
| "Settings" | 按钮 | 导航到 `/pos-settings` |
| "Session Checkout" / "Quick Sale" | 按钮 | 切换模式 |
| Country select | 下拉 | 设置发票国家配置 |
| 支付方式选择 | 下拉 | Cash/Card/Stripe 等 |
| "Create & Stay" | 按钮 | 生成 InvoiceRecord→留在 POS |
| "Create & View" | 按钮 | 生成 InvoiceRecord→导航到 `/invoice/:id` |
| "Skip" | 按钮 | 跳过创建发票 |
| 退款模式: 交易选择/原因输入 | 表单 | 选择要退款的交易 |
| "Confirm Refund" | 按钮 | 恢复库存→标记退款 |
| "Change" | 按钮 | 清除当前 session 预约 |
| "Clear Cart" | 按钮 | 清空购物车 |
| 购物车: "-"/"+"/"X" | 按钮 | 调整数量/移除 |
| 小费预设: 0%/10%/15%/20% | 按钮 | 设置小费比例 |
| "Cash"/"Card"/"Other" | 按钮 | 选择支付方式 |
| "Complete Sale" | 按钮 | 保存交易→扣库存→更新客户→打印收据→清空购物车 |
| 购物车项目 "+ Add" | 按钮 | 添加自定义行项目 |
| 分类 chips | 按钮 | 过滤商品网格 |
| 服务预设按钮 | 按钮 | 添加预设服务 |
| 商品网格按钮 | 按钮 | 添加到购物车 |

---

## Supply Brands (`/supply-brands`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "← Back" | 按钮 | 导航到 `/me` |
| "Brands" / "New Products" | 标签页 | 切换视图 (New Products 有数量角标) |
| 分类过滤: All/Ink/Needles/Machines/Aftercare/Other | 按钮组 | 过滤品牌 |
| 搜索框 | 输入框 | 按名称/描述/产品名搜索 |
| "Ships here" / "All countries" | 按钮 | 切换物流过滤 |
| 品牌行 | 点击 | 展开/折叠品牌详情 |
| "Buy [Brand] Official Store" | 链接 | 打开 affiliate 链接→计数→新标签 |
| 产品: "Buy" | 链接 | affiliate 点击追踪→计数→新标签 |

---

## Supply Reviews (`/supply-reviews`)

| 元素 | 类型 | 行为 |
|------|------|------|
| "Back" | 按钮 | 导航到 `/me` |
| 分类过滤 | 标签页 | 过滤评论 |
| 浮动按钮 "Write Review" | 按钮 | 打开底部表单 |
| 产品搜索框 | 输入框 | 防抖搜索 |
| 搜索结果行 | 点击 | 选择产品→自动填充 |
| 分类选择器 | 按钮 | 设置评论分类 |
| 正文 textarea | 文本域 | 评论内容 |
| "AI Extract" | 按钮 | 本地关键词提取→复制 AI prompt |
| Tag "Clear" | 按钮 | 清除标签 |
| Pros/Cons input | 输入框 | 优缺点 |
| "Would Buy Again" / "Would Not Buy Again" | 按钮组 | 设置 buyAgain |
| 照片: file input | 上传 | 多张图片→data URL |
| 照片: "x" | 按钮 | 移除 |
| Anonymous toggle | 切换 | 匿名发布 |
| "Submit Review" | 按钮 | 保存到 IndexedDB→重置表单→关闭 |
| "Helpful" (👍+count) | 按钮 | 增加 helpfulCount |
| 空状态: "Write First Review" | 按钮 | 打开表单 |

---

## Booking Pages

### Client Booking (`/book/:artistId`) — 多步骤
| 元素 | 类型 | 行为 |
|------|------|------|
| 日期选择按钮 | 按钮 | 选择可用日期 |
| 时间段按钮 | 按钮 | 选择具体时间 |
| "Continue" | 按钮 | 下一步 |
| "Back" | 按钮 | 上一步 |
| 联系方式选择 | 选择器 | WhatsApp/SMS/Email |
| 客户信息输入 | 输入框 | 姓名/电话/邮箱 |
| 设计说明 textarea | 文本域 | 预约备注 |
| "Join Waiting List" | 按钮 | 创建 waiting list 条目 |
| "Submit Booking" | 按钮 | 创建 ClientRecord+LeadRecord+AppointmentRecord |
| "Pay Deposit" | 按钮 | 跳转 Stripe 支付链接 |
| "Skip Payment" | 按钮 | 跳过订金 |
| "Add to Calendar" | 按钮 | 打开 Google Calendar URL |
| "Download .ics" | 按钮 | 下载 ICS 文件 |

### Appointment Respond (`/respond/:id`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Confirm" | 按钮 | 更新状态→deposit_paid |
| "Reschedule" | 按钮 | 显示日期/时间选择器 |
| 可用时间段按钮 | 按钮 | 选择新时间 |
| "Submit Reschedule" | 按钮 | 保存 proposedDate/proposedTime |
| "Cancel" | 按钮 | 更新状态→cancelled |

### Embed Booking (`/embed/:artistId`)
| 元素 | 类型 | 行为 |
|------|------|------|
| 日期选择 | 按钮 | 选日期 |
| 时间段选择 | 按钮 | 选时间→进入信息步骤 |
| 客户信息输入 | 输入框 | 姓名/电话/邮箱 |
| "Submit" | 提交 | 创建记录 |
| "Join Waiting List" | 按钮 | 加入等待列表 |

---

## Competitors

### Competitors Page (`/competitors`)
| 元素 | 类型 | 行为 |
|------|------|------|
| 分类过滤 pills | 按钮 | 按分类过滤 |
| 搜索框 | 输入框 | 按名称搜索 |
| "All" / "Due" | 标签页 | 按检查状态过滤 |
| "Mark Check Done" | 按钮 | 更新 lastCheck 时间 |
| 展开/折叠 | 点击 | 切换详情 |
| "Visit Website" | 链接 | 打开网站 (带 affiliate 追踪) |
| "Update Check" | 按钮 | 刷新竞品检查 |
| "Manage" | 按钮 | 导航到 `/competitors-admin` |

### Competitors Admin (`/competitors-admin`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Back" | 按钮 | 导航到 `/me` |
| Add/Edit: 展开弹窗 | 弹窗 | 名称/分类/网站/描述 输入 |
| "Save" | 按钮 | 保存到 IndexedDB |
| "Cancel" | 按钮 | 关闭弹窗 |
| "Delete" | 按钮 | 确认后删除 |
| 功能分析 CRUD | 弹窗 | 功能名称/评级 |
| "Reset Seed Data" | 按钮 | 重置所有竞品 |

---

## Settings Pages

### Availability Settings (`/availability-settings`)
| 元素 | 类型 | 行为 |
|------|------|------|
| 工时输入 (start/end) | 时间输入 | 设置营业时间 |
| 星期 toggle (Mon-Sun) | 按钮组 | 切换休息日 |
| Instagram handle 输入 | 输入框 | 保存社媒链接 |
| WhatsApp phone 输入 | 输入框 | 保存联系方式 |
| "Reminders enabled" 复选框 | 复选框 | 切换提醒 |
| "Save" | 按钮 | 更新 IndexedDB + POST Worker `/api/sync` |
| "Back" | 按钮 | 导航到 `/me` |

### Payment Settings (`/payment-settings`)
| 元素 | 类型 | 行为 |
|------|------|------|
| Provider 下拉 | 选择 | Stripe/Square/Manual |
| 支付方式 checkboxes | 复选框 | 多选 |
| Stripe Connect: Account ID | 输入框 | Stripe 账户 |
| "Connect Stripe Express" | 按钮 | POST Worker→创建链接→新标签打开 |
| 币种/默认订金/模板 | 输入框 | 配置 |
| "Save" | 按钮 | IndexedDB + POST Worker |
| "Back" | 按钮 | 导航到 `/me` |

### Notification Settings (`/notification-settings`)
| 元素 | 类型 | 行为 |
|------|------|------|
| Twilio: Account SID / Auth Token | 输入框 | 凭证管理 |
| Auth Token show/hide toggle | 按钮 | 切换密码显示 |
| SendGrid: API Key | 输入框 | 凭证管理 |
| Backend URL / Secret | 输入框 | API 配置 |
| "Enable SMS" | 复选框 | 启用短信 |
| "Enable Email" | 复选框 | 启用邮件 |
| "Send Test SMS" | 按钮 | 发送测试短信 |
| "Send Test Email" | 按钮 | 发送测试邮件 |
| Calendar: "Copy" | 按钮 | 复制 ICS feed URL |

### Artist Profile (`/artist-profile`)
| 元素 | 类型 | 行为 |
|------|------|------|
| 头像上传 | 点击区域 | 触发 file input→data URL→保存 |
| Slug input | 输入框 | 短链接标识 |
| "Booking enabled" toggle | 切换 | 启用/禁用 |
| 活动: 类型/城市/场地/日期 输入 | 表单 | 活动信息 |
| "Add Event" | 按钮 | 保存到 IndexedDB |
| "Cancel" (活动) | 按钮 | 隐藏表单 |
| 链接: label + URL input | 输入框 | 社媒链接 |
| "Add Link" | 按钮 | 添加链接 |
| "Remove" | 按钮 | 移除链接 |
| Up/Down | 按钮 | 排序 |
| "Save & Sync" | 按钮 | IndexedDB + POST Worker |

### Events (`/events`)
| 元素 | 类型 | 行为 |
|------|------|------|
| 活动卡片: toggle active | 切换 | 更新活动状态 |
| "Notify Clients" | 按钮 | POST Worker 发送通知 |
| "Delete Event" | 按钮 | 确认后删除 |
| "Add Event" 表单 | 表单 | 创建活动 |
| "Back" | 按钮 | 导航到 `/me` |

---

## Other Pages

### Portfolio (`/portfolio`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Select" / "Cancel" | 按钮 | 切换多选模式 |
| "+ Upload" | 按钮 | file input→最多20张→IndexedDB→sync Worker |
| "Select All (N)" | 按钮 | 全选/取消 |
| "Delete Selected" | 按钮 | 确认后批量删除 |
| 可见性过滤: "all"/"public"/"private" | 按钮 | 过滤 |
| Tag 过滤按钮 | 按钮 | 按标签过滤 |
| 缩略图 | 点击 | 打开全屏详情 |
| 详情: "X" | 按钮 | 关闭 |
| 详情: "<"/">" | 按钮 | 切换图片 |
| 详情: "Public"/"Private" toggle | 切换 | 更新 isPublic |
| 详情: "Social OK" toggle | 切换 | 更新 consentForSocial |
| 详情: "Promo OK" toggle | 切换 | 更新 consentForPromotion |
| 详情: "Copy" | 按钮 | 复制 dataUrl |
| 详情: "Delete" | 按钮 | 确认后删除 |
| 详情: Tag 按钮 | 按钮 | 切换标签 |

### Inventory (`/inventory`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Scan" | 按钮 | 打开扫码相机 |
| "Capture" | 按钮 | 拍照识别 |
| "Cancel" | 按钮 | 关闭相机 |
| 搜索框 | 输入框 | 按名称过滤 |
| 分类 chips | 按钮 | 过滤 |
| "Low Stock Only" | 按钮 | 切换低库存过滤 |
| 物品 "+"/"-" | 按钮 | 快速调整数量 |
| "Edit" | 按钮 | 打开编辑弹窗 |
| "Delete" | 按钮 | 确认后删除 |
| "Add Item" 表单 | 表单 | 名称/分类/数量/单价/最低库存 |
| "Add Item" 提交 | 按钮 | 保存到 IndexedDB |

### Referral (`/referral`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Copy Link" | 按钮 | 复制 referral 链接 |
| WhatsApp share | 按钮 | 打开 wa.me |
| Facebook share | 按钮 | 打开 sharer URL |
| Instagram/TikTok share | 按钮 | 复制链接 + alert |
| "Back" | 按钮 | 导航到 `/me` |

### Review Invites (`/review-invites`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "←" | 按钮 | 返回 |
| "Invite"/"Follow Up"/"History" (含角标) | 标签页 | 切换视图 |
| 搜索框 (History 模式) | 输入框 | 按客户名过滤 |
| "All"/"7d"/"30d"/"90d" (History 模式) | 按钮 | 时间范围过滤 |
| "Copy Invite" | 按钮 | 生成邀请文案→复制→标记已邀请 |
| "Copy Follow Up" | 按钮 | 生成跟进文案→复制→标记已跟进 |
| 消息预览 | 点击 | 关闭预览 |

### Deposit Policy (`/deposit-policy`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Enabled" toggle | 切换 | 启用/禁用订金规则 |
| "Fixed Amount"/"Percentage" toggle | 切换 | 模式选择 |
| 金额/百分比输入 | 输入框 | 订金数值 |
| "Refundable" toggle | 切换 | 是否可退 |
| "Reschedule allowed" toggle | 切换 | 允许改约 |
| "Save" | 按钮 | 保存到 IndexedDB |
| "Back" | 按钮 | 导航到 `/me` |

### Health Checklist (`/health-checklist`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "New Inspection" | 按钮 | 创建新检查表 |
| 检查表下拉 | 选择 | 选择/查看已有检查表 |
| Pass/Fail toggle | 按钮 | 逐项通过/不通过 |
| "Complete Inspection" | 按钮 | 完成检查 |

### Verification (`/verification`)
| 元素 | 类型 | 行为 |
|------|------|------|
| 平台选择 | 下拉 | IG/Facebook/TikTok |
| 社媒链接输入 | 输入框 | 主要/次要链接 |
| Studio/brand name 输入 | 输入框 | 工作室名 |
| Bio textarea | 文本域 | 简介 |
| Post captions | 文本域 | 一行一个 |
| "Submit Verification" | 按钮 | 计算评分→更新用户验证字段 |
| 通过: "Go to My Profile" | 按钮 | 导航到 `/me` |
| 待定: "Back to Profile" | 按钮 | 导航到 `/me` |

### Check-in (`/checkin/:appointmentId`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "I'm Here" | 按钮 | 更新 appointment 状态→ready |

### Client Portal (`/portal/:clientId`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Appointments" / "Timeline" | 标签页 | 切换视图 |
| "Add to Calendar" | 按钮 | 下载 ICS 文件 |

### Locations (`/locations`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Edit" per location | 按钮 | 弹出内联编辑表单 |
| "Del" per location | 按钮 | 确认后删除 |
| 名称/地址/电话/经理 输入 | 表单 | 门店信息 |
| "Save Location" | 按钮 | 保存到 IndexedDB |
| Artist assignment toggles | 按钮 | 分配艺术家到门店 |
| "Back" | 按钮 | 导航到 `/me` |

### Outreach (`/outreach`)
| 元素 | 类型 | 行为 |
|------|------|------|
| 客户选择 | 下拉 | 选择客户 |
| 模板选择按钮 | 按钮组 | booking_confirm/reminder/reschedule 等 |
| 消息 textarea | 文本域 | 可编辑，手动修改清除模板 |
| 渠道选择: WhatsApp/SMS/IG/Facebook/TikTok | 按钮组 | 选择发送渠道 |
| "Send" | 按钮 | 复制消息→打开渠道 URL→新标签 |
| "Back" | 按钮 | 导航到 `/me` |

### Content Strategy (`/content-strategy`)
| 元素 | 类型 | 行为 |
|------|------|------|
| Gap analysis toggle | 切换 | 显示/隐藏差距分析 |
| 策略选择器 | 按钮 | 选择策略 |
| "Regen" | 按钮 | 重新生成 AI 建议 |
| "Copy" | 按钮 | 复制文案到剪贴板 |
| "Build AI Prompt" | 按钮 | 生成 AI prompt |
| "Copy Prompt" | 按钮 | 复制 prompt |

### Analytics (`/analytics`)
| 元素 | 类型 | 行为 |
|------|------|------|
| "← Back" | 按钮 | 返回 |
| 客户名行 | 点击 | 导航到 `/client/:id` |
| "7 days"/"30 days"/"90 days" | 标签页 | 切换时间范围 |
| 统计卡片 | 显示 | 仅展示 |

### Intake (`/intake/:artistId`)
六节 intake 表单:
| 元素 | 类型 | 行为 |
|------|------|------|
| Section 1: 姓名/电话/邮箱 | 输入框 | 联系方式 |
| Section 2: 描述/尺寸/位置 | 输入框 | 设计需求 |
| Section 3: 身体部位 | 按钮/选择 | 纹身位置 |
| Section 4: 预算/日期 | 输入框 | 预算和时间偏好 |
| Section 5: 过敏 toggle | 按钮组 | 逐项 Yes/No |
| Section 6: 参考图片 | file input | 多张上传 |
| "Submit Intake" | 按钮 | 验证→创建 LeadRecord |

### Lead Revise (`/intake/revise/:leadId`)
| 元素 | 类型 | 行为 |
|------|------|------|
| 说明 textarea | 文本域 | 变更请求 |
| 图片上传 | file input | 多张 |
| "Submit Revision" | 按钮 | 创建 RevisionRecord |

---

## 全局组件

### TabBar (底部导航)
| 元素 | 类型 | 行为 |
|------|------|------|
| "Today" | 按钮 | 导航到 `/today` |
| "Clients" | 按钮 | 导航到 `/clients` |
| "Me" | 按钮 | 导航到 `/me` |
| 激活态 | 高亮 | 当前路径对应的 tab 文字白色，其余灰色 |

### ErrorBoundary (全局错误捕获)
| 元素 | 类型 | 行为 |
|------|------|------|
| "重试" 按钮 | 按钮 | `window.location.reload()` |
| "详情" 折叠 | summary | 展开显示组件栈 |

### OfflineBanner
| 元素 | 类型 | 行为 |
|------|------|------|
| 离线横幅 | 自动显示 | `navigator.onLine === false` 时显示 WiFi-off 图标 + 提示文字 |

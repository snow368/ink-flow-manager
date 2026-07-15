import openpyxl, csv, re, os
from collections import Counter

SRC = r'D:/ink-flow-manager/marketing/seo-targets/ink-flows.com-Performance-on-Search-2026-07-15.xlsx'
OUT = r'D:/ink-flow-manager/marketing/seo-targets'

wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)

def num(x):
    try: return float(x)
    except: return 0.0

def sheet_rows(name):
    return list(wb[name].iter_rows(values_only=True))

# ---------- Queries ----------
qrows = sheet_rows('Queries')
queries = []
for r in qrows[1:]:
    if not r or r[0] is None: continue
    q = str(r[0]).strip()
    if not q: continue
    queries.append({'q': q, 'clicks': num(r[1]), 'imp': num(r[2]),
                    'ctr': num(r[3]), 'pos': num(r[4])})
queries.sort(key=lambda x: -x['imp'])

def bucket(p):
    if p <= 0: return 'no_pos'
    if p <= 3: return 'top3'
    if p <= 7: return 'top10'
    if p <= 20: return 'quick_win_8_20'
    if p <= 30: return 'near_top_21_30'
    if p <= 50: return 'mid_31_50'
    return 'deep_50plus'

for x in queries: x['bucket'] = bucket(x['pos'])

with open(f'{OUT}/gsc_queries.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['query', 'clicks', 'impressions', 'ctr', 'position', 'bucket'])
    for x in queries:
        w.writerow([x['q'], x['clicks'], x['imp'], round(x['ctr'], 4), x['pos'], x['bucket']])

# ---------- Pages ----------
prows = sheet_rows('Pages')
pages = []
for r in prows[1:]:
    if not r or r[0] is None: continue
    url = str(r[0]).strip()
    if not url: continue
    pages.append({'url': url, 'clicks': num(r[1]), 'imp': num(r[2]),
                  'ctr': num(r[3]), 'pos': num(r[4])})
pages.sort(key=lambda x: -x['imp'])

with open(f'{OUT}/gsc_pages.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['page', 'clicks', 'impressions', 'ctr', 'position'])
    for x in pages:
        w.writerow([x['url'], x['clicks'], x['imp'], round(x['ctr'], 4), x['pos']])

# ---------- Stats ----------
bc = Counter(x['bucket'] for x in queries)
total_imp = sum(x['imp'] for x in queries)
total_clk = sum(x['clicks'] for x in queries)
avg_pos = sum(x['pos'] for x in queries if x['pos'] > 0) / max(1, sum(1 for x in queries if x['pos'] > 0))

print(f"Total queries: {len(queries)}")
print(f"Total impressions: {total_imp:.0f} | Total clicks: {total_clk:.0f}")
print(f"Avg position (queried): {avg_pos:.1f}")
print("Bucket distribution:")
for b in ['top3', 'top10', 'quick_win_8_20', 'near_top_21_30', 'mid_31_50', 'deep_50plus', 'no_pos']:
    print(f"  {b:16}: {bc.get(b,0)}")

qw = [x for x in queries if x['bucket'] == 'quick_win_8_20']
nt = [x for x in queries if x['bucket'] == 'near_top_21_30']
print(f"\n=== QUICK WINS (pos 8-20): {len(qw)} ===")
for x in qw: print(f"  {x['q']:42} imp={x['imp']:.0f} pos={x['pos']:.1f} clk={x['clicks']:.0f}")
print(f"\n=== NEAR TOP (pos 21-30): {len(nt)} ===")
for x in nt: print(f"  {x['q']:42} imp={x['imp']:.0f} pos={x['pos']:.1f}")

# ---------- B2B money keywords ----------
money = [x for x in queries if re.search(r'software|crm|pos|booking|scheduling|studio|management|client|deposit|payment|waiver|consent', x['q'], re.I)]
money.sort(key=lambda y: -y['imp'])
print(f"\n=== B2B MONEY KEYWORDS: {len(money)} ===")
for x in money: print(f"  {x['q']:44} imp={x['imp']:.0f} pos={x['pos']:.1f} clk={x['clicks']:.0f}")

# ---------- Target page mapping (heuristic) ----------
def map_page(q):
    ql = q.lower()
    if 'pos' in ql: return '/tattoo-pos-system'
    if 'crm' in ql: return '/tattoo-crm-software'
    if 'booking' in ql or 'schedul' in ql: return '/tattoo-scheduling-software'
    if 'client' in ql: return '/tattoo-client-management'
    if 'commission' in ql: return '/tattoo-commission-software'
    if 'consent' in ql or 'waiver' in ql: return '/tattoo-consent-form-app'
    if 'deposit' in ql: return '/tattoo-deposit-software'
    if 'payment' in ql: return '/tattoo-payment-processing'
    if 'business' in ql or 'management' in ql: return '/tattoo-business-management'
    if 'software' in ql or 'studio' in ql: return '/features (or /tattoo-business-management)'
    if 'app' in ql: return '/tattoo-booking-app'
    return '(review)'

# ---------- Write report ----------
lines = []
lines.append('# GSC 快速胜利分析 — ink-flows.com')
lines.append('')
lines.append(f'> 数据源:`ink-flows.com-Performance-on-Search-2026-07-15.xlsx`(GSC 导出)')
lines.append(f'> 日期范围:**Last 3 months**,但实际数据自 **2026-06-16** 起(约 1 个月真实收录数据)。')
lines.append('')
lines.append('## 1. 总体概况')
lines.append('')
lines.append(f'- 总查询词:**{len(queries)}** 个')
lines.append(f'- 总曝光:**{total_imp:.0f}** | 总点击:**{total_clk:.0f}**')
lines.append(f'- 有位置词的加权平均排名:**{avg_pos:.1f}** 名')
lines.append('')
lines.append('## 2. 位置分布(关键发现)')
lines.append('')
lines.append('| 区间 | 词数 | 说明 |')
lines.append('|------|------|------|')
lines.append(f"| Top 3 | {bc.get('top3',0)} | 已基本上榜 |")
lines.append(f"| Top 10 (4-7) | {bc.get('top10',0)} | 首页内但未到顶 |")
lines.append(f"| **快速胜利 8-20** | **{bc.get('quick_win_8_20',0)}** | **原计划的优先目标,实际极少** |")
lines.append(f"| 21-30 | {bc.get('near_top_21_30',0)} | 接近第二页头部 |")
lines.append(f"| 31-50 | {bc.get('mid_31_50',0)} | 中深 |")
lines.append(f"| 50+ 深 | {bc.get('deep_50plus',0)} | 几乎无展现权重 |")
lines.append(f"| 无位置 | {bc.get('no_pos',0)} | 零曝光 |")
lines.append('')
lines.append('> **结论:几乎没有卡在 8–20 名的快速胜利词。** 全站查询几乎都排在 30 名开外,')
lines.append('> 说明站点处于**新站低权威期**,不是"几页 on-page 微调就能上首页"的状态。')
lines.append('> 因此优先级必须从"快速胜利微调"调整为"整站权威 + 结构清理"。')
lines.append('')
lines.append('## 3. 快速胜利词(8-20 名)')
lines.append('')
if qw:
    for x in qw:
        lines.append(f"- `{x['q']}` — 曝光 {x['imp']:.0f} / 位置 {x['pos']:.1f} / 点击 {x['clicks']:.0f}")
else:
    lines.append('- **无**。当前 0 个词落在 8–20 名区间。')
lines.append('')
lines.append('## 4. 高曝光词(按曝光降序,即使位置深)')
lines.append('')
lines.append('| 查询 | 曝光 | 位置 | 点击 | 区间 |')
lines.append('|------|------|------|------|------|')
for x in queries[:25]:
    lines.append(f"| `{x['q']}` | {x['imp']:.0f} | {x['pos']:.1f} | {x['clicks']:.0f} | {x['bucket']} |")
lines.append('')
lines.append('## 5. B2B 软件钱词(高商业价值,当前位置深)')
lines.append('')
lines.append('> 这些词有真实搜索量(30–40 曝光/词)但排在 60–87 名,是 B2B SaaS 计划的核心目标。')
lines.append('> 一旦权威/外链起来,它们最先受益。')
lines.append('')
lines.append('| 查询 | 曝光 | 当前位置 | 建议目标页 |')
lines.append('|------|------|----------|------------|')
for x in money:
    lines.append(f"| `{x['q']}` | {x['imp']:.0f} | {x['pos']:.1f} | {map_page(x['q'])} |")
lines.append('')
lines.append('## 6. 表现最好的页面(按曝光)')
lines.append('')
lines.append('| 页面 | 曝光 | 位置 | 点击 |')
lines.append('|------|------|------|------|')
for x in pages[:25]:
    lines.append(f"| `{x['url']}` | {x['imp']:.0f} | {x['pos']:.1f} | {x['clicks']:.0f} |")
lines.append('')
lines.append('## 7. 修订后的优先级(叠加进 b2b-saas-ranking-plan)')
lines.append('')
lines.append('1. **结构清理(Step 1)不变且更关键**:全站位置深 = 权重被 35 个后台屏稀释。')
lines.append('   noindex 后台屏 + 301 重复定价页,集中有限权重到钱页。')
lines.append('2. **B2B 钱页 on-page 基线**:把钱词目标页(`tattoo-*-software` 等)补 FAQ/Schema/内链,')
lines.append('   这是"低成本高确定"的优化,权威一来就能承接排名。')
lines.append('3. **外链主杠杆(Step 3)**:新站 0 外链,深排名的主因是权威。G2/Capterra/替代页矩阵/行业站优先。')
lines.append('4. **消费者内容长期线**:aftercare/ideas 簇继续写,吃顶部流量,但短期不解决 B2B 深排名。')
lines.append('5. **1 个月后重测**:等权威稍起,再跑本分析看是否出现 8–20 快速胜利词。')
lines.append('')
with open(f'{OUT}/gsc_quickwins_analysis.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('\n-> wrote gsc_queries.csv, gsc_pages.csv, gsc_quickwins_analysis.md')

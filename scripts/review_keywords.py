#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
InkFlow 长尾词 —— 词级审核 (应用 SEO 知识库关键词方法论)

知识来源 (D:/ink-flow-manager/seo-knowledge/):
  - framework/keyword-research.md  (搜索意图4类 / 5维评分 / 三阶段闭环 / 4道审核闸)
  - framework/keyword-selection-methodology.md (5维评分)
  - keyword-research/inkflow-keywords-with-intent.csv (MOFU/BOFU/TOFU 漏斗标注范式)

本脚本对 longtail_matrix.csv 的 5652 个原始 Google Suggest 长尾词逐词审核:
  1) 意图标注 (KB 4 类): TOFU-信息型 / MOFU-商业型 / BOFU-交易型 / 导航型
  2) 4 道审核闸:
       闸1 业务相关性  -> is_junk / is_offtopic
       闸2 搜索意图    -> 导航型且非本品牌 => 竞品词, 不应做
       闸3 蚕食排查    -> meaning 簇已被 Tattoo Meaning Finder 70 页覆盖 => 仅内链
       闸4 KD 可行性   -> 沙箱未跑哥飞, 标 pending_kd (需本地 `python mine_longtail.py --from-cache`)
  3) 归属页映射 (复用 build_page_plan.py 的 PILLARS + THEMES + classify_theme)

输出:
  seo-targets/longtail_review.csv  (5652 行, 逐词审核)
  seo-targets/longtail_review.md   (分布统计 + 审核结论 + 样例)
"""
import os
import re
import csv
import argparse
from collections import defaultdict, OrderedDict

# 复用 build_page_plan.py 的审核/分类逻辑, 保证与 81 页规划一致
import build_page_plan as bp

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IN_CSV = os.path.join(ROOT, "seo-targets", "longtail_matrix.csv")
PAGE_PLAN = os.path.join(ROOT, "seo-targets", "page_plan.csv")
OUT_CSV = os.path.join(ROOT, "seo-targets", "longtail_review.csv")
OUT_MD = os.path.join(ROOT, "seo-targets", "longtail_review.md")

# ---------------- 意图分类 (KB 4 类) ----------------
# 交易型强信号 (BOFU)
TX_STRONG = ["best ", " top 10", " top 5", " vs ", " versus ", " alternative", " alternatives",
             " review", " reviews", " compare", " comparison", " cheapest", " for sale",
             "near me", "free trial", " coupon", " discount", " buy ", "buying ", "order ",
             "worth it", "should i get", "should i buy"]

# 商业型信号 (MOFU): 含产品/方案/工具词 —— 用 \b 词边界匹配, 杜绝 "apply/appear/position" 误判
BIZ_WORDS = ["software", "app", "apps", "system", "systems", "tool", "tools", "platform",
             "service", "management", "booking", "scheduler", "scheduling", "waiver",
             "waivers", "pos", "crm", "appointment", "business",
             "for artists", "for studios", "for shop", "studio software", "shop software",
             "studio app", "shop app", "online booking", "online scheduler"]
BIZ_RE = re.compile(r"\b(" + "|".join(re.escape(w) for w in BIZ_WORDS) + r")\b")

# 价格/成本信号 (需结合商业词才判交易型, 否则信息型疑问)
PRICE_TOKENS = [" price", " pricing", " cost", " cheap", " cheapest"]

# 导航型品牌词 (仅明确平台/竞品, 不含 "tattooed" 这类普通过去分词) —— 词边界匹配
BRAND_OURS = ["inkflow", "ink flow"]
BRAND_COMPETITOR = ["tattoodo", "tattoogenda", "booksy", "altegio", "google",
                    "amazon", "etsy", "pinterest", "instagram", "tiktok", "app store", "play store"]
BRAND_RE = re.compile(r"\b(" + "|".join(re.escape(b) for b in BRAND_OURS + BRAND_COMPETITOR) + r")\b")

def classify_intent(kw):
    k = " " + kw.lower().strip() + " "
    # 1. 交易型强信号
    if any(t in k for t in TX_STRONG):
        return "BOFU-交易型"
    # 2. 价格/成本 + 商业词 => 交易型 (如 "tattoo booking software pricing")
    has_price = any(t in k for t in PRICE_TOKENS)
    has_biz = bool(BIZ_RE.search(k))
    if has_price and has_biz:
        return "BOFU-交易型"
    # 3. free: 商业语境 => 交易型(找免费方案); 信息语境(设计/ideas) => 信息型
    if "free" in k.split():
        if has_biz:
            return "BOFU-交易型"
        return "TOFU-信息型"
    # 4. 商业型 (方案/工具词, 无交易信号)
    if has_biz:
        return "MOFU-商业型"
    # 5. 导航型 (品牌)
    if BRAND_RE.search(k):
        return "导航型"
    # 6. 默认信息型 (how/what/guide/meaning/ideas/healing/pain...)
    return "TOFU-信息型"

FUNNEL = {"TOFU-信息型": "TOFU", "MOFU-商业型": "MOFU", "BOFU-交易型": "BOFU", "导航型": "NAV"}

# 意图可量化分 (KB: 商业/交易 > 信息; 用于 partial 5维)
INTENT_SCORE = {"BOFU-交易型": 9, "MOFU-商业型": 8, "TOFU-信息型": 4, "导航型": 2}
BIZ_VALUE = {"BOFU-交易型": 9, "MOFU-商业型": 8, "TOFU-信息型": 3, "导航型": 1}

# ---------------- 4 道审核闸 ----------------
def decide(kw, intent, cluster):
    reasons = []
    # 闸1 业务相关性
    if bp.is_junk(kw):
        return "reject", "noise(噪声/堆词/乱码)"
    if bp.is_offtopic(kw):
        return "reject", "offtopic(非纹身/无关)"
    # 闸2 搜索意图 (导航型且非本品牌 => 竞品词, 不应做)
    if intent == "导航型":
        k = " " + kw.lower() + " "
        if any(b in k for b in BRAND_COMPETITOR):
            return "reject", "competitor-nav(竞品品牌词, 排不上)"
        return "keep", "brand-nav(本品牌词)"
    # 闸3 蚕食排查 (meaning 簇已被 Meaning Finder 70 页覆盖)
    if cluster == "meaning":
        return "review", "cannibal-meaning(已被70页覆盖, 仅做内链)"
    # 闸4 KD 可行性 -> 沙箱未跑哥飞, 标 pending
    return "keep", "pending-kd(需哥飞打分确认难度)"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=IN_CSV)
    ap.add_argument("--page-plan", default=PAGE_PLAN)
    ap.add_argument("--out-csv", default=OUT_CSV)
    ap.add_argument("--out-md", default=OUT_MD)
    args = ap.parse_args()

    # 读原始词 + 原 cluster
    rows = []
    with open(args.src, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rows.append((r["keyword"].strip(), r["cluster"].strip()))

    # 读 page_plan 建 (cluster,theme)->slug 映射, 保证与 81 页规划一致
    page_map = {}
    with open(args.page_plan, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            page_map[r["page_id"]] = r["slug"]

    out_rows = []
    stats = defaultdict(int)
    intent_dist = defaultdict(int)
    funnel_dist = defaultdict(int)
    decision_dist = defaultdict(int)
    side_dist = defaultdict(int)
    cluster_decision = defaultdict(lambda: defaultdict(int))
    examples = defaultdict(list)

    for kw, cluster in rows:
        c = cluster if cluster in bp.PILLARS else "other"
        intent = classify_intent(kw)
        funnel = FUNNEL[intent]
        side = bp.business_side(kw)
        th = bp.classify_theme(c, kw)
        page_id = f"{c}-{th}"
        assigned = page_map.get(page_id, bp.PILLARS[c][0])
        decision, reason = decide(kw, intent, c)

        # partial 5维 (KD / 搜索量 缺, 标 pending)
        intent_score = INTENT_SCORE[intent]
        biz_value = BIZ_VALUE[intent]
        match_score = 9 if c in bp.PILLARS else 5
        # 启发式优先级: 仅用可算的两高权维 (意图0.4 + 商业价值0.3)
        priority_hint = "high" if intent in ("BOFU-交易型", "MOFU-商业型") else ("med" if funnel == "TOFU" and side == "B2B" else "low")

        out_rows.append({
            "keyword": kw,
            "cluster": c,
            "theme": th,
            "intent": intent,
            "funnel": funnel,
            "business_side": side,
            "decision": decision,
            "gate_reason": reason,
            "assigned_page": assigned,
            "intent_score": intent_score,
            "biz_value": biz_value,
            "match_score": match_score,
            "kd_gate": "pending(哥飞)",
            "priority_hint": priority_hint,
        })
        intent_dist[intent] += 1
        funnel_dist[funnel] += 1
        decision_dist[decision] += 1
        side_dist[side] += 1
        cluster_decision[c][decision] += 1
        stats["total"] += 1
        if len(examples[(decision, c)]) < 4 and len(examples[(decision, c)]) < 4:
            examples[(decision, c)].append(kw)

    # 输出 CSV
    with open(args.out_csv, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["keyword","cluster","theme","intent","funnel",
                                          "business_side","decision","gate_reason","assigned_page",
                                          "intent_score","biz_value","match_score","kd_gate","priority_hint"])
        w.writeheader()
        for r in out_rows:
            w.writerow(r)

    # 输出 MD
    total = stats["total"]
    def pct(n): return f"{100*n/max(1,total):.1f}%"
    lines = ["# InkFlow 长尾词词级审核报告",
             "",
             f"> 审核对象: **{total}** 个 Google Suggest 长尾词 (来源 `longtail_matrix.csv`)",
             "> 方法: 应用 `seo-knowledge` 关键词方法论 (4类意图 + 4道审核闸)",
             f"> 生成时间: 2026-07-14",
             "",
             "## 一、意图分布 (KB 4 类)",
             "",
             "| 意图 | 数量 | 占比 | 对应内容 |",
             "|------|------|------|----------|",
             f"| TOFU-信息型 | {intent_dist['TOFU-信息型']} | {pct(intent_dist['TOFU-信息型'])} | 博客/指南 |",
             f"| MOFU-商业型 | {intent_dist['MOFU-商业型']} | {pct(intent_dist['MOFU-商业型'])} | 功能页 |",
             f"| BOFU-交易型 | {intent_dist['BOFU-交易型']} | {pct(intent_dist['BOFU-交易型'])} | 对比/产品页 |",
             f"| 导航型 | {intent_dist['导航型']} | {pct(intent_dist['导航型'])} | 品牌页 |",
             "",
             "## 二、审核决策 (4 道闸结果)",
             "",
             "| 决策 | 数量 | 占比 | 含义 |",
             "|------|------|------|------|",
             f"| keep | {decision_dist['keep']} | {pct(decision_dist['keep'])} | 通过前3闸, KD待哥飞确认 |",
             f"| review | {decision_dist['review']} | {pct(decision_dist['review'])} | 需人工决定 (蚕食/歧义) |",
             f"| reject | {decision_dist['reject']} | {pct(decision_dist['reject'])} | 噪声/无关/竞品词 |",
             "",
             "## 三、业务侧分布",
             "",
             f"- B2B (工作室/艺术家工具向): {side_dist['B2B']} ({pct(side_dist['B2B'])})",
             f"- B2C (消费者内容向): {side_dist['B2C']} ({pct(side_dist['B2C'])})",
             "",
             "## 四、各集群 × 决策分布",
             "",
             "| 集群 | keep | review | reject | 主要意图 |",
             "|------|------|-------|--------|---------|"]
    # 各集群主要意图
    cluster_intent = defaultdict(lambda: defaultdict(int))
    for r in out_rows:
        cluster_intent[r["cluster"]][r["intent"]] += 1
    for c in sorted(cluster_decision, key=lambda x: -sum(cluster_decision[x].values())):
        ci = cluster_intent[c]
        top_intent = max(ci, key=ci.get) if ci else "-"
        lines.append(f"| {c} | {cluster_decision[c]['keep']} | {cluster_decision[c]['review']} | {cluster_decision[c]['reject']} | {top_intent} |")
    lines += ["",
              "## 五、关键结论",
              "",
              "1. **TOFU 占比极高** — Google Suggest 长尾天然偏信息型 (how/what/guide/meaning/ideas)。",
              "   按 KB 原则『前期 80% 精力做商业/交易型』, 这批词不能散养, 必须用 **Hub-and-Spoke**",
              "   把 TOFU 权重通过内链导向 MOFU/BOFU 功能页 (即此前 aftercare 博客→工具 的漏斗)。",
              "2. **meaning 簇全部 review** — 已被 Tattoo Meaning Finder 70 页覆盖, 新站不应再建重复页,",
              "   改为在 70 页内做内链即可 (蚕食排查闸3)。",
              "3. **KD 闸未闭合** — 沙箱无法稳定连哥飞, 5652 词暂无难度分。需本地运行:",
              "   `export GEFEI_TOKEN=wc_mcp_7614980ee9bd6ae77d97d9932b054c39e01720b195c63500 && python mine_longtail.py --from-cache --max-kd 100 --out seo-targets/longtail_matrix`",
              "   拿到 KD 后, 对 keep 词按 KD<20(新站)/25(B2C) 阈值二次筛选。",
              "4. **BOFU/MOFU 词是金矿** — 含 best/vs/software/free 的词直接对应对比页/功能页, 优先排进建页。",
              "",
              "## 六、keep 样例 (按优先级)",
              ""]
    for r in sorted(out_rows, key=lambda x: (0 if x["priority_hint"]=="high" else 1 if x["priority_hint"]=="med" else 2)):
        if r["decision"] == "keep" and r["priority_hint"] in ("high", "med"):
            lines.append(f"- [{r['priority_hint']}] `{r['keyword']}` → {r['intent']} → {r['assigned_page']}")
            if len([l for l in lines if l.startswith("- [")]) >= 30:
                break
    lines += ["",
              "## 七、reject 样例",
              ""]
    shown_rej = 0
    for r in out_rows:
        if r["decision"] == "reject":
            lines.append(f"- `{r['keyword']}` — {r['gate_reason']}")
            shown_rej += 1
            if shown_rej >= 20:
                break
    lines += ["", "---", f"CSV 全量: `{os.path.relpath(OUT_CSV, ROOT)}`", ""]
    with open(args.out_md, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"总词数: {total}")
    print(f"意图: TOFU={intent_dist['TOFU-信息型']} MOFU={intent_dist['MOFU-商业型']} BOFU={intent_dist['BOFU-交易型']} NAV={intent_dist['导航型']}")
    print(f"决策: keep={decision_dist['keep']} review={decision_dist['review']} reject={decision_dist['reject']}")
    print(f"业务侧: B2B={side_dist['B2B']} B2C={side_dist['B2C']}")
    print(f"CSV -> {OUT_CSV}")
    print(f"MD  -> {OUT_MD}")

if __name__ == "__main__":
    main()

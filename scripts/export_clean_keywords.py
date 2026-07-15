#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 longtail_review.csv 清理出「可直接用的词库」:
  - 剔除 reject (噪声/竞品平台词) 和 review (meaning 簇蚕食, 仅内链)
  - 保留 keep 词, 按优先级 (BOFU/MOFU > TOFU-B2B > TOFU-B2C) 排序
输出:
  seo-targets/longtail_clean.csv      (全部 keep 词, 干净可建页词库)
  seo-targets/longtail_gold.csv       (仅 BOFU+MOFU 金矿词, 立即建页候选)
"""
import os
import csv
import argparse
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IN = os.path.join(ROOT, "seo-targets", "longtail_review.csv")
OUT_CLEAN = os.path.join(ROOT, "seo-targets", "longtail_clean.csv")
OUT_GOLD = os.path.join(ROOT, "seo-targets", "longtail_gold.csv")

PRIORITY_RANK = {"high": 0, "med": 1, "low": 2}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=IN)
    ap.add_argument("--out-clean", default=OUT_CLEAN)
    ap.add_argument("--out-gold", default=OUT_GOLD)
    args = ap.parse_args()

    rows = []
    with open(args.src, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rows.append(r)

    keep = [r for r in rows if r["decision"] == "keep"]
    gold = [r for r in keep if r["funnel"] in ("BOFU", "MOFU")]

    def sort_key(r):
        return (PRIORITY_RANK.get(r["priority_hint"], 9),
                r["cluster"],
                r["keyword"])

    keep.sort(key=sort_key)
    gold.sort(key=sort_key)

    cols = ["keyword", "cluster", "theme", "intent", "funnel",
            "business_side", "assigned_page", "priority_hint"]
    with open(args.out_clean, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in keep:
            w.writerow({c: r[c] for c in cols})

    with open(args.out_gold, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in gold:
            w.writerow({c: r[c] for c in cols})

    # 按集群统计
    by_cluster = defaultdict(int)
    for r in keep:
        by_cluster[r["cluster"]] += 1

    print(f"原始审核词: {len(rows)}")
    print(f"剔除: reject={sum(1 for r in rows if r['decision']=='reject')} "
          f"review={sum(1 for r in rows if r['decision']=='review')} (meaning 蚕食)")
    print(f"干净可建页词库 (longtail_clean.csv): {len(keep)}")
    print(f"  其中 BOFU+MOFU 金矿 (longtail_gold.csv): {len(gold)}")
    print(f"  TOFU: {len(keep)-len(gold)}")
    print("各集群 keep 词数:")
    for c in sorted(by_cluster, key=lambda x: -by_cluster[x]):
        print(f"  {c}: {by_cluster[c]}")
    print(f"clean -> {OUT_CLEAN}")
    print(f"gold  -> {OUT_GOLD}")

if __name__ == "__main__":
    main()

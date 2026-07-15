#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 KD 打分队列 kd_queue.csv（纯离线，读本地 CSV，无需联网）。
来源：
  1) page_plan.csv 中 review_status=recommended_keep 的页面主词（内容优先级最高）
  2) longtail_gold.csv 的全部金矿词（BOFU/MOFU）
去重后按 (page_primary 优先, 其次 gold) 排序，gold 内部按 priority_hint 高→低。
"""
import csv
import os

BASE = "D:/ink-flow-manager/marketing/seo-targets"
PLAN = os.path.join(BASE, "page_plan.csv")
GOLD = os.path.join(BASE, "longtail_gold.csv")
OUT = os.path.join(BASE, "kd_queue.csv")

HINT_RANK = {"high": 0, "med": 1, "medium": 1, "low": 2}


def load(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    plan = load(PLAN)
    queue = {}  # lower_keyword -> dict(keyword, ref_id, source, priority, sortkey)

    # 1) 保留页主词
    for r in plan:
        if r.get("review_status") == "recommended_keep":
            kw = (r.get("primary_keyword") or "").strip()
            if not kw:
                continue
            lk = kw.lower()
            if lk not in queue:
                queue[lk] = {
                    "keyword": kw,
                    "ref_id": r.get("page_id", ""),
                    "source": "page_primary",
                    "priority": 1,
                    "sortkey": -int(r.get("kw_count") or 0),
                }

    # 2) 金矿词
    if os.path.exists(GOLD):
        gold = load(GOLD)
        for r in gold:
            kw = (r.get("keyword") or "").strip()
            if not kw:
                continue
            lk = kw.lower()
            if lk not in queue:
                hint = (r.get("priority_hint") or "low").strip().lower()
                queue[lk] = {
                    "keyword": kw,
                    "ref_id": r.get("assigned_page", "gold"),
                    "source": "gold",
                    "priority": 2,
                    "sortkey": HINT_RANK.get(hint, 2),
                }

    rows = list(queue.values())
    rows.sort(key=lambda x: (x["priority"], x["sortkey"], x["keyword"]))

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["keyword", "ref_id", "source", "priority", "sortkey"])
        w.writeheader()
        for r in rows:
            w.writerow(r)

    n_pp = sum(1 for r in rows if r["source"] == "page_primary")
    n_gold = sum(1 for r in rows if r["source"] == "gold")
    print(f"队列生成完成：共 {len(rows)} 词 | page_primary={n_pp} | gold={n_gold}")
    print(f"-> {OUT}")


if __name__ == "__main__":
    main()

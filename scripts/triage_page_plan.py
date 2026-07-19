#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动预审 page_plan.csv：把 122 页分为 3 类，降低人工复核负担。
- recommended_keep  : 支柱页 + 支撑页 kw>=10（明确有量）
- recommended_merge : 薄页 kw<10（建议并入父级支柱/相关 spoke）
- recommended_reject: near me 页（SaaS 无实体店，不建独立页，关键词并入支柱 FAQ）

输出：
- 回写 page_plan.csv 的 review_status 列（可逆，原 pending_review 被覆盖为建议值）
- 生成 triage_report.md 汇总 + 待人工确认清单
"""
import csv
import os

SRC = "D:/ink-flow-manager/marketing/seo-targets/page_plan.csv"
OUT_MD = "D:/ink-flow-manager/marketing/seo-targets/triage_report.md"


def is_near_me(row):
    pk = (row["primary_keyword"] or "").lower()
    slug = (row["slug"] or "").lower()
    sup = (row["supporting_keywords"] or "").lower()
    if "near me" in pk:
        return True
    if "near-me" in slug:
        return True
    if "by-location" in slug and "near me" in sup:
        return True
    return False


def main():
    with open(SRC, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    keep, merge, reject = [], [], []
    for row in rows:
        kc = int(row["kw_count"] or 0)
        note = ""
        if row["page_type"] == "pillar":
            decision = "recommended_keep"
            note = "核心支柱页"
        elif is_near_me(row):
            decision = "recommended_reject"
            note = "near me 词：SaaS 无实体店，不建独立页，关键词并入支柱 FAQ"
        elif kc < 10:
            decision = "recommended_merge"
            merge_target = f"{row['cluster']}-general"
            note = f"薄页(kw={kc})，建议并入 {merge_target}"
        else:
            decision = "recommended_keep"
            note = ""
        row["review_status"] = decision
        row["_note"] = note
        if decision == "recommended_keep":
            keep.append(row)
        elif decision == "recommended_merge":
            merge.append(row)
        else:
            reject.append(row)

    # 回写（去掉临时 _note 列，保留原字段 + 更新后的 review_status）
    write_fields = [c for c in fieldnames]
    with open(SRC, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=write_fields)
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k, "") for k in write_fields})

    # 汇总报告
    lines = []
    lines.append("# Page Plan 自动预审报告\n")
    lines.append(f"总页数：**{len(rows)}**  |  生成自 `page_plan.csv`\n")
    lines.append("## 分类统计\n")
    lines.append(f"- ✅ recommended_keep（保留）：**{len(keep)}** 页")
    lines.append(f"- 🔀 recommended_merge（合并/并入父级）：**{len(merge)}** 页")
    lines.append(f"- ❌ recommended_reject（砍掉 near me）：**{len(reject)}** 页\n")

    # 按 cluster 统计 keep/merge/reject
    lines.append("## 按簇分布\n")
    clusters = {}
    for row in rows:
        c = row["cluster"]
        clusters.setdefault(c, {"keep": 0, "merge": 0, "reject": 0})
        st = row["review_status"]
        if st == "recommended_keep":
            clusters[c]["keep"] += 1
        elif st == "recommended_merge":
            clusters[c]["merge"] += 1
        else:
            clusters[c]["reject"] += 1
    lines.append("| 簇 | 保留 | 合并 | 砍 |")
    lines.append("| --- | --- | --- | --- |")
    for c, v in sorted(clusters.items()):
        lines.append(f"| {c} | {v['keep']} | {v['merge']} | {v['reject']} |")

    lines.append("\n## ❌ 砍掉清单（near me，建议并入对应支柱 FAQ）\n")
    for row in reject:
        lines.append(f"- `{row['page_id']}` — {row['primary_keyword']} (kw={row['kw_count']})")

    lines.append("\n## 🔀 合并清单（薄页 kw<10，并入父级）\n")
    for row in merge:
        lines.append(f"- `{row['page_id']}` — {row['primary_keyword']} (kw={row['kw_count']}) → {row['cluster']}-general")

    lines.append("\n## 人工需确认的高价值保留页（pillar，请扫一眼标题/primary keyword）\n")
    for row in keep:
        if row["page_type"] == "pillar":
            lines.append(f"- `{row['page_id']}` — {row['title']} | PK: {row['primary_keyword']} (kw={row['kw_count']})")

    lines.append("\n---\n")
    lines.append("**下一步**：确认以上分类后，即可进入「写内容（先写 BOFU/MOFU 金矿词页）→ 建内链 → 生成 Astro 页」阶段。\n")
    lines.append("review_status 已回写；如需推翻某页结论，直接改该列值即可（pending_review / recommended_keep / recommended_merge / recommended_reject）。\n")

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"总页: {len(rows)} | keep: {len(keep)} | merge: {len(merge)} | reject: {len(reject)}")
    print(f"报告已生成: {OUT_MD}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""扫描 src/pages 真实站点页面（排除 .agents 噪声），抽取主题信号并映射到 122 页聚类框架。
输出: seo-targets/page_topic_audit.csv (+ 控制台摘要)
用途: 配合 GSC 导出，做「每页锁定 1 个主题 + 决策(保留/合并/重写/砍)」审计。
"""
import os, re, csv
from collections import Counter, defaultdict

ROOT = "src/pages"
OUT = "seo-targets/page_topic_audit.csv"
PLAN = "seo-targets/page_plan.csv"

fm_title = re.compile(r"title:\s*['\"](.+?)['\"]", re.I)
title_tag = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
h1_tag = re.compile(r"<h1[^>]*>(.*?)</h1>", re.I | re.S)
desc_tag = re.compile(r'name=["\']description["\'][^>]*content=["\'](.*?)["\']', re.I | re.S)
fm_desc = re.compile(r"description:\s*['\"](.+?)['\"]", re.I)
tag_strip = re.compile(r"<[^>]+>")
js_comment = re.compile(r"\{/*.*?\*/\}")
curly = re.compile(r"\{[^}]*\}")

# 聚类关键词映射（head noun → cluster）
CLUSTER_KW = {
    "aftercare": ["aftercare", "heal", "healing", "care", "after-care"],
    "ideas": ["idea", "ideas", "design", "inspiration", "meaning"],
    "color": ["color", "colour", "ink"],
    "placement": ["placement", "spot", "body", "location", "where"],
    "small": ["small", "tiny", "minimal", "mini"],
    "cost": ["cost", "price", "pricing", "quote", "fee"],
    "removal": ["removal", "remove", "laser", "fade"],
    "coverup": ["cover", "coverup", "cover-up"],
    "pain": ["pain", "hurt", "painful", "ouch"],
    "problems": ["problem", "issue", "infection", "blowout", "repair"],
    "styles": ["style", "styles"],
    "quotes": ["quotes", "quote", "caption", "word"],
    "prep": ["prep", "prepare", "before", "ready"],
    "trends": ["trend", "trends"],
}

def route_of(rel):
    p = rel.replace("src/pages/", "").replace("\\", "/")
    p = re.sub(r"\.(tsx|astro|md)$", "", p)
    p = re.sub(r"/index$", "", p)
    if p == "": p = "/"
    elif not p.startswith("/"): p = "/" + p
    return p

def extract(path):
    txt = open(path, encoding="utf-8", errors="ignore").read()
    fm = ""
    m = re.match(r"^---\s*\n(.*?)\n---", txt, re.S)
    if m: fm = m[1]
    title = fm_title.search(fm)
    title = title.group(1) if title else None
    if not title:
        t = title_tag.search(txt); title = t.group(1).strip() if t else None
    if title: title = re.sub(r"\{[^}]*\}", "", title).strip()
    h1 = h1_tag.search(txt)
    h1 = tag_strip.sub("", h1.group(1)) if h1 else None
    if h1: h1 = re.sub(r"\{[^}]*\}", "", h1).strip()
    desc = desc_tag.search(txt)
    if not desc:
        d = fm_desc.search(fm); desc = d.group(1) if d else None
    if desc: desc = re.sub(r"\{[^}]*\}", "", desc).strip()
    body = re.sub(r"^---.*?---", "", txt, flags=re.S)
    body = tag_strip.sub(" ", body); body = js_comment.sub(" ", body); body = curly.sub(" ", body)
    body = re.sub(r"\s+", " ", body)
    wc = len(body.split())
    return title, h1, desc, wc, bool(re.search(r"faq", txt, re.I)), bool(re.search(r'application/ld\+json|json-ld|schema', txt, re.I))

def map_cluster(route, title, h1):
    blob = (route + " " + (title or "") + " " + (h1 or "")).lower()
    for cl, kws in CLUSTER_KW.items():
        for kw in kws:
            if re.search(r"\b" + re.escape(kw), blob):
                return cl
    return "(未归类)"

def main():
    rows = []
    for dp, _, fns in os.walk(ROOT):
        if ".agents" in dp.replace("\\", "/").split("/"):
            continue
        for fn in fns:
            if fn.endswith((".tsx", ".astro", ".md")):
                full = os.path.join(dp, fn).replace("\\", "/")
                rel = full
                d = os.path.dirname(rel).replace("src/pages", "").replace("\\", "/") or "/"
                title, h1, desc, wc, hf, hs = extract(full)
                cl = map_cluster(route_of(rel), title, h1)
                rows.append({
                    "route": route_of(rel), "dir": d, "file": rel,
                    "cluster": cl, "title": (title or "")[:70], "h1": (h1 or "")[:70],
                    "words": wc, "has_faq": "Y" if hf else "", "has_schema": "Y" if hs else "",
                })
    rows.sort(key=lambda r: (r["dir"], r["route"]))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["route","dir","cluster","file","title","h1","words","has_faq","has_schema"])
        w.writeheader(); w.writerows(rows)

    print(f"真实站点页(已排除 .agents): {len(rows)}")
    dc = Counter(r["dir"] for r in rows)
    print("--- 各目录 ---")
    for k, v in sorted(dc.items(), key=lambda x: -x[1]):
        print(f"  {k:14} {v}")
    cc = Counter(r["cluster"] for r in rows)
    print("\n--- 现有页映射到 122 页聚类框架 ---")
    for k, v in sorted(cc.items(), key=lambda x: -x[1]):
        print(f"  {k:14} {v} 页")

    # 计划侧聚类计数
    planned = Counter()
    if os.path.exists(PLAN):
        with open(PLAN, encoding="utf-8") as f:
            for r in csv.DictReader(f):
                planned[r.get("cluster","").strip()] += 1
        print(f"\n--- 计划 vs 现有（同簇对比）---")
        allc = set(list(cc) + list(planned))
        for c in sorted(allc):
            p = planned.get(c, 0); e = cc.get(c, 0)
            flag = "  ← 现有空白,需新建" if e == 0 and p > 0 else ("  ← 计划无此簇(现有多余?)" if p == 0 and e > 0 else "")
            print(f"  {c:14} 计划 {p:3} / 现有 {e:3}{flag}")

    thin = [r for r in rows if r["words"] < 300]
    print(f"\n薄页(<300词): {len(thin)} / {len(rows)}")
    print(f"无 FAQ: {sum(1 for r in rows if not r['has_faq'])} / {len(rows)}")
    print(f"无 Schema: {sum(1 for r in rows if not r['has_schema'])} / {len(rows)}")
    print(f"\nCSV -> {OUT}")

if __name__ == "__main__":
    main()

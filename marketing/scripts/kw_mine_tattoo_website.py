#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
InkFlow B5 Website Builder 主题 · 系统化关键词实挖
- 用完整 "前缀 x 种子 x 后缀" 矩阵调 Google Suggest (www.google.com/complete/search)
- 每个 suggestion 标注来源 query 数 (出现越多越核心)
- 输出去重后的真实下拉词，零推测
"""
import urllib.request
import urllib.parse
import json
import time
import sys

# ---- 种子词 (核心名词短语) ----
SEEDS = [
    "tattoo website",
    "tattoo artist website",
    "tattoo studio website",
    "tattoo shop website",
    "tattoo portfolio website",
    "tattoo website builder",
    "free tattoo website",
    "tattoo booking website",
    "tattoo business website",
]

# ---- 前缀 (放在种子前) ----
PREFIXES = [
    "best", "top", "free", "cheap", "professional",
    "how to make a", "how to build a", "create a", "build a", "make a",
]

# ---- 后缀 (放在种子后, 空格连接) ----
SUFFIXES = [
    "templates", "template", "design", "design ideas", "examples", "ideas",
    "inspiration", "cost", "price", "reddit", "near me", "for artists",
    "for beginners", "with booking", "vs wix", "vs squarespace", "vs linktree",
    "wordpress", "shopify",
]

# ---- 直接挖的已知有效 query (含修饰维度) ----
DIRECT = [
    "tattoo website", "tattoo website templates", "tattoo website design",
    "tattoo website design ideas", "tattoo website examples", "tattoo website ideas",
    "tattoo website inspiration", "tattoo website cost", "tattoo website price",
    "tattoo website reddit", "tattoo website near me", "tattoo website vs wix",
    "tattoo website vs squarespace", "tattoo website vs linktree", "tattoo website wordpress",
    "best tattoo website", "top tattoo website", "free tattoo website", "cheap tattoo website",
    "professional tattoo website", "how to make a tattoo website", "how to build a tattoo website",
    "create a tattoo website", "build a tattoo website", "make a tattoo website",
    "best tattoo websites", "best website builders for tattoo artists",
    "tattoo artist website templates", "tattoo artist website design",
    "tattoo artist website ideas", "tattoo artist website examples",
    "tattoo artist website portfolio", "tattoo studio website template",
    "tattoo studio website design", "tattoo portfolio website examples",
    "tattoo portfolio website template", "free tattoo portfolio website",
    "tattoo website for",
]

# ---- 生成完整 query 矩阵 ----
queries = set(DIRECT)
for s in SEEDS:
    queries.add(s)
    for p in PREFIXES:
        queries.add(f"{p} {s}")
    for suf in SUFFIXES:
        queries.add(f"{s} {suf}")

queries = sorted(queries)

results = {}  # query -> list[suggestion]
for q in queries:
    url = "https://www.google.com/complete/search?" + urllib.parse.urlencode({
        "client": "firefox", "q": q, "hl": "en", "gl": "US"
    })
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read().decode("utf-8"))
        sugg = data[1] if isinstance(data, list) and len(data) > 1 else []
        results[q] = [str(x) for x in sugg]
    except Exception as e:
        results[q] = [f"__ERR__:{e}"]
    time.sleep(0.25)

# ---- 汇总去重 + 计数来源 ----
from collections import defaultdict
counter = defaultdict(int)
source_map = defaultdict(list)
for q, sugg_list in results.items():
    for s in sugg_list:
        if s.startswith("__ERR__"):
            continue
        counter[s] += 1
        source_map[s].append(q)

# 降噪过滤: 去掉明显与"建站"无关的 tattoo prices/design stencil 联想
EXCLUDE_HINTS = ["tattoo prices", "tattoo cost", "how much do tattoos", "tattoo stencil",
                 "tattoo design ideas (for drawing)", "tattoo fonts", "tattoo meaning"]

def is_noise(phrase: str) -> bool:
    p = phrase.lower()
    # 含 tattoo 但核心是 prices/meaning/fonts/stencil -> 噪音
    if any(h in p for h in ["how much", "prices near me", "price of a tattoo", "tattoo meaning",
                            "tattoo fonts", "tattoo stencil", "tattoo drawing"]):
        return True
    return False

clean = {k: v for k, v in counter.items() if not is_noise(k)}

# ---- 输出 ----
print(f"=== QUERY COUNT: {len(queries)} ===")
err_q = [q for q, v in results.items() if v and v[0].startswith("__ERR__")]
print(f"=== ERR QUERIES: {len(err_q)} ===")
for q in err_q:
    print(f"  ERR {q}: {results[q][0]}")

print("\n=== UNIQUE SUGGESTIONS (count desc, deduped, noise-filtered) ===")
for phrase, cnt in sorted(clean.items(), key=lambda x: (-x[1], x[0])):
    print(f"{cnt:2d}  {phrase}")

print("\n=== RAW BY QUERY (for audit) ===")
for q in queries:
    sl = results[q]
    if sl and sl[0].startswith("__ERR__"):
        print(f"[{q}] -> {sl[0]}")
    else:
        print(f"[{q}] -> {len(sl)} sugg")

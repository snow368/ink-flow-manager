#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate the "X tattoo meaning" -> category classification map from
marketing/src/data/tattoo-meanings.ts

Outputs:
  - seo-targets/tattoo-meaning-keyword-map.csv   (machine-readable)
  - seo-targets/tattoo-meaning-keyword-map.md     (human-readable report)
"""
import re
import os

SRC = r"D:/ink-flow-manager/marketing/src/data/tattoo-meanings.ts"
OUT_DIR = r"D:/ink-flow-manager/marketing/seo-targets"

# Categories created during the 2026-07-12 "tattoo meaning finder" expansion.
NEW_CATEGORIES = {"birds", "zodiac", "insects", "sea-life", "time", "words"}
# Symbols added into the EXISTING geometric category during the same task.
EXTENDED_GEOMETRIC = {"infinity", "sun", "galaxy", "comet", "planet", "aurora"}

with open(SRC, encoding="utf-8") as f:
    text = f.read()

# category id -> display name
cat_re = re.compile(r"id:\s*'([^']+)',\s*name:\s*'([^']+)'")
cat_map = {cid: cname for cid, cname in cat_re.findall(text)}

# symbol: slug, name, category
sym_re = re.compile(r"slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)'")
symbols = sym_re.findall(text)

def status_for(cat, slug):
    if cat in NEW_CATEGORIES:
        return "new_category"
    if cat == "geometric" and slug in EXTENDED_GEOMETRIC:
        return "extended"
    return "existing"

rows = []
for slug, name, cat in symbols:
    kw = f"{name} tattoo meaning"
    st = status_for(cat, slug)
    rows.append((kw, slug, cat, cat_map.get(cat, cat), st, ""))

# Curated variant / alias phrasings that route to an existing symbol.
# (keyword, slug, category_id, note)
variants = [
    ("koi tattoo meaning", "koi-fish", "mythological", "alias of koi fish"),
    ("crescent moon tattoo meaning", "moon", "geometric", "variant of moon"),
    ("nautical star tattoo meaning", "star", "geometric", "variant of star"),
    ("saturn tattoo meaning", "planet", "geometric", "variant of planet"),
    ("aurora borealis tattoo meaning", "aurora", "geometric", "variant of aurora"),
    ("sugar skull tattoo meaning", "skull", "objects", "variant of skull"),
    ("sacred heart tattoo meaning", "heart", "objects", "variant of heart"),
    ("ouroboros tattoo meaning", "snake", "animals", "variant of snake"),
    ("sun and moon tattoo meaning", "sun", "geometric", "sun (moon also in geometric)"),
    ("celtic tree of life tattoo meaning", "tree-of-life", "nature", "variant of tree of life"),
]

for kw, slug, cat, note in variants:
    rows.append((kw, slug, cat, cat_map.get(cat, cat), "variant", note))

# Gap keywords: common searches with NO current symbol in the Finder.
# (keyword, suggested category, note)  -> status = "gap"
gaps = [
    ("cat tattoo meaning", "animals", "missing symbol"),
    ("bear tattoo meaning", "animals", "missing symbol"),
    ("deer tattoo meaning", "animals", "missing symbol"),
    ("fox tattoo meaning", "animals", "missing symbol"),
    ("elephant tattoo meaning", "animals", "missing symbol"),
    ("tiger tattoo meaning", "animals", "missing symbol"),
    ("wolf pack tattoo meaning", "animals", "covered by wolf customSections"),
    ("lily tattoo meaning", "flowers", "missing symbol"),
    ("daisy tattoo meaning", "flowers", "missing symbol"),
    ("lavender tattoo meaning", "flowers", "missing symbol"),
    ("tulip tattoo meaning", "flowers", "missing symbol"),
    ("hibiscus tattoo meaning", "flowers", "missing symbol"),
    ("unicorn tattoo meaning", "mythological", "missing symbol"),
    ("fairy tattoo meaning", "mythological", "missing symbol"),
    ("kraken tattoo meaning", "sea-life", "missing symbol"),
    ("seahorse tattoo meaning", "sea-life", "missing symbol"),
    ("turtle tattoo meaning", "sea-life", "missing symbol"),
    ("fish tattoo meaning", "sea-life", "missing symbol (generic)"),
    ("crow tattoo meaning", "birds", "missing symbol (raven exists)"),
    ("sparrow tattoo meaning", "birds", "missing symbol (swallow exists)"),
    ("peacock tattoo meaning", "birds", "missing symbol"),
    ("leo tattoo meaning", "zodiac", "missing symbol (sign, category exists)"),
    ("virgo tattoo meaning", "zodiac", "missing symbol (sign, category exists)"),
    ("aries tattoo meaning", "zodiac", "missing symbol (sign, category exists)"),
    ("angel tattoo meaning", "religious", "missing symbol"),
    ("buddha tattoo meaning", "religious", "missing symbol"),
    ("ganesha tattoo meaning", "religious", "missing symbol"),
    ("yin yang tattoo meaning", "cultural", "missing symbol"),
    ("chakra tattoo meaning", "religious", "missing symbol"),
    ("ship tattoo meaning", "objects", "missing symbol"),
    ("music note tattoo meaning", "objects", "missing symbol"),
    ("lightning tattoo meaning", "geometric", "missing symbol"),
    ("cloud tattoo meaning", "nature", "missing symbol"),
    ("leaf tattoo meaning", "nature", "missing symbol"),
]

for kw, cat, note in gaps:
    rows.append((kw, "", cat, cat_map.get(cat, cat), "gap", note))

# ---- CSV ----
csv_path = os.path.join(OUT_DIR, "tattoo-meaning-keyword-map.csv")
with open(csv_path, "w", encoding="utf-8", newline="") as f:
    f.write("keyword,symbol_slug,category_id,category_name,status,note\n")
    for kw, slug, cat, cname, st, note in rows:
        f.write(f"{kw},{slug},{cat},{cname},{st},{note}\n")

# ---- Summary counts ----
from collections import Counter
status_counts = Counter(st for *_, st, _ in rows)
total_symbols = len(symbols)
total_cats = len(cat_map)

# ---- MD ----
md_path = os.path.join(OUT_DIR, "tattoo-meaning-keyword-map.md")
lines = []
lines.append("# Tattoo Meaning Finder — 关键词归类映射表")
lines.append("")
lines.append("> 生成自 `src/data/tattoo-meanings.ts`（单一数据源）。\n")
lines.append(f"> 当前共 **{total_symbols} 个符号 / {total_cats} 个类别**。"
             "本表用于把 `“X tattoo meaning”` 类搜索词归入 Tattoo Meaning Finder，"
             "并在 Finder 无对应类别时新建小类。")
lines.append("")
lines.append("## 状态说明")
lines.append("")
lines.append("| 状态 | 含义 |")
lines.append("|------|------|")
lines.append("| `existing` | 任务前已在 Finder 中（类别与符号都存在） |")
lines.append("| `extended` | 在**已有类别**中补充了新符号（本次任务扩展，未新建类别） |")
lines.append("| `new_category` | 属于本次任务**新建的小类** |")
lines.append("| `variant` | 同义/变体搜索词，路由到已有符号 |")
lines.append("| `gap` | 常见搜索词，Finder 暂缺对应符号（待补充内容） |")
lines.append("")
lines.append("## 类别汇总（15 类）")
lines.append("")
lines.append("| 类别 ID | 类别名 | 来源 | 符号数 |")
lines.append("|---------|--------|------|--------|")
for cid, cname in cat_map.items():
    cnt = sum(1 for s in symbols if s[2] == cid)
    src = "新建" if cid in NEW_CATEGORIES else ("扩展" if cid == "geometric" else "原有")
    lines.append(f"| {cid} | {cname} | {src} | {cnt} |")
lines.append("")
lines.append("## 完整归类映射")
lines.append("")
lines.append("| 搜索词 | 符号 slug | 类别 | 状态 | 备注 |")
lines.append("|--------|-----------|------|------|------|")
for kw, slug, cat, cname, st, note in rows:
    lines.append(f"| {kw} | {slug or '—'} | {cname} | {st} | {note or ''} |")
lines.append("")
lines.append("## 缺口与下一步建议")
lines.append("")
lines.append("`gap` 状态的关键词表示有搜索量但 Finder 暂无对应符号。建议优先级：")
lines.append("")
lines.append("1. **已有类别直接补符号**：如 `cat`, `bear`, `deer`, `fox`, `tiger`（animals）；"
             "`lily`, `daisy`, `hibiscus`（flowers）；`unicorn`, `fairy`（mythological）；"
             "`kraken`, `seahorse`, `turtle`（sea-life）；`crow`, `sparrow`, `peacock`（birds）；"
             "`angel`, `buddha`, `ganesha`, `chakra`（religious）；`yin yang`（cultural）。")
lines.append("2. **星座符号扩充**：zodiac 类别已建，但仅 4 个符号；可补 `leo`, `virgo`, `aries`, "
             "`taurus`, `cancer`, `libra`, `sagittarius`, `capricorn`, `aquarius` 等 12 星座。")
lines.append("3. **跨类别通用词**：`bird`, `fish`, `flower`, `tree` 等通用词可由现有具体符号承接，"
             "并在详情页增加 \"related\" 引导。")
lines.append("")
lines.append("---")
lines.append("")
lines.append(f"*Mapping generated programmatically from `tattoo-meanings.ts` "
             f"({total_symbols} symbols / {total_cats} categories).*")

with open(md_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"symbols parsed : {total_symbols}")
print(f"categories     : {total_cats}")
print(f"status counts  : {dict(status_counts)}")
print(f"CSV  -> {csv_path}")
print(f"MD   -> {md_path}")

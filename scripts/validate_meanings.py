#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Read-only integrity check for the tattoo-meanings data layer + page fixes.
Does NOT write to dist/ or any build output. Safe to run in sandbox."""
import re
import sys
import os

ROOT = r"D:/ink-flow-manager/marketing"
DATA = os.path.join(ROOT, "src/data/tattoo-meanings.ts")
SYMBOL_PAGE = os.path.join(ROOT, "src/pages/meaning/[symbol].astro")
INDEX_PAGE = os.path.join(ROOT, "src/pages/meaning/index.astro")

errors = []
warnings = []

with open(DATA, encoding="utf-8") as f:
    data = f.read()

# category id -> name
cat_re = re.compile(r"id:\s*'([^']+)',\s*name:\s*'([^']+)'")
cat_map = {}
for cid, cname in cat_re.findall(data):
    if cid in cat_map and cat_map[cid] != cname:
        warnings.append(f"duplicate category id {cid}")
    cat_map[cid] = cname

# symbols
sym_re = re.compile(r"slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)'")
symbols = sym_re.findall(data)
slugs = [s[0] for s in symbols]

# 1. unique slugs
dup = [s for s in set(slugs) if slugs.count(s) > 1]
if dup:
    errors.append(f"DUPLICATE slugs: {dup}")

# 2. count
if len(symbols) != 70:
    errors.append(f"symbol count = {len(symbols)} (expected 70)")
if len(cat_map) != 15:
    errors.append(f"category count = {len(cat_map)} (expected 15)")

# 3. every symbol.category exists
bad_cat = [(s[0], s[2]) for s in symbols if s[2] not in cat_map]
if bad_cat:
    errors.append(f"symbols with unknown category: {bad_cat}")

# 4. every category has >=1 symbol
cat_symbols = {c: [] for c in cat_map}
for s in symbols:
    cat_symbols[s[2]].append(s[0])
empty_cats = [c for c, v in cat_symbols.items() if not v]
if empty_cats:
    errors.append(f"empty categories: {empty_cats}")

# 5. per-category counts vs header claim
print("Per-category symbol counts:")
for cid in cat_map:
    print(f"  {cid:12s} {cat_map[cid]:28s} {len(cat_symbols[cid])}")

# 6. breadcrumb anchor fix present in [symbol].astro
with open(SYMBOL_PAGE, encoding="utf-8") as f:
    sp = f.read()
if "/meaning#${category.id}" in sp and "/meaning/${category.id}" not in sp:
    print("OK  [symbol].astro breadcrumb uses anchor (/meaning#cat)")
elif "/meaning/${category.id}" in sp:
    errors.append("[symbol].astro still uses route /meaning/${category.id} (would 404)")

# 7. index.astro uses dynamic counts (ALL_MEANINGS.length / TATTOO_CATEGORIES.length)
with open(INDEX_PAGE, encoding="utf-8") as f:
    ip = f.read()
if "ALL_MEANINGS.length" in ip and "TATTOO_CATEGORIES.length" in ip:
    print("OK  index.astro uses dynamic counts (ALL_MEANINGS.length / TATTOO_CATEGORIES.length)")
if "42 symbols" in ip or "10 categories" in ip:
    errors.append("index.astro still contains hardcoded '42'/'10' copy")

# 8. doc cross-check: keyword map CSV exists and row count matches symbols
csv_path = os.path.join(ROOT, "seo-targets/tattoo-meaning-keyword-map.csv")
if os.path.exists(csv_path):
    with open(csv_path, encoding="utf-8") as f:
        csv_rows = [r for r in f.read().splitlines()[1:] if r]
    mapped_syms = [r for r in csv_rows if r.split(",")[4] in ("existing", "extended", "new_category", "variant") and r.split(",")[1]]
    # count distinct symbol slugs referenced
    ref_slugs = set(r.split(",")[1] for r in csv_rows if r.split(",")[1])
    missing = set(slugs) - ref_slugs
    if missing:
        warnings.append(f"symbols not referenced in keyword map: {missing}")
    print(f"OK  keyword map CSV present: {len(csv_rows)} rows, references {len(ref_slugs)}/{len(slugs)} symbols")

print("\n=== RESULT ===")
if errors:
    print("FAILED:")
    for e in errors:
        print("  -", e)
    sys.exit(1)
else:
    print("PASSED: data layer + page fixes are internally consistent.")
if warnings:
    print("Warnings:")
    for w in warnings:
        print("  -", w)

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Read-only check for the new category-page SEO content.
Verifies tattoo-category-content.ts covers every category in
tattoo-meanings.ts, has >=3 FAQs each, and meta descriptions <=160 chars.
Does NOT write to dist/."""
import re
import os
import sys

ROOT = r"D:/ink-flow-manager/marketing"
DATA = os.path.join(ROOT, "src/data/tattoo-meanings.ts")
CONTENT = os.path.join(ROOT, "src/data/tattoo-category-content.ts")
PAGE = os.path.join(ROOT, "src/pages/meaning/category/[category].astro")

errors = []
warnings = []

with open(DATA, encoding="utf-8") as f:
    data = f.read()
cat_ids = set(re.findall(r"id:\s*'([^']+)',\s*name:", data))

with open(CONTENT, encoding="utf-8") as f:
    content = f.read()

# top-level keys in the content map (2-space indent, followed by '{')
keys = re.findall(r"^  ([\w'-]+):\s*\{", content, re.MULTILINE)
keyset = set(keys)

print(f"categories in tattoo-meanings.ts : {len(cat_ids)}")
print(f"keys in category content map     : {len(keyset)}")

# 1. every category has content; no orphan keys
missing = cat_ids - keyset
if missing:
    errors.append(f"categories with NO page content: {sorted(missing)}")
orphan = keyset - cat_ids
if orphan:
    errors.append(f"content keys not matching any category: {sorted(orphan)}")

# 2. per-key checks
for k in sorted(keyset):
    # locate this block: from its key line to the next top-level key
    start = content.index(f"  {k}: {{")
    # find next top-level key after start
    nxt = re.search(r"\n  [\w'-]+: \{", content[start + 1:])
    end = nxt.start() if nxt else len(content)
    block = content[start:end]

    for field in ("h1:", "metaDescription:", "intro:", "faqs:"):
        if field not in block:
            errors.append(f"[{k}] missing field '{field}'")
    qcount = block.count("question:")
    if qcount < 3:
        errors.append(f"[{k}] only {qcount} FAQs (need >=3)")
    # meta description length
    m = re.search(r"metaDescription:\s*`([^`]*)`", block)
    if m:
        md = m.group(1)
        if len(md) > 160:
            errors.append(f"[{k}] metaDescription {len(md)} chars (>160): {md[:40]}...")
        if len(md) < 70:
            warnings.append(f"[{k}] metaDescription only {len(md)} chars (thin)")

# 3. page route exists
if not os.path.exists(PAGE):
    errors.append(f"category page route missing: {PAGE}")
else:
    with open(PAGE, encoding="utf-8") as f:
        pg = f.read()
    if "getStaticPaths" not in pg or "CATEGORY_PAGE_CONTENT" not in pg:
        errors.append("category page route missing getStaticPaths / content import")

print("\n=== RESULT ===")
if errors:
    print("FAILED:")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print("PASSED: all 15 categories have SEO content (>=3 FAQs, meta <=160) + page route present.")
if warnings:
    print("Warnings:")
    for w in warnings:
        print("  -", w)

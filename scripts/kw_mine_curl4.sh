#!/usr/bin/env bash
# Batch D: fill coverage gaps from stage-1 mining.
# Missing dims: app/software/platform/creator/maker/generator,
# cost/pricing question-form, PAA (do/why/should need website),
# for small business/beginners, themes/layout/html/canva template.
RAW="D:/ink-flow-manager/marketing/scripts/kw_raw4_tattoo.txt"
rm -f "$RAW"
queries=(
  "tattoo website app"
  "tattoo website software"
  "tattoo website platform"
  "tattoo website creator"
  "tattoo website maker"
  "tattoo website generator"
  "tattoo website pricing"
  "tattoo website cost"
  "how much does a tattoo website cost"
  "tattoo website cheap"
  "cheap tattoo website"
  "do tattoo artists need a website"
  "why do tattoo artists need a website"
  "should a tattoo artist have a website"
  "tattoo website for small business"
  "tattoo website for beginners"
  "tattoo website themes"
  "tattoo website layout"
  "tattoo website template free download"
  "html tattoo website template"
  "canva tattoo website template"
  "tattoo portfolio website app"
  "tattoo artist website app"
)
for q in "${queries[@]}"; do
  echo "###Q $q" >> "$RAW"
  curl -s --max-time 10 --compressed -G "https://www.google.com/complete/search" \
    --data-urlencode "client=firefox" \
    --data-urlencode "q=$q" >> "$RAW"
  echo "" >> "$RAW"
  sleep 2
done

"C:/Users/snow3/.workbuddy/binaries/python/versions/3.13.12/python.exe" - <<'PY'
import json
from collections import defaultdict
raw = open(r"D:/ink-flow-manager/marketing/scripts/kw_raw4_tattoo.txt", encoding="utf-8").read().split("\n")
counter = defaultdict(int)
empty = []
cur = None
for line in raw:
    if line.startswith("###Q "):
        cur = line[5:].strip(); continue
    line = line.strip()
    if not line: continue
    try:
        d = json.loads(line)
    except Exception:
        continue
    if not isinstance(d, list) or len(d) < 2: continue
    sugg = d[1]
    if not sugg:
        if cur and cur not in empty: empty.append(cur)
        continue
    for s in sugg:
        p = str(s).lower()
        if any(h in p for h in ["how much does a tattoo", "price of a tattoo", "tattoo prices",
                                "tattoo meaning", "tattoo fonts", "tattoo stencil",
                                "tattoo drawing", "tattoo ideas near me"]):
            continue
        counter[str(s)] += 1
print("=== BATCH D VERIFIED SUGGESTIONS ===")
for ph, c in sorted(counter.items(), key=lambda x:(-x[1], x[0])):
    print(f"{c:2d}  {ph}")
print(f"\n=== EMPTY/FAILED ({len(empty)}) ===")
for q in empty: print("  -", q)
PY
echo "DONE"

#!/usr/bin/env bash
# 系统化关键词实挖 (curl 版, 走沙箱放行的 www.google.com)
# 用法: bash kw_mine_curl.sh
set -u

RAW="D:/ink-flow-manager/marketing/scripts/kw_raw_tattoo.txt"
: > "$RAW"

# 核心 query 矩阵 (前缀 x 种子 x 后缀, 已精简去重)
QUERIES=(
  "tattoo website"
  "tattoo website templates" "tattoo website design" "tattoo website design ideas"
  "tattoo website examples" "tattoo website ideas" "tattoo website inspiration"
  "tattoo website cost" "tattoo website price" "tattoo website reddit"
  "tattoo website near me" "tattoo website vs wix" "tattoo website vs squarespace"
  "tattoo website vs linktree" "tattoo website wordpress" "tattoo website shopify"
  "tattoo website for"
  "best tattoo website" "top tattoo website" "free tattoo website"
  "cheap tattoo website" "professional tattoo website"
  "how to make a tattoo website" "how to build a tattoo website"
  "create a tattoo website" "build a tattoo website" "make a tattoo website"
  "best tattoo websites" "best website builders for tattoo artists"
  "tattoo artist website" "tattoo artist website templates" "tattoo artist website design"
  "tattoo artist website ideas" "tattoo artist website examples" "tattoo artist website portfolio"
  "tattoo studio website" "tattoo studio website template" "tattoo studio website design"
  "tattoo shop website" "tattoo shop website template"
  "tattoo portfolio website" "tattoo portfolio website examples" "tattoo portfolio website template"
  "free tattoo portfolio website"
  "tattoo website builder" "tattoo maker website free"
  "tattoo booking website" "tattoo artist booking website"
  "tattoo business website"
)

for q in "${QUERIES[@]}"; do
  echo "###Q $q" >> "$RAW"
  curl -s --max-time 10 --connect-timeout 5 --compressed -G "https://www.google.com/complete/search" \
    --data-urlencode "client=firefox" \
    --data-urlencode "q=$q" \
    --data-urlencode "hl=en" \
    --data-urlencode "gl=US" >> "$RAW"
  echo >> "$RAW"
  sleep 0.3
done

echo "RAW_DONE lines=$(wc -l < "$RAW")"

# 本地解析 (无网络)
"C:/Users/snow3/.workbuddy/binaries/python/versions/3.13.12/python.exe" - <<'PY'
import json, re
from collections import defaultdict

raw = open("D:/ink-flow-manager/marketing/scripts/kw_raw_tattoo.txt", encoding="utf-8").read().split("\n")
counter = defaultdict(int)
cur_q = None
for line in raw:
    if line.startswith("###Q "):
        cur_q = line[5:].strip()
        continue
    line = line.strip()
    if not line:
        continue
    try:
        data = json.loads(line)
    except Exception:
        continue
    if not isinstance(data, list) or len(data) < 2:
        continue
    for s in data[1]:
        s = str(s)
        # 噪音过滤
        p = s.lower()
        if any(h in p for h in ["how much", "prices near me", "price of a tattoo",
                                "tattoo meaning", "tattoo fonts", "tattoo stencil",
                                "tattoo drawing", "tattoo ideas (drawing)"]):
            continue
        counter[s] += 1

print("\n=== UNIQUE SUGGESTIONS (count desc) ===")
for phrase, cnt in sorted(counter.items(), key=lambda x: (-x[1], x[0])):
    print(f"{cnt:2d}  {phrase}")
PY

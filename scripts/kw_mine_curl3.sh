#!/usr/bin/env bash
# 最终补跑: 对比词 + 设计词 (无 hl/gl, 长间隔避限流)
set -u
RAW="D:/ink-flow-manager/marketing/scripts/kw_raw3_tattoo.txt"
: > "$RAW"
QUERIES=(
  "tattoo website vs wix"
  "tattoo website vs squarespace"
  "tattoo website vs linktree"
  "tattoo website design"
  "tattoo website examples"
  "tattoo website ideas"
)
for q in "${QUERIES[@]}"; do
  echo "###Q $q" >> "$RAW"
  curl -s --max-time 8 --connect-timeout 4 --compressed -G "https://www.google.com/complete/search" \
    --data-urlencode "client=firefox" --data-urlencode "q=$q" >> "$RAW"
  echo >> "$RAW"
  sleep 2
done
echo "DONE3 lines=$(wc -l < "$RAW")"

#!/usr/bin/env bash
# 补跑被限流的关键 query (design/comparison/how-to 簇)
set -u
RAW="D:/ink-flow-manager/marketing/scripts/kw_raw2_tattoo.txt"
: > "$RAW"

QUERIES=(
  "tattoo website design"
  "tattoo website design ideas"
  "tattoo website examples"
  "tattoo website ideas"
  "tattoo website inspiration"
  "tattoo website vs wix"
  "tattoo website vs squarespace"
  "tattoo website vs linktree"
  "tattoo website cost"
  "tattoo website price"
  "tattoo website reddit"
  "tattoo website near me"
  "tattoo website wordpress"
  "tattoo website shopify"
  "tattoo website for"
  "top tattoo website"
  "how to make a tattoo website"
  "how to build a tattoo website"
  "tattoo portfolio website template"
  "tattoo studio website templates"
)

for q in "${QUERIES[@]}"; do
  echo "###Q $q" >> "$RAW"
  curl -s --max-time 8 --connect-timeout 4 --compressed -G "https://www.google.com/complete/search" \
    --data-urlencode "client=firefox" --data-urlencode "q=$q" \
    --data-urlencode "hl=en" --data-urlencode "gl=US" >> "$RAW"
  echo >> "$RAW"
  sleep 1.2
done
echo "DONE2 lines=$(wc -l < "$RAW")"

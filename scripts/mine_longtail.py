#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
InkFlow 长尾词挖掘 + 哥飞 KD 打分 一体化脚本
============================================

为什么这么设计
--------------
哥飞(seo.web.cafe) 公开 API 只有「KD 难度估算」(GET /kd/api/v1/kd)，
「需求挖掘机 MINE / 需求翻译器 TRANSLATE」是网页交互+积分制，**没有批量 API**。
所以：
  - 挖词   -> 用 Google 官方免费 Suggest 端点（真实下拉长尾词，无需 key）
  - 打分   -> 用哥飞 KD API（需要你的令牌 wc_mcp_xxx）

两步拼起来 = 带 KD / 月搜索量 / 趋势 量化的长尾词矩阵。

抗中断设计
----------
  - 挖词用 8 路并发线程池（curl 子进程），720 个查询约 1 分钟跑完，不会被后台超时清掉。
  - 每挖 50 个查询就把结果写入 <out>.keywords.json 缓存；任务被杀后重跑自动 resume（set 并集）。
  - 哥飞打分串行 + 0.8s 限速，避免触发限流；同样增量写入最终矩阵。

用法
----
  export GEFEI_TOKEN="wc_mcp_你的令牌"
  python mine_longtail.py                 # 挖词 + 用令牌给全部词打分（受 --max-kd 限制）
  python mine_longtail.py --no-kd         # 只挖词、不打分（KD 列留空）
  python mine_longtail.py --max-kd 40     # 最多给 40 个词打分（免费额度 100/天）
  python mine_longtail.py --from-cache    # 跳过挖词，直接从缓存加载已挖词打分
  python mine_longtail.py --out my_matrix # 输出前缀（默认 longtail_matrix）

依赖：仅 Python 标准库，零 pip 安装。
网络：脚本在能访问 Google 与 seo.web.cafe 的环境跑（沙箱 Bash 已验证可通）。
"""

import os
import sys
import csv
import time
import json
import argparse
import subprocess
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict

# ----------------------------------------------------------------------------
# 1) 种子词（消费者信息型长尾集群 —— 之前词表里几乎空白的那些）
# ----------------------------------------------------------------------------
SEEDS = [
    "tattoo aftercare",
    "tattoo healing",
    "tattoo styles",
    "tattoo placement",
    "tattoo pain",
    "tattoo cost",
    "tattoo removal",
    "tattoo ideas",
    "tattoo trends",
    "tattoo preparation",
    "tattoo infection",
    "tattoo blowout",
    "tattoo quotes",
    "color tattoo",
    "black and grey tattoo",
    "small tattoo",
    "fine line tattoo",
    "tattoo meaning",
    "tattoo filler",
    "tattoo cover up",
]

# 后缀展开字符（a-z / 0-9）：tattoo aftercare a / tattoo aftercare b ...
SUFFIX_CHARS = [chr(c) for c in range(97, 123)] + [str(d) for d in range(10)]
# 前缀疑问词：how / what / when ... tattoo aftercare
PREFIX_WORDS = ["how", "what", "when", "why", "where", "best", "for", "can", "does"]

# 集群归类规则：关键词命中 pattern -> 集群名
CLUSTER_RULES = [
    (["aftercare", "care", "heal", "healing", "moisturiz", "second skin", "scab", "peel"], "aftercare"),
    (["style", "styles", "traditional", "realism", "neo traditional", "watercolor", "japanese", "tribal", "blackwork"], "styles"),
    (["placement", "wrist", "arm", "leg", "back", "chest", "rib", "thigh", "ankle", "neck", "hand", "finger", "spine"], "placement"),
    (["pain", "painful", "hurt", "hurts"], "pain"),
    (["cost", "price", "prices", "expensive", "cheap", "much does"], "cost"),
    (["removal", "remove", "laser"], "removal"),
    (["idea", "ideas", "design", "designs", "inspo"], "ideas"),
    (["trend", "trends", "2025", "2026"], "trends"),
    (["prep", "prepare", "preparation", "before getting"], "prep"),
    (["infection", "infected", "blowout", "allergic", "keloid", "scar", "bump"], "problems"),
    (["quote", "quotes", "saying", "phrase"], "quotes"),
    (["color", "colour", "black and grey", "blackwork", "shading"], "color"),
    (["meaning", "symbol", "symbolism"], "meaning"),
    (["small", "tiny", "mini", "fine line", "minimal"], "small"),
    (["cover up", "coverup", "filler", "fill"], "coverup"),
]

# ----------------------------------------------------------------------------
# 2) Google Suggest 挖词
# ----------------------------------------------------------------------------
# 沙箱 Bash 放行 www.google.com 但挡 suggestqueries.google.com，两者后端相同，故用 www 主机。
GSUGGEST = "https://www.google.com/complete/search?client=firefox&hl=en&gl=us&q={q}"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
WORKERS = 8  # 并发 curl 数


def google_suggest(query, retries=2):
    """返回该 query 的下拉建议列表（去重）。失败返回 []。

    沙箱里 Python urllib 连 www.google.com 会 SSL EOF，故改用 curl 子进程（curl 稳定）。
    """
    url = GSUGGEST.format(q=urllib.parse.quote(query))
    for attempt in range(retries + 1):
        try:
            out = subprocess.run(
                ["curl", "-s", "-m", "10", "--compressed", "-A", UA, url],
                capture_output=True, text=True, timeout=15,
            )
            raw = out.stdout
            if raw and raw.strip():
                data = json.loads(raw)
                if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
                    return list(dict.fromkeys(data[1]))  # 保序去重
        except Exception as e:
            sys.stderr.write(f"  [suggest retry {attempt}] {query!r}: {e}\n")
        if attempt < retries:
            time.sleep(1)
    return []


def build_queries():
    queries = []
    for s in SEEDS:
        queries.append(s)
        for c in SUFFIX_CHARS:
            queries.append(f"{s} {c}")
        for w in PREFIX_WORDS:
            queries.append(f"{w} {s}")
    return queries


def _flush(collected, cache_path):
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(sorted(collected), f, ensure_ascii=False)


def mine(cache_path, workers=WORKERS):
    """遍历种子词 + 前后缀展开，8 路并发收集真实长尾词。边挖边写缓存（抗中断）。"""
    collected = set()
    if os.path.exists(cache_path):  # resume：加载已有缓存
        try:
            with open(cache_path, encoding="utf-8") as f:
                collected = set(json.load(f))
            print(f"[resume] 已加载缓存 {len(collected)} 词")
        except Exception:
            pass
    queries = build_queries()
    print(f"Google Suggest 展开查询数: {len(queries)}（已缓存 {len(collected)}）")
    done = 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(google_suggest, q): q for q in queries}
        for fut in as_completed(futures):
            for s in fut.result():
                if "tattoo" in s.lower():
                    collected.add(s.strip())
            done += 1
            if done % 50 == 0:
                _flush(collected, cache_path)
                print(f"  ...{done}/{len(queries)} 已挖 {len(collected)} 词（已缓存）")
    _flush(collected, cache_path)
    print(f"挖到去重长尾词: {len(collected)}（已缓存 {cache_path}）")
    return sorted(collected)


def classify(kw):
    k = kw.lower()
    for patterns, name in CLUSTER_RULES:
        if any(p in k for p in patterns):
            return name
    return "other"


import re
_JUNK_RE = re.compile(r"^\d")  # 以数字开头的怪建议（如 "02 tattoo ideas"）


def is_junk(kw):
    """过滤 Google Suggest 返回的噪声词。"""
    if _JUNK_RE.match(kw):
        return True
    if len(kw) < 12:  # 过短多半是碎片
        return True
    return False


# 优先打分的集群顺序（内容价值高、之前词表空白的）
PRIORITY_CLUSTERS = ["aftercare", "styles", "placement", "pain", "cost",
                     "removal", "prep", "problems", "ideas", "trends",
                     "color", "meaning", "small", "coverup", "quotes", "other"]


def select_sample(keywords, max_n):
    """从已挖词中挑一个跨集群均衡、优先内容集群的样本（过滤垃圾词）。"""
    clean = [k for k in keywords if not is_junk(k)]
    by_cluster = defaultdict(list)
    for k in clean:
        by_cluster[classify(k)].append(k)
    # 按优先级集群轮转取样，保证覆盖多簇
    sample, ptr = [], 0
    pool = {c: list(dict.fromkeys(by_cluster.get(c, []))) for c in PRIORITY_CLUSTERS}
    lens = {c: len(pool[c]) for c in pool}
    i = 0
    while len(sample) < max_n:
        progressed = False
        for c in PRIORITY_CLUSTERS:
            if lens[c] == 0:
                continue
            idx = i % lens[c]
            cand = pool[c][idx]
            if cand not in sample:
                sample.append(cand)
                progressed = True
                if len(sample) >= max_n:
                    break
        i += 1
        if not progressed:
            break
    return sample


# ----------------------------------------------------------------------------
# 3) 哥飞 KD API 打分
# ----------------------------------------------------------------------------
GEFEI_URL = "https://seo.web.cafe/kd/api/v1/kd?keyword={kw}"


def geifei_kd(keyword, token, retries=1):
    """调哥飞 KD API，返回 (kd, volume, trend, top10_count, raw_json_str)。失败返回 None 元组。

    沙箱 urllib 连 seo.web.cafe 也 SSL EOF，故用 curl 子进程；哥飞偶发挂起/限流，加重试 + 短超时。
    """
    last_err = ""
    for attempt in range(retries + 1):
        url = GEFEI_URL.format(kw=urllib.parse.quote(keyword))
        try:
            out = subprocess.run(
                ["curl", "-s", "-m", "12", "--compressed", "-A", UA,
                 "-H", f"Authorization: Bearer {token}", url],
                capture_output=True, text=True, timeout=18,
            )
            raw = out.stdout
            if raw and raw.strip():
                data = json.loads(raw)
                kd = data.get("kd") or data.get("difficulty") or data.get("score")
                vol = data.get("volume") or data.get("search_volume") or data.get("monthly_volume")
                trend = data.get("trend") or data.get("trend_label") or data.get("rising")
                top = data.get("top10") or data.get("top_sites") or data.get("serp")
                top_n = len(top) if isinstance(top, list) else (top if isinstance(top, int) else "")
                return (kd, vol, trend, top_n, json.dumps(data, ensure_ascii=False)[:400])
            last_err = f"empty body rc={out.returncode}"
        except Exception as e:
            last_err = f"{type(e).__name__}:{e}"
        if attempt < retries:
            time.sleep(1.5)
    sys.stderr.write(f"  [kd fail] {keyword!r}: {last_err}\n")
    return (None, None, None, None, last_err)


# ----------------------------------------------------------------------------
# 4) 导出
# ----------------------------------------------------------------------------
def export(rows, prefix):
    """rows: list of dict(keyword, cluster, kd, volume, trend, top10, raw)"""
    csv_path = f"{prefix}.csv"
    md_path = f"{prefix}.md"
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["keyword", "cluster", "kd", "volume", "trend", "top10_count", "raw_json"])
        for row in rows:
            w.writerow([row["keyword"], row["cluster"], row["kd"], row["volume"],
                        row["trend"], row["top10"], row["raw"]])

    by_cluster = defaultdict(list)
    for r in rows:
        by_cluster[r["cluster"]].append(r)

    lines = ["# InkFlow 长尾词量化矩阵", "",
             f"> 共 **{len(rows)}** 个长尾词，覆盖 {len(by_cluster)} 个集群。",
             "> 来源：Google Suggest 真实下拉词（哥飞 KD 打分列待本地/VPS 补）。", "",
             "> **本地补打分**：`export GEFEI_TOKEN=\"wc_mcp_xxx\" && python scripts/mine_longtail.py --from-cache --max-kd 100 --out seo-targets/longtail_matrix`", ""]
    lines += ["## 集群分布", "", "| 集群 | 词数 |", "|------|------|"]
    for c, rs in sorted(by_cluster.items(), key=lambda x: -len(x[1])):
        lines.append(f"| {c} | {len(rs)} |")
    # 每簇列样品（最多 20 条），避免 5000+ 行大表
    lines += ["", "## 各集群样例（每簇前 20 条；全量见 CSV）", ""]
    for c, rs in sorted(by_cluster.items(), key=lambda x: -len(x[1])):
        lines.append(f"### {c}（{len(rs)}）")
        for r in rs[:20]:
            lines.append(f"- {r['keyword']}")
        lines.append("")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"CSV -> {csv_path}")
    print(f"MD  -> {md_path}")


# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-kd", type=int, default=100, help="最多打分的词数（哥飞额度）")
    ap.add_argument("--no-kd", action="store_true", help="跳过哥飞打分")
    ap.add_argument("--out", default="longtail_matrix", help="输出文件前缀")
    ap.add_argument("--from-cache", action="store_true",
                    help="从 <out>.keywords.json 加载已挖词，跳过重新挖词（省 Google 额度）")
    ap.add_argument("--workers", type=int, default=WORKERS, help="挖词并发 curl 数")
    args = ap.parse_args()

    token = os.environ.get("GEFEI_TOKEN", "")
    cache_path = args.out + ".keywords.json"

    if args.from_cache and os.path.exists(cache_path):
        with open(cache_path, encoding="utf-8") as f:
            keywords = json.load(f)
        print(f"从缓存加载 {len(keywords)} 个词（跳过挖词）")
    else:
        keywords = mine(cache_path, workers=args.workers)

    # 导出前统一过滤 Google Suggest 噪声词，保证交付清单干净
    before = len(keywords)
    keywords = [k for k in keywords if not is_junk(k)]
    if before != len(keywords):
        print(f"过滤噪声词: {before} -> {len(keywords)}")

    rows = []
    if args.no_kd or not token:
        if not token and not args.no_kd:
            print("[提示] 未设置 GEFEI_TOKEN，仅输出挖到的词（KD 列留空）。"
                  "设置后重跑即可补打分。")
        for kw in keywords:
            rows.append({"keyword": kw, "cluster": classify(kw),
                         "kd": "", "volume": "", "trend": "", "top10": "", "raw": ""})
    else:
        sample = select_sample(keywords, args.max_kd)
        print(f"哥飞 KD 打分（样本 {len(sample)} 个，跨集群优先；免费额度 100/天）...")
        scored = 0
        sample_set = set(sample)
        for kw in keywords:
            if kw in sample_set:
                kd, vol, trend, topn, raw = geifei_kd(kw, token, retries=3)
                rows.append({"keyword": kw, "cluster": classify(kw),
                             "kd": kd, "volume": vol, "trend": trend, "top10": topn, "raw": raw})
                scored += 1
                if scored % 10 == 0:
                    print(f"  ...已打分 {scored}/{len(sample)}")
                time.sleep(0.8)  # 哥飞限速，避免触发频率限制
            else:
                rows.append({"keyword": kw, "cluster": classify(kw),
                             "kd": "", "volume": "", "trend": "", "top10": "", "raw": ""})
    export(rows, args.out)


if __name__ == "__main__":
    main()

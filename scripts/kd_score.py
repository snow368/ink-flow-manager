#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
哥飞 KD 难度打分脚本（在【本地机器】运行，沙箱连不通 seo.web.cafe）。

特性：
  - 令牌：从环境变量 GEFEI_TOKEN 读取；若未设置，尝试读同目录 geffe_token.txt（gitignore）。
  - 断点续跑：已打分的词写 kd_scores.csv，重跑自动跳过。
  - 每日上限：默认 100（免费额度），可用 --cap 改（VIP 500）。按自然日计数。
  - 超时重试：单请求 timeout 10s，失败重试 2 次（退避 3s）。
  - 缓存：结果落盘，不重复消耗额度。
  - 首次成功响应会打印原始 JSON，方便确认 KD 字段名（如需调整 extract_kd）。

用法（Windows 本地）：
  cd D:\ink-flow-manager\marketing
  set GEFEI_TOKEN=你的哥飞令牌
  python scripts/kd_score.py --cap 100

可选参数：
  --queue 路径   默认 .../seo-targets/kd_queue.csv
  --out   路径   默认 .../seo-targets/kd_scores.csv
  --cap   整数   每日上限，默认 100
"""
import argparse
import csv
import os
import sys
import time
import urllib.parse
import urllib.request
import json
from datetime import date

BASE = "D:/ink-flow-manager/marketing/seo-targets"
API = "https://seo.web.cafe/kd/api/v1/kd"

HINTS = {"high": 0, "med": 1, "medium": 1, "low": 2}


def get_token(script_dir):
    tok = os.environ.get("GEFEI_TOKEN")
    if tok:
        return tok.strip()
    p = os.path.join(script_dir, "gefei_token.txt")
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            return f.read().strip()
    return None


def extract_kd(data):
    """尽力从响应里抠出 KD 数值。字段名未知时返回 None（原始存盘供人工看）。"""
    if isinstance(data, dict):
        for k in ("kd", "difficulty", "keyword_difficulty", "kd_score", "score", "value"):
            v = data.get(k)
            if isinstance(v, (int, float)):
                return v
        # 常见嵌套：{"data": {...}}
        if isinstance(data.get("data"), dict):
            return extract_kd(data["data"])
        # 常见嵌套：{"result": {...}}
        if isinstance(data.get("result"), dict):
            return extract_kd(data["result"])
    return None


def load_done(out_path):
    done = {}
    if os.path.exists(out_path):
        with open(out_path, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                done[r["keyword"].lower()] = r
    return done


def today_count(scores):
    today = date.today().isoformat()
    return sum(1 for r in scores.values() if r.get("date") == today)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--queue", default=os.path.join(BASE, "kd_queue.csv"))
    ap.add_argument("--out", default=os.path.join(BASE, "kd_scores.csv"))
    ap.add_argument("--cap", type=int, default=100)
    args = ap.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    token = get_token(script_dir)
    if not token:
        print("❌ 未找到哥飞令牌。请：")
        print("   set GEFEI_TOKEN=你的令牌   或   在同目录建 gefei_token.txt（仅一行令牌）")
        sys.exit(1)

    if not os.path.exists(args.queue):
        print(f"❌ 队列不存在：{args.queue}，先跑 build_kd_queue.py")
        sys.exit(1)

    with open(args.queue, newline="", encoding="utf-8") as f:
        queue = list(csv.DictReader(f))

    done = load_done(args.out)
    used_today = today_count(done)
    remaining_cap = max(0, args.cap - used_today)
    print(f"已完成 {len(done)} 词 | 今日已用 {used_today} | 今日剩余额度 {remaining_cap}")

    if remaining_cap <= 0:
        print("⏸ 今日额度已用完，明天再跑（脚本按自然日自动重置）。")
        sys.exit(0)

    pending = [r for r in queue if r["keyword"].lower() not in done]
    print(f"队列共 {len(queue)} 词，待打分词 {len(pending)}")

    scored = 0
    failed = 0
    first_raw_printed = False
    out_fields = ["keyword", "ref_id", "source", "kd", "raw", "date", "status"]

    # 以追加模式打开，断点续跑
    write_header = not os.path.exists(args.out)
    with open(args.out, "a", newline="", encoding="utf-8") as fout:
        w = csv.DictWriter(fout, fieldnames=out_fields)
        if write_header:
            w.writeheader()

        for r in pending:
            if scored >= remaining_cap:
                print(f"⏸ 达到今日上限 {args.cap}，停止。剩余 {len(pending)-scored} 词明天续跑。")
                break

            kw = r["keyword"]
            url = f"{API}?keyword={urllib.parse.quote(kw)}"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            kd = None
            raw = ""
            status = "ok"
            ok = False
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        body = resp.read().decode("utf-8", "replace")
                        raw = body[:500]
                        if resp.status == 200:
                            try:
                                data = json.loads(body)
                            except Exception:
                                data = None
                            kd = extract_kd(data) if data else None
                            if not first_raw_printed:
                                print("【首次响应原始 JSON】", body[:800])
                                first_raw_printed = True
                            ok = True
                            break
                        elif resp.status == 401:
                            print("❌ 401 令牌无效，停止。")
                            sys.exit(1)
                        elif resp.status in (429, 403):
                            print("⏸ 触发限流(429/403)，停止，稍后重试。")
                            sys.exit(0)
                        else:
                            raw = f"HTTP {resp.status}"
                except Exception as e:
                    if attempt < 2:
                        time.sleep(3)
                        continue
                    raw = f"ERR {type(e).__name__}: {e}"
                    status = "error"
                    failed += 1
            if not ok and status != "error":
                status = "error"
                failed += 1

            row = {
                "keyword": kw,
                "ref_id": r.get("ref_id", ""),
                "source": r.get("source", ""),
                "kd": kd if kd is not None else "",
                "raw": raw,
                "date": date.today().isoformat(),
                "status": status,
            }
            w.writerow(row)
            fout.flush()
            if status == "ok":
                scored += 1
                print(f"  ✓ {kw} -> kd={kd}")
            else:
                print(f"  ✗ {kw} -> {raw[:80]}")
            time.sleep(0.3)

    print(f"\n本批完成：成功 {scored} | 失败 {failed} | 累计 {len(done)+scored} 词已落盘 {args.out}")


if __name__ == "__main__":
    main()

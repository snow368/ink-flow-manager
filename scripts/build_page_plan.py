#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
InkFlow 长尾词 → 内容页规划器
流水线: 审核(review) → 挑选(select) → 分类(classify) → 聚合(aggregate) → 规划内容页(plan)
输入: seo-targets/longtail_matrix.csv  (5652 真实 Google Suggest 长尾词)
输出: seo-targets/page_plan.csv + page_plan.md  (每页=一组词, 待人工挑选后建页)

设计原则:
- 5652 词 ≠ 5652 页。必须「词→页聚合」, 否则内容农场。
- 人工审核闸: 所有生成的页 review_status=pending_review, 需人挑后才进「写内容」。
- 聚合用「集群(cluster) × 子主题(theme)」二维, 每个 (cluster,theme) = 一个 spoke 页, cluster 本身 = pillar 页。
"""
import os
import re
import csv
import json
import argparse
from collections import defaultdict, OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IN_CSV = os.path.join(ROOT, "seo-targets", "longtail_matrix.csv")
OUT_CSV = os.path.join(ROOT, "seo-targets", "page_plan.csv")
OUT_MD = os.path.join(ROOT, "seo-targets", "page_plan.md")

# ---------- ① 审核 (review) ----------
def is_junk(kw):
    k = kw.strip().lower()
    if len(k) < 6:
        return True
    if not re.search(r"[a-z]", k):
        return True
    # 非英文占比过高
    non_en = len(re.findall(r"[^a-z0-9\s'\"\-]", k))
    if non_en / max(1, len(k)) > 0.3:
        return True
    # Google 怪建议: 数字打头 / 含 ? / 含 http / 明显乱码
    if re.match(r"^\d+\s+tattoo", k):
        return True
    if "?" in k or "http" in k or "@" in k:
        return True
    if k.count("tattoo") > 3:  # 堆词
        return True
    return False

def is_offtopic(kw):
    k = kw.lower()
    if "tattoo" not in k and "ink" not in k:
        return True
    # 明显无关
    if any(w in k for w in ["porn", "xxx", "casino", "crypto", "loan"]):
        return True
    return False

# ---------- ② 挑选 (select) / 业务相关性 ----------
B2B_TOKENS = ["studio", "artist", "shop", "parlor", "management", "booking",
              "pos ", "waiver", "crm", "scheduling", "appointment", "consultation",
              "invoice", "pricing", "deposit"]
def business_side(kw):
    k = " " + kw.lower() + " "
    if any(t in k for t in B2B_TOKENS):
        return "B2B"
    return "B2C"

# ---------- ④ 聚合 (aggregate) : 集群 × 子主题 ----------
PILLARS = {
    "aftercare": ("blog/tattoo-aftercare-guide", "Tattoo Aftercare Guide: Complete Healing & Care Tips"),
    "placement": ("blog/tattoo-placement-guide", "Tattoo Placement Guide: Pain, Meaning & Ideas by Body Part"),
    "ideas":     ("blog/tattoo-ideas-guide", "Tattoo Ideas: Styles, Themes & Inspiration Gallery"),
    "pain":      ("blog/tattoo-pain-guide", "Tattoo Pain Guide: Chart, Scale & How to Manage It"),
    "cost":      ("blog/tattoo-cost-guide", "Tattoo Cost Guide: Prices by Size, Style & Location"),
    "styles":    ("blog/tattoo-styles-guide", "Tattoo Styles Explained: Types, Examples & Comparisons"),
    "meaning":   ("blog/tattoo-meaning-guide", "Tattoo Meanings: Symbol Dictionary & What They Represent"),
    "removal":   ("blog/tattoo-removal-guide", "Tattoo Removal Guide: Cost, Methods & What to Expect"),
    "small":     ("blog/small-tattoo-ideas", "Small Tattoo Ideas: Minimalist Designs & Placements"),
    "coverup":   ("blog/tattoo-coverup-ideas", "Tattoo Cover-Up Ideas: Transform Old Ink with New Art"),
    "color":     ("blog/tattoo-color-guide", "Color Tattoo Guide: Vibrancy, Fading & Aftercare"),
    "problems":  ("blog/tattoo-problems-guide", "Tattoo Problems & Fixes: Blowouts, Infections & More"),
    "quotes":    ("blog/tattoo-quotes-guide", "Tattoo Quotes: Short, Meaningful & Themed Phrases"),
    "prep":      ("blog/tattoo-prep-guide", "Tattoo Preparation Guide: Checklist & Tips Before You Go"),
    "trends":    ("blog/tattoo-trends-guide", "Tattoo Trends: What's Hot in 2025-2026"),
    "other":     ("blog/tattoo-guide", "Tattoo Guide: Everything You Need to Know"),
}

# 每个集群的子主题: (theme_key, [匹配词], 商业意图?)
THEMES = {
    "aftercare": [
        ("second-skin", ["second skin"], False),
        ("sensitive-skin", ["sensitive"], False),
        ("color-tattoo", ["color tattoo", "colour tattoo"], False),
        ("black-grey", ["black and grey", "black and gray", "grey tattoo", "gray tattoo"], False),
        ("timeline", ["day 1", "first day", "day one", "week 1", "week one", "first week",
                      "week 2", "second week", "after 1 week", "after 2 weeks", "first month", "month", "year"], False),
        ("issues", ["scab", "peel", "red", "infection", "bump", "itch", "sun", "burn", "rash", "blister"], False),
        ("products", ["balm", "cream", "lotion", "ointment", "soap", "aquaphor", "coconut", "vaseline", "petroleum"], True),
        ("activities", ["swim", "exercise", "shower", "sleep", "gym", "sauna", "tan", "work"], False),
    ],
    "placement": [
        ("pain", ["pain"], False),
        ("meaning", ["meaning"], False),
        ("ideas", ["ideas", "design"], False),
        ("for-women", ["female", "women", "girl"], False),
        ("for-men", ["male", "men", "guy"], False),
        ("arm", ["arm"], False), ("leg", ["leg", "thigh", "calf", "ankle"], False),
        ("back", ["back"], False), ("chest", ["chest"], False), ("wrist", ["wrist"], False),
        ("hand", ["hand", "finger"], False), ("neck", ["neck"], False),
        ("shoulder", ["shoulder"], False), ("rib", ["rib"], False),
        ("foot", ["foot", "toe"], False), ("head-face", ["head", "face", "scalp"], False),
    ],
    "ideas": [
        ("for-women", ["women", "female", "girl"], False),
        ("for-men", ["men", "male", "guy"], False),
        ("small", ["small"], False),
        ("family", ["family"], False),
        ("name", ["name"], False),
        ("animal", ["animal", "wolf", "lion", "cat", "dog", "bird", "snake", "butterfly", "flower", "owl"], False),
        ("meaningful", ["meaningful", "meaning"], False),
        ("minimalist", ["minimalist", "minimal", "simple"], False),
        ("geometric", ["geometric"], False),
    ],
    "pain": [
        ("chart", ["chart", "map", "scale"], False),
        ("by-body-part", ["arm", "leg", "back", "chest", "rib", "wrist", "ankle", "neck",
                           "head", "hand", "foot", "spine", "sternum", "elbow", "knee"], False),
        ("for-women", ["women", "female"], False),
        ("for-men", ["men", "male"], False),
        ("reduction", ["less", "reduce", "numb", "numbing", "hack", "manage", "deal", "help"], False),
    ],
    "cost": [
        ("by-location", ["uk", "usa", "us ", "australia", "canada", "india", "london", "nyc",
                          "toronto", "sydney", "japan", "germany", "dubai", "singapore",
                          "philippines", "south africa", "ireland", "scotland", "hanoi", "halifax"], True),
        ("by-size", ["small", "half sleeve", "full sleeve", "sleeve", "back piece", "forearm", "tiny"], True),
        ("by-style", ["watercolor", "realism", "traditional", "blackwork", "geometric", "portrait"], True),
    ],
    "styles": [
        ("watercolor", ["watercolor"], False),
        ("traditional", ["traditional", "old school", "neo traditional"], False),
        ("blackwork", ["blackwork", "black and grey", "black and gray", "tribal"], False),
        ("minimalist", ["minimalist", "minimal", "fine line", "single line"], False),
        ("geometric", ["geometric"], False),
        ("japanese", ["japanese", "irezumi"], False),
        ("realism", ["realism", "realistic", "portrait"], False),
        ("dotwork", ["dotwork", "stipple"], False),
        ("comparison", ["vs", "versus", "difference", "types of"], False),
    ],
    "meaning": [
        # meaning 簇绝大多数已由 Tattoo Meaning Finder 的 70 页覆盖 → 标记为 existing-finder, 仅做内链
        ("symbol-dict", ["meaning", "symbol", "represent"], False),
    ],
    "removal": [
        ("questions", ["can tattoo removal", "can fine line", "can a tattoo",
                        "does tattoo removal", "does a tattoo", "do tattoo removal",
                        "are tattoo removal", "will tattoo removal", "how tattoo removal",
                        "how does", "is tattoo removal", "should you"] , False),
        ("fine-line", ["fine line tattoo removal", "fine line removal"], False),
        ("cost", ["cost", "price", "pricing", "expensive", "cheap"], True),
        ("method", ["laser", "picosure", "pico ", "cream", "ointment", "natural",
                    "surgery", "saline", "dermabrasion", "tca", "at home", "at-home"], True),
        ("before-after", ["before", "after"], False),
        ("reviews", ["review", "rating", "experience", "testimonial"], False),
        ("vs-alternatives", ["vs cover", "cover up vs", "instead of cover", "alternative to cover",
                              "vs coverup", "coverup vs"], False),
        ("app", ["app", "ai ", "simulator", "generator"], False),
        ("training", ["training", "course", "certification", "learn", "workshop", "class"], False),
        ("free", ["free", "low cost", "low-cost", "cheap"], True),
        ("by-size", ["small", "large", "big", "tiny", "half sleeve", "full sleeve",
                     "sleeve", "back piece", "forearm", "finger"], False),
        ("by-color", ["color tattoo", "colored tattoo", "black", "white"], False),
        ("specialty", ["blowout", "faded", "old", "regret", "mistake", "childhood"], False),
        ("by-location", ["near me", "uk", "usa", "us ", "australia", "canada", "london",
                          "japan", "japanese", "dubai", "india", "philippines", "south africa",
                          "ireland", "scotland", "nyc", "toronto", "sydney", "germany",
                          "singapore", "bali", "korea", "brazil", "mexico"], True),
        ("shop", ["shop", "clinic", "salon", "studio", "business", "office"], False),
    ],
    "small": [
        ("fine-line-basics", ["fine line", "single needle", "hairline", "thin line",
                                "1 needle", "one needle", "micro", "tiny line"], False),
        ("by-subject", ["family", "name", "animal", "wolf", "lion", "cat", "dog", "bird",
                         "snake", "butterfly", "flower", "rose", "sunflower", "lily",
                         "heart", "symbol", "cross", "angel", "star", "moon", "sun",
                         "tree", "leaf", "cherry", "daisy", "lotus"], False),
        ("for-women", ["women", "female", "girl"], False),
        ("for-men", ["men", "male", "guy"], False),
        ("meaningful", ["meaningful", "meaning", "symbolic", "spiritual"], False),
        ("by-style", ["minimalist", "minimal", "simple", "geometric", "watercolor", "tribal",
                       "vintage", "retro", "dainty", "delicate", "cute", "aesthetic",
                       "trendy", "chic"], False),
        ("placement", ["wrist", "ankle", "finger", "hand", "behind ear", "foot", "rib",
                        "sternum", "collarbone", "shoulder", "neck", "forearm", "bicep",
                        "inner arm", "thigh", "calf", "back"], False),
        ("cost", ["cost", "price", "pricing", "cheap", "expensive"], True),
        ("near-me", ["near me", "within "], False),
        ("vs-big", ["vs ", "versus", "compared to", "or big", "regular"], False),
        ("artist", ["artist", "specialist", "shop", "studio"], False),
    ],
    "coverup": [
        ("filler", ["filler", "fill in", "fill ins", "gap filler", "cloud filler",
                     "anime filler", "machine filler", "rose filler", "evil filler",
                     "filler design", "filler piece"], False),
        ("questions", ["are cover", "are tattoo", "can you", "can tattoo",
                        "do cover", "do tattoo", "does tattoo", "does cover",
                        "will cover", "will tattoo", "how to cover",
                        "how tattoo", "is cover", "is tattoo"], False),
        ("makeup", ["makeup"], False),
        ("by-medium", ["patch", "tape", "sticker", "sleeve", "clothing", "bandage",
                        "jewelry", "bracelet"], False),
        ("vs-alternatives", ["vs removal", "vs rework", "vs blast", "instead of removal",
                              "alternative to", "vs cover"], False),
        ("by-old-style", ["name", "ex ", "date", "tribal", "butterfly", "flower", "rose",
                            "words", "quote", "star", "skull", "heart", "anchor", "compass",
                            "bird"], False),
        ("app", ["app", "ai", "generator", "design online", "simulator", "online"], False),
        ("for-artists", ["artist", "specialist", "expert", "professional"], False),
        ("placement", ["arm", "wrist", "hand", "finger", "back", "chest", "rib",
                        "shoulder", "neck", "leg", "thigh", "calf", "ankle", "foot",
                        "face", "head"], False),
        ("for-women", ["women", "female", "girl"], False),
        ("for-men", ["men", "male", "guy"], False),
        ("cost", ["cost", "price", "pricing"], True),
        ("ideas", ["idea", "design", "inspiration", "creative"], False),
        ("by-location", ["near me", "london", "uk", "usa", "us ", "australia", "canada",
                          "japan", "india", "philippines", "bali"], False),
    ],
    "color": [
        ("by-skin-tone", ["dark skin", "brown skin", "black skin", "pale skin", "light skin",
                            "white skin", "olive skin", "skin tone"], False),
        ("ink", ["ink brand", "tattoo ink", "color ink", "ink color", "pigment", " ink "], False),
        ("by-type", ["watercolor", "realism", "realistic", "traditional", "neotraditional",
                      "japanese", "irezumi", "tribal", "geometric"], False),
        ("for-women", ["women", "female", "girl"], False),
        ("for-men", ["men", "male", "guy"], False),
        ("placement", ["arm", "leg", "back", "chest", "rib", "wrist", "ankle", "neck",
                        "hand", "foot", "shoulder", "finger"], False),
        ("fading", ["fading", "fade", "vibrant", "bright", "stays", "stay", "long last"], False),
        ("lotion", ["lotion", "cream", "balm", "ointment", "soap"], False),
        ("artist", ["artist", "specialist"], False),
        ("black-grey", ["black and grey", "black and gray", "blackwork", "vs black",
                         "vs color", " vs "], False),
        ("by-location", ["near me", "london", "uk", "usa", "us ", "australia", "canada",
                          "japan", "india", "philippines", "south africa", "ireland",
                          "scotland", "nyc", "toronto", "sydney", "germany", "dubai",
                          "singapore", "hanoi", "halifax", "korea", "bali", "brazil",
                          "mexico", "italy", "spain", "france"], False),
    ],
    "quotes": [
        ("fine-line", ["fine line quote", "fine line tattoo quote"], False),
        ("by-occasion", ["recovery", "day", "gift", "jesus", "humor", "humour", "funny",
                          "hater", "joker", "needle", "lost", "memory", "memorial",
                          "sympathy", "remembrance", "tribute", "anniversary", "birthday",
                          "wedding", "graduation", "funeral", "cancer", "survivor"], False),
        ("by-language", ["hindi", "sanskrit", "spanish", "french", "latin", "italian",
                          "german", "arabic", "chinese", "japanese", "korean", "portuguese",
                          "english", "marathi", "tamil", "telugu", "urdu", "bengali",
                          "greek", "irish", "hebrew", "persian", "turkish", "russian",
                          "swedish", "norwegian", "dutch", "polish", "thai", "vietnamese",
                          "malay", "filipino", "indonesian", "kanji"], False),
        ("for-women", ["women", "female", "girl"], False),
        ("for-men", ["men", "male", "guy"], False),
        ("by-tone", ["short", "simple", "inspirational", "motivational", "funny", "sassy",
                      "savage", "deep", "emotional", "powerful", "cute", "pretty",
                      "unique", "romantic", "tough", "attitude", "baddie", "aesthetic",
                      "cool", "swag"], False),
        ("by-theme", ["family", "love", "strength", "faith", "hope", "friend", "mother",
                       "mom", "father", "dad", "sister", "brother", "god", "bible",
                       "religious", "spiritual", "life", "death", "live", "laugh"], False),
        ("with-meaning", ["meaning", "meaningful"], False),
        ("placement", ["hand", "arm", "wrist", "back", "chest", "shoulder", "rib", "leg",
                        "ankle", "foot", "finger", "neck", "forearm", "bicep", "sternum",
                        "collarbone", "elbow", "hip", "knee"], False),
        ("by-location", ["near me"], False),
    ],
    "problems": [
        ("blowout", ["blowout"], False),
        ("infection", ["infection", "staph", "mrsa"], False),
        ("allergic", ["allergic", "reaction"], False),
        ("keloid", ["keloid", "scar"], False),
        ("fading", ["fading", "fade", "blurry"], False),
        ("stretching", ["stretch", "pregnancy", "weight"], False),
    ],
    "prep": [
        ("checklist", ["checklist", "things to do"], False),
        ("tips", ["tips", "how to"], False),
        ("for-artists", ["artist"], False),
        ("skin", ["skin", "shave", "moisturize"], False),
    ],
    "trends": [
        ("by-year", ["2024", "2025", "2026", "2027"], False),
        ("by-style", ["minimalist", "fine line", "watercolor", "micro"], False),
    ],
    "other": [],
}

def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

def classify_theme(cluster, kw):
    k = " " + kw.lower() + " "
    for theme_key, pats, _ in THEMES.get(cluster, []):
        for p in pats:
            if p in k:
                return theme_key
    return "general"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=IN_CSV)
    ap.add_argument("--out-csv", default=OUT_CSV)
    ap.add_argument("--out-md", default=OUT_MD)
    args = ap.parse_args()

    # 读词
    rows = []
    with open(args.src, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rows.append(r["keyword"].strip())
    raw_n = len(rows)

    # ① 审核: 去噪 + 去重 + 去无关
    seen = set()
    cleaned = []
    dropped_junk = dropped_dup = dropped_off = 0
    for kw in rows:
        if is_junk(kw):
            dropped_junk += 1
            continue
        if is_offtopic(kw):
            dropped_off += 1
            continue
        key = kw.lower()
        if key in seen:
            dropped_dup += 1
            continue
        seen.add(key)
        cleaned.append(kw)
    kept_n = len(cleaned)

    # ③ 分类: 用原 cluster 列 (已在 CSV)。但本脚本独立, 需从输入再读 cluster。
    # 重新读带 cluster
    kw_cluster = {}
    with open(args.src, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            kw_cluster[r["keyword"].strip().lower()] = r["cluster"].strip()

    # ④ 聚合: (cluster, theme) -> 词列表
    groups = OrderedDict()
    for kw in cleaned:
        c = kw_cluster.get(kw.lower(), "other")
        if c not in PILLARS:
            c = "other"
        th = classify_theme(c, kw)
        key = (c, th)
        groups.setdefault(key, []).append(kw)

    # ⑤ 规划内容页
    pages = []
    for (c, th), kws in groups.items():
        if th == "general":
            # 归入 pillar
            slug, title = PILLARS[c]
            ptype = "pillar"
        else:
            slug = f"blog/{slugify(c + '-' + th)}"
            cap = th.replace("-", " ").title()
            title = f"Tattoo {cap}: Complete Guide & Tips"
            ptype = "spoke"
        # 商业意图
        commercial = False
        if th != "general":
            for t in THEMES.get(c, []):
                if t[0] == th:
                    commercial = t[2]
                    break
        intent = "commercial" if commercial else "informational"
        side = business_side(kws[0])
        # primary keyword: 含 theme 主图案的词, 否则第一个
        primary = kws[0]
        if th != "general":
            for t in THEMES.get(c, []):
                if t[0] == th:
                    pat = t[1][0]
                    hit = [w for w in kws if pat in (" " + w.lower() + " ")]
                    if hit:
                        primary = hit[0]
                    break
        sample = " | ".join(kws[:20])
        pages.append({
            "page_id": f"{c}-{th}",
            "cluster": c,
            "page_type": ptype,
            "slug": slug,
            "title": title,
            "primary_keyword": primary,
            "supporting_keywords": sample,
            "kw_count": len(kws),
            "intent": intent,
            "business_side": side,
            "review_status": "pending_review",
        })

    # 输出 CSV (按 cluster, 然后 pillar 在前)
    pages.sort(key=lambda p: (p["cluster"], 0 if p["page_type"] == "pillar" else 1, -p["kw_count"]))
    with open(args.out_csv, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["page_id","cluster","page_type","slug","title",
                                          "primary_keyword","supporting_keywords","kw_count",
                                          "intent","business_side","review_status"])
        w.writeheader()
        for p in pages:
            w.writerow(p)

    # 输出 MD 汇总
    by_cluster = defaultdict(list)
    for p in pages:
        by_cluster[p["cluster"]].append(p)
    lines = ["# InkFlow 内容页规划表 (待人工挑选)", "",
             f"> 输入长尾词 **{raw_n}** → 审核后保留 **{kept_n}** "
             f"(丢弃: 噪声 {dropped_junk} / 重复 {dropped_dup} / 无关 {dropped_off})",
             f"> 聚合为 **{len(pages)}** 个内容页 (pillar + spoke), 全部 `pending_review`。",
             "> 流程: 审核 → 挑选(本表人工勾选) → 分类 → 聚合 → 规划 → 写内容 → 建内链 → 上线监控",
             "",
             "## 集群 × 页面总览", "",
             "| 集群 | 类型 | 页面 slug | 主推词 | 聚合词数 | 意图 | 业务侧 |",
             "|------|------|-----------|--------|---------|------|--------|"]
    for c in sorted(by_cluster, key=lambda x: -sum(p["kw_count"] for p in by_cluster[x])):
        for p in by_cluster[c]:
            lines.append(f"| {c} | {p['page_type']} | `{p['slug']}` | {p['primary_keyword']} | {p['kw_count']} | {p['intent']} | {p['business_side']} |")
    lines += ["", "## 待办 (人工闸)", "",
              "1. **挑选**: 打开 page_plan.csv, 对每页 `review_status` 标 `approved` / `rejected` / `split`(需再拆)。",
              "2. **规划内容**: approved 的页排进建页排期 (建议按 kw_count 高 + informational 优先起量)。",
              "3. **写内容**: 按 TDI 8 维 (实体覆盖/子意图/深度/语义变体/集群内聚/E-E-A-T/互动/新鲜度) 出厂即深。",
              "4. **建内链**: spoke → pillar 双向; 锚文本用主推词变体 (避免 exact-match 过度优化)。",
              "5. **上线监控**: IndexNow 提交 + GSC 追踪排名 (日更闭环, 参考 Gingiris Daily SOP)。", ""]
    with open(args.out_md, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"输入词: {raw_n}")
    print(f"审核后保留: {kept_n} (噪声 {dropped_junk} / 重复 {dropped_dup} / 无关 {dropped_off})")
    print(f"聚合页面数: {len(pages)} (pillar {sum(1 for p in pages if p['page_type']=='pillar')} / spoke {sum(1 for p in pages if p['page_type']=='spoke')})")
    print(f"CSV -> {args.out_csv}")
    print(f"MD  -> {args.out_md}")

if __name__ == "__main__":
    main()

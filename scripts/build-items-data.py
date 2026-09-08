#!/usr/bin/env python3
"""
build-items-data.py —— 把 atlas-data 的物品数据聚合 + 反查 Pal 掉落来源。

输入：
- data/atlas-items.json（1892 个物品，含 name/description/category/rarity/price 等）
- data/pals/{slug}.json（drops 字段：item code → 掉落来源）

输出：data/items.json
{ "<slug>": { "id", "name", "description", "category", "subcategory",
              "rarity", "rank", "price", "maxStack",
              "droppedBy": [{"slug", "rate", "min", "max"}, ...] } }
"""
import json
import os
import re

ITEMS = os.path.join("data", "atlas-items.json")
PALS = os.path.join("data", "pals")
OUT = os.path.join("data", "items.json")


def slugify(code: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", code.lower()).strip("-")


def clean_desc(s: str) -> str:
    # 去掉 <mapObjectName .../> 之类残留 XML 标记，保留说明文字。
    s = re.sub(r"<[^>]+>", "", s or "")
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    return s.strip()


def main():
    items = json.load(open(ITEMS, encoding="utf-8"))["records"]

    # 反查 drops：item code -> [{slug, rate, min, max}]
    dropped_by = {}
    if os.path.isdir(PALS):
        for f in os.listdir(PALS):
            if not f.endswith(".json"):
                continue
            slug = f[:-5]
            d = json.load(open(os.path.join(PALS, f), encoding="utf-8"))
            for drop in (d.get("drops") or []):
                code = drop.get("item")
                if not code:
                    continue
                dropped_by.setdefault(code, []).append({
                    "slug": slug,
                    "rate": drop.get("rate"),
                    "min": drop.get("min"),
                    "max": drop.get("max"),
                })

    out = {}
    for r in items:
        slug = slugify(r["id"])
        out[slug] = {
            "id": r["id"],
            "name": r["name"],
            "description": clean_desc(r.get("description", "")),
            "category": r.get("category", ""),
            "subcategory": r.get("subcategory", ""),
            "rarity": r.get("rarity"),
            "rank": r.get("rank"),
            "price": r.get("price"),
            "maxStack": r.get("maxStack"),
            "droppedBy": dropped_by.get(r["id"], []),
        }

    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    has_drop = sum(1 for v in out.values() if v["droppedBy"])
    print(f"items.json: {len(out)} 个物品，{has_drop} 个有掉落来源")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
build-spawn-data.py —— 把 atlas-data 的 spawn 坐标聚合到每个 Pal，生成 Location 摘要。

数据源：Awy64/palworld-atlas-data（GitHub Pages，游戏文件提取）。
- maps/palpagos/spawns.json  +  maps/tree/spawns.json

输出：data/pal-spawns.json
{ "<slug>": { "count": N, "minLevel": a, "maxLevel": b, "nightOnly": bool,
              "hasAlpha": bool, "alphaMin": a, "alphaMax": b, "regions": ["palpagos", ...] } }
"""
import json
import os
from collections import defaultdict

DATA = os.path.join("data", "pals")
PALPAGOS = os.path.join("data", "atlas-palpagos-spawns.json")
TREE = os.path.join("data", "atlas-tree-spawns.json")
OUT = os.path.join("data", "pal-spawns.json")


def top_points(items, n=5):
    """每个 Pal 取 spawn 权重最高的 n 个点（坐标去重后），供 Location 页精确坐标模块。

    只保留 palpagos 点（tree 坐标是另一套尺度）；按 weight 降序，同坐标去重。
    """
    seen = set()
    pts = []
    for s in sorted(items, key=lambda x: -x.get("weight", 0)):
        key = (round(s["mapX"], 1), round(s["mapY"], 1))
        if key in seen:
            continue
        seen.add(key)
        pts.append(
            {
                "x": round(s["mapX"], 1),
                "y": round(s["mapY"], 1),
                "kind": s["kind"],
                "availability": s["availability"],
                "minLevel": s["minLevel"],
                "maxLevel": s["maxLevel"],
            }
        )
        if len(pts) >= n:
            break
    return pts


def main():
    spawns = []
    for f in (PALPAGOS, TREE):
        if os.path.exists(f):
            spawns += json.load(open(f, encoding="utf-8"))["spawns"]

    code2slug = {}
    for f in os.listdir(DATA):
        if f.endswith(".json"):
            d = json.load(open(os.path.join(DATA, f), encoding="utf-8"))
            code2slug[d["code"]] = f[:-5]

    agg = defaultdict(list)
    for s in spawns:
        agg[s["palId"]].append(s)

    out = {}
    for code, items in agg.items():
        slug = code2slug.get(code)
        if not slug:
            continue
        wild = [s for s in items if s["kind"] == "wild"]
        alpha = [s for s in items if s["kind"] == "alpha"]
        lv = [s["minLevel"] for s in wild] + [s["maxLevel"] for s in wild]
        night_only = all(s["availability"] == "night" for s in wild)
        regions = sorted({s["region"] for s in items})
        # 坐标中心（用 palpagos 的 spawn 点，tree 坐标是另一套尺度）
        pt = [s for s in wild if s["region"] == "palpagos"]
        cx = sum(s["mapX"] for s in pt) / len(pt) if pt else None
        cy = sum(s["mapY"] for s in pt) / len(pt) if pt else None
        rec = {
            "count": len(wild),
            "minLevel": min(lv) if lv else None,
            "maxLevel": max(lv) if lv else None,
            "nightOnly": night_only,
            "hasAlpha": len(alpha) > 0,
            "alphaMin": min((s["minLevel"] for s in alpha), default=None),
            "alphaMax": max((s["maxLevel"] for s in alpha), default=None),
            "regions": regions,
            "cx": round(cx, 1) if cx is not None else None,
            "cy": round(cy, 1) if cy is not None else None,
            "points": top_points([s for s in items if s["region"] == "palpagos"]),
        }
        out[slug] = rec

    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"pal-spawns.json: {len(out)} pal 有 spawn 数据")


if __name__ == "__main__":
    main()

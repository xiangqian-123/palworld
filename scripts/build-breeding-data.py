#!/usr/bin/env python3
"""
build-breeding-data.py —— 预计算 Palworld 1.0 全量繁殖关系。

规则：
1. 同种自交：A+A=A。
2. override（breedsInto）：特定 parent+partner → 变体 child，绕过公式。
3. 公式：childRank = floor((rankA+rankB+1)/2)，取 combiRank 最近的 Pal；
   ignoreCombi 的 28 个传奇/塔 BOSS 不参与公式结果。

输出（写入 data/ 下）：
- breeding-parents.json  { slug: [[slugA, slugB], ...] }   谁能繁殖出它
- breeding-children.json { slug: [childSlug, ...] }         它能繁殖出什么
"""
import json
import os
import bisect

DATA = os.path.join("data", "pals")
OUT_PARENTS = os.path.join("data", "breeding-parents.json")
OUT_CHILDREN = os.path.join("data", "breeding-children.json")


def main():
    pals = {}
    for f in os.listdir(DATA):
        if not f.endswith(".json"):
            continue
        slug = f[:-5]
        d = json.load(open(os.path.join(DATA, f), encoding="utf-8"))
        d["slug"] = slug
        pals[d["name"]] = d

    rank = {n: d["combiRank"] for n, d in pals.items()}
    code2name = {d["code"]: n for n, d in pals.items()}

    override = {}
    for n, d in pals.items():
        for x in (d.get("breedsInto") or []):
            p = code2name.get(x["partner"])
            c = code2name.get(x["child"])
            if p and c:
                override[frozenset({n, p})] = c

    breedable = [n for n, d in pals.items() if not d.get("ignoreCombi")]
    sorted_pals = sorted(breedable, key=lambda n: rank[n])
    sorted_ranks = [rank[n] for n in sorted_pals]

    def find_child(a, b):
        if a == b:
            return a
        k = frozenset({a, b})
        if k in override:
            return override[k]
        t = (rank[a] + rank[b] + 1) // 2
        i = bisect.bisect_left(sorted_ranks, t)
        cand = [sorted_pals[j] for j in (i - 1, i, i + 1)
                if 0 <= j < len(sorted_pals)]
        # 最近者胜；等距（tie）时取更高 combiRank（1.0 规则，多数工具搞反）。
        return min(cand, key=lambda p: (abs(rank[p] - t), -rank[p]))

    names = list(pals.keys())
    parents = {}
    children = {}
    for i, a in enumerate(names):
        for b in names[i:]:
            c = find_child(a, b)
            parents.setdefault(c, []).append((a, b))
            children.setdefault(a, set()).add(c)
            children.setdefault(b, set()).add(c)

    out_p = {pals[t]["slug"]: [[pals[x]["slug"], pals[y]["slug"]] for x, y in v]
             for t, v in parents.items()}
    out_c = {pals[p]["slug"]: sorted(v) for p, v in children.items()}

    json.dump(out_p, open(OUT_PARENTS, "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(out_c, open(OUT_CHILDREN, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"parents: {len(out_p)} pal, {sum(len(v) for v in out_p.values())} combos -> {OUT_PARENTS}")
    print(f"children: {len(out_c)} pal, {sum(len(v) for v in out_c.values())} entries -> {OUT_CHILDREN}")


if __name__ == "__main__":
    main()

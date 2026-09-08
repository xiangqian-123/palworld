"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface CalcPal {
  slug: string;
  name: string;
  combiRank: number;
  ignoreCombi: boolean;
}

interface Props {
  pals: CalcPal[];
  overrides: [string, string, string][];
  locale: string;
}

/** 正向：两个 parent 繁殖出什么 child。 */
function findChild(
  a: string,
  b: string,
  rankMap: Map<string, number>,
  ovMap: Map<string, string>,
  breedable: CalcPal[]
): string | null {
  if (!a || !b) return null;
  if (a === b) return a;
  const ov = ovMap.get([a, b].sort().join("|"));
  if (ov) return ov;
  const ra = rankMap.get(a);
  const rb = rankMap.get(b);
  if (ra == null || rb == null) return null;
  const target = Math.floor((ra + rb + 1) / 2);
  let lo = 0;
  let hi = breedable.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (breedable[mid].combiRank < target) lo = mid + 1;
    else hi = mid;
  }
  let best = breedable[lo];
  let bestD = Math.abs(best.combiRank - target);
  for (const p of [breedable[lo - 1], breedable[lo + 1]]) {
    if (!p) continue;
    const d = Math.abs(p.combiRank - target);
    // tie 时取更高 combiRank（1.0 规则）
    if (d < bestD || (d === bestD && p.combiRank > best.combiRank)) {
      best = p;
      bestD = d;
    }
  }
  return best.slug;
}

export default function BreedingCalculator({ pals, overrides, locale }: Props) {
  const { rankMap, ovMap, breedable } = useMemo(() => {
    const rankMap = new Map(pals.map((p) => [p.slug, p.combiRank]));
    const ovMap = new Map(overrides.map(([a, b, c]) => [[a, b].sort().join("|"), c]));
    const breedable = pals
      .filter((p) => !p.ignoreCombi)
      .sort((a, b) => a.combiRank - b.combiRank);
    return { rankMap, ovMap, breedable };
  }, [pals, overrides]);

  const [mode, setMode] = useState<"child" | "parents">("child");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [target, setTarget] = useState("");

  const child = mode === "child" ? findChild(a, b, rankMap, ovMap, breedable) : null;

  const parents = useMemo(() => {
    if (mode !== "parents" || !target) return [];
    const res: [string, string][] = [];
    const slugs = pals.map((p) => p.slug);
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i; j < slugs.length; j++) {
        if (findChild(slugs[i], slugs[j], rankMap, ovMap, breedable) === target) {
          res.push([slugs[i], slugs[j]]);
        }
      }
    }
    return res;
  }, [mode, target, pals, rankMap, ovMap, breedable]);

  const nameOf = (slug: string) => pals.find((p) => p.slug === slug)?.name ?? slug;

  return (
    <div className="breeder">
      <div className="breeder-tabs">
        <button
          className={mode === "child" ? "active" : ""}
          onClick={() => setMode("child")}
        >
          Find Child
        </button>
        <button
          className={mode === "parents" ? "active" : ""}
          onClick={() => setMode("parents")}
        >
          Find Parents
        </button>
      </div>

      {mode === "child" ? (
        <div className="breeder-pair">
          <label>
            <span>Parent A</span>
            <select value={a} onChange={(e) => setA(e.target.value)}>
              <option value="">Select a Pal…</option>
              {pals.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <span className="breeder-plus">+</span>
          <label>
            <span>Parent B</span>
            <select value={b} onChange={(e) => setB(e.target.value)}>
              <option value="">Select a Pal…</option>
              {pals.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <span className="breeder-eq">=</span>
          <div className="breeder-result">
            {child ? (
              <Link href={`/${locale}/pal/${child}`} className="breeder-child">
                {nameOf(child)}
              </Link>
            ) : (
              <span className="breeder-hint">Pick two Pals</span>
            )}
          </div>
        </div>
      ) : (
        <div className="breeder-parents">
          <label>
            <span>I want…</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Select a Pal…</option>
              {pals.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {target && (
            <p className="breeder-count">
              {parents.length} parent combination{parents.length === 1 ? "" : "s"}
            </p>
          )}
          <div className="breeder-parent-list">
            {parents.slice(0, 200).map(([x, y], i) => (
              <div className="breeder-parent-row" key={i}>
                <Link href={`/${locale}/pal/${x}`}>{nameOf(x)}</Link>
                <span>+</span>
                <Link href={`/${locale}/pal/${y}`}>{nameOf(y)}</Link>
              </div>
            ))}
            {parents.length > 200 && (
              <p className="breeder-more">…and {parents.length - 200} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

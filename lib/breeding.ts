import fs from "fs";
import path from "path";

/**
 * Palworld 1.0 繁殖系统 —— 核心算法与数据。
 *
 * 规则（已按 1.0 数据校准）：
 * 1. 同种自交：A + A = A。
 * 2. 特殊 override（breedsInto）：特定 parent+partner → 特定变体 child，绕过公式。
 * 3. 普通公式：childRank = floor((rankA + rankB + 1) / 2)，取 combiRank 最接近的 Pal；
 *    ignoreCombi 的 28 个传奇/塔 BOSS 不参与公式结果（只能同种自交）。
 *
 * parents 反向索引预计算在 data/breeding-parents.json（41616 个组合），
 * 避免 build 时对 288 个页面重复 O(n²) 遍历。
 */

export interface BreedPal {
  slug: string;
  name: string;
  code: string;
  combiRank: number;
  ignoreCombi: boolean;
  paldexIndex: number;
}

const PALS_DIR = path.join(process.cwd(), "data", "pals");
const PARENTS_FILE = path.join(process.cwd(), "data", "breeding-parents.json");

interface BreedCache {
  bySlug: Map<string, BreedPal>;
  codeToSlug: Map<string, string>;
  /** 排序后的可繁殖 Pal slug（按 combiRank 升序），用于二分。 */
  sorted: string[];
  sortedRanks: number[];
  /** override：`${slugA}|${slugB}`（字典序）→ child slug。 */
  override: Map<string, string>;
}

let cache: BreedCache | null = null;

function load(): BreedCache {
  if (cache) return cache;
  const bySlug = new Map<string, BreedPal>();
  const codeToSlug = new Map<string, string>();
  const override = new Map<string, string>();

  if (fs.existsSync(PALS_DIR)) {
    for (const f of fs.readdirSync(PALS_DIR)) {
      if (!f.endsWith(".json")) continue;
      const slug = f.replace(/\.json$/, "");
      try {
        const d = JSON.parse(
          fs.readFileSync(path.join(PALS_DIR, f), "utf8")
        ) as Record<string, unknown>;
        const pal: BreedPal = {
          slug,
          name: String(d.name ?? slug),
          code: String(d.code ?? ""),
          combiRank: Number(d.combiRank ?? 0),
          ignoreCombi: Boolean(d.ignoreCombi),
          paldexIndex: Number(d.paldexIndex ?? 0),
        };
        bySlug.set(slug, pal);
        if (pal.code) codeToSlug.set(pal.code, slug);
      } catch {
        /* skip broken file */
      }
    }
  }

  // 构建 override 表（breedsInto：partner 与 child 都是 code）。
  for (const pal of bySlug.values()) {
    const raw = readRaw(pal.slug);
    const breedsInto = raw?.breedsInto as
      | { partner: string; child: string }[]
      | undefined;
    if (!breedsInto) continue;
    for (const x of breedsInto) {
      const p = codeToSlug.get(x.partner);
      const c = codeToSlug.get(x.child);
      if (p && c) {
        const key = [pal.slug, p].sort().join("|");
        override.set(key, c);
      }
    }
  }

  // 可公式繁殖的 Pal（非 ignoreCombi），按 combiRank 排序。
  const breedable = [...bySlug.values()]
    .filter((p) => !p.ignoreCombi)
    .sort((a, b) => a.combiRank - b.combiRank);
  const sorted = breedable.map((p) => p.slug);
  const sortedRanks = breedable.map((p) => p.combiRank);

  cache = { bySlug, codeToSlug, sorted, sortedRanks, override };
  return cache;
}

function readRaw(slug: string): Record<string, unknown> | null {
  const file = path.join(PALS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** 二分查找 combiRank 最接近 target 的可繁殖 Pal；等距（tie）时取更高 combiRank（1.0 规则）。 */
function closestByRank(target: number, c: BreedCache): string {
  let lo = 0;
  let hi = c.sortedRanks.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (c.sortedRanks[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  const cand = [c.sorted[lo]];
  if (lo > 0) cand.push(c.sorted[lo - 1]);
  if (lo + 1 < c.sorted.length) cand.push(c.sorted[lo + 1]);
  return cand.reduce((best, s) => {
    const d = Math.abs(c.bySlug.get(s)!.combiRank - target);
    const bd = Math.abs(c.bySlug.get(best)!.combiRank - target);
    if (d < bd) return s;
    if (d === bd && c.bySlug.get(s)!.combiRank > c.bySlug.get(best)!.combiRank)
      return s;
    return best;
  }, c.sorted[lo]);
}

/** 正向：两个 parent 繁殖出什么 child（返回 slug）。 */
export function findChild(slugA: string, slugB: string): string | null {
  const c = load();
  if (slugA === slugB) return c.bySlug.has(slugA) ? slugA : null;
  if (!c.bySlug.has(slugA) || !c.bySlug.has(slugB)) return null;

  const key = [slugA, slugB].sort().join("|");
  const ov = c.override.get(key);
  if (ov) return ov;

  const ra = c.bySlug.get(slugA)!.combiRank;
  const rb = c.bySlug.get(slugB)!.combiRank;
  const target = Math.floor((ra + rb + 1) / 2);
  return closestByRank(target, c);
}

/** 反向：能繁殖出目标 Pal 的所有 parent 组合（预计算索引，内存缓存）。 */
let parentsCache: Record<string, [string, string][]> | null = null;
function loadParents(): Record<string, [string, string][]> {
  if (parentsCache) return parentsCache;
  const file = PARENTS_FILE;
  let all: Record<string, [string, string][]> = {};
  if (fs.existsSync(file)) {
    try {
      all = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      all = {};
    }
  }
  parentsCache = all;
  return all;
}

export function getParents(slug: string): [string, string][] {
  return loadParents()[slug] ?? [];
}

/** 一个 Pal 作为 parent 能繁殖出的所有不同 child（预计算索引，内存缓存）。 */
let childrenCache: Record<string, string[]> | null = null;
function loadChildren(): Record<string, string[]> {
  if (childrenCache) return childrenCache;
  const file = path.join(process.cwd(), "data", "breeding-children.json");
  let all: Record<string, string[]> = {};
  if (fs.existsSync(file)) {
    try {
      all = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      all = {};
    }
  }
  childrenCache = all;
  return all;
}

export function getChildren(slug: string): string[] {
  return loadChildren()[slug] ?? [];
}

/** 全部 Pal（按编号排序），供下拉选择 / 列表。 */
export function getAllBreedPals(): BreedPal[] {
  const c = load();
  return [...c.bySlug.values()].sort((a, b) => a.paldexIndex - b.paldexIndex);
}

export function getBreedPal(slug: string): BreedPal | null {
  return load().bySlug.get(slug) ?? null;
}

/** 全量组合数据（供计算器客户端内嵌）：[{slug,name,combiRank}, ...]。 */
export function getCombinationData(): {
  slug: string;
  name: string;
  combiRank: number;
}[] {
  const c = load();
  return [...c.bySlug.values()]
    .sort((a, b) => a.paldexIndex - b.paldexIndex)
    .map((p) => ({ slug: p.slug, name: p.name, combiRank: p.combiRank }));
}

/** 计算器完整数据（客户端内嵌）：pal 列表 + override 配方。 */
export function getBreedingData(): {
  pals: { slug: string; name: string; combiRank: number; ignoreCombi: boolean }[];
  overrides: [string, string, string][];
} {
  const c = load();
  return {
    pals: [...c.bySlug.values()]
      .sort((a, b) => a.paldexIndex - b.paldexIndex)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        combiRank: p.combiRank,
        ignoreCombi: p.ignoreCombi,
      })),
    overrides: [...c.override.entries()].map(([k, v]) => {
      const [a, b] = k.split("|");
      return [a, b, v];
    }),
  };
}

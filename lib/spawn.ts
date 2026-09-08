import fs from "fs";
import path from "path";

/** Pal 野生 spawn 摘要（由 scripts/build-spawn-data.py 从 atlas-data 聚合生成）。 */
export interface PalSpawn {
  count: number;
  minLevel: number | null;
  maxLevel: number | null;
  nightOnly: boolean;
  hasAlpha: boolean;
  alphaMin: number | null;
  alphaMax: number | null;
  regions: string[];
}

let cache: Record<string, PalSpawn> | null = null;

function load(): Record<string, PalSpawn> {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "pal-spawns.json");
  let all: Record<string, PalSpawn> = {};
  if (fs.existsSync(file)) {
    try {
      all = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      all = {};
    }
  }
  cache = all;
  return all;
}

export function getPalSpawn(slug: string): PalSpawn | null {
  return load()[slug] ?? null;
}

/** 地图名 → 显示名。 */
export function regionLabel(region: string): string {
  if (region === "palpagos") return "Palpagos Islands";
  if (region === "tree") return "World Tree";
  return region;
}

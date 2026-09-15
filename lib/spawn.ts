import fs from "fs";
import path from "path";

/** 单个 spawn 点（按刷新权重取 top N，坐标已去重）。 */
export interface PalSpawnPoint {
  x: number;
  y: number;
  kind: "wild" | "alpha";
  availability: string;
  minLevel: number | null;
  maxLevel: number | null;
}

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
  /** Palpagos 地图上的 spawn 点中心坐标（mapX/mapY）。 */
  cx: number | null;
  cy: number | null;
  /** 高权重 spawn 点坐标（top 5，仅 palpagos 区域）。 */
  points?: PalSpawnPoint[];
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

/** 高权重 spawn 点坐标（可能为空数组）。 */
export function getPalSpawnPoints(slug: string): PalSpawnPoint[] {
  return load()[slug]?.points ?? [];
}

/** 坐标的粗粒度可读位置（与 bearing 同一套划分）。 */
export function coordArea(x: number, y: number): string {
  return bearingLabel(spawnBearing(x, y));
}

/** 地图名 → 显示名。 */
export function regionLabel(region: string): string {
  if (region === "palpagos") return "Palpagos Islands";
  if (region === "tree") return "World Tree";
  return region;
}

/**
 * 根据 Palpagos 坐标中心给一个粗粒度方位描述（"south-west" / "north-east" / "central"）。
 * 地图坐标大致范围：mapX -1728~948，mapY -2008~842（原点在中部）。
 */
export function spawnBearing(cx: number, cy: number): string {
  const ew = cx < -450 ? "west" : cx > 450 ? "east" : "";
  const ns = cy < -450 ? "south" : cy > 450 ? "north" : "";
  if (!ew && !ns) return "central";
  return [ns, ew].filter(Boolean).join("-");
}

/** 把方位码转成可读英文短语。 */
export function bearingLabel(bearing: string): string {
  const map: Record<string, string> = {
    north: "northern Palpagos",
    south: "southern Palpagos",
    east: "eastern Palpagos",
    west: "western Palpagos",
    "north-east": "north-eastern Palpagos",
    "north-west": "north-western Palpagos",
    "south-east": "south-eastern Palpagos",
    "south-west": "south-western Palpagos",
    central: "central Palpagos",
  };
  return map[bearing] ?? "Palpagos";
}

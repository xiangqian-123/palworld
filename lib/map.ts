import fs from "fs";
import path from "path";

/**
 * 交互地图数据。
 * - data/map/locations.json：Pal 物种中心点 + Alpha Boss 点（来自 atlas-data spawn 坐标）
 * - data/locations/resources.json：矿石/资源点（游戏 Wiki 坐标，与 pal-map 坐标系一致）
 * - data/locations/bases.json：基地位置
 * - data/locations/fast-travel.json：快速旅行点
 * 独立扩展数据层，不改 atlas-data / pals / items。
 */

export interface MapLocation {
  id: string;
  type: "pal" | "boss" | "resource" | "base" | "fast-travel";
  name: string;
  en?: string;
  palSlug: string | null;
  x: number;
  y: number;
  region?: string;
  description?: string;
  resourceType?: string;
}

export interface MapData {
  extent: number[];
  locations: MapLocation[];
}

let cache: MapData | null = null;

function readJson<T>(file: string): T {
  try {
    const p = path.join(process.cwd(), "data", "locations", file);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    /* ignore */
  }
  return [] as unknown as T;
}

export function getMapData(): MapData {
  if (cache) return cache;

  const file = path.join(process.cwd(), "data", "map", "locations.json");
  let base: MapData = { extent: [-1000, -1000, 1000, 1000], locations: [] };
  try {
    if (fs.existsSync(file)) {
      base = JSON.parse(fs.readFileSync(file, "utf8")) as MapData;
    }
  } catch {
    /* ignore */
  }

  // 合并扩展地点层（resource / base / fast-travel）
  const resources = readJson<MapLocation[]>("resources.json");
  const bases = readJson<MapLocation[]>("bases.json");
  const fastTravel = readJson<MapLocation[]>("fast-travel.json");

  base.locations = [
    ...base.locations,
    ...resources.map((l) => ({ ...l, palSlug: null })),
    ...bases.map((l) => ({ ...l, palSlug: null })),
    ...fastTravel.map((l) => ({ ...l, palSlug: null })),
  ];

  cache = base;
  return base;
}

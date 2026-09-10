import fs from "fs";
import path from "path";

/**
 * 交互地图数据（data/map/locations.json）。
 * 来源：atlas-data spawn 坐标（Pal 物种中心点 + Alpha Boss 点）。
 * 仅 Pal / Boss 两类有真实坐标；Resource / Base / Fast Travel 暂无数据，不做假。
 */

export interface MapLocation {
  id: string;
  type: "pal" | "boss";
  name: string;
  palSlug: string | null;
  x: number;
  y: number;
}

export interface MapData {
  extent: number[];
  locations: MapLocation[];
}

let cache: MapData | null = null;

export function getMapData(): MapData {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "map", "locations.json");
  let data: MapData = { extent: [-1000, -1000, 1000, 1000], locations: [] };
  try {
    if (fs.existsSync(file)) {
      data = JSON.parse(fs.readFileSync(file, "utf8")) as MapData;
    }
  } catch {
    /* ignore */
  }
  cache = data;
  return data;
}

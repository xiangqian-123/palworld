import fs from "fs";
import path from "path";

// Pal 详情数据目录（由 fetch-pal-details.py 从 palworld-db API 批量抓取生成）。
export const PAL_DATA_DIR = path.join(process.cwd(), "data", "pals");

export interface PalStats {
  hp: number;
  meleeAttack: number;
  shotAttack: number;
  defense: number;
  support: number;
  craftSpeed: number;
}

export interface PalSpeed {
  walk: number;
  run: number;
  rideSprint: number;
  transport: number;
}

export interface PalMove {
  level: number;
  name: string;
  element: string;
  power: number;
  cooldown: number;
  category: string;
  minRange: number;
  maxRange: number;
}

export interface PalDrop {
  item: string;
  name: string;
  rate: number;
  min: number;
  max: number;
}

export interface PalBreedChild {
  partner: string;
  child: string;
}

export interface PalPartnerSkillScale {
  label: string;
  values: number[];
}

export interface Pal {
  slug: string;
  code: string;
  name: string;
  paldexIndex: number;
  paldexSuffix?: string;
  rarity?: number;
  size?: string;
  elements: string[];
  genus?: string;
  workSuitabilities?: Record<string, number>;
  bestWork?: string;
  partnerSkill?: string;
  partnerSkillScaling?: PalPartnerSkillScale[];
  stats?: PalStats;
  speed?: PalSpeed;
  price?: number;
  combiRank?: number;
  captureRate?: number;
  isBoss?: boolean;
  isTowerBoss?: boolean;
  isRaidBoss?: boolean;
  description?: string;
  moves?: PalMove[];
  eggMoves?: string[];
  drops?: PalDrop[];
  uniqueBreeding?: unknown[];
  innatePassives?: unknown[];
  genderMale?: number;
  breedsInto?: PalBreedChild[];
}

// 列出全部 Pal slug（从 data/pals 目录读取，按文件名）。
export function getPalSlugs(): string[] {
  if (!fs.existsSync(PAL_DATA_DIR)) return [];
  return fs
    .readdirSync(PAL_DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

// 按 slug 读取单个 Pal 详情。
export function getPal(slug: string): Pal | null {
  const file = path.join(PAL_DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Pal;
  } catch {
    return null;
  }
}

// 全部 Pal（按编号排序），用于图鉴列表等场景。
export function getAllPals(): Pal[] {
  return getPalSlugs()
    .map((slug) => getPal(slug))
    .filter((p): p is Pal => p !== null)
    .sort((a, b) => a.paldexIndex - b.paldexIndex);
}

// code（图标文件名）→ 英文名 映射（惰性加载，缓存）。
let codeNameCache: Record<string, string> | null = null;
function loadCodeNameMap(): Record<string, string> {
  if (codeNameCache) return codeNameCache;
  const file = path.join(process.cwd(), "data", "pal-map.json");
  let map: Record<string, string> = {};
  try {
    map = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
  } catch {
    map = {};
  }
  codeNameCache = map;
  return map;
}

export function getCodeName(code: string): string {
  const map = loadCodeNameMap();
  return map[code] ?? code;
}

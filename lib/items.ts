import fs from "fs";
import path from "path";

/** 物品数据（由 scripts/build-items-data.py 从 atlas-data 生成）。 */
export interface ItemDrop {
  slug: string;
  rate: number | null;
  min: number | null;
  max: number | null;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  rarity: number | null;
  rank: number | null;
  price: number | null;
  maxStack: number | null;
  droppedBy: ItemDrop[];
}

let cache: Record<string, Item> | null = null;

function load(): Record<string, Item> {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "items.json");
  let all: Record<string, Item> = {};
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

export function getItem(slug: string): Item | null {
  return load()[slug] ?? null;
}

export function getItemSlugs(): string[] {
  return Object.keys(load()).sort();
}

export function getAllItems(): Item[] {
  return Object.values(load());
}

/** 分类名 → 物品数（按数量降序）。 */
export function getCategories(): { name: string; count: number }[] {
  const m = new Map<string, number>();
  for (const it of Object.values(load())) {
    if (!it.category) continue;
    m.set(it.category, (m.get(it.category) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** 分类显示名（把 game code 转成友好名）。 */
export function categoryLabel(cat: string): string {
  return cat;
}

import fs from "fs";
import path from "path";
import { getItem } from "@/lib/items";

/**
 * Pal drops → Item 页面映射。
 * 映射表 data/mappings/drop-item-map.json：drops code → items.json key。
 * 独立映射层，不改英文数据源。
 */

let cache: Record<string, string> | null = null;

function load(): Record<string, string> {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "mappings", "drop-item-map.json");
  let m: Record<string, string> = {};
  try {
    if (fs.existsSync(file)) {
      m = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
    }
  } catch {
    /* ignore */
  }
  cache = m;
  return m;
}

/** drops code → item slug（仅当对应 item 真实存在时返回），否则 null。 */
export function dropItemSlug(dropCode: string): string | null {
  const key = load()[dropCode];
  if (!key) return null;
  return getItem(key) ? key : null;
}

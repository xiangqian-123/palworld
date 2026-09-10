import fs from "fs";
import path from "path";

/**
 * 中文名翻译映射加载（data/translations/*.json）。
 * 独立映射层，不改英文数据源。
 */

export interface Translation {
  name?: string;
  aliases?: string[];
}

const T_DIR = path.join(process.cwd(), "data", "translations");

let palZh: Record<string, Translation> | null = null;
let palTw: Record<string, Translation> | null = null;
let itemZh: Record<string, Translation> | null = null;
let itemTw: Record<string, Translation> | null = null;

function load(file: string): Record<string, Translation> {
  try {
    const p = path.join(T_DIR, file);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, Translation>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function palTranslations(): {
  zh: Record<string, Translation>;
  tw: Record<string, Translation>;
} {
  if (!palZh) palZh = load("pals.zh-CN.json");
  if (!palTw) palTw = load("pals.zh-TW.json");
  return { zh: palZh, tw: palTw };
}

export function itemTranslations(): {
  zh: Record<string, Translation>;
  tw: Record<string, Translation>;
} {
  if (!itemZh) itemZh = load("items.zh-CN.json");
  if (!itemTw) itemTw = load("items.zh-TW.json");
  return { zh: itemZh, tw: itemTw };
}

/** 当前 locale 的中文名（zh-TW 用繁体，其余用简体）。 */
export function palZhName(slug: string, locale: string): string {
  const { zh, tw } = palTranslations();
  if (locale === "zh-TW") return tw[slug]?.name ?? zh[slug]?.name ?? "";
  return zh[slug]?.name ?? "";
}

export function itemZhName(slug: string, locale: string): string {
  const { zh, tw } = itemTranslations();
  if (locale === "zh-TW") return tw[slug]?.name ?? zh[slug]?.name ?? "";
  return zh[slug]?.name ?? "";
}

import fs from "fs";
import path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "i18n", "messages");

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (isObj(v) && isObj(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function read(file: string): Record<string, unknown> {
  try {
    const p = path.join(MESSAGES_DIR, file);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    /* ignore */
  }
  return {};
}

// 回退链（从兜底到目标）：en 兜底 + 目标语言覆盖。
// zh-TW 无独立繁体文件，用 zh-CN 兜底（否则会显示英文）。
function fallbackChain(locale: string): string[] {
  if (locale === "zh-TW") return ["en", "zh-CN"];
  if (locale === "en") return ["en"];
  return ["en", locale];
}

// 按回退链做 key 级深合并：缺 key 自动用 en，本语言有则覆盖。
export function getMessages(locale: string): Record<string, unknown> {
  let merged: Record<string, unknown> = {};
  for (const loc of fallbackChain(locale)) {
    merged = deepMerge(merged, read(`${loc}.json`));
  }
  return merged;
}

export function pick(
  messages: Record<string, unknown>,
  key: string,
  fallback = ""
): string {
  const v = messages[key];
  return typeof v === "string" ? v : fallback;
}

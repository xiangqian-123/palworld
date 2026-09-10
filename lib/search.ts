import { getAllPals } from "@/lib/pal";
import { getItem, getItemSlugs } from "@/lib/items";
import { getPostsByLocale } from "@/lib/posts";
import { ELEMENT_ZH } from "@/lib/pal-labels";
import {
  palTranslations,
  itemTranslations,
  type Translation,
} from "@/lib/translations";

/**
 * 全站搜索索引。
 * 范围：Pals（id/英文名/中文名/别名）、Items（id/英文名/中文名/别名）、Guides（当前语言标题）。
 * 匹配：大小写不敏感 + 部分关键词（substring）。
 * 中文名映射来自 data/translations/*.json（独立映射层，不改英文数据源）。
 */

export interface SearchHit {
  slug: string;
  /** 英文名（数据源原生）。 */
  name: string;
  /** 中文名（翻译映射，可能为空字符串）。 */
  zhName: string;
  sub?: string;
  type: "pal" | "item" | "guide";
}

export interface SearchResult {
  pals: SearchHit[];
  items: SearchHit[];
  guides: SearchHit[];
}

/** 把 item id 转成详情页 slug（与 data/items.json 的 key 一致）。 */
function itemSlug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// 翻译匹配：命中中文名 / 别名。
function matchTranslation(
  q: string,
  zh: Translation | undefined,
  tw: Translation | undefined
): boolean {
  const names = [zh?.name, tw?.name];
  const aliases = [...(zh?.aliases ?? []), ...(tw?.aliases ?? [])];
  return (
    names.some((n) => n && n.toLowerCase().includes(q)) ||
    aliases.some((a) => a && a.toLowerCase().includes(q))
  );
}

/** 当前 locale 对应的中文名（zh-TW 用繁体，其余用简体）。 */
function zhNameFor(
  locale: string,
  zh: Translation | undefined,
  tw: Translation | undefined
): string {
  if (locale === "zh-TW") return tw?.name ?? zh?.name ?? "";
  return zh?.name ?? "";
}

export function search(query: string, locale: string): SearchResult {
  const q = query.trim().toLowerCase();
  const empty: SearchResult = { pals: [], items: [], guides: [] };
  if (!q) return empty;

  const { zh: pzh, tw: ptw } = palTranslations();

  const pals: SearchHit[] = getAllPals()
    .filter((p) => {
      if (p.slug.toLowerCase().includes(q)) return true;
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.code.toLowerCase().includes(q)) return true;
      return matchTranslation(q, pzh[p.slug], ptw[p.slug]);
    })
    .slice(0, 12)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      zhName: zhNameFor(locale, pzh[p.slug], ptw[p.slug]),
      sub:
        (p.elements ?? [])
          .map((e) => ELEMENT_ZH[e] ?? e)
          .join(" / ") || `#${p.paldexIndex}`,
      type: "pal" as const,
    }));

  const { zh: izh, tw: itw } = itemTranslations();

  const items: SearchHit[] = getItemSlugs()
    .map((slug) => ({ slug, item: getItem(slug) }))
    .filter(({ slug, item }) => {
      if (!item) return false;
      if (slug.includes(q)) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.id.toLowerCase().includes(q)) return true;
      return matchTranslation(q, izh[slug], itw[slug]);
    })
    .slice(0, 12)
    .map(({ slug, item }) => ({
      slug,
      name: item!.name,
      zhName: zhNameFor(locale, izh[slug], itw[slug]),
      sub: item!.category,
      type: "item" as const,
    }));

  const guides: SearchHit[] = getPostsByLocale(locale)
    .filter((p) => p.frontmatter.title.toLowerCase().includes(q))
    .slice(0, 8)
    .map((p) => ({
      slug: p.slug,
      name: p.frontmatter.title,
      zhName: "",
      type: "guide" as const,
    }));

  return { pals, items, guides };
}

/** 供 SearchBox 判断是否有结果（以及无结果提示）。 */
export function searchTotal(r: SearchResult): number {
  return r.pals.length + r.items.length + r.guides.length;
}

export { itemSlug };

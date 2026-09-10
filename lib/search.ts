import { getAllPals } from "@/lib/pal";
import { getItem, getItemSlugs } from "@/lib/items";
import { getPostsByLocale } from "@/lib/posts";
import { ELEMENT_ZH } from "@/lib/pal-labels";

/**
 * 全站搜索索引（STEP 2）。
 * 范围：Pals（英文名）、Items（英文名/分类）、Guides（当前语言标题）。
 * 匹配：大小写不敏感 + 部分关键词（substring）。
 * 结果按类型分组，供 SearchBox 渲染。
 */

export interface SearchHit {
  slug: string;
  name: string;
  sub?: string;
  type: "pal" | "item" | "guide";
}

export interface SearchResult {
  pals: SearchHit[];
  items: SearchHit[];
  guides: SearchHit[];
}

// 把 item id 转成详情页 slug（与 data/items.json 的 key 一致，直接用 key 更稳）。
function itemSlug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function search(query: string, locale: string): SearchResult {
  const q = query.trim().toLowerCase();
  const empty: SearchResult = { pals: [], items: [], guides: [] };
  if (!q) return empty;

  const pals: SearchHit[] = getAllPals()
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    )
    .slice(0, 12)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      sub:
        (p.elements ?? [])
          .map((e) => ELEMENT_ZH[e] ?? e)
          .join(" / ") || `#${p.paldexIndex}`,
      type: "pal",
    }));

  const items: SearchHit[] = getItemSlugs()
    .map((slug) => ({ slug, item: getItem(slug) }))
    .filter(
      ({ slug, item }) =>
        item &&
        (item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          slug.includes(q))
    )
    .slice(0, 12)
    .map(({ slug, item }) => ({
      slug,
      name: item!.name,
      sub: item!.category,
      type: "item" as const,
    }));

  const guides: SearchHit[] = getPostsByLocale(locale)
    .filter((p) => p.frontmatter.title.toLowerCase().includes(q))
    .slice(0, 8)
    .map((p) => ({
      slug: p.slug,
      name: p.frontmatter.title,
      type: "guide",
    }));

  return { pals, items, guides };
}

/** 供 SearchBox 判断是否有结果（以及无结果提示）。 */
export function searchTotal(r: SearchResult): number {
  return r.pals.length + r.items.length + r.guides.length;
}

export { itemSlug };

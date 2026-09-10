import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { buildAlternates, OG_LOCALE, websiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import ItemsBrowser from "@/components/ItemsBrowser";
import { getCategories, getItem, getItemSlugs } from "@/lib/items";

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const title = `Palworld 物品数据库 — ${siteConfig.siteName}`;
  const description =
    "Palworld 全物品数据库：武器、防具、蓝图、材料、食物与饰品——搜索、按分类筛选与排序，查看哪些 Pal 掉落。";
  return {
    title,
    description,
    alternates: buildAlternates(params.locale, "/items"),
    openGraph: {
      type: "website",
      siteName: siteConfig.siteName,
      locale: OG_LOCALE[(params.locale as Locale) ?? "zh-CN"],
      title,
      description,
      images: [siteConfig.ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

export default function ItemsIndexPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string; sort?: string };
}) {
  if (!isValidLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const categories = getCategories();
  const validCats = new Set(categories.map((c) => c.name));
  const initialCategory =
    searchParams.category && validCats.has(searchParams.category)
      ? searchParams.category
      : "all";
  const initialSort = ["name", "category", "rarity"].includes(
    searchParams.sort ?? ""
  )
    ? (searchParams.sort as string)
    : "name";

  const items = getItemSlugs()
    .map((slug) => {
      const it = getItem(slug);
      if (!it) return null;
      return {
        slug,
        name: it.name,
        category: it.category,
        rarity: it.rarity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <article className="guide">
      <JsonLd data={websiteJsonLd(locale)} />
      <header className="guide-header">
        <span className="eyebrow">Item Database</span>
        <h1>Palworld 物品数据库</h1>
        <p className="lead">
          {items.length} 件物品 · {categories.length} 个分类——搜索、筛选、排序，查看哪些 Pal 掉落。
        </p>
      </header>
      <div className="guide-body">
        <ItemsBrowser
          items={items}
          categories={categories}
          locale={locale}
          initialCategory={initialCategory}
          initialSort={initialSort}
        />
      </div>
    </article>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isValidLocale, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { buildAlternates, OG_LOCALE, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import {
  getCategories,
  getItem,
  getItemSlugs,
  categoryDisplayName,
} from "@/lib/items";

// Item 分类页：服务端渲染该分类全部 item 链接（Google 可抓取的全部内链入口）。
export const revalidate = 604800;

export function generateStaticParams() {
  return getCategories().map((c) => ({ locale: "zh-CN", category: c.name }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; category: string };
}): Metadata {
  const items = categoryItems(params.category);
  if (items.length === 0) return { title: siteConfig.defaultTitle };
  const zh = params.locale === "zh-CN" || params.locale === "zh-TW";
  const display = categoryDisplayName(params.category, zh);
  const title = zh
    ? `Palworld ${display}列表 — ${siteConfig.siteName}`
    : `Palworld ${display} Items — ${siteConfig.siteName}`;
  const description = zh
    ? `Palworld ${display}：全部 ${items.length} 件物品列表——名称、稀有度与获取方式。`
    : `All ${items.length} Palworld ${display} items — names, rarity and how to get each one.`;
  return {
    title,
    description,
    alternates: buildAlternates(
      params.locale,
      `/items/${encodeURIComponent(params.category)}`
    ),
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

/** 某分类的全部 item（slug + 名称 + 稀有度），按名称排序。 */
function categoryItems(category: string) {
  return getItemSlugs()
    .map((slug) => {
      const it = getItem(slug);
      if (!it || it.category !== category) return null;
      return { slug, name: it.name, rarity: it.rarity };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function ItemCategoryPage({
  params,
}: {
  params: { locale: string; category: string };
}) {
  if (!isValidLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const zh = locale === "zh-CN" || locale === "zh-TW";
  const items = categoryItems(params.category);
  if (items.length === 0) notFound();
  const display = categoryDisplayName(params.category, zh);

  return (
    <article className="guide">
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: siteConfig.siteName, path: "" },
          { name: "Items", path: "/items" },
          { name: display, path: `/items/${encodeURIComponent(params.category)}` },
        ])}
      />
      <header className="guide-header">
        <span className="eyebrow">Item Database</span>
        <h1>
          {zh ? `Palworld ${display}` : `Palworld ${display} Items`}
        </h1>
        <p className="lead">
          {items.length} {zh ? "件物品" : "items"} —{" "}
          {zh
            ? "按名称排序，点击查看掉落来源与用途。"
            : "sorted by name. Open any item for its drop sources and uses."}
        </p>
      </header>
      <div className="guide-body">
        <p>
          <Link href={`/${locale}/items`}>← All items</Link>
        </p>
        <div className="breed-list">
          {items.map((it) => (
            <Link
              key={it.slug}
              href={`/${locale}/item/${it.slug}`}
              className="breed-chip"
            >
              {it.name}
              {it.rarity != null && (
                <span className="drop-rate">Rarity {it.rarity}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

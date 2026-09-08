import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getItem, getItemSlugs } from "@/lib/items";
import { getBreedPal } from "@/lib/breeding";
import { type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import {
  OG_LOCALE,
  absoluteUrl,
  buildAlternates,
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

// 物品数据不随版本变动，长尾页走 ISR（只预渲染 zh-CN，其余按需生成缓存 7 天）。
export const revalidate = 604800;

export function generateStaticParams() {
  return getItemSlugs().map((slug) => ({ locale: "zh-CN", slug }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Metadata {
  const item = getItem(params.slug);
  if (!item) return { title: siteConfig.defaultTitle };
  const path = `/item/${params.slug}`;
  const title = `${item.name} — How to Get, Uses | ${siteConfig.siteName}`;
  const description = item.description
    ? `${item.name} — ${item.description.slice(0, 150)}`
    : `${item.name} in Palworld: where to find it and which Pals drop it.`;
  return {
    title,
    description,
    alternates: buildAlternates(params.locale, path),
    openGraph: {
      type: "article",
      siteName: siteConfig.siteName,
      locale: OG_LOCALE[(params.locale as Locale) ?? "zh-CN"],
      title,
      description,
      url: absoluteUrl(`/${params.locale}${path}`),
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

export default function ItemPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const item = getItem(params.slug);
  if (!item) notFound();

  const locale = params.locale as Locale;

  return (
    <article className="guide">
      <JsonLd
        data={articleJsonLd({
          locale,
          title: item.name,
          description: item.description,
          path: `/item/${params.slug}`,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: siteConfig.siteName, path: "" },
          { name: "Items", path: "/items" },
          { name: item.name, path: `/item/${params.slug}` },
        ])}
      />

      <header className="guide-header">
        <span className="eyebrow">{item.category || "Item"}</span>
        <h1>{item.name}</h1>
      </header>

      <div className="guide-body prose">
        {item.description && <p className="pal-desc">{item.description}</p>}

        <table>
          <tbody>
            <tr>
              <th>Category</th>
              <td>
                <Link href={`/${locale}/items#${item.category}`}>
                  {item.category}
                </Link>
              </td>
            </tr>
            {item.rarity != null && (
              <tr>
                <th>Rarity</th>
                <td>{item.rarity}</td>
              </tr>
            )}
            {item.price != null && (
              <tr>
                <th>Price</th>
                <td>{item.price.toLocaleString()}</td>
              </tr>
            )}
            {item.maxStack != null && (
              <tr>
                <th>Max Stack</th>
                <td>{item.maxStack}</td>
              </tr>
            )}
          </tbody>
        </table>

        {item.droppedBy.length > 0 ? (
          <>
            <h2>Dropped by</h2>
            <p>
              {item.name} drops from {item.droppedBy.length} Pal
              {item.droppedBy.length === 1 ? "" : "s"}:
            </p>
            <div className="breed-list">
              {item.droppedBy.map((d) => {
                const p = getBreedPal(d.slug);
                return (
                  <Link
                    key={d.slug}
                    href={`/${locale}/pal/${d.slug}`}
                    className="breed-chip"
                  >
                    {p?.code && (
                      <img
                        src={`/images/pals/${p.code}.png`}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    {p?.name ?? d.slug}
                    {d.rate != null && (
                      <span className="drop-rate">
                        {d.rate}% ×{d.min}
                        {d.max !== d.min ? `–${d.max}` : ""}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <p>
            {item.name} is not dropped by wild Pals — it is obtained through
            crafting or other means.
          </p>
        )}

        <p>
          <Link href={`/${locale}/items`}>← All items</Link>
        </p>
      </div>
    </article>
  );
}

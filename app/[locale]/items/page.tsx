import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getAllItems } from "@/lib/items";
import { isValidLocale, locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { buildAlternates, OG_LOCALE } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { websiteJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const title = `Palworld Items Database — ${siteConfig.siteName}`;
  const description =
    "Complete Palworld items database: materials, weapons, armor, food and schematics — where to find them and which Pals drop them.";
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
}: {
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const categories = getCategories();
  const items = getAllItems();

  const byCat = new Map<string, typeof items>();
  for (const it of items) {
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    byCat.get(it.category)!.push(it);
  }

  return (
    <article className="guide">
      <JsonLd data={websiteJsonLd(locale)} />
      <header className="guide-header">
        <span className="eyebrow">Database</span>
        <h1>Palworld Items</h1>
        <p className="lead">
          {items.length} items across {categories.length} categories — where to
          find them and which Pals drop them.
        </p>
      </header>

      <div className="guide-body prose">
        <div className="item-cat-nav">
          {categories.map((c) => (
            <a key={c.name} href={`#${c.name}`}>
              {c.name} ({c.count})
            </a>
          ))}
        </div>

        {categories.map((c) => (
          <section key={c.name} id={c.name}>
            <h2>
              {c.name} <span className="item-count">({c.count})</span>
            </h2>
            <div className="breed-list">
              {(byCat.get(c.name) ?? []).map((it) => (
                <Link
                  key={it.id}
                  href={`/${locale}/item/${slugOf(it.id)}`}
                  className="breed-chip"
                >
                  {it.name}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function slugOf(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

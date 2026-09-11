import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isValidLocale, locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { buildAlternates, OG_LOCALE, websiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import MapExplorer from "@/components/MapExplorer";
import { getMapData } from "@/lib/map";
import { palZhName } from "@/lib/translations";
import { getPal } from "@/lib/pal";

const POPULAR_MAP_PALS = [
  "anubis",
  "jetragon",
  "shadowbeak",
  "frostallion",
  "orserk",
];

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const title = `Palworld 交互地图 — ${siteConfig.siteName}`;
  const description =
    "Palworld 交互地图：Pal 刷新位置、Alpha Boss、矿石资源、基地与快速旅行点一览，缩放拖拽浏览，点击查看详情。";
  return {
    title,
    description,
    alternates: buildAlternates(params.locale, "/map"),
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

export default function MapPage({ params }: { params: { locale: string } }) {
  if (!isValidLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const zh = locale === "zh-CN" || locale === "zh-TW";

  const data = getMapData();

  const locations = data.locations.map((l) => {
    let main: string;
    let secondary: string | undefined;
    if (l.type === "pal" || l.type === "boss") {
      const zn = l.palSlug ? palZhName(l.palSlug, locale) : "";
      main = zh ? zn || l.name : l.name;
      secondary = zh ? (zn ? l.name : undefined) : zn || undefined;
    } else {
      main = zh ? l.name : l.en || l.name;
      secondary = zh ? l.en || undefined : l.name;
    }
    return {
      id: l.id,
      type: l.type,
      main,
      secondary,
      palSlug: l.palSlug,
      x: l.x,
      y: l.y,
      region: l.region,
      description: l.description,
      resourceType: l.resourceType,
    };
  });

  const catCount = (type: string) =>
    locations.filter((l) => l.type === type).length;

  const cats = [
    { type: "pal", label: zh ? "Pal 刷新点" : "Pal Spawns" },
    { type: "boss", label: zh ? "Alpha Boss" : "Alpha Bosses" },
    { type: "resource", label: zh ? "矿石资源" : "Resources" },
    { type: "base", label: zh ? "基地位置" : "Base Locations" },
    { type: "fast-travel", label: zh ? "快速旅行点" : "Fast Travel" },
  ].filter((c) => catCount(c.type) > 0);

  return (
    <article className="guide">
      <JsonLd data={websiteJsonLd(locale)} />
      <header className="guide-header">
        <span className="eyebrow">Map</span>
        <h1>Palworld 交互地图</h1>
        <p className="lead">
          按 Pal / Boss / 资源 / 基地 / 快速旅行点筛选，缩放拖拽浏览，点击查看详情。
        </p>
      </header>
      <div className="guide-body">
        <MapExplorer locations={locations} locale={locale} />

        <section className="map-section">
          <h2>{zh ? "热门位置" : "Popular Locations"}</h2>
          <div className="breed-list">
            {POPULAR_MAP_PALS.map((slug) => {
              const p = getPal(slug);
              const name = palZhName(slug, locale) || p?.name || slug;
              return (
                <Link
                  key={slug}
                  href={`/${locale}/pal/${slug}/location`}
                  className="breed-chip"
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="map-section">
          <h2>{zh ? "位置分类" : "Location Categories"}</h2>
          <div className="map-cats">
            {cats.map((c) => (
              <div className="map-cat" key={c.type}>
                <strong>{c.label}</strong>
                <span>{catCount(c.type)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

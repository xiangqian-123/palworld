import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { buildAlternates, OG_LOCALE, websiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import MapExplorer from "@/components/MapExplorer";
import { getMapData } from "@/lib/map";
import { palZhName } from "@/lib/translations";

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const title = `Palworld 地图 — ${siteConfig.siteName}`;
  const description =
    "Palworld 交互地图：Pal 刷新位置与 Alpha Boss 位置一览，点击查看每一只 Pal 的出没地点。";
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

  const data = getMapData();
  const locations = data.locations.map((l) => ({
    id: l.id,
    type: l.type,
    name: l.name,
    zhName: l.palSlug ? palZhName(l.palSlug, locale) : "",
    palSlug: l.palSlug,
    x: l.x,
    y: l.y,
  }));

  return (
    <article className="guide">
      <JsonLd data={websiteJsonLd(locale)} />
      <header className="guide-header">
        <span className="eyebrow">Map</span>
        <h1>Palworld 交互地图</h1>
        <p className="lead">
          按 Pal / Boss 筛选，查看刷新位置与 Alpha Boss 出没点，点击查看每只 Pal 的详细位置页。
        </p>
      </header>
      <div className="guide-body">
        <MapExplorer locations={locations} locale={locale} />
      </div>
    </article>
  );
}

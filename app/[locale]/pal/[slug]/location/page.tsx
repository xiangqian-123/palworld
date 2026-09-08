import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPal, getPalSlugs } from "@/lib/pal";
import {
  getPalSpawn,
  regionLabel,
  spawnBearing,
  bearingLabel,
} from "@/lib/spawn";
import { locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import {
  OG_LOCALE,
  absoluteUrl,
  buildAlternates,
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  const slugs = getPalSlugs();
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Metadata {
  const pal = getPal(params.slug);
  if (!pal) return { title: siteConfig.defaultTitle };
  const path = `/pal/${pal.slug}/location`;
  const spawn = getPalSpawn(pal.slug);
  const title = `Where to Find ${pal.name} — Spawn Location`;
  const description = spawn
    ? `${pal.name} spawns at level ${spawn.minLevel}–${spawn.maxLevel}${spawn.nightOnly ? " at night" : ""} in Palworld 1.0. Wild spawns, Alpha boss and map location.`
    : `${pal.name} has no wild spawn in Palworld 1.0 — it is obtained through breeding instead.`;
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
      images: [`/images/pals/${pal.code}.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/images/pals/${pal.code}.png`],
    },
  };
}

export default function PalLocationPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const pal = getPal(params.slug);
  if (!pal) notFound();

  const locale = params.locale as Locale;
  const spawn = getPalSpawn(pal.slug);
  const bearing =
    spawn && spawn.cx != null && spawn.cy != null
      ? spawnBearing(spawn.cx, spawn.cy)
      : null;

  return (
    <article className="guide">
      <JsonLd
        data={articleJsonLd({
          locale,
          title: `Where to Find ${pal.name}`,
          description: `Spawn locations and levels for ${pal.name} in Palworld 1.0.`,
          path: `/pal/${pal.slug}/location`,
          image: `/images/pals/${pal.code}.png`,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: siteConfig.siteName, path: "" },
          { name: "Pal Codex", path: "/guide/pals" },
          { name: pal.name, path: `/pal/${pal.slug}` },
          { name: "Location", path: `/pal/${pal.slug}/location` },
        ])}
      />

      <header className="guide-header pal-header">
        <img
          className="pal-avatar"
          src={`/images/pals/${pal.code}.png`}
          alt={pal.name}
        />
        <div className="pal-heading">
          <span className="eyebrow">Location</span>
          <h1>Where to Find {pal.name}</h1>
        </div>
      </header>

      <div className="guide-body">
        <div className="prose">
          {spawn ? (
            <>
              <p className="pal-desc">
                {pal.name} has{" "}
                <strong>
                  {spawn.count} wild spawn point{spawn.count === 1 ? "" : "s"}
                </strong>{" "}
                {bearing ? `in ${bearingLabel(bearing)}` : ""}
                {spawn.regions.includes("tree")
                  ? ", plus the World Tree"
                  : ""}
                . Wild level {spawn.minLevel}–{spawn.maxLevel}
                {spawn.nightOnly ? " (night only)" : " (day and night)"}.
              </p>
              <table>
                <tbody>
                  <tr>
                    <th>Wild Level</th>
                    <td>
                      {spawn.minLevel != null
                        ? spawn.minLevel === spawn.maxLevel
                          ? spawn.minLevel
                          : `${spawn.minLevel}–${spawn.maxLevel}`
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <th>Active</th>
                    <td>{spawn.nightOnly ? "Night only" : "Day & Night"}</td>
                  </tr>
                  <tr>
                    <th>Map</th>
                    <td>{spawn.regions.map(regionLabel).join(" & ")}</td>
                  </tr>
                  {bearing && (
                    <tr>
                      <th>Area</th>
                      <td>{bearingLabel(bearing)}</td>
                    </tr>
                  )}
                  <tr>
                    <th>Spawn Points</th>
                    <td>{spawn.count}</td>
                  </tr>
                  {spawn.hasAlpha && (
                    <tr>
                      <th>Alpha Boss</th>
                      <td>
                        Yes
                        {spawn.alphaMin != null
                          ? ` · Lv ${spawn.alphaMin === spawn.alphaMax ? spawn.alphaMin : `${spawn.alphaMin}–${spawn.alphaMax}`}`
                          : ""}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p>
                Prefer breeding over hunting? See{" "}
                <Link href={`/${locale}/pal/${pal.slug}/breeding`}>
                  how to breed {pal.name}
                </Link>{" "}
                or open the{" "}
                <Link href={`/${locale}/breeding-calculator`}>
                  breeding calculator
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <p className="pal-desc">
                {pal.name} has <strong>no wild spawn</strong> in Palworld 1.0 —
                it cannot be caught in the open world.
              </p>
              <p>
                The only way to get {pal.name} is through{" "}
                <Link href={`/${locale}/pal/${pal.slug}/breeding`}>
                  breeding
                </Link>
                . See the breeding page for every parent combination that
                produces it.
              </p>
              <p>
                <Link
                  href={`/${locale}/pal/${pal.slug}/breeding`}
                  className="btn btn-primary"
                >
                  How to Breed {pal.name}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

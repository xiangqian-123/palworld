import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPal, getPalSlugs } from "@/lib/pal";
import {
  getPalSpawn,
  getPalSpawnPoints,
  regionLabel,
  spawnBearing,
  bearingLabel,
} from "@/lib/spawn";
import { getParents, getChildren, getBreedPal } from "@/lib/breeding";
import { dropItemSlug } from "@/lib/drops";
import { getItem } from "@/lib/items";
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

// spawn 数据不随版本变动，长尾页走 ISR（只预渲染 zh-CN，其余按需生成缓存 7 天）。
export const revalidate = 604800;

export function generateStaticParams() {
  return getPalSlugs().map((slug) => ({ locale: "zh-CN", slug }));
}

// CTR 实验（2026-09-19 竞争面研究）：SERP 竞品标题=主词+2-3 价值点，裸标题是 363 曝光 0 点击的主因。
// 仅覆盖这 3 页（GSC 曝光最大），14 天 CTR 有改善再推广到模板。P0-3 Not Spawning 块/地图落地前，
// 标题只承诺页面已有模块（坐标/等级/Alpha/breeding），禁止写页面没有的东西。
const CTR_TITLE_OVERRIDES: Record<string, { title: string; description: string }> = {
  astegon: {
    title: "Where to Find Astegon – Spawns, Coordinates & Boss Level",
    description:
      "Astegon spawn locations in Palworld 1.0 with exact coordinates, level ranges and Alpha boss spawns, plus how to get Astegon through breeding.",
  },
  jormuntide: {
    title: "Jormuntide Location – Spawns, Coordinates & How to Get",
    description:
      "Jormuntide spawn locations in Palworld 1.0 with exact coordinates, level ranges and Alpha boss spawns, plus how to get Jormuntide through breeding.",
  },
  neptilius: {
    title: "Neptilius Location – Spawns, Coordinates & How to Get",
    description:
      "Neptilius spawn locations in Palworld 1.0 with exact coordinates, level ranges and Alpha boss spawns, plus how to get Neptilius through breeding.",
  },
};

export function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Metadata {
  const pal = getPal(params.slug);
  if (!pal) return { title: siteConfig.defaultTitle };
  const path = `/pal/${pal.slug}/location`;
  const spawn = getPalSpawn(pal.slug);
  const override = CTR_TITLE_OVERRIDES[pal.slug];
  const title = override?.title ?? `Where to Find ${pal.name} — Spawn Location`;
  const description =
    override?.description ??
    (spawn
      ? `${pal.name} spawns at level ${spawn.minLevel}–${spawn.maxLevel}${spawn.nightOnly ? " at night" : ""} in Palworld 1.0. Wild spawns, Alpha boss and map location.`
      : `${pal.name} has no wild spawn in Palworld 1.0 — it is obtained through breeding instead.`);
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
  const points = getPalSpawnPoints(pal.slug);
  const bearing =
    spawn && spawn.cx != null && spawn.cy != null
      ? spawnBearing(spawn.cx, spawn.cy)
      : null;

  // Other ways to get：繁殖（第一组父母组合）+ 掉落（前 5 个，映射到 item 页）。
  const parentPair = getParents(pal.slug)[0];
  const drops = (pal.drops ?? []).slice(0, 5);

  // Related Pals：能繁殖出的子代前 3 个。
  const relatedChildren = getChildren(pal.slug).slice(0, 3);

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
              <h2>Quick Answer</h2>
              <p className="pal-desc">
                {pal.name} has{" "}
                <strong>
                  {spawn.count} wild spawn point{spawn.count === 1 ? "" : "s"}
                </strong>{" "}
                {bearing ? `in ${bearingLabel(bearing)}` : ""}
                {spawn.regions.includes("tree")
                  ? ", plus additional spawns in the World Tree"
                  : ""}
                . Wild level {spawn.minLevel}–{spawn.maxLevel}
                {spawn.nightOnly ? " (night only)" : " (day and night)"}.
              </p>

              {points.length > 0 && (
                <>
                  <h2>Exact Spawn Locations</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Coordinates (X, Y)</th>
                        <th>Type</th>
                        <th>Level</th>
                        <th>Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map((p, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            {p.x}, {p.y}
                          </td>
                          <td>
                            {p.kind === "alpha"
                              ? "Alpha Boss"
                              : "Wild"}
                          </td>
                          <td>
                            {p.minLevel != null
                              ? p.minLevel === p.maxLevel
                                ? p.minLevel
                                : `${p.minLevel}–${p.maxLevel}`
                              : "—"}
                          </td>
                          <td>
                            {p.availability === "night"
                              ? "Night only"
                              : "Day & Night"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {spawn.regions.includes("tree") && (
                    <p>
                      Additional spawn points exist inside the World Tree
                      (level {spawn.minLevel}–{spawn.maxLevel}); the coordinates
                      above cover the Palpagos overworld.
                    </p>
                  )}
                </>
              )}

              {bearing && (
                <>
                  <h2>How to Reach</h2>
                  <p>
                    {pal.name} lives in{" "}
                    <strong>{bearingLabel(bearing)}</strong> of the Palpagos
                    Islands, around {spawn.regions.map(regionLabel).join(" & ")}.
                    Head to the {bearingLabel(bearing)} sector and search at the
                    coordinates listed above.
                  </p>
                </>
              )}

              <h2>{pal.name} Spawn Details</h2>
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

              {(parentPair || drops.length > 0) && (
                <>
                  <h2>Other Ways to Get {pal.name}</h2>
                  {parentPair && (
                    <p>
                      <strong>Breeding:</strong> breed{" "}
                      <Link href={`/${locale}/pal/${parentPair[0]}`}>
                        {getBreedPal(parentPair[0])?.name ?? parentPair[0]}
                      </Link>{" "}
                      with{" "}
                      <Link href={`/${locale}/pal/${parentPair[1]}`}>
                        {getBreedPal(parentPair[1])?.name ?? parentPair[1]}
                      </Link>{" "}
                      to hatch {pal.name}. See{" "}
                      <Link href={`/${locale}/pal/${pal.slug}/breeding`}>
                        every breeding combination
                      </Link>{" "}
                      or open the{" "}
                      <Link href={`/${locale}/breeding-calculator`}>
                        breeding calculator
                      </Link>
                      .
                    </p>
                  )}
                  {drops.length > 0 && (
                    <>
                      <p>
                        <strong>Drops from {pal.name}:</strong>
                      </p>
                      <ul>
                        {drops.map((d) => {
                          const itemSlug = dropItemSlug(d.item);
                          const label = itemSlug
                            ? getItem(itemSlug)?.name ?? d.name
                            : d.name;
                          return (
                            <li key={d.item}>
                              {itemSlug ? (
                                <Link href={`/${locale}/item/${itemSlug}`}>
                                  {label}
                                </Link>
                              ) : (
                                label
                              )}
                              {d.rate != null &&
                                ` (${d.rate}% ×${d.min}${d.max !== d.min ? `–${d.max}` : ""})`}
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </>
              )}

              {relatedChildren.length > 0 && (
                <>
                  <h2>Related Pals</h2>
                  <div className="breed-list">
                    {relatedChildren.map((childSlug) => (
                      <Link
                        key={childSlug}
                        href={`/${locale}/pal/${childSlug}`}
                        className="breed-chip"
                      >
                        {getBreedPal(childSlug)?.name ?? childSlug}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h2>Quick Answer</h2>
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

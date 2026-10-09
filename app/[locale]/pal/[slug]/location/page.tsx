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
import { getParents, getChildren, getBreedPal, UNBREEDABLE } from "@/lib/breeding";
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
  // 2026-10-07 第二轮：上一版标题已含价值点，但 GSC 显示该 cluster 仍 0 点击
  // （astegon/location 页面 475 曝光 0 点击、jormuntide 230/0、neptilius 191/0）。
  // 改法：标题前置 searcher 实际用的 `{Pal} Location` 词序（该页 84% 曝光含 "location"），
  // 并把三条模板化 description 换成各自真实数据（方位/等级/Alpha），避免三页 snippet 雷同。
  // 数据来源：data/pal-spawns.json + data/pals/*.json，不写页面没有的模块。
  astegon: {
    title: "Astegon Location in Palworld – Coordinates, Level & How to Breed",
    description:
      "Where is Astegon in Palworld 1.0? 22 wild spawn points in western Palpagos at level 55–80, an Alpha boss at Lv 55, plus every breeding combination.",
  },
  jormuntide: {
    title: "Jormuntide Location in Palworld – Coordinates, Level & How to Breed",
    description:
      "Where is Jormuntide in Palworld 1.0? 22 wild spawn points in central Palpagos at level 55–80, an Alpha boss at Lv 55, plus every breeding combination.",
  },
  neptilius: {
    title: "Neptilius Location in Palworld – Coordinates, Level & How to Get",
    description:
      "Where is Neptilius in Palworld 1.0? One Alpha spawn point in northern Palpagos at level 60, plus what to do when the spawn looks empty.",
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
  // 2026-10-09 第三轮：3 页 override 观察期后仍 0 点击（根因是 Authority 被 Fandom/Game8 压制，
  // 非 snippet 质量），但裸标题 `Where to Find X — Spawn Location` 无价值点、词序错，
  // 仍是 snippet 质量下限。现将已验证词序 `{Pal} Location` + 价值点推广到默认模板，
  // 让全站 200+ 页受益。默认只承诺页面必有模块（坐标/等级），Alpha/breeding 视 spawn 数据补。
  const title =
    override?.title ??
    (spawn
      ? `${pal.name} Location in Palworld – Coordinates & Levels`
      : `How to Get ${pal.name} in Palworld`);
  const description =
    override?.description ??
    (spawn
      ? `${pal.name} spawns at level ${spawn.minLevel}–${spawn.maxLevel}${spawn.nightOnly ? " at night" : ""} in Palworld 1.0. ${spawn.count} wild spawn point${spawn.count === 1 ? "" : "s"} with exact coordinates${spawn.hasAlpha ? ", plus an Alpha boss" : ""}.`
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

  // M1 variant 分组：Alpha Boss 优先展示，其次 Wild（数据来自 atlas 游戏文件，kind 字段）。
  const alphaPoints = points.filter((p) => p.kind === "alpha");
  const wildPoints = points.filter((p) => p.kind !== "alpha");

  // M3 排除项（2026-09-19 起）：只对多源验证过的 Pal 开启，验证一个加一个，默认空。
  // 例：某 Pal 被多攻略站确认"不在程序化地下城刷新"时加入 Set 并渲染反向回答句。
  const NO_DUNGEON_SPAWNS: Set<string> = new Set([]);

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
                {spawn.hasAlpha && alphaPoints.length > 0 && (
                  <>
                    {" "}
                    The Alpha boss spawns at{" "}
                    <strong>
                      {alphaPoints[0].x}, {alphaPoints[0].y}
                    </strong>
                    .
                  </>
                )}
              </p>

              {points.length > 0 && (
                <>
                  <h2>Exact Spawn Locations</h2>
                  <p>
                    Coordinates below come from the game files (Palworld 1.0).
                    {spawn.hasAlpha &&
                      wildPoints.length > 0 &&
                      " The Alpha Boss is listed first, followed by regular wild spawns."}
                  </p>
                  {alphaPoints.length > 0 && (
                    <>
                      <h3>Alpha Boss Spawn</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Coordinates (X, Y)</th>
                            <th>Level</th>
                            <th>Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alphaPoints.map((p, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>
                                {p.x}, {p.y}
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
                    </>
                  )}
                  {wildPoints.length > 0 && (
                    <>
                      <h3>Wild Spawns</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Coordinates (X, Y)</th>
                            <th>Level</th>
                            <th>Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wildPoints.map((p, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>
                                {p.x}, {p.y}
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
                    </>
                  )}
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

              <h2>{pal.name} Not Spawning? How Spawns Work</h2>
              <ul>
                <li>
                  <strong>The map icon marks the region, not the exact
                  spot:</strong> Pals roam the area around the icon — check the
                  coordinates above rather than the icon itself.
                  {spawn.hasAlpha &&
                    " Some Alpha bosses live inside caves; look for a tunnel or cave entrance near their coordinates."}
                </li>
                {spawn.hasAlpha && (
                  <li>
                    <strong>Alpha bosses respawn:</strong> after you defeat an
                    Alpha boss, it takes roughly one in-game day (about an hour
                    of real time) to respawn. If it's missing, come back later.
                  </li>
                )}
                <li>
                  <strong>Reroll wild spawns:</strong> if a wild spawn point
                  looks empty, fly away far enough for the Pals to despawn and
                  return — the group respawns on your return.
                </li>
                {NO_DUNGEON_SPAWNS.has(pal.slug) && (
                  <li>
                    <strong>Dungeons:</strong> {pal.name} does not spawn inside
                    procedural dungeons — don't waste time searching there.
                  </li>
                )}
              </ul>

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
          ) : UNBREEDABLE[pal.slug] ? (
            <>
              <h2>Quick Answer</h2>
              <p className="pal-desc">
                {pal.name} has <strong>no spawn location</strong> in Palworld
                1.0 — it is the final story boss and cannot be caught, bred or
                obtained in-game.
              </p>
              <p>
                You face {pal.name} in the main story finale; defeating it only{" "}
                <Link href={`/${locale}/pal/${pal.slug}`}>
                  registers it in your Paldeck
                </Link>
                . See the{" "}
                <Link href={`/${locale}/pal/${pal.slug}/breeding`}>
                  breeding page
                </Link>{" "}
                for why no combination produces it.
              </p>
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

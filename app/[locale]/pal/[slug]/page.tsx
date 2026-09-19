import { notFound } from "next/navigation";
import Link from "next/link";
import { getPal, getPalSlugs, getCodeName, localizePal } from "@/lib/pal";
import { getPalSpawn, regionLabel } from "@/lib/spawn";
import { dropItemSlug } from "@/lib/drops";
import {
  elementLabel,
  workLabel,
  ELEMENT_ZH,
  getElementWeaknesses,
} from "@/lib/pal-labels";
import { getParents, getBreedPal, UNBREEDABLE } from "@/lib/breeding";
import { type Locale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";
import {
  OG_LOCALE,
  absoluteUrl,
  buildAlternates,
  breadcrumbJsonLd,
  palPageJsonLd,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import type { Metadata } from "next";

function t(messages: Record<string, unknown>, key: string, fallback: string) {
  const parts = key.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p];
    else return fallback;
  }
  return typeof cur === "string" ? cur : fallback;
}

// Pal 数据基本不随版本变动，长尾页走 ISR：
// build 只预渲染默认语言（zh-CN），其余语言首次访问时生成并缓存 7 天。
export const revalidate = 604800;

export function generateStaticParams() {
  return getPalSlugs().map((slug) => ({ locale: "zh-CN", slug }));
}

// CTR 实验（2026-09-19 施工表 P1-2）：pal 详情 title 公式=主词+价值点（GSC query：
// what type is dandilord / dupin work / solenne best moveset 等）。5 slug 实验，
// 14 天 GSC CTR 有改善再推广全模板。title/description 全语言同文案（GSC 词系为 EN）。
const CTR_TITLE_OVERRIDES: Record<string, { title: string; description: string }> =
  {};
for (const s of ["dupin", "eidrolon", "solenne", "dandilord", "tocotoco"]) {
  const p = getPal(s);
  if (!p) continue;
  const weak = getElementWeaknesses(p.elements).join("/");
  const name = p.name;
  CTR_TITLE_OVERRIDES[s] = {
    title: `${name} — Type, Skills, Drops & How to Get`,
    description: `${name} is a ${p.elements.join("/")} type Pal in Palworld 1.0, weak to ${weak}. Full stats, skills, drops and how to breed ${name}.`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const pal = getPal(params.slug);
  if (!pal) return { title: siteConfig.defaultTitle };
  const localized = localizePal(pal, params.locale);
  const path = `/pal/${localized.slug}`;
  const override = CTR_TITLE_OVERRIDES[pal.slug];
  const title = override?.title ?? `${localized.name} — ${siteConfig.siteName}`;
  const description =
    override?.description ??
    (localized.description || siteConfig.defaultDescription);
  const image = `/images/pals/${localized.code}.png`;
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
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function PalPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const pal = getPal(params.slug);
  if (!pal) notFound();
  const localized = localizePal(pal, params.locale);

  const messages = getMessages(params.locale);
  const isZh = params.locale === "zh-CN" || params.locale === "zh-TW";
  const el = (en: string) => (isZh ? elementLabel(en) : en);
  const wk = (en: string) => (isZh ? workLabel(en) : en);
  const L = (key: string, fb = "") => t(messages, key, fb);

  const genderMale = pal.genderMale;
  const hasGender = genderMale != null && genderMale >= 0;

  // Best Uses 标签（数据驱动：rarity/攻击→战斗、rideSprint→骑乘、bestWork 等级→基地工作）
  const uses: { key: string; label: string; detail?: string }[] = [];
  const atk = Math.max(pal.stats?.meleeAttack ?? 0, pal.stats?.shotAttack ?? 0);
  if ((pal.rarity ?? 0) >= 8 || atk >= 130) {
    uses.push({ key: "combat", label: L("pal.combat", "Combat") });
  }
  if ((pal.speed?.rideSprint ?? 0) >= 1200) {
    uses.push({ key: "mount", label: L("pal.mount", "Mount") });
  }
  const bwLv = pal.bestWork ? (pal.workSuitabilities?.[pal.bestWork] ?? 0) : 0;
  if (pal.bestWork && bwLv >= 4) {
    uses.push({
      key: "base",
      label: L("pal.baseWorker", "Base Worker"),
      detail: `${wk(pal.bestWork)} Lv${bwLv}`,
    });
  }

  // Hero 自动 SEO 描述（元素 + 用途，数据驱动，不手写）
  const usePhrase = (key: string): string => {
    if (key === "combat") return isZh ? "后期战斗" : "late-game combat";
    if (key === "mount") return isZh ? "骑乘" : "riding";
    if (key === "base") return isZh ? "基地生产" : "base production";
    return "";
  };
  const usePhrases = uses.map((u) => usePhrase(u.key)).filter(Boolean);
  const seoDesc = (() => {
    const weakEn = getElementWeaknesses(pal.elements).join("/");
    const weakZh = getElementWeaknesses(pal.elements)
      .map((e) => ELEMENT_ZH[e] ?? e)
      .join("·");
    if (isZh) {
      const elZh = pal.elements.map((e) => ELEMENT_ZH[e] ?? e).join("·");
      const elText = elZh === "无属性" ? "无属性" : `${elZh}属性`;
      const base = `${pal.name} 是${elText} Pal，弱点为${weakZh}`;
      if (usePhrases.length === 0) return `${base}。`;
      return `${base}，适合${usePhrases.join("、")}。`;
    }
    const elEn = pal.elements.join("/");
    const base = `${pal.name} is a ${elEn}-type Pal, weak to ${weakEn}`;
    if (usePhrases.length === 0) return `${base}.`;
    return `${base}, ideal for ${usePhrases.join(" and ")}.`;
  })();

  const locale = params.locale as Locale;
  const path = `/pal/${pal.slug}`;
  const codexLabel = L("nav.pals", "Pal Codex");

  return (
    <article className="guide">
      <JsonLd
        data={palPageJsonLd({
          locale,
          name: pal.name,
          description: localized.description,
          path,
          image: `/images/pals/${pal.code}.png`,
          paldexIndex: pal.paldexIndex,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: siteConfig.siteName, path: "" },
          { name: codexLabel, path: "/guide/pals" },
          { name: pal.name, path },
        ])}
      />
      <header className="guide-header pal-header">
        <img
          className="pal-avatar"
          src={`/images/pals/${pal.code}.png`}
          alt={pal.name}
        />
        <div className="pal-heading">
          <span className="eyebrow">
            {L("pal.paldexNo", "Paldeck No.")} #{pal.paldexIndex}
            {pal.paldexSuffix || ""}
          </span>
          <h1>{pal.name}</h1>
          <div className="pal-meta">
            {pal.elements.map((e) => (
              <span key={e} className="tag">
                {el(e)}
              </span>
            ))}
            {pal.rarity != null && (
              <span className="tag">
                {L("pal.rarity", "Rarity")} {pal.rarity}
              </span>
            )}
            {pal.size && (
              <span className="tag">
                {L("pal.size", "Size")} {pal.size}
              </span>
            )}
            {hasGender && (
              <span className="tag">
                {L("pal.gender", "Gender")} ♂{genderMale}% ♀
                {100 - genderMale}%
              </span>
            )}
          </div>
          {seoDesc && <p className="pal-seo-desc">{seoDesc}</p>}
        </div>
      </header>

      <div className="guide-body prose">
        {localized.description && <p className="pal-desc">{localized.description}</p>}

        {uses.length > 0 && (
          <>
            <h2>{L("pal.bestUses", "Best Uses")}</h2>
            <div className="pal-uses">
              {uses.map((u) => (
                <span key={u.key} className={`use-chip use-${u.key}`}>
                  {u.label}
                  {u.detail && <span className="use-detail">{u.detail}</span>}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="pal-breeding-cta">
          <Link
            href={`/${params.locale}/pal/${pal.slug}/breeding`}
            className="btn btn-primary"
          >
            {L("pal.breedingCta", "How to Breed")} {pal.name}
          </Link>
          <Link
            href={`/${params.locale}/breeding-calculator`}
            className="btn btn-ghost"
          >
            {L("pal.breedingCalc", "Breeding Calculator")}
          </Link>
        </div>

        {(() => {
          const sp = getPalSpawn(pal.slug);
          if (!sp) return null;
          const regionText = sp.regions.map(regionLabel).join(" & ");
          return (
            <>
              <h2>{L("pal.location", "Where to Find")} {pal.name}</h2>
              <table>
                <tbody>
                  <tr>
                    <th>{L("pal.spawnLevel", "Wild Level")}</th>
                    <td>
                      {sp.minLevel != null
                        ? sp.minLevel === sp.maxLevel
                          ? sp.minLevel
                          : `${sp.minLevel}–${sp.maxLevel}`
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <th>{L("pal.spawnTime", "Active")}</th>
                    <td>
                      {sp.nightOnly
                        ? L("pal.nightOnly", "Night only")
                        : L("pal.dayNight", "Day & Night")}
                    </td>
                  </tr>
                  <tr>
                    <th>{L("pal.map", "Map")}</th>
                    <td>{regionText}</td>
                  </tr>
                  {sp.hasAlpha && (
                    <tr>
                      <th>{L("pal.alpha", "Alpha Boss")}</th>
                      <td>
                        {L("pal.alphaYes", "Yes")}
                        {sp.alphaMin != null
                          ? ` · Lv ${sp.alphaMin === sp.alphaMax ? sp.alphaMin : `${sp.alphaMin}–${sp.alphaMax}`}`
                          : ""}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="pal-location-link">
                <Link href={`/${params.locale}/pal/${pal.slug}/location`}>
                  {L("pal.fullLocation", "Full spawn guide →")}
                </Link>
                {" · "}
                <Link href={`/${params.locale}/map`}>
                  {L("pal.viewOnMap", "View on Map →")}
                </Link>
              </p>
            </>
          );
        })()}

        {(() => {
          // How to Get：繁殖第一组组合（getParents）+ 不可繁殖直答（UNBREEDABLE）。
          const pair = getParents(pal.slug)[0];
          const unbreedable = UNBREEDABLE[pal.slug];
          if (!pair && !unbreedable) return null;
          const aName = pair ? (getBreedPal(pair[0])?.name ?? pair[0]) : "";
          const bName = pair ? (getBreedPal(pair[1])?.name ?? pair[1]) : "";
          return (
            <>
              <h2>
                {isZh ? "如何获得" : "How to Get"} {pal.name}
              </h2>
              {unbreedable ? (
                <p>
                  {isZh
                    ? `${pal.name} 是最终剧情 Boss——Palworld 1.0 中无法捕捉，也无法繁殖。击败它只会记录到你的图鉴。`
                    : `${pal.name} is the final story boss — it cannot be caught or bred in Palworld 1.0. Defeating it only registers it in your Paldeck.`}
                </p>
              ) : (
                <p>
                  {isZh ? (
                    <>
                      让{" "}
                      <Link href={`/${params.locale}/pal/${pair![0]}`}>{aName}</Link>{" "}
                      与{" "}
                      <Link href={`/${params.locale}/pal/${pair![1]}`}>{bName}</Link>{" "}
                      繁殖可孵出 {pal.name}。查看{" "}
                      <Link href={`/${params.locale}/pal/${pal.slug}/breeding`}>
                        全部繁殖组合
                      </Link>
                      。
                    </>
                  ) : (
                    <>
                      Breed{" "}
                      <Link href={`/${params.locale}/pal/${pair![0]}`}>{aName}</Link>{" "}
                      with{" "}
                      <Link href={`/${params.locale}/pal/${pair![1]}`}>{bName}</Link>{" "}
                      to hatch {pal.name}. See{" "}
                      <Link href={`/${params.locale}/pal/${pal.slug}/breeding`}>
                        every breeding combination
                      </Link>
                      .
                    </>
                  )}
                </p>
              )}
            </>
          );
        })()}

        {pal.stats && (
          <>
            <h2>{L("pal.stats", "Base Stats")}</h2>
            <table>
              <thead>
                <tr>
                  <th>{L("pal.statHp", "HP")}</th>
                  <th>{L("pal.statMelee", "Melee Attack")}</th>
                  <th>{L("pal.statShot", "Shot Attack")}</th>
                  <th>{L("pal.statDefense", "Defense")}</th>
                  <th>{L("pal.statSupport", "Support")}</th>
                  <th>{L("pal.statCraft", "Craft Speed")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{pal.stats.hp}</td>
                  <td>{pal.stats.meleeAttack}</td>
                  <td>{pal.stats.shotAttack}</td>
                  <td>{pal.stats.defense}</td>
                  <td>{pal.stats.support}</td>
                  <td>{pal.stats.craftSpeed}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {pal.workSuitabilities &&
          Object.keys(pal.workSuitabilities).length > 0 && (
            <>
              <h2>{L("pal.work", "Work Suitability")}</h2>
              <table>
                <thead>
                  <tr>
                    <th>{L("pal.workType", "Work Type")}</th>
                    <th>{L("pal.level", "Level")}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pal.workSuitabilities).map(([k, v]) => (
                    <tr key={k}>
                      <td>{wk(k)}</td>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

        {pal.partnerSkill && (
          <>
            <h2>{L("pal.partnerSkill", "Partner Skill")}</h2>
            <p>
              <strong>{localized.partnerSkill}</strong>
            </p>
            {pal.partnerSkillScaling?.map((s) => (
              <p key={s.label}>
                {s.label}: {s.values.join(" / ")}
              </p>
            ))}
          </>
        )}

        {pal.moves && pal.moves.length > 0 && (
          <>
            <h2>{L("pal.moves", "Active Skills")}</h2>
            <table>
              <thead>
                <tr>
                  <th>{L("pal.moveLevel", "Lv")}</th>
                  <th>{L("pal.moveName", "Move")}</th>
                  <th>{L("pal.moveElement", "Element")}</th>
                  <th>{L("pal.movePower", "Power")}</th>
                  <th>{L("pal.moveCooldown", "Cooldown")}</th>
                  <th>{L("pal.moveCategory", "Type")}</th>
                </tr>
              </thead>
              <tbody>
                {pal.moves.map((m, i) => (
                  <tr key={i}>
                    <td>{m.level}</td>
                    <td>{m.name}</td>
                    <td>{el(m.element)}</td>
                    <td>{m.power}</td>
                    <td>{m.cooldown}s</td>
                    <td>{m.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {pal.eggMoves && pal.eggMoves.length > 0 && (
          <>
            <h2>{L("pal.eggMoves", "Egg Moves")}</h2>
            <p>{pal.eggMoves.join("、")}</p>
          </>
        )}

        {pal.drops && pal.drops.length > 0 && (
          <>
            <h2>{L("pal.drops", "Drops")}</h2>
            <table>
              <thead>
                <tr>
                  <th>{L("pal.dropItem", "Item")}</th>
                  <th>{L("pal.dropRate", "Rate")}</th>
                  <th>{L("pal.dropAmount", "Amount")}</th>
                </tr>
              </thead>
              <tbody>
                {pal.drops.map((d, i) => {
                  const slug = dropItemSlug(d.item);
                  return (
                    <tr key={i}>
                      <td>
                        {slug ? (
                          <Link href={`/${params.locale}/item/${slug}`}>
                            {d.name}
                          </Link>
                        ) : (
                          d.name
                        )}
                      </td>
                      <td>{d.rate}%</td>
                      <td>
                        {d.min}
                        {d.max !== d.min ? `-${d.max}` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {pal.speed && (
          <>
            <h2>{L("pal.speed", "Speed")}</h2>
            <table>
              <thead>
                <tr>
                  <th>{L("pal.speedWalk", "Walk")}</th>
                  <th>{L("pal.speedRun", "Run")}</th>
                  <th>{L("pal.speedRide", "Ride Sprint")}</th>
                  <th>{L("pal.speedTransport", "Transport")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{pal.speed.walk}</td>
                  <td>{pal.speed.run}</td>
                  <td>{pal.speed.rideSprint}</td>
                  <td>{pal.speed.transport}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {(pal.captureRate != null || pal.price != null) && (
          <>
            <h2>{L("pal.captureRate", "Capture Rate")}</h2>
            <p>
              {pal.captureRate != null && (
                <>
                  {L("pal.captureRate", "Capture Rate")}: {pal.captureRate}
                </>
              )}
              {pal.price != null && (
                <> · {L("pal.price", "Price")}: {pal.price}</>
              )}
            </p>
          </>
        )}

        {pal.breedsInto && pal.breedsInto.length > 0 && (
          <>
            <h2>{L("pal.breedsInto", "Breeds Into")}</h2>
            <p>
              {pal.breedsInto
                .map((b) => `${b.partner} → ${getCodeName(b.child)}`)
                .join("、")}
            </p>
          </>
        )}

        <h2>{L("pal.related", "Related")}</h2>
        <div className="breed-list related-list">
          <Link
            href={`/${params.locale}/pal/${pal.slug}/breeding`}
            className="breed-chip"
          >
            {L("pal.breedingCta", "How to Breed")} {pal.name}
          </Link>
          <Link
            href={`/${params.locale}/pal/${pal.slug}/location`}
            className="breed-chip"
          >
            {L("pal.location", "Where to Find")} {pal.name}
          </Link>
          <Link
            href={`/${params.locale}/breeding-calculator`}
            className="breed-chip"
          >
            {L("pal.breedingCalc", "Breeding Calculator")}
          </Link>
          <Link href={`/${params.locale}/pals`} className="breed-chip">
            {L("nav.pals", "Pal Codex")}
          </Link>
        </div>
      </div>
    </article>
  );
}

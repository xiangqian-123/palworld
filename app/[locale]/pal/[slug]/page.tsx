import { notFound } from "next/navigation";
import { getPal, getPalSlugs, getCodeName } from "@/lib/pal";
import { elementLabel, workLabel } from "@/lib/pal-labels";
import { locales } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";
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

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const pal = getPal(params.slug);
  if (!pal) return { title: siteConfig.defaultTitle };
  return {
    title: `${pal.name} — ${siteConfig.siteName}`,
    description: pal.description || siteConfig.defaultDescription,
    alternates: {
      canonical: `${siteConfig.siteUrl}/${params.locale}/pal/${pal.slug}`,
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

  const messages = getMessages(params.locale);
  const isZh = params.locale === "zh-CN" || params.locale === "zh-TW";
  const el = (en: string) => (isZh ? elementLabel(en) : en);
  const wk = (en: string) => (isZh ? workLabel(en) : en);
  const L = (key: string, fb = "") => t(messages, key, fb);

  const genderMale = pal.genderMale;
  const hasGender = genderMale != null && genderMale >= 0;

  return (
    <article className="guide">
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
        </div>
      </header>

      <div className="guide-body prose">
        {pal.description && <p className="pal-desc">{pal.description}</p>}

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
              <strong>{pal.partnerSkill}</strong>
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
                {pal.drops.map((d, i) => (
                  <tr key={i}>
                    <td>{d.name}</td>
                    <td>{d.rate}%</td>
                    <td>
                      {d.min}
                      {d.max !== d.min ? `-${d.max}` : ""}
                    </td>
                  </tr>
                ))}
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
      </div>
    </article>
  );
}

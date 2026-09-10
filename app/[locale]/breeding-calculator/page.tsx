import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { buildAlternates, OG_LOCALE, websiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { getBreedingData } from "@/lib/breeding";
import BreedingCalculator from "@/components/BreedingCalculator";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const title = `Palworld 养殖计算器（1.0）— ${siteConfig.siteName}`;
  const description =
    "Palworld 养殖计算器：选择两只父母 Pal 查找后代，或选择目标 Pal 反查所有父母组合。基于 1.0 CombiRank 公式与全部特殊配方。";
  return {
    title,
    description,
    alternates: buildAlternates(params.locale, "/breeding-calculator"),
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

const POPULAR_BREEDS = [
  "anubis",
  "jetragon",
  "shadowbeak",
  "orserk",
  "frostallion",
  "lyleen",
];

// 热门查询的显示名（与 data/pals 的英文名一致）。
const POPULAR_NAMES: Record<string, string> = {
  anubis: "Anubis",
  jetragon: "Jetragon",
  shadowbeak: "Shadowbeak",
  orserk: "Orserk",
  frostallion: "Frostallion",
  lyleen: "Lyleen",
};

export default function BreedingCalculatorPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) notFound();
  const data = getBreedingData();
  const locale = params.locale;
  const zh = locale === "zh-CN" || locale === "zh-TW";

  const T = {
    eyebrow: zh ? "养殖" : "Breeding",
    h1: zh ? "Palworld 养殖计算器" : "Palworld Breeding Calculator",
    lead: zh
      ? "选择两只父母 Pal 查找后代，或选择目标 Pal 查找所有可用父母组合——基于 1.0 CombiRank 公式与全部特殊配方。"
      : "Pick two parents to find their child, or pick a target Pal to see every parent combination — based on the verified 1.0 CombiRank formula and all special override combos.",
    howToTitle: zh ? "如何使用" : "How to Use",
    howToSteps: zh
      ? [
          "选择模式：Find Child（两只父母查后代）或 Find Parents（目标 Pal 反查父母组合）。",
          "从下拉框选择 Pal，结果会实时显示。",
          "点击结果中的 Pal 名称，跳转到对应 Pal 详情页查看更多数据。",
        ]
      : [
          "Pick a mode: Find Child (two parents → child) or Find Parents (target Pal → all parent combos).",
          "Select Pals from the dropdowns — results appear instantly.",
          "Click any Pal name to open its full detail page.",
        ],
    popularTitle: zh ? "热门养殖查询" : "Popular Breeding Lookups",
    mechanicTitle: zh ? "Palworld 养殖机制" : "How Palworld Breeding Works",
    mechanics: zh
      ? [
          ["父母组合", "每两只 Pal 有一个确定的繁殖结果。特殊配方优先于公式计算。"],
          ["蛋", "两只 Pal 在养殖场繁殖会产下一颗蛋，孵化出后代。"],
          ["被动继承", "父母的被动技能会概率遗传给后代，用于培育理想被动组合。"],
          ["突变", "1.0 新增 Pal 觉醒与突变系统，可改变 Pal 的形态与属性。"],
          ["特殊组合", "部分 Pal 只能通过特定父母组合繁殖（绕过公式），传奇 Pal 只能同种自交。"],
        ]
      : [
          ["Parent combinations", "Every pair of Pals has a fixed child. Special overrides take priority over the formula."],
          ["Egg", "Two Pals breed an egg at the breeding farm, which hatches into the offspring."],
          ["Passive inheritance", "Parent passives can pass down to offspring — used to breed ideal passive sets."],
          ["Mutation", "The 1.0 Pal awakening & mutation system can alter a Pal's form and stats."],
          ["Special combinations", "Some Pals only come from specific parents (bypassing the formula); legendary Pals breed only with themselves."],
        ],
    breedingGuideLink: zh ? "查看养殖攻略 →" : "Read the Breeding Guide →",
    faqTitle: zh ? "常见问题" : "FAQ",
    faqs: zh
      ? [
          ["如何繁殖出 Anubis？", "使用 Vanwyrn + Cinnamoth 这个特殊配方即可稳定获得 Anubis。"],
          ["如何繁殖出 Jetragon？", "Jetragon 是传奇 Pal，只能通过 Jetragon + Jetragon 同种自交获得。"],
          ["传奇 Pal 能和其它 Pal 繁殖吗？", "不能。Jetragon、Frostallion、Shadowbeak 等传奇/塔 BOSS 只能同种自交，不参与普通公式。"],
          ["如何让后代继承想要的被动技能？", "把带有目标被动的父母放进养殖场，被动会概率遗传给后代，多代筛选即可固定组合。"],
        ]
      : [
          ["How do I breed Anubis?", "Use the special combo Vanwyrn + Cinnamoth to reliably get Anubis."],
          ["How do I breed Jetragon?", "Jetragon is a legendary Pal — only Jetragon + Jetragon (same-species) produces it."],
          ["Can legendary Pals breed with other Pals?", "No. Legendary/tower bosses like Jetragon, Frostallion and Shadowbeak only breed with their own species."],
          ["How do I pass down passive skills?", "Breed parents carrying the desired passive — it passes to offspring probabilistically; filter over generations to lock it in."],
        ],
    dataVersionLabel: zh ? "数据版本" : "Data version",
    lastUpdatedLabel: zh ? "最后更新" : "Last updated",
  };

  return (
    <article className="guide">
      <JsonLd data={websiteJsonLd(locale as Locale)} />
      <header className="guide-header">
        <span className="eyebrow">{T.eyebrow}</span>
        <h1>{T.h1}</h1>
        <p className="lead">{T.lead}</p>
      </header>

      <div className="guide-body">
        <BreedingCalculator
          pals={data.pals}
          overrides={data.overrides}
          locale={locale}
        />

        <section className="breed-info">
          <h2>{T.howToTitle}</h2>
          <ol className="breed-steps">
            {T.howToSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>

        <section className="breed-info">
          <h2>{T.popularTitle}</h2>
          <div className="breed-list">
            {POPULAR_BREEDS.map((slug) => (
              <Link
                key={slug}
                href={`/${locale}/pal/${slug}/breeding`}
                className="breed-chip"
              >
                {POPULAR_NAMES[slug] ?? slug}
              </Link>
            ))}
          </div>
        </section>

        <section className="breed-info">
          <h2>{T.mechanicTitle}</h2>
          <dl className="breed-mech">
            {T.mechanics.map(([k, v], i) => (
              <div key={i} className="breed-mech-row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="breed-cta">
            <Link href={`/${locale}/guide/breeding`}>{T.breedingGuideLink}</Link>
          </p>
        </section>

        <section className="breed-info">
          <h2>{T.faqTitle}</h2>
          {T.faqs.map(([q, a], i) => (
            <div key={i} className="breed-faq">
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </section>

        <p className="breed-version">
          {T.dataVersionLabel}: {siteConfig.dataVersion} · {T.lastUpdatedLabel}:{" "}
          {siteConfig.dataUpdatedAt}
        </p>
      </div>
    </article>
  );
}

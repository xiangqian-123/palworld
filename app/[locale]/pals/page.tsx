import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { buildAlternates, OG_LOCALE, websiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PalCodex from "@/components/PalCodex";
import { getAllPals, getPalSlugs } from "@/lib/pal";

const VALID_ELEMENTS = [
  "Neutral",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Ice",
  "Ground",
  "Dark",
  "Dragon",
];

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const title = `Palworld Pal 图鉴 — ${siteConfig.siteName}`;
  const description =
    "Palworld 全 Pal 图鉴：按元素、攻击力、防御力筛选与排序，查找每一只 Pal 的属性、工作适性、技能与养殖信息。";
  return {
    title,
    description,
    alternates: buildAlternates(params.locale, "/pals"),
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

export default function PalsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { element?: string; sort?: string };
}) {
  if (!isValidLocale(params.locale)) notFound();
  const locale = params.locale as Locale;

  const initialElement = VALID_ELEMENTS.includes(searchParams.element ?? "")
    ? (searchParams.element as string)
    : "all";
  const initialSort = ["paldex", "name", "attack", "defense"].includes(
    searchParams.sort ?? ""
  )
    ? (searchParams.sort as string)
    : "paldex";

  const pals = getAllPals().map((p) => ({
    slug: p.slug,
    name: p.name,
    code: p.code,
    paldexIndex: p.paldexIndex,
    elements: p.elements ?? [],
    attack: p.stats?.meleeAttack ?? null,
    defense: p.stats?.defense ?? null,
  }));

  return (
    <article className="guide">
      <JsonLd data={websiteJsonLd(locale)} />
      <header className="guide-header">
        <span className="eyebrow">Pal Codex</span>
        <h1>Palworld Pal 图鉴</h1>
        <p className="lead">
          {getPalSlugs().length} 只 Pal · 按元素筛选、按编号/名称/攻击/防御排序，点击查看属性、工作适性、技能与养殖信息。
        </p>
      </header>
      <div className="guide-body">
        <PalCodex
          pals={pals}
          locale={locale}
          initialElement={initialElement}
          initialSort={initialSort}
        />
      </div>
    </article>
  );
}

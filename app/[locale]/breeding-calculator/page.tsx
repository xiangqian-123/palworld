import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { buildAlternates, OG_LOCALE } from "@/lib/seo";
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
  const title = `Palworld Breeding Calculator 1.0 — ${siteConfig.siteName}`;
  const description =
    "Palworld breeding calculator: pick two parents to find their child, or pick a target Pal to see every parent combination. Based on the 1.0 CombiRank formula and all special override combos.";
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

export default function BreedingCalculatorPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) notFound();
  const data = getBreedingData();

  return (
    <article className="guide">
      <header className="guide-header">
        <span className="eyebrow">Breeding</span>
        <h1>Palworld Breeding Calculator</h1>
        <p className="lead">
          Pick two parents to find their child, or pick a target Pal to see
          every parent combination — based on the verified 1.0 CombiRank formula
          and all special override combos.
        </p>
      </header>
      <div className="guide-body">
        <BreedingCalculator
          pals={data.pals}
          overrides={data.overrides}
          locale={params.locale}
        />
      </div>
    </article>
  );
}

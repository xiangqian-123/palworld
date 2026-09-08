import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPal, getPalSlugs } from "@/lib/pal";
import { getParents, getChildren, getBreedPal } from "@/lib/breeding";
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
  const path = `/pal/${pal.slug}/breeding`;
  const title = `How to Breed ${pal.name} in Palworld — Breeding Guide`;
  const description = `Every parent combination that breeds ${pal.name} in Palworld 1.0, plus what ${pal.name} breeds into. Verified CombiRank formula and special combos.`;
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

export default function PalBreedingPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const pal = getPal(params.slug);
  if (!pal) notFound();

  const locale = params.locale as Locale;
  const parents = getParents(pal.slug);
  const children = getChildren(pal.slug);
  const breedTrue =
    parents.length === 1 && parents[0][0] === pal.slug && parents[0][1] === pal.slug;

  // 解析 parent slug → 名称（复用 breeding 的内存缓存）。
  const seen = new Map<string, { name: string; code: string }>();
  const meta = (slug: string) => {
    if (!seen.has(slug)) {
      const p = getBreedPal(slug);
      seen.set(slug, p ? { name: p.name, code: p.code } : { name: slug, code: "" });
    }
    return seen.get(slug)!;
  };

  // 把自交组合排最前，其余按 parent 名排序。
  const sortedParents = [...parents].sort((x, y) => {
    const xs = x[0] === pal.slug && x[1] === pal.slug ? 0 : 1;
    const ys = y[0] === pal.slug && y[1] === pal.slug ? 0 : 1;
    return xs - ys || meta(x[0]).name.localeCompare(meta(y[0]).name);
  });

  const childMeta = (slug: string) => {
    const p = getBreedPal(slug);
    return p ? { name: p.name, code: p.code } : { name: slug, code: "" };
  };

  return (
    <article className="guide">
      <JsonLd
        data={articleJsonLd({
          locale,
          title: `How to Breed ${pal.name}`,
          description: `Every parent combination that breeds ${pal.name} in Palworld 1.0.`,
          path: `/pal/${pal.slug}/breeding`,
          image: `/images/pals/${pal.code}.png`,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: siteConfig.siteName, path: "" },
          { name: "Pal Codex", path: "/guide/pals" },
          { name: pal.name, path: `/pal/${pal.slug}` },
          { name: "Breeding", path: `/pal/${pal.slug}/breeding` },
        ])}
      />

      <header className="guide-header pal-header">
        <img
          className="pal-avatar"
          src={`/images/pals/${pal.code}.png`}
          alt={pal.name}
        />
        <div className="pal-heading">
          <span className="eyebrow">Breeding</span>
          <h1>How to Breed {pal.name}</h1>
          <p className="lead">
            {breedTrue
              ? `${pal.name} only breeds true — pair two ${pal.name} together to get another ${pal.name}.`
              : `${parents.length} parent combination${
                  parents.length === 1 ? "" : "s"
                } produce ${pal.name} in Palworld 1.0.`}
          </p>
        </div>
      </header>

      <div className="guide-body">
        <div className="prose">
          <h2>Parents that breed {pal.name}</h2>
          <p>
            Results use the verified Palworld 1.0 formula —{" "}
            <code>floor((rankA + rankB + 1) / 2)</code> — plus all special
            override combos. Pair any two Pals below in a Breeding Farm with a
            Cake to hatch {pal.name}.
          </p>
          <div className="breed-list">
            {sortedParents.map(([a, b], i) => {
              const ma = meta(a);
              const mb = meta(b);
              return (
                <div className="breed-pair" key={i}>
                  <Link href={`/${locale}/pal/${a}`} className="breed-chip">
                    {ma.code && (
                      <img src={`/images/pals/${ma.code}.png`} alt="" loading="lazy" />
                    )}
                    {ma.name}
                  </Link>
                  <span className="breed-x">+</span>
                  <Link href={`/${locale}/pal/${b}`} className="breed-chip">
                    {mb.code && (
                      <img src={`/images/pals/${mb.code}.png`} alt="" loading="lazy" />
                    )}
                    {mb.name}
                  </Link>
                </div>
              );
            })}
          </div>

          {children.length > 0 && (
            <>
              <h2>What {pal.name} breeds into</h2>
              <p>
                {pal.name} can be used as a parent to breed {children.length}{" "}
                different Pals:
              </p>
              <div className="breed-list">
                {children.map((slug) => {
                  const m = childMeta(slug);
                  return (
                    <Link
                      href={`/${locale}/pal/${slug}`}
                      className="breed-chip"
                      key={slug}
                    >
                      {m.code && (
                        <img src={`/images/pals/${m.code}.png`} alt="" loading="lazy" />
                      )}
                      {m.name}
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          <p className="breed-cta">
            <Link href={`/${locale}/breeding-calculator`}>
              Open the full Breeding Calculator →
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
}

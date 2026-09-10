import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";
import { OG_LOCALE, buildAlternates, websiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import SearchBox from "@/components/SearchBox";
import { getPal, getPalSlugs } from "@/lib/pal";
import { getItemSlugs, getCategories } from "@/lib/items";
import { getPost } from "@/lib/posts";
import { ELEMENT_ZH } from "@/lib/pal-labels";

const HERO_IMG = "/images/guides/ss-16.jpg";
const ABOUT_IMG = "/images/guides/ss-17.jpg";

// 热门 Pal（8 个高价值 Pal，slug 与 data/pals 一致）。
const POPULAR_PAL_SLUGS = [
  "anubis",
  "jetragon",
  "shadowbeak",
  "frostallion",
  "orserk",
  "lyleen",
  "bellanoir",
  "grizzbolt",
];

// 首页攻略模块只展示主要攻略。
const GUIDE_SLUGS = [
  "beginner",
  "base",
  "world-tree",
  "endgame",
  "passives",
  "breeding",
];

// 1.0 模块展示真实存在的页面。
const V1_SLUGS = ["world-tree", "new-pals", "materials", "breeding"];

// 物品数据库首页展示的主要分类（真实 category 值）。
const ITEM_CAT_ICONS: Record<string, string> = {
  Blueprint: "📐",
  Weapon: "⚔️",
  Armor: "🛡️",
  Material: "🧱",
  Food: "🍖",
  Accessory: "💍",
};
const ITEM_CAT_ORDER = [
  "Blueprint",
  "Weapon",
  "Armor",
  "Material",
  "Food",
  "Accessory",
];

type Card = { title: string; desc: string; slug: string };
type ExploreCard = {
  title: string;
  countLabel?: string;
  desc: string;
  cta: string;
  href: string;
};

function t(messages: Record<string, unknown>, path: string, fb = ""): string {
  const v = path
    .split(".")
    .reduce<unknown>(
      (cur, k) =>
        cur && typeof cur === "object"
          ? (cur as Record<string, unknown>)[k]
          : undefined,
      messages
    );
  return typeof v === "string" ? v : fb;
}

function arr(messages: Record<string, unknown>, path: string): string[] {
  const v = path
    .split(".")
    .reduce<unknown>(
      (cur, k) =>
        cur && typeof cur === "object"
          ? (cur as Record<string, unknown>)[k]
          : undefined,
      messages
    );
  return Array.isArray(v) ? (v as string[]) : [];
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const m = getMessages(params.locale);
  const description = t(m, "hero.subtitle", siteConfig.defaultDescription);
  return {
    title: siteConfig.defaultTitle,
    description,
    alternates: buildAlternates(params.locale, ""),
    openGraph: {
      type: "website",
      siteName: siteConfig.siteName,
      locale: OG_LOCALE[(params.locale as Locale) ?? "zh-CN"],
      title: siteConfig.defaultTitle,
      description,
      images: [siteConfig.ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.defaultTitle,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isValidLocale(params.locale)) notFound();
  const m = getMessages(params.locale);
  const locale = params.locale;
  const zh = locale === "zh-CN" || locale === "zh-TW";

  // 数据源（统一数量，动态读取，不写死）。
  const palCount = getPalSlugs().length;
  const itemCount = getItemSlugs().length;
  const categories = getCategories();
  const catMap = new Map(categories.map((c) => [c.name, c.count]));
  const popularPals = POPULAR_PAL_SLUGS.map((s) => getPal(s)).filter(
    (p): p is NonNullable<ReturnType<typeof getPal>> => p !== null
  );

  const trendingCards = ((m.trending as { cards?: Card[] } | undefined)?.cards) ?? [];
  const exploreCards =
    ((m.explore as { cards?: ExploreCard[] } | undefined)?.cards) ?? [];

  // guide 标题（多语言自动，按 slug 取当前语言标题）。
  const guideTitle = (slug: string) =>
    getPost(locale, slug)?.frontmatter.title ?? slug;

  const statsLine = `${palCount} ${t(m, "hero.statPalsLabel", "Pals")} · ${itemCount.toLocaleString()} ${t(m, "hero.statItemsLabel", "Items")} · ${t(m, "hero.statUpdated", "Updated for Palworld 1.0")}`;

  const countFor = (href: string): number | null =>
    href === "/pals" ? palCount : href === "/items" ? itemCount : null;

  return (
    <>
      <JsonLd data={websiteJsonLd(locale as Locale)} />

      {/* 1. Hero + Global Search */}
      <section
        className="hero hero-bg"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
      >
        <div className="container">
          <div className="hero-copy" style={{ maxWidth: 760 }}>
            <span className="eyebrow">{t(m, "hero.eyebrow", "Palworld Database + Tools + Wiki")}</span>
            <h1>{t(m, "hero.title", "Palworld Wiki")}</h1>
            <p className="desc">{t(m, "hero.subtitle")}</p>
            <div className="hero-stats">
              <span className="stat">{statsLine}</span>
            </div>

            <SearchBox locale={locale} />

            <div className="hero-actions hero-actions-home">
              <Link className="btn btn-primary" href={`/${locale}/pals`}>
                {t(m, "hero.ctaPals", "浏览 Pal 图鉴")}
              </Link>
              <Link className="btn btn-ghost" href={`/${locale}/breeding-calculator`}>
                {t(m, "hero.ctaBreeding", "养殖计算器")}
              </Link>
              <Link className="btn btn-ghost" href={`/${locale}/map`}>
                {t(m, "hero.ctaMap", "探索地图")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 当前热门 */}
      <section className="section">
        <div className="container">
          <h2>{t(m, "trending.title", "当前热门")}</h2>
          <div className="trending-grid">
            {trendingCards.map((c) => (
              <Link
                key={c.slug}
                className="trending-card"
                href={`/${locale}/guide/${c.slug}`}
              >
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 探索 Palworld：四张核心功能卡 */}
      <section className="section section-alt">
        <div className="container">
          <h2>{t(m, "explore.title", "探索 Palworld")}</h2>
          <div className="explore-grid">
            {exploreCards.map((c) => {
              const n = countFor(c.href);
              return (
                <Link
                  key={c.href}
                  className="explore-card"
                  href={`/${locale}${c.href}`}
                >
                  {n !== null && c.countLabel ? (
                    <div className="explore-count">
                      {n.toLocaleString()} {c.countLabel}
                    </div>
                  ) : null}
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <span className="explore-cta">{c.cta}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. 热门 Pal */}
      <section className="section">
        <div className="container">
          <h2>{t(m, "popularPals.title", "热门 Pal")}</h2>
          <div className="pop-pal-grid">
            {popularPals.map((p) => {
              const els = (p.elements ?? [])
                .map((e) => (zh ? ELEMENT_ZH[e] ?? e : e))
                .join(" / ");
              return (
                <Link
                  key={p.slug}
                  className="pop-pal"
                  href={`/${locale}/pal/${p.slug}`}
                >
                  <img
                    src={`/images/pals/${p.code}.png`}
                    alt={p.name}
                    loading="lazy"
                    width={72}
                    height={72}
                  />
                  <div className="pop-pal-info">
                    <h3>{p.name}</h3>
                    <span className="pop-pal-meta">
                      {els} · #{p.paldexIndex}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="module-more">
            <Link className="btn btn-ghost" href={`/${locale}/pals`}>
              {t(m, "popularPals.viewAll", "查看全部 Pal →")}
            </Link>
          </div>
        </div>
      </section>

      {/* 5. 物品数据库 */}
      <section className="section section-alt">
        <div className="container">
          <h2>{t(m, "itemsDb.title", "物品数据库")}</h2>
          <p className="lead">
            {itemCount.toLocaleString()} {t(m, "hero.statItemsLabel", "Items")}
          </p>
          <div className="item-cat-grid">
            {ITEM_CAT_ORDER.map((cat) => (
              <Link
                key={cat}
                className="item-cat-card"
                href={`/${locale}/items?category=${cat}`}
              >
                <span className="item-cat-icon">
                  {ITEM_CAT_ICONS[cat] ?? "📦"}
                </span>
                <div>
                  <h3>{t(m, `cat.${cat}`, cat)}</h3>
                  <span className="item-cat-count">
                    {catMap.get(cat) ?? 0} {t(m, "hero.statItemsLabel", "Items")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="module-more">
            <Link className="btn btn-ghost" href={`/${locale}/items`}>
              {t(m, "itemsDb.browseAll", "浏览全部物品 →")}
            </Link>
          </div>
        </div>
      </section>

      {/* 6. 攻略 */}
      <section className="section">
        <div className="container">
          <h2>{t(m, "guidesHome.title", "攻略")}</h2>
          <div className="guide-links-grid">
            {GUIDE_SLUGS.map((slug) => (
              <Link
                key={slug}
                className="guide-link-card"
                href={`/${locale}/guide/${slug}`}
              >
                {guideTitle(slug)}
              </Link>
            ))}
          </div>
          <div className="module-more">
            <Link className="btn btn-ghost" href={`/${locale}/guide/beginner`}>
              {t(m, "guidesHome.viewAll", "查看全部攻略 →")}
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Palworld 1.0 */}
      <section className="section section-alt">
        <div className="container">
          <h2>{t(m, "v1.title", "Palworld 1.0")}</h2>
          <p className="lead">{t(m, "v1.lead")}</p>
          <div className="guide-links-grid">
            {V1_SLUGS.map((slug) => (
              <Link
                key={slug}
                className="guide-link-card"
                href={`/${locale}/guide/${slug}`}
              >
                {guideTitle(slug)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. 什么是 Palworld（下移） */}
      <section className="section">
        <div className="container about-grid">
          <div className="about-art">
            <img src={ABOUT_IMG} alt="Palworld 中的 Pal 幻兽" loading="lazy" />
          </div>
          <div className="about-copy">
            <h2>{t(m, "about.title", "What is Palworld")}</h2>
            {arr(m, "about.paragraphs").map((p, i) => (
              <p className="lead" key={i}>
                {p}
              </p>
            ))}
            <table className="fact-table">
              <tbody>
                {(((m.about as { facts?: { label: string; value: string }[] } | undefined)?.facts) ?? []).map(
                  (f) => (
                    <tr key={f.label}>
                      <th>{f.label}</th>
                      <td>{f.value}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 9. 官方预告片（下移） */}
      <section className="section section-alt">
        <div className="container">
          <h2>{t(m, "trailer.title", "Official Trailer")}</h2>
          <p className="lead">{t(m, "trailer.lead")}</p>
          <div className="video">
            <iframe
              src="https://www.youtube.com/embed/1fpGg9wNM9A"
              title="Palworld 1.0 Official Launch Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}

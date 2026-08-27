import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";

type Card = { title: string; desc: string; slug: string; img?: string };
type Fact = { label: string; value: string };

// 卡片配图（对应各页面的 hero 图），让卡片与白底形成反差。
const CARD_IMAGES: Record<string, string> = {
  beginner: "/images/guides/ss-01.jpg",
  pals: "/images/guides/ss-04.jpg",
  breeding: "/images/guides/ss-05.jpg",
  base: "/images/guides/ss-17.jpg",
  materials: "/images/guides/ss-06.jpg",
  endgame: "/images/guides/trailer-launch.jpg",
  money: "/images/guides/trailer-cinematic.jpg",
};

// 首页主视觉海报图（用备用官方截图，避免与内容页重复）。
const HERO_IMG = "/images/guides/ss-16.jpg";
// "什么是 Palworld" 区块左侧配图。
const ABOUT_IMG = "/images/guides/ss-17.jpg";

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

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isValidLocale(params.locale)) notFound();
  const m = getMessages(params.locale);
  const locale = params.locale;

  const stats = arr(m, "hero.stats");
  const cards =
    ((m.startHere as { cards?: Card[] } | undefined)?.cards) ?? [];
  const facts =
    ((m.about as { facts?: Fact[] } | undefined)?.facts) ?? [];
  const paragraphs = arr(m, "about.paragraphs");

  return (
    <>
      {/* Hero：图片作为全屏背景，叠加深色遮罩保证文字可读 */}
      <section
        className="hero hero-bg"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
      >
        <div className="container">
          <div className="hero-copy" style={{ maxWidth: 720 }}>
            <span className="eyebrow">{t(m, "hero.eyebrow", "Fan-Made Community Wiki")}</span>
            <h1>{t(m, "hero.title", "Palworld")}</h1>
            <p className="desc">{t(m, "hero.description")}</p>
            <div className="hero-stats">
              {stats.map((s, i) => (
                <span className="stat" key={i}>
                  {s}
                </span>
              ))}
            </div>
            <div className="hero-actions">
              <Link className="btn btn-primary" href={`/${locale}/guide/beginner`}>
                {t(m, "hero.ctaPrimary", "Start Beginner Guide")}
              </Link>
              <Link className="btn btn-ghost" href={`/${locale}/guide/pals`}>
                {t(m, "hero.ctaSecondary", "Explore Pal Codex")}
              </Link>
              <a
                className="btn btn-ghost"
                href="https://palworld.gg/breeding-calculator"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(m, "hero.ctaThird", "Breeding Calculator")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Start Here 卡片 */}
      <section className="section">
        <div className="container">
          <h2>{t(m, "startHere.title", "Start Here")}</h2>
          <p className="lead">{t(m, "startHere.lead")}</p>
          <div className="cards">
            {cards.map((c, i) => (
              <Link
                key={c.slug}
                className="card"
                href={`/${locale}/guide/${c.slug}`}
              >
                <div
                  className="card-img"
                  style={{
                    backgroundImage: `url(${CARD_IMAGES[c.slug] ?? c.img ?? ""})`,
                  }}
                />
                <div className="card-body">
                  <h3>
                    <span className="num">{String(i + 1).padStart(2, "0")}</span>
                    {c.title}
                  </h3>
                  <p>{c.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What is Palworld */}
      <section className="section section-alt">
        <div className="container about-grid">
          <div className="about-art">
            <img src={ABOUT_IMG} alt="Palworld 中的 Pal 幻兽" />
          </div>
          <div className="about-copy">
            <h2>{t(m, "about.title", "What is Palworld")}</h2>
            {paragraphs.map((p, i) => (
              <p className="lead" key={i}>
                {p}
              </p>
            ))}
            <table className="fact-table">
              <tbody>
                {facts.map((f) => (
                  <tr key={f.label}>
                    <th>{f.label}</th>
                    <td>{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Official Trailer */}
      <section className="section">
        <div className="container">
          <h2>{t(m, "trailer.title", "Official Trailer")}</h2>
          <p className="lead">{t(m, "trailer.lead")}</p>
          <div className="video">
            <iframe
              src="https://www.youtube.com/embed/1fpGg9wNM9A"
              title="Palworld 1.0 Official Launch Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta">
        <div className="container">
          <h2>{t(m, "cta.title", "Ready to Master Palworld?")}</h2>          <p>{t(m, "cta.description")}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href={`/${locale}/guide/beginner`}>
              {t(m, "cta.primary", "Read the Beginner Guide")}
            </Link>
            <a
              className="btn btn-ghost"
              href="https://store.steampowered.com/app/1623730/Palworld/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(m, "cta.secondary", "Play on Steam")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

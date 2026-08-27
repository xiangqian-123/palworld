import Link from "next/link";
import { locales } from "@/lib/locales";

const NAV_LINKS = [
  { slug: "beginner", key: "nav.beginner" },
  { slug: "pals", key: "nav.pals" },
  { slug: "breeding", key: "nav.breeding" },
  { slug: "base", key: "nav.base" },
  { slug: "materials", key: "nav.materials" },
  { slug: "map", key: "nav.map" },
  { slug: "endgame", key: "nav.endgame" },
  { slug: "money", key: "nav.money" },
  { slug: "faq", key: "nav.faq" },
];

const LANG_LABELS: Record<string, string> = {
  "zh-CN": "中文",
  "zh-TW": "繁體",
  en: "EN",
  ja: "日本語",
  ru: "РУ",
  de: "DE",
};

function t(messages: Record<string, unknown>, key: string, fallback: string) {
  const parts = key.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p];
    else return fallback;
  }
  return typeof cur === "string" ? cur : fallback;
}

export default function Nav({
  locale,
  messages,
}: {
  locale: string;
  messages: Record<string, unknown>;
}) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href={`/${locale}`} className="nav-logo">
          <span className="dot" />
          Palworld Wiki
        </Link>
        <nav className="nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.slug} href={`/${locale}/guide/${l.slug}`}>
              {t(messages, l.key, l.slug)}
            </Link>
          ))}
          <details className="lang">
            <summary>{LANG_LABELS[locale] ?? locale}</summary>
            <div className="lang-list">
              {locales.map((l) => (
                <Link key={l} href={`/${l}`}>
                  {LANG_LABELS[l]}
                </Link>
              ))}
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}

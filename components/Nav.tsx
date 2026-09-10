"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { locales } from "@/lib/locales";
import SearchBox from "./SearchBox";

// 攻略 dropdown（固定 10 项）。
const GUIDE_LINKS = [
  { slug: "beginner", key: "nav.beginner" },
  { slug: "base", key: "nav.base" },
  { slug: "world-tree", key: "nav.worldTree" },
  { slug: "endgame", key: "nav.endgame" },
  { slug: "money", key: "nav.money" },
  { slug: "passives", key: "nav.passives" },
  { slug: "ps5", key: "nav.ps5" },
  { slug: "mobile", key: "nav.mobile" },
  { slug: "tcg", key: "nav.tcg" },
  { slug: "faq", key: "nav.faq" },
];

// 养殖 dropdown（计算器 + 攻略 + 被动）。
const BREED_LINKS = [
  { href: "/breeding-calculator", key: "nav.breedingCalc" },
  { href: "/guide/breeding", key: "nav.breedingGuide" },
  { href: "/guide/passives", key: "nav.passives" },
];

// 物品 dropdown 分类（display 名复数，链接用真实 category 值单数）。
const ITEM_CATS = [
  { cat: "Weapon", labelKey: "cat.Weapon", label: "Weapons" },
  { cat: "Armor", labelKey: "cat.Armor", label: "Armor" },
  { cat: "Blueprint", labelKey: "cat.Blueprint", label: "Blueprints" },
  { cat: "Material", labelKey: "cat.Material", label: "Materials" },
  { cat: "Food", labelKey: "cat.Food", label: "Food" },
  { cat: "Accessory", labelKey: "cat.Accessory", label: "Accessories" },
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

function switchLocale(pathname: string, target: string): string {
  const rest = pathname.replace(/^\/[^/]+/, "") || "";
  return `/${target}${rest}`;
}

export default function Nav({
  locale,
  messages,
}: {
  locale: string;
  messages: Record<string, unknown>;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const palLink = `/${locale}/pals`;
  const mapLink = `/${locale}/guide/map`;

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href={`/${locale}`} className="nav-logo" onClick={close}>
          <span className="dot" />
          Palworld Wiki
        </Link>

        {/* 桌面端导航 */}
        <nav className="nav-links nav-desktop">
          <Link href={palLink}>{t(messages, "nav.pals", "Pal 图鉴")}</Link>

          <details className="nav-dd">
            <summary>{t(messages, "nav.breeding", "养殖")}</summary>
            <div className="nav-dd-list">
              {BREED_LINKS.map((l) => (
                <Link key={l.href} href={`/${locale}${l.href}`}>
                  {t(messages, l.key, l.key)}
                </Link>
              ))}
            </div>
          </details>

          <details className="nav-dd">
            <summary>{t(messages, "nav.items", "物品")}</summary>
            <div className="nav-dd-list">
              <Link href={`/${locale}/items`}>
                {t(messages, "nav.allItems", "全部物品")}
              </Link>
              {ITEM_CATS.map((c) => (
                <Link
                  key={c.cat}
                  href={`/${locale}/items?category=${c.cat}`}
                >
                  {t(messages, c.labelKey, c.label)}
                </Link>
              ))}
            </div>
          </details>

          <Link href={mapLink}>{t(messages, "nav.map", "地图")}</Link>

          <details className="nav-dd">
            <summary>{t(messages, "nav.guides", "攻略")}</summary>
            <div className="nav-dd-list">
              {GUIDE_LINKS.map((l) => (
                <Link key={l.slug} href={`/${locale}/guide/${l.slug}`}>
                  {t(messages, l.key, l.slug)}
                </Link>
              ))}
            </div>
          </details>

          <SearchBox locale={locale} compact />

          <details className="nav-dd lang">
            <summary>{LANG_LABELS[locale] ?? locale}</summary>
            <div className="nav-dd-list lang-list">
              {locales.map((l) => (
                <Link key={l} href={switchLocale(pathname ?? `/${locale}`, l)}>
                  {LANG_LABELS[l]}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        {/* 移动端汉堡按钮 */}
        <button
          className="nav-burger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* 移动端菜单 */}
      {menuOpen && (
        <div className="nav-mobile">
          <SearchBox locale={locale} />
          <Link href={palLink} onClick={close}>
            {t(messages, "nav.pals", "Pal 图鉴")}
          </Link>

          <details className="nav-dd">
            <summary>{t(messages, "nav.breeding", "养殖")}</summary>
            <div className="nav-dd-list">
              {BREED_LINKS.map((l) => (
                <Link key={l.href} href={`/${locale}${l.href}`} onClick={close}>
                  {t(messages, l.key, l.key)}
                </Link>
              ))}
            </div>
          </details>

          <details className="nav-dd">
            <summary>{t(messages, "nav.items", "物品")}</summary>
            <div className="nav-dd-list">
              <Link href={`/${locale}/items`} onClick={close}>
                {t(messages, "nav.allItems", "全部物品")}
              </Link>
              {ITEM_CATS.map((c) => (
                <Link
                  key={c.cat}
                  href={`/${locale}/items?category=${c.cat}`}
                  onClick={close}
                >
                  {t(messages, c.labelKey, c.label)}
                </Link>
              ))}
            </div>
          </details>

          <Link href={mapLink} onClick={close}>
            {t(messages, "nav.map", "地图")}
          </Link>

          <details className="nav-dd">
            <summary>{t(messages, "nav.guides", "攻略")}</summary>
            <div className="nav-dd-list">
              {GUIDE_LINKS.map((l) => (
                <Link
                  key={l.slug}
                  href={`/${locale}/guide/${l.slug}`}
                  onClick={close}
                >
                  {t(messages, l.key, l.slug)}
                </Link>
              ))}
            </div>
          </details>

          <div className="nav-mobile-lang">
            {locales.map((l) => (
              <Link key={l} href={switchLocale(pathname ?? `/${locale}`, l)} onClick={close}>
                {LANG_LABELS[l]}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

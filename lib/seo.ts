import type { Metadata } from "next";
import { DEFAULT_LOCALE, locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";

/**
 * SEO 工具层：canonical / hreflang / OpenGraph / JSON-LD 的唯一生成入口。
 *
 * 约定：
 * - `path` 一律是「不含 locale 前缀」的路径，例如 ""（首页）、"/guide/beginner"、"/pal/lamball"。
 * - 所有 URL 都基于 siteConfig.siteUrl 生成绝对路径。
 */

/** 各语言对应的 hreflang 代码（BCP 47）。 */
export const HREFLANG: Record<Locale, string> = {
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  en: "en",
  ja: "ja",
  ru: "ru",
  de: "de",
};

/** 各语言对应的 og:locale 值（下划线格式）。 */
export const OG_LOCALE: Record<Locale, string> = {
  "zh-CN": "zh_CN",
  "zh-TW": "zh_TW",
  en: "en_US",
  ja: "ja_JP",
  ru: "ru_RU",
  de: "de_DE",
};

/** 把任意路径拼成绝对 URL。 */
export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.siteUrl}${p}`;
}

/** 规范化 path：首页为空串，其余保证以 / 开头且不以 / 结尾。 */
function normalizePath(path: string): string {
  if (!path || path === "/") return "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

/** 生成 hreflang 映射（含 x-default，指向默认语言）。 */
export function hreflangLanguages(path: string): Record<string, string> {
  const p = normalizePath(path);
  const langs: Record<string, string> = {};
  for (const l of locales) {
    langs[HREFLANG[l]] = absoluteUrl(`/${l}${p}`);
  }
  langs["x-default"] = absoluteUrl(`/${DEFAULT_LOCALE}${p}`);
  return langs;
}

/** 生成完整的 alternates（canonical + hreflang）。 */
export function buildAlternates(
  locale: string,
  path: string
): Metadata["alternates"] {
  const p = normalizePath(path);
  return {
    canonical: absoluteUrl(`/${locale}${p}`),
    languages: hreflangLanguages(p),
  } as Metadata["alternates"];
}

/** 站点默认 OG 图（绝对路径）。 */
export function ogImageUrl(image?: string): string[] {
  return [absoluteUrl(image || siteConfig.ogImage)];
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

/** WebSite：首页使用，声明站点名、语言与搜索入口。 */
export function websiteJsonLd(locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.siteName,
    url: absoluteUrl(`/${locale}`),
    description: siteConfig.defaultDescription,
    inLanguage: HREFLANG[locale],
    about: {
      "@type": "VideoGame",
      name: siteConfig.gameName,
    },
  };
}

/** BreadcrumbList：面包屑，帮助 Google 理解层级。 */
export function breadcrumbJsonLd(
  locale: Locale,
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(`/${locale}${normalizePath(it.path)}`),
    })),
  };
}

/** Article：攻略页使用。 */
export function articleJsonLd(opts: {
  locale: Locale;
  title: string;
  description?: string;
  path: string;
  image?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description || "",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/${opts.locale}${normalizePath(opts.path)}`),
    },
    image: ogImageUrl(opts.image),
    inLanguage: HREFLANG[opts.locale],
    publisher: {
      "@type": "Organization",
      name: siteConfig.siteName,
      url: siteConfig.siteUrl,
    },
  };
}

/** ItemPage + 游戏内实体：单个 Pal 详情页使用。 */
export function palPageJsonLd(opts: {
  locale: Locale;
  name: string;
  description?: string;
  path: string;
  image?: string;
  paldexIndex?: number;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: opts.name,
    description: opts.description || "",
    url: absoluteUrl(`/${opts.locale}${normalizePath(opts.path)}`),
    inLanguage: HREFLANG[opts.locale],
    thumbnailUrl: ogImageUrl(opts.image),
    about: {
      "@type": "Thing",
      name: opts.name,
      description: opts.description || "",
      ...(opts.paldexIndex != null
        ? { identifier: `Paldeck #${opts.paldexIndex}` }
        : {}),
    },
  };
}

/** FAQPage：把 MDX 里的「### 问句 + 正文」抽成结构化问答。 */
export function faqJsonLd(
  qa: { q: string; a: string }[]
): Record<string, unknown> | null {
  if (!qa.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

// ---------------------------------------------------------------------------
// MDX → FAQ 抽取
// ---------------------------------------------------------------------------

function stripInlineMd(s: string): string {
  return s
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // 链接/图片 → 文本
    .replace(/`([^`]*)`/g, "$1") // 行内代码
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // 加粗
    .replace(/(\*|_)(.*?)\1/g, "$2") // 斜体
    .replace(/<[^>]+>/g, "") // 残留 HTML 标签
    .replace(/\s+/g, " ")
    .trim();
}

function isQuestion(q: string): boolean {
  return /[?？]$/.test(q.trim());
}

/**
 * 从 MDX 正文抽取问答对：识别 `### 标题` 作为问题、其后正文作为答案，
 * 遇到下一个 `##` / `###` 标题即结束。只保留以问号结尾的问题。
 */
export function extractFaq(markdown: string): { q: string; a: string }[] {
  const body = markdown.replace(/^\uFEFF?---[\s\S]*?---\r?\n?/, "");
  const out: { q: string; a: string }[] = [];
  let cur: { q: string; a: string[] } | null = null;

  const flush = () => {
    if (cur && isQuestion(cur.q)) {
      const answer = stripInlineMd(cur.a.join(" "));
      if (answer) {
        out.push({ q: stripInlineMd(cur.q).replace(/^\d+[.、]\s*/, ""), a: answer });
      }
    }
    cur = null;
  };

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flush();
      cur = { q: line.replace(/^###\s+/, "").trim(), a: [] };
    } else if (/^#{1,2}\s+/.test(line)) {
      flush();
    } else if (cur && line.trim()) {
      // 跳过列表型「详见 xxx」的导航行，避免答案里全是链接
      if (/^[-*]\s+详见/.test(line.trim())) continue;
      cur.a.push(line.trim());
    }
  }
  flush();
  return out;
}

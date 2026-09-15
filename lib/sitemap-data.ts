import fs from "fs";
import path from "path";
import type { MetadataRoute } from "next";
import { getSlugs } from "@/lib/posts";
import { getPalSlugs } from "@/lib/pal";
import { getItemSlugs, getCategories } from "@/lib/items";
import { locales } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { hreflangLanguages } from "@/lib/seo";

/**
 * sitemap 数据层：按 section 构建条目 + XML 序列化。
 *
 * 真实 lastModified 口径（禁止 new Date()）：
 * - 数据派生页（pal/breeding/location/item）→ data/atlas-latest.json 的 generatedAt
 * - Guide 页 → 对应 mdx 文件的 mtime（en → zh-CN 回退，与 CONTENT_FALLBACK 一致）
 * - 固定页（首页/索引页）→ 数据时间
 * 读取失败一律省略 lastModified（省略优于伪装）。
 */

export const SITEMAP_SECTIONS = [
  "core",
  "guides",
  "pals",
  "pal-locations",
  "pal-breeding",
  "items",
] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

function dataGeneratedAt(): Date | undefined {
  try {
    const file = path.join(process.cwd(), "data", "atlas-latest.json");
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as {
      generatedAt?: string;
    };
    if (!raw.generatedAt) return undefined;
    const d = new Date(raw.generatedAt);
    return isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
}

/** Guide 页真实 mtime：en 优先，缺失回退 zh-CN（与 posts.ts 回退链一致）。 */
function guideMtime(slug: string): Date | undefined {
  for (const loc of ["en", "zh-CN"]) {
    const file = path.join(
      process.cwd(),
      "content",
      "guides",
      loc,
      `${slug}.mdx`
    );
    try {
      if (fs.existsSync(file)) return fs.statSync(file).mtime;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

/** 构建某个 section 的全部条目。 */
export function buildSectionEntries(
  section: SitemapSection
): MetadataRoute.Sitemap {
  const dataTime = dataGeneratedAt();
  const entries: MetadataRoute.Sitemap = [];
  const push = (
    pathNoLocale: string,
    opts: {
      lastModified?: Date;
      changeFrequency: "weekly" | "monthly";
      priority: number;
    }
  ) => {
    const languages = hreflangLanguages(pathNoLocale);
    for (const locale of locales) {
      const entry: MetadataRoute.Sitemap[number] = {
        url: `${siteConfig.siteUrl}/${locale}${pathNoLocale}`,
        changeFrequency: opts.changeFrequency,
        priority: opts.priority,
        alternates: { languages },
      };
      if (opts.lastModified) entry.lastModified = opts.lastModified;
      entries.push(entry);
    }
  };

  switch (section) {
    case "core":
      push("", { lastModified: dataTime, changeFrequency: "weekly", priority: 1 });
      push("/pals", { lastModified: dataTime, changeFrequency: "weekly", priority: 0.9 });
      push("/map", { lastModified: dataTime, changeFrequency: "weekly", priority: 0.9 });
      push("/breeding-calculator", { lastModified: dataTime, changeFrequency: "weekly", priority: 0.9 });
      push("/items", { lastModified: dataTime, changeFrequency: "weekly", priority: 0.8 });
      // Item 分类页（内链架构入口）
      for (const cat of getCategories().map((c) => c.name)) {
        push(`/items/${encodeURIComponent(cat)}`, {
          lastModified: dataTime,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
      break;
    case "guides":
      for (const slug of getSlugs()) {
        push(`/guide/${slug}`, {
          lastModified: guideMtime(slug),
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }
      break;
    case "pals":
      for (const slug of getPalSlugs()) {
        push(`/pal/${slug}`, { lastModified: dataTime, changeFrequency: "monthly", priority: 0.7 });
      }
      break;
    case "pal-locations":
      for (const slug of getPalSlugs()) {
        push(`/pal/${slug}/location`, { lastModified: dataTime, changeFrequency: "monthly", priority: 0.7 });
      }
      break;
    case "pal-breeding":
      for (const slug of getPalSlugs()) {
        push(`/pal/${slug}/breeding`, { lastModified: dataTime, changeFrequency: "monthly", priority: 0.7 });
      }
      break;
    case "items":
      for (const slug of getItemSlugs()) {
        push(`/item/${slug}`, { lastModified: dataTime, changeFrequency: "monthly", priority: 0.6 });
      }
      break;
  }
  return entries;
}

/** 把条目序列化为 sitemap XML（含 hreflang xhtml:link，与 Next 原生口径一致）。 */
export function serializeSitemap(entries: MetadataRoute.Sitemap): string {
  const items = entries
    .map((e) => {
      const alt =
        e.alternates && e.alternates.languages
          ? Object.entries(e.alternates.languages)
              .map(
                ([hreflang, url]) =>
                  `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${url}"/>`
              )
              .join("")
          : "";
      return [
        "<url>",
        `<loc>${e.url}</loc>`,
        e.lastModified
          ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>`
          : "",
        e.changeFrequency ? `<changefreq>${e.changeFrequency}</changefreq>` : "",
        e.priority != null ? `<priority>${e.priority}</priority>` : "",
        alt,
        "</url>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    items,
    "</urlset>",
  ].join("\n");
}

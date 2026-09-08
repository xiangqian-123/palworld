import type { MetadataRoute } from "next";
import { getSlugs } from "@/lib/posts";
import { getPalSlugs } from "@/lib/pal";
import { locales } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import { hreflangLanguages } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getSlugs();
  const palSlugs = getPalSlugs();
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // 首页
  for (const locale of locales) {
    entries.push({
      url: `${siteConfig.siteUrl}/${locale}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: hreflangLanguages("") },
    });
  }

  // 攻略页
  for (const slug of slugs) {
    const languages = hreflangLanguages(`/guide/${slug}`);
    for (const locale of locales) {
      entries.push({
        url: `${siteConfig.siteUrl}/${locale}/guide/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages },
      });
    }
  }

  // Pal 详情页
  for (const slug of palSlugs) {
    const languages = hreflangLanguages(`/pal/${slug}`);
    for (const locale of locales) {
      entries.push({
        url: `${siteConfig.siteUrl}/${locale}/pal/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  // Pal 繁殖页（How to breed X）
  for (const slug of palSlugs) {
    const languages = hreflangLanguages(`/pal/${slug}/breeding`);
    for (const locale of locales) {
      entries.push({
        url: `${siteConfig.siteUrl}/${locale}/pal/${slug}/breeding`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  // Pal 位置页（Where to find X）
  for (const slug of palSlugs) {
    const languages = hreflangLanguages(`/pal/${slug}/location`);
    for (const locale of locales) {
      entries.push({
        url: `${siteConfig.siteUrl}/${locale}/pal/${slug}/location`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  // Breeding Calculator
  {
    const languages = hreflangLanguages("/breeding-calculator");
    for (const locale of locales) {
      entries.push({
        url: `${siteConfig.siteUrl}/${locale}/breeding-calculator`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: { languages },
      });
    }
  }

  return entries;
}

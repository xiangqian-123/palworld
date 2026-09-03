import type { MetadataRoute } from "next";
import { getSlugs } from "@/lib/posts";
import { getPalSlugs } from "@/lib/pal";
import { locales } from "@/lib/locales";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getSlugs();
  const palSlugs = getPalSlugs();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${siteConfig.siteUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    });
    for (const slug of slugs) {
      entries.push({
        url: `${siteConfig.siteUrl}/${locale}/guide/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
    for (const slug of palSlugs) {
      entries.push({
        url: `${siteConfig.siteUrl}/${locale}/pal/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  return entries;
}

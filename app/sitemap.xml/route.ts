import { SITEMAP_SECTIONS } from "@/lib/sitemap-data";
import { siteConfig } from "@/lib/site";

/** sitemap index：指向 6 个分组子 sitemap。 */
export async function GET() {
  const locs = SITEMAP_SECTIONS.map(
    (s) => `<sitemap><loc>${siteConfig.siteUrl}/sitemap/${s}.xml</loc></sitemap>`
  ).join("");
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    locs +
    "\n</sitemapindex>";
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

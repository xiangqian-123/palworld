import {
  SITEMAP_SECTIONS,
  buildSectionEntries,
  serializeSitemap,
  type SitemapSection,
} from "@/lib/sitemap-data";

export function generateStaticParams() {
  return SITEMAP_SECTIONS.map((section) => ({ section: `${section}.xml` }));
}

/** 分组子 sitemap：/sitemap/{section}.xml */
export async function GET(
  _request: Request,
  { params }: { params: { section: string } }
) {
  const section = params.section.replace(/\.xml$/, "") as SitemapSection;
  if (!SITEMAP_SECTIONS.includes(section)) {
    return new Response("Not Found", { status: 404 });
  }
  const xml = serializeSitemap(buildSectionEntries(section));
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

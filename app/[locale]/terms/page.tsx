import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/locales";
import { buildAlternates } from "@/lib/seo";

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: "Terms of Service",
    description: "Terms of use for this fan-made Palworld community wiki.",
    alternates: buildAlternates(params.locale, "/terms"),
    // 模板化页面内容单薄，避免被判定为低质量内容；链接仍可跟随。
    robots: { index: false, follow: true },
  };
}

export default function TermsPage({ params }: { params: { locale: string } }) {
  if (!isValidLocale(params.locale)) notFound();
  return (
    <article className="guide">
      <header className="guide-header">
        <h1>Terms of Service</h1>
      </header>
      <div className="prose">
        <p>
          This fan-made community wiki is provided for informational purposes
          only. Guides and data are community-maintained and may contain
          inaccuracies.
        </p>
        <p>
          Palworld and all related trademarks are the property of Pocketpair,
          Inc. This site is not affiliated with or endorsed by Pocketpair.
        </p>
      </div>
    </article>
  );
}

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
    title: "Privacy Policy",
    description: "How this fan-made Palworld community wiki handles your data.",
    alternates: buildAlternates(params.locale, "/privacy"),
    // 模板化页面内容单薄，避免被判定为低质量内容；链接仍可跟随。
    robots: { index: false, follow: true },
  };
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  if (!isValidLocale(params.locale)) notFound();
  return (
    <article className="guide">
      <header className="guide-header">
        <h1>Privacy Policy</h1>
      </header>
      <div className="prose">
        <p>
          This is a fan-made community wiki. We do not collect personal data
          beyond standard, anonymized analytics used to understand site traffic.
        </p>
        <p>
          Palworld and all related trademarks are the property of Pocketpair,
          Inc. This site is not affiliated with Pocketpair.
        </p>
      </div>
    </article>
  );
}

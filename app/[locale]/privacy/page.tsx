import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";

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

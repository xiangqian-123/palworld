import Link from "next/link";

function s(v: unknown, fb = ""): string {
  return typeof v === "string" ? v : fb;
}

export default function Footer({
  locale,
  messages,
  siteUrl,
}: {
  locale: string;
  messages: Record<string, unknown>;
  siteUrl: string;
}) {
  const footer = (messages.footer ?? {}) as Record<string, unknown>;
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>{s(footer.aboutTitle, "Palworld Wiki")}</h4>
          <p>{s(footer.about)}</p>
        </div>
        <div>
          <h4>{s(footer.playGame, "Play")}</h4>
          <a
            href="https://store.steampowered.com/app/1623730/Palworld/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s(footer.playGame)}
          </a>
          <a
            href="https://www.pocketpair.jp/palworld"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s(footer.officialSite, "Official Site")}
          </a>
        </div>
        <div>
          <h4>{s(footer.community, "Community")}</h4>
          <a href="https://palworld.gg/" target="_blank" rel="noopener noreferrer">
            {s(footer.communityTool, "Official Wiki")}
          </a>
          <a
            href="https://reddit.com/r/Palworld"
            target="_blank"
            rel="noopener noreferrer"
          >
            Reddit
          </a>
        </div>
        <div>
          <h4>{s(footer.legal, "Legal")}</h4>
          <Link href={`/${locale}/privacy`}>{s(footer.privacyPolicy, "Privacy Policy")}</Link>
          <Link href={`/${locale}/terms`}>{s(footer.termsOfService, "Terms of Service")}</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} Palworld Wiki · {s(footer.disclaimer)}
      </div>
    </footer>
  );
}

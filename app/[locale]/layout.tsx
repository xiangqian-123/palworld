import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, locales, DEFAULT_LOCALE } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";
import { OG_LOCALE } from "@/lib/seo";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * 站点级 metadata 基线：
 * - metadataBase 让相对路径的 OG 图 / canonical 解析成绝对地址；
 * - 各页面通过 generateMetadata 覆盖 title / description / alternates。
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: siteConfig.defaultTitle,
  description: siteConfig.defaultDescription,
  applicationName: siteConfig.siteName,
  openGraph: {
    type: "website",
    siteName: siteConfig.siteName,
    locale: OG_LOCALE[DEFAULT_LOCALE],
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    images: [siteConfig.ogImage],
  },
  robots: { index: true, follow: true },
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) notFound();
  const messages = getMessages(params.locale);

  return (
    <html lang={params.locale}>
      <body>
        <GoogleAnalytics gaId={siteConfig.gaId} />
        <Nav locale={params.locale} messages={messages} />
        <main>{children}</main>
        <Footer
          locale={params.locale}
          messages={messages}
          siteUrl={siteConfig.siteUrl}
        />
      </body>
    </html>
  );
}

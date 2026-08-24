import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/lib/site";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  title: siteConfig.defaultTitle,
  description: siteConfig.defaultDescription,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <GoogleAnalytics gaId={siteConfig.gaId} />
        {children}
      </body>
    </html>
  );
}

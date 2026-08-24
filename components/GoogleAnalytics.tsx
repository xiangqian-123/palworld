import Script from "next/script";

/**
 * GA4 脚本注入。gaId 为空时不渲染任何内容（本地开发无 GA 时静默跳过）。
 * ID 通过环境变量 NEXT_PUBLIC_GA_ID 传入（见 site.config.ts）。
 */
export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  if (!gaId || !gaId.startsWith("G-")) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gaId}');`,
        }}
      />
    </>
  );
}

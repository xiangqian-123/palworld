/**
 * 站点级配置中心 —— Palworld 版
 *
 * 复制一个新游戏站时，只需改这一个文件（以及替换 content/ 目录的 MDX），
 * 代码其余部分全部读这里的值，无需改动。
 */
export interface SiteConfig {
  /** 站点名（用于标题、OpenGraph、JSON-LD）。 */
  siteName: string;
  /** 站点根网址（用于 canonical、hreflang、sitemap、robots）。 */
  siteUrl: string;
  /** 游戏名（用于默认标题/描述等文案）。 */
  gameName: string;
  /** Google Analytics 4 衡量 ID（G- 开头）。 */
  gaId: string;
  /** 默认页面标题（各页面未单独定义 metadata 时使用）。 */
  defaultTitle: string;
  /** 默认页面描述。 */
  defaultDescription: string;
  /** OpenGraph 的备选语言（除默认 locale 外）。 */
  ogLocales: string[];
}

export const siteConfig: SiteConfig = {
  siteName: 'Palworld Wiki',
  siteUrl: 'https://palworld-chi.vercel.app',
  gameName: 'Palworld',
  // GA4 衡量 ID：优先读环境变量 NEXT_PUBLIC_GA_ID，未设置时用下方写死的值
  gaId: process.env.NEXT_PUBLIC_GA_ID || 'G-3SC1YKTZN6',
  defaultTitle: 'Palworld Wiki — Guides, Pal Codex, Breeding & Mods',
  defaultDescription:
    'Palworld Wiki — complete fan guide to Palworld: beginner tutorials, 287 Pal codex, breeding calculator, materials, Terraria crossover, TCG and server guides.',
  ogLocales: ['en', 'ja', 'ru', 'de', 'zh-TW'],
};

# Palworld · Decision Log

> 站外运营台账（不 commit 到 site repo）。与 `gsc_reminder_log.md`（auto-pull 日志）区分：本文件记人工决策动作。

## 2026-10-07 · CTR 观察轮（无 mdx 改动）

### WATCH · /en/pal/astegon/location（等 14 天看 CTR）
- **决策**：astegon location 承接页第一轮已上线，本轮不改（等第二轮满 14 天看 CTR 再决定是否 CTR_OPTIMIZE）
- **审计结果**：CTR_TITLE_OVERRIDES（page.tsx）override「22 spawn / Lv55–80 / Alpha55」与 pal-spawns.json（count 22 / minLevel 55 / maxLevel 80 / hasAlpha true）一致，无编造
- **precision gap**：data 有 tree（World Tree）region，但 override title 未含；下次 CTR_OPTIMIZE 时可评估补
- **review**：≈2026-10-21（满 14 天看 CTR）
- **边界**：astegon 承接页 title/description 硬编码在 page.tsx CTR_TITLE_OVERRIDES，不在 mdx 边界内（本轮「只改 mdx」边界外，未动）

### 发现 · 内容页 SEO metadata 三层源（下一轮单独做）
- mdx frontmatter 之外，内容页 SEO metadata 还有：`lib/seo.ts` HOME_META（brand query）、`data/search-index.ts`（auto 生成 slug title）、`app/[locale]/pal/[slug]/location/page.tsx` CTR_TITLE_OVERRIDES（Palworld 动态页）
- **下一轮任务**：单独梳理这三层，统一 content-page SEO metadata 的 source-of-truth

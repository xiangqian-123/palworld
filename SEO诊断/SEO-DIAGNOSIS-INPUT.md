# SEO-DIAGNOSIS-INPUT — Palworld 站

> 生成：2026-09-15 ｜ 站点：https://palworld-chi.vercel.app ｜ 范围：全部 /en/ URL（2,785 个）
> 原则：本次只诊断不改动——Title、正文、URL、导航、页面结构一律未动。
> GSC 数据状态：✅ 已通过 Search Console API 拉取完成（服务账号 youxi-374@youxi-508703）。

---

## 一、项目现状快照

| 项 | 值 |
|---|---|
| 游戏 | Palworld（1.0 已发售，数据版本 Palworld 1.0，atlas-data build 25080279，2026-09-07） |
| 站点 | Next.js App Router，`site.config.ts` 单一配置，MDX + data/ JSON（pals 288、items 1892）驱动 |
| 部署 | Vercel 子域，GSC 验证文件已 200 |
| 语言 | **6 语言全部真实译文**（zh-CN/zh-TW/en/ja/ru/de 各 22 篇攻略），无壳页问题 |
| /en/ URL 全集 | **2,785**：首页 1 + 攻略 22 + Pal 288×3（详情/breeding/location）+ 图鉴 1 + 物品 1892+1 + 地图 1 + 配种计算器 1 + privacy/terms 2 |
| sitemap.xml | 16,698 URL（6 语言 × 2,783），**含 hreflang 标注 116,886 条**；文件体积 **16.6 MB** |
| robots.txt | allow 全部 + sitemap 指向正常 |
| GA | G-3SC1YKTZN6 |

### 与 legacy 站的对比（同一套模板演进）

| 检查项 | legacy 站 | Palworld 站 |
|---|---|---|
| `<html lang>` 按 locale | ❌ 硬编码 zh-CN | ✅ `lang={params.locale}` |
| privacy/terms noindex | ❌ 未做 | ✅ noindex,follow |
| 攻略页中文残留（最后核验/本页目录/上一章） | ❌ 全在 | ✅ 已清理（线上验证无） |
| sitemap hreflang | ❌ 无 | ✅ 有 |
| 6 语言真译文 | 仅 3 语言 | ✅ 6 语言 |

---

## 二、技术 SEO 指标（每 URL，已实测 + 源码双重验证）

明细 CSV：`palworld_en_tech_seo.csv`（2,785 行，按类型生成）。各类型统一结论：

| 页面类型 | 数量 | indexable | canonical | hreflang | 在 sitemap |
|---|---|---|---|---|---|
| home | 1 | ✅ | 自引用 ✓ | 7 条（6语言+x-default→zh-CN） | ✅ |
| guide | 22 | ✅ | 自引用 ✓ | 7 条 | ✅ |
| pal / pal-breeding / pal-location | 288×3 | ✅ | 自引用 ✓ | 7 条 | ✅ |
| pals / items / map / breeding-calculator | 4 | ✅ | 自引用 ✓ | 7 条 | ✅ |
| item | 1,892 | ✅ | 自引用 ✓ | 7 条 | ✅ |
| privacy / terms | 2 | ❌→✅ noindex,follow（按清单 P1.5 正确处理） | 自引用 ✓ | 7 条 | 不在 sitemap（正确） |

线上抽查：/en、/en/guide/beginner、/en/pal/anubis 三页 `lang=en`、canonical 正确、7 条 hreflang、无 noindex 残留 ✓。

### 异常清单

1. **`lastModified: now`**：sitemap.ts 全部用 `new Date()`（构建时间）而非文件真实 mtime——违反自查清单 P2「lastModified 用文件真实 mtime」，Google 拿不到真实更新信号。
2. **sitemap 16.6 MB**：16,698 URL 单文件。Google 对 sitemap 上限 50MB/50,000 URL 内尚可，但 16MB 下载/解析开销大，建议按类型拆分 sitemap index（guides / pals / items）。
3. **item 长尾页 ISR**：pal/item 长尾页 build 只预渲染 zh-CN，其余语言首次访问时生成缓存 7 天（pal page.tsx:30 注释）——Google 首次抓取 en/item 时是冷渲染，首字节慢可能影响抓取预算；GSC 数据显示 en/pal/*/location 已开始有曝光，说明 Google 在正常抓。
4. **en 页面的中文 metadata 泄漏（详见第五节）**。

---

## 三、GSC 最近 28 天：每 /en/ URL 的 Query × Clicks × Impressions × CTR × Position

> 窗口：2026-08-18 ~ 2026-09-15 ｜ 资源：https://palworld-chi.vercel.app/
> query 行 167 条（GSC 隐藏了低曝光 query）；page 聚合 27 个 URL 有数据，2,758 个零曝光。

### 3.1 每 URL 汇总（page 聚合口径，明细 `palworld_gsc_merged.csv`）

| URL | Clicks | Impressions | CTR | Avg Position |
|---|---|---|---|---|
| /en/guide/passives | 0 | 145 | 0% | 69.1 |
| /en/guide/world-tree | 0 | **89** | 0% | **8.5** |
| /en/guide/breeding | 0 | 48 | 0% | 81.7 |
| /en/guide/wiki | 0 | 39 | 0% | 73.6 |
| /en/guide/materials | 0 | 31 | 0% | 72.3 |
| /en/guide/beginner | **1** | 25 | 4.0% | 38.2 |
| /en/guide/endgame | 0 | 24 | 0% | 12.2 |
| /en/guide/money | 0 | 18 | 0% | 36.0 |
| /en/guide/faq | 0 | 11 | 0% | 56.3 |
| /en/pal/mossanda/location | 0 | 8 | 0% | 19.0 |
| /en/guide/base | 0 | 6 | 0% | 29.8 |
| /en/pal/astegon/location | 0 | 6 | 0% | 8.3 |
| /en/pal/blazamut/location | 0 | 5 | 0% | 9.4 |
| 其余 14 页（new-pals/tcg/mobile/dualith-noct/gildra/starryon 等） | 0 | 各 ≤3 | — | 5.0–86 |
| **合计** | **1** | **480** | 0.2% | — |

### 3.2 Query 级明细（167 行全量在 `gsc_28d.csv`，top 曝光 query）

| Query（截断） | 页面 | Imp | Pos |
|---|---|---|---|
| what level are the pals in the world tree | world-tree | 2 | 8.5 |
| world tree bosses palworld | world-tree | 2 | 7.0 |
| palworld 自动化（中文） | beginner | 3 | 9.0 |
| all passive in palworld / coward passive… / perks palworld | passives | 各 2 | 68–94 |
| material palworld / palworld materials list 等 | materials | 各 2 | 82–92 |
| palworld maintenance | faq | 2 | 72.5 |

> 解读：**Palworld 站竞争强度远高于 legacy**——28 天仅 1 次点击、480 曝光，58.8% 曝光落在 >50 位。亮点是 world-tree 页已稳定在第 1 页（pos 7–8.5）；pal/*/location 长尾页也开始进第 1 页（pos 5–9），说明 location 页型是 Palworld 场景的有效长尾入口。中文 query（palworld 自动化）落在 /en/ 页面——语言标注正确的前提下属正常（中文 query 匹配到 en 页说明 en 页在该 query 有排名能力，但也提示中文搜索需求旺盛）。

---

## 四、Position 分组 Impression 占比（1–3 / 4–10 / 11–20 / 21–50 / >50）

> Position 小数四舍五入后分档。双口径（query 行 vs page 聚合），page 聚合覆盖 GSC 隐藏的 query 曝光。

### 4.1 主口径：query 行（167 条，总曝光 188）

| 组 | Impressions | 占比 | Clicks | 行数 |
|---|---|---|---|---|
| 1–3 | 1 | 0.5% | 0 | 1 |
| 4–10 | 26 | 13.8% | 0 | 17 |
| 11–20 | 6 | 3.2% | 0 | 5 |
| 21–50 | 4 | 2.1% | 0 | 4 |
| >50 | 151 | **80.3%** | 0 | 140 |

### 4.2 补充口径：page 聚合行（27 页，总曝光 480）

| 组 | Impressions | 占比 | Clicks | 页数 |
|---|---|---|---|---|
| 1–3 | 0 | 0% | 0 | 0 |
| 4–10 | 110 | 22.9% | 0 | 10 |
| 11–20 | 37 | 7.7% | 0 | 5 |
| 21–50 | 51 | 10.6% | 1 | 4 |
| >50 | 282 | **58.8%** | 0 | 8 |

明细：`palworld_gsc_bands.csv`。与 legacy 站（96.9% 曝光在 4–10 位）相反，Palworld 是**大竞争词环境**，多数词在 5 页开外——符合「热门游戏攻略站起步期」形态，重点是 world-tree/location 这类低竞争长尾已进首页。

---

## 5. 英文页面中文残留清单（线上 + 源码双重确认）

**攻略正文**：en 22 篇仅有 28 处中文，全部为两类：
- 19 篇 frontmatter `sourceLabel: "官方 Wiki"`（en 页面显示中文来源标签，应为 "Official Wiki"）
- pals.mdx 元素表 9 个中文元素名（无属性/火/水/草/电/冰/地/暗/龙，英文表中混中文列）

**模板层**（比 legacy 干净——最后核验/本页目录/上一章/面包屑已全部清理，线上验证无残留）：

| 位置 | 问题 | 影响面 | 线上实测 |
|---|---|---|---|
| app/[locale]/pals/page.tsx:27-29,85,87 | metadata title/description + H1 + 副标题硬编码中文 | /en/pals 标题是「Palworld Pal 图鉴」，描述全中文 | ✅ 已确认 |
| app/[locale]/items/page.tsx:15-17,78,80 | 同上 | /en/items 标题「Palworld 物品数据库」+ 中文描述 | 源码确认 |
| app/[locale]/map/page.tsx:26-28 | metadata + 图例硬编码中文 | /en/map 标题「Palworld 交互地图」 | 源码确认 |
| app/[locale]/breeding-calculator/page.tsx:20-22 | generateMetadata 不分语言（正文本身已是 zh/非zh 双语三元） | /en/breeding-calculator 标题「Palworld 养殖计算器（1.0）」+ 中文描述 | ✅ 已确认 |
| app/[locale]/page.tsx:354 | img alt「Palworld 中的 Pal 幻兽」不分语言 | en 首页图片 alt 中文 | 源码确认 |
| components/SearchBox.tsx:35 注释逻辑 | en 页副名显示中文名（「英文名 + 中文名」） | **设计如此**（搜索辅助） | — |

组件其余中文（PalCodex/ItemsBrowser/MapExplorer/Nav 等）全部是 `zh ? 中文 : English` 三元表达式——**非问题**。Nav 语言切换标签「中文/繁體/日本語」为本族语显示，正确做法。

---

## 六、内部入链分析（2,785 页静态计算）

明细 CSV：`palworld_en_inlinks.csv`。链接来源：Nav（全站）、Footer（privacy/terms）、首页 body、/pals 页 → 288 pal、/items 页 → 首屏 60 item（其余靠客户端分页）、pal 页 → 自身 breeding/location 子页 + drops 物品（经 drop-item-map.json 映射）、22 篇攻略 MDX 交叉链接、语言切换自链。

| 类型 | 入链数（实例） | 来源页数 |
|---|---|---|
| /en/items | 19,504 | 2,785 |
| /en/guide/passives | 5,580 | 2,785 |
| /en/breeding-calculator | 3,368 | 2,785 |
| /en/pals | 3,077 | 2,785 |
| /en/map | 3,076 | 2,785 |
| 导航内 10 攻略 | ~2,789–2,800 | 2,785 |
| pal 页 | 1–13（图鉴+首页热门+交叉链接） | 1–3 |
| pal/breeding、pal/location | 2（仅自家 pal 页） | 1 |
| item 页 | 0–13（drops 链接） | 0–3 |

### 孤儿/弱链页（关键发现）

- **1,717 / 1,892 item 页非自身入链来源 = 0**：既不在 /items 首页首屏 60 个之内、也不被任何 pal 的 drops 链接（drops 映射覆盖 115 个 item + 首屏 60 → 仅 175 个 item 有真实入链）。这 1,717 页**只能靠 sitemap 和客户端分页被发现**。
- pal/breeding 与 pal/location 各 288 页均只有 1 个来源页（自家 pal 详情页）——深度 3 的长尾，依赖 Google 沿 pal 页向下抓。
- pal 页中非热门非导航页只有 1–2 个来源（/pals 图鉴页 288 链接是主要保障，该页未被分页截断 ✓）。

---

## 七、数据文件与产出

| 文件 | 内容 |
|---|---|
| `palworld_en_tech_seo.csv` | 2,785 个 /en/ URL 的 indexability/canonical/hreflang/sitemap/入链数 |
| `palworld_en_inlinks.csv` | 每 URL 入链实例数、唯一来源页数 |
| `palworld_cjk_remnants.csv` | 中文残留逐行扫描（含分类：leak/设计如此/注释） |
| `gsc_28d.csv` / `gsc_28d_pages.csv` | GSC 28 天 query 明细（167 行）/ page 聚合（27 行） |
| `palworld_gsc_bands.csv` | Position 五组占比（双口径） |
| `palworld_gsc_merged.csv` | 有 GSC 数据的 URL 合并表（27 行） |
| `en_urls_sitemap.csv` | sitemap 中的 2,783 个 en URL |
| 本文件 | 汇总诊断输入 |

### 方法说明

- sitemap 状态：解析线上 sitemap.xml（16.6MB，16,698 URL，2026-09-15 拉取）
- indexability/canonical/hreflang/lang：源码 + 线上实测（/en、/en/guide/beginner、/en/pal/anubis、/en/pals、/en/breeding-calculator 五页）
- 入链：静态模板计算（Nav/Footer/首页/图鉴页首屏/物品页首屏 60/drops 映射/攻略 MDX 交叉链接），口径为「en 站内初始 HTML 中的链接实例数」；客户端分页与交互结果链接不计入
- 中文残留：源码逐行 CJK 扫描 + 分类（硬编码泄漏 / zh三元表达式设计如此 / 注释）+ 线上渲染验证
- GSC：Search Console API，28 天，filter = 页面 URL 匹配 `^https://palworld-chi\.vercel\.app/en(/|$)`

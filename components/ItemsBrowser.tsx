"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface CodexItem {
  slug: string;
  name: string;
  category: string;
  rarity: number | null;
}

const CAT_ZH: Record<string, string> = {
  Blueprint: "蓝图",
  Weapon: "武器",
  Armor: "防具",
  Essential: "基础",
  Consume: "消耗品",
  Material: "材料",
  Food: "食物",
  Accessory: "饰品",
  Ammo: "弹药",
  SpecialWeapon: "特殊武器",
  CaptureItemModifier: "捕获物改造",
  Glider: "滑翔翼",
};

const PER_PAGE = 60;

export default function ItemsBrowser({
  items,
  categories,
  locale,
  initialCategory,
  initialSort,
}: {
  items: CodexItem[];
  categories: { name: string; count: number }[];
  locale: string;
  initialCategory: string;
  initialSort: string;
}) {
  const zh = locale === "zh-CN" || locale === "zh-TW";
  const router = useRouter();

  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const catLabel = (c: string) => (zh ? CAT_ZH[c] ?? c : c);

  const filtered = useMemo(() => {
    let list = items;
    if (category !== "all") list = list.filter((it) => it.category === category);
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (it) => it.name.toLowerCase().includes(qq) || it.slug.includes(qq)
      );
    }
    const sorted = [...list];
    if (sort === "category") sorted.sort((a, b) => a.category.localeCompare(b.category));
    else if (sort === "rarity")
      sorted.sort((a, b) => (b.rarity ?? 0) - (a.rarity ?? 0));
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [items, category, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  function updateUrl(cat: string, so: string) {
    const params = new URLSearchParams();
    if (cat !== "all") params.set("category", cat);
    if (so !== "name") params.set("sort", so);
    const qs = params.toString();
    router.replace(qs ? `/${locale}/items?${qs}` : `/${locale}/items`, {
      scroll: false,
    });
  }

  return (
    <div className="codex">
      <div className="codex-toolbar">
        <div className="codex-search">
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={zh ? "搜索物品名称……" : "Search item name…"}
            autoComplete="off"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            const v = e.target.value;
            setCategory(v);
            setPage(1);
            updateUrl(v, sort);
          }}
          aria-label={zh ? "分类筛选" : "Category filter"}
        >
          <option value="all">{zh ? "全部分类" : "All Categories"}</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {catLabel(c.name)} ({c.count})
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            const v = e.target.value;
            setSort(v);
            setPage(1);
            updateUrl(category, v);
          }}
          aria-label={zh ? "排序" : "Sort"}
        >
          <option value="name">{zh ? "名称" : "Name"}</option>
          <option value="category">{zh ? "分类" : "Category"}</option>
          <option value="rarity">{zh ? "稀有度" : "Rarity"}</option>
        </select>
      </div>

      <p className="codex-result">
        {filtered.length} {zh ? "件物品" : "items"}
      </p>

      <div className="breed-list">
        {pageItems.map((it) => (
          <Link
            key={it.slug}
            href={`/${locale}/item/${it.slug}`}
            className="breed-chip"
          >
            {it.name}
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="codex-pager">
          <button
            className="btn btn-ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
          >
            {zh ? "上一页" : "Prev"}
          </button>
          <span className="codex-pager-info">
            {safePage} / {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            {zh ? "下一页" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}

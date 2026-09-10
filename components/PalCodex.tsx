"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ELEMENT_ZH } from "@/lib/pal-labels";

export interface CodexPal {
  slug: string;
  name: string;
  code: string;
  paldexIndex: number;
  elements: string[];
  attack: number | null;
  defense: number | null;
}

const ELEMENTS = [
  "Neutral",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Ice",
  "Ground",
  "Dark",
  "Dragon",
];

const PER_PAGE = 48;

export default function PalCodex({
  pals,
  locale,
  initialElement,
  initialSort,
}: {
  pals: CodexPal[];
  locale: string;
  initialElement: string;
  initialSort: string;
}) {
  const zh = locale === "zh-CN" || locale === "zh-TW";
  const router = useRouter();

  const [element, setElement] = useState(initialElement);
  const [sort, setSort] = useState(initialSort);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const elemLabel = (e: string) => (zh ? `${ELEMENT_ZH[e] ?? e} ${e}` : e);

  const filtered = useMemo(() => {
    let list = pals;
    if (element !== "all") {
      list = list.filter((p) => p.elements.includes(element));
    }
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(qq) || p.slug.toLowerCase().includes(qq)
      );
    }
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "attack")
      sorted.sort((a, b) => (b.attack ?? 0) - (a.attack ?? 0));
    else if (sort === "defense")
      sorted.sort((a, b) => (b.defense ?? 0) - (a.defense ?? 0));
    else sorted.sort((a, b) => a.paldexIndex - b.paldexIndex);
    return sorted;
  }, [pals, element, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  function updateUrl(el: string, so: string) {
    const params = new URLSearchParams();
    if (el !== "all") params.set("element", el);
    if (so !== "paldex") params.set("sort", so);
    const qs = params.toString();
    router.replace(qs ? `/${locale}/pals?${qs}` : `/${locale}/pals`, {
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
            placeholder={zh ? "搜索 Pal 名称……" : "Search Pal name…"}
            autoComplete="off"
          />
        </div>
        <select
          value={element}
          onChange={(e) => {
            const v = e.target.value;
            setElement(v);
            setPage(1);
            updateUrl(v, sort);
          }}
          aria-label={zh ? "元素筛选" : "Element filter"}
        >
          <option value="all">{zh ? "全部元素" : "All Elements"}</option>
          {ELEMENTS.map((e) => (
            <option key={e} value={e}>
              {elemLabel(e)}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            const v = e.target.value;
            setSort(v);
            setPage(1);
            updateUrl(element, v);
          }}
          aria-label={zh ? "排序" : "Sort"}
        >
          <option value="paldex">{zh ? "图鉴编号" : "Paldeck #"}</option>
          <option value="name">{zh ? "名称" : "Name"}</option>
          <option value="attack">{zh ? "攻击力" : "Attack"}</option>
          <option value="defense">{zh ? "防御力" : "Defense"}</option>
        </select>
      </div>

      <p className="codex-result">
        {filtered.length} {zh ? "只 Pal" : "Pals"}
      </p>

      <div className="pal-grid">
        {pageItems.map((p) => (
          <Link
            key={p.slug}
            className="pal-card"
            href={`/${locale}/pal/${p.slug}`}
          >
            <img
              src={`/images/pals/${p.code}.png`}
              alt={p.name}
              loading="lazy"
              width={56}
              height={56}
            />
            <span className="pal-name">{p.name}</span>
            <span className="pal-no">#{p.paldexIndex}</span>
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

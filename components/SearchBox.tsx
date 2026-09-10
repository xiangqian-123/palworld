"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SearchResult } from "@/lib/search";

// 搜索框文案（第一版内建，按语言前缀判断；后续要完整 i18n 再迁到 messages）。
function labels(locale: string) {
  const zh = locale === "zh-CN" || locale === "zh-TW";
  return {
    placeholder: zh
      ? "搜索 Pal、物品、材料、Boss、攻略……"
      : "Search Pals, items, materials, bosses, guides…",
    pals: zh ? "Pal 图鉴" : "Pals",
    items: zh ? "物品" : "Items",
    guides: zh ? "攻略" : "Guides",
    empty: zh ? "没有找到相关结果" : "No results found",
  };
}

export default function SearchBox({
  locale,
  compact = false,
}: {
  locale: string;
  compact?: boolean;
}) {
  const L = labels(locale);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setRes(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = (await fetch(
          `/api/search?q=${encodeURIComponent(q)}&locale=${locale}`
        ).then((r) => r.json())) as SearchResult;
        setRes(r);
      } catch {
        setRes(null);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [q, locale]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const total = res
    ? res.pals.length + res.items.length + res.guides.length
    : 0;

  function close() {
    setOpen(false);
    setQ("");
  }

  return (
    <div className={`searchbox${compact ? " searchbox-compact" : ""}`} ref={boxRef}>
      <div className="searchbox-input">
        <svg
          className="searchbox-icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          placeholder={L.placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          aria-label={L.placeholder}
        />
      </div>

      {open && q.trim() && (
        <div className="search-drop">
          {res && total === 0 && <p className="search-empty">{L.empty}</p>}
          {res && res.pals.length > 0 && (
            <div className="search-group">
              <h4>{L.pals}</h4>
              {res.pals.map((h) => (
                <Link
                  key={h.slug}
                  href={`/${locale}/pal/${h.slug}`}
                  onClick={close}
                  className="search-hit"
                >
                  <span className="search-hit-name">{h.name}</span>
                  {h.sub && <span className="search-hit-sub">{h.sub}</span>}
                </Link>
              ))}
            </div>
          )}
          {res && res.items.length > 0 && (
            <div className="search-group">
              <h4>{L.items}</h4>
              {res.items.map((h) => (
                <Link
                  key={h.slug}
                  href={`/${locale}/item/${h.slug}`}
                  onClick={close}
                  className="search-hit"
                >
                  <span className="search-hit-name">{h.name}</span>
                  {h.sub && <span className="search-hit-sub">{h.sub}</span>}
                </Link>
              ))}
            </div>
          )}
          {res && res.guides.length > 0 && (
            <div className="search-group">
              <h4>{L.guides}</h4>
              {res.guides.map((h) => (
                <Link
                  key={h.slug}
                  href={`/${locale}/guide/${h.slug}`}
                  onClick={close}
                  className="search-hit"
                >
                  <span className="search-hit-name">{h.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

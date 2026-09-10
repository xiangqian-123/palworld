"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface MapItem {
  id: string;
  type: "pal" | "boss";
  name: string;
  zhName: string;
  palSlug: string | null;
  x: number;
  y: number;
}

export default function MapExplorer({
  locations,
  locale,
}: {
  locations: MapItem[];
  locale: string;
}) {
  const zh = locale === "zh-CN" || locale === "zh-TW";
  const [filter, setFilter] = useState<"pal" | "boss">("pal");
  const [selected, setSelected] = useState<string | null>(null);

  const palCount = locations.filter((l) => l.type === "pal").length;
  const bossCount = locations.filter((l) => l.type === "boss").length;

  const filtered = useMemo(
    () => locations.filter((l) => l.type === filter),
    [locations, filter]
  );

  // SVG 坐标归一化
  const W = 1000;
  const H = 700;
  const PAD = 40;
  const xs = filtered.map((l) => l.x);
  const ys = filtered.map((l) => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = (x: number) =>
    PAD + ((x - minX) / (maxX - minX || 1)) * (W - 2 * PAD);
  const sy = (y: number) =>
    PAD + ((y - minY) / (maxY - minY || 1)) * (H - 2 * PAD);

  function display(l: MapItem): { main: string; secondary?: string } {
    if (zh) {
      return { main: l.zhName || l.name, secondary: l.zhName ? l.name : undefined };
    }
    return { main: l.name, secondary: l.zhName || undefined };
  }

  return (
    <div className="map-explorer">
      <div className="map-filter">
        <button
          className={filter === "pal" ? "active" : ""}
          onClick={() => {
            setFilter("pal");
            setSelected(null);
          }}
        >
          {zh ? "Pal" : "Pal"} ({palCount})
        </button>
        <button
          className={filter === "boss" ? "active" : ""}
          onClick={() => {
            setFilter("boss");
            setSelected(null);
          }}
        >
          {zh ? "Boss" : "Boss"} ({bossCount})
        </button>
      </div>

      <div className="map-area">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Palworld map">
          <rect x="0" y="0" width={W} height={H} rx="12" className="map-bg" />
          {filtered.map((l) => (
            <circle
              key={l.id}
              cx={sx(l.x)}
              cy={sy(l.y)}
              r={l.type === "boss" ? 5 : 3}
              className={`map-dot map-dot-${l.type}${
                selected === l.id ? " active" : ""
              }`}
              onClick={() => setSelected(selected === l.id ? null : l.id)}
            />
          ))}
        </svg>
        {selected && (
          <div className="map-tooltip">
            {(() => {
              const l = filtered.find((x) => x.id === selected);
              if (!l) return null;
              const d = display(l);
              return (
                <>
                  <strong>{d.main}</strong>
                  {d.secondary && <span>{d.secondary}</span>}
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="map-list">
        {filtered.map((l) => {
          const d = display(l);
          return (
            <Link
              key={l.id}
              href={
                l.palSlug
                  ? `/${locale}/pal/${l.palSlug}/location`
                  : `/${locale}/guide/map`
              }
              className="map-list-item"
            >
              <span className="map-list-name">{d.main}</span>
              {d.secondary && (
                <span className="map-list-secondary">{d.secondary}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

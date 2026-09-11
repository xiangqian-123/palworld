"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

export interface MapItem {
  id: string;
  type: "pal" | "boss" | "resource" | "base" | "fast-travel";
  main: string;
  secondary?: string;
  palSlug: string | null;
  x: number;
  y: number;
  region?: string;
  description?: string;
  resourceType?: string;
}

const VIEW_W = 1000;
const VIEW_H = 700;

const TYPE_ORDER: MapItem["type"][] = [
  "pal",
  "boss",
  "resource",
  "base",
  "fast-travel",
];

export default function MapExplorer({
  locations,
  locale,
}: {
  locations: MapItem[];
  locale: string;
}) {
  const zh = locale === "zh-CN" || locale === "zh-TW";

  const typeLabel: Record<MapItem["type"], string> = {
    pal: zh ? "Pal" : "Pal",
    boss: zh ? "Alpha Boss" : "Alpha Boss",
    resource: zh ? "资源" : "Resource",
    base: zh ? "基地" : "Base",
    "fast-travel": zh ? "快速旅行" : "Fast Travel",
  };

  // 每个类型的数量（有数据才显示 Filter 按钮）
  const counts = useMemo(() => {
    const m = new Map<MapItem["type"], number>();
    for (const l of locations) m.set(l.type, (m.get(l.type) ?? 0) + 1);
    return m;
  }, [locations]);

  const visibleTypes = TYPE_ORDER.filter((t) => (counts.get(t) ?? 0) > 0);

  const [filter, setFilter] = useState<MapItem["type"]>(
    visibleTypes[0] ?? "pal"
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null
  );

  const filtered = useMemo(
    () => locations.filter((l) => l.type === filter),
    [locations, filter]
  );

  const MIN_X = -1800;
  const MAX_X = 1100;
  const MIN_Y = -2100;
  const MAX_Y = 900;
  const sx = (x: number) => ((x - MIN_X) / (MAX_X - MIN_X)) * VIEW_W;
  const sy = (y: number) => ((MAX_Y - y) / (MAX_Y - MIN_Y)) * VIEW_H;

  function zoomIn() {
    setView((v) => ({ ...v, scale: Math.min(v.scale * 1.4, 8) }));
  }
  function zoomOut() {
    setView((v) => ({ ...v, scale: Math.max(v.scale / 1.4, 0.5) }));
  }
  function reset() {
    setView({ scale: 1, tx: 0, ty: 0 });
    setSelected(null);
  }
  function onWheel(e: React.WheelEvent) {
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    setView((v) => ({
      ...v,
      scale: Math.min(Math.max(v.scale * factor, 0.5), 8),
    }));
  }
  function onMouseDown(e: React.MouseEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    setView((v) => ({
      ...v,
      tx: dragRef.current!.tx + (e.clientX - dragRef.current!.x),
      ty: dragRef.current!.ty + (e.clientY - dragRef.current!.y),
    }));
  }
  function onMouseUp() {
    dragRef.current = null;
  }

  function linkOf(l: MapItem): string {
    if (l.palSlug) return `/${locale}/pal/${l.palSlug}/location`;
    if (l.type === "resource") return `/${locale}/guide/materials`;
    if (l.type === "base") return `/${locale}/guide/base`;
    return `/${locale}/map`;
  }

  const sel = filtered.find((l) => l.id === selected);

  return (
    <div className="map-explorer">
      <div className="map-toolbar">
        <div className="map-filter">
          {visibleTypes.map((t) => (
            <button
              key={t}
              className={filter === t ? "active" : ""}
              onClick={() => {
                setFilter(t);
                setSelected(null);
              }}
            >
              {typeLabel[t]} ({counts.get(t)})
            </button>
          ))}
        </div>
        <div className="map-zoom">
          <button onClick={zoomIn} aria-label="Zoom in">+</button>
          <button onClick={zoomOut} aria-label="Zoom out">−</button>
          <button onClick={reset} aria-label="Reset">⤾</button>
        </div>
      </div>

      <div
        className="map-area"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Palworld map">
          <defs>
            <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--map-grid)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} rx="12" className="map-bg" />
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} rx="12" fill="url(#map-grid)" />
          <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
            {filtered.map((l) => (
              <circle
                key={l.id}
                cx={sx(l.x)}
                cy={sy(l.y)}
                r={l.type === "boss" || l.type === "resource" ? 5 : l.type === "base" ? 6 : l.type === "fast-travel" ? 4 : 3}
                className={`map-dot map-dot-${l.type}${selected === l.id ? " active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(selected === l.id ? null : l.id);
                }}
              />
            ))}
          </g>
        </svg>

        {sel && (
          <div className="map-tooltip">
            <div className="map-tooltip-type">{typeLabel[sel.type]}</div>
            <strong className="map-tooltip-name">{sel.main}</strong>
            {sel.secondary && (
              <span className="map-tooltip-en">{sel.secondary}</span>
            )}
            {sel.description && (
              <div className="map-tooltip-desc">{sel.description}</div>
            )}
            <div className="map-tooltip-coord">
              {zh ? "坐标" : "Coords"}: {sel.x}, {sel.y}
            </div>
            <Link className="map-tooltip-link" href={linkOf(sel)}>
              {zh ? "查看详情 →" : "View details →"}
            </Link>
          </div>
        )}
      </div>

      <div className="map-list">
        {filtered.map((l) => (
          <Link key={l.id} href={linkOf(l)} className="map-list-item">
            <span className="map-list-name">{l.main}</span>
            {l.secondary && (
              <span className="map-list-secondary">{l.secondary}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

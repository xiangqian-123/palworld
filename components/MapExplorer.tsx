"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

export interface MapItem {
  id: string;
  type: "pal" | "boss";
  name: string;
  zhName: string;
  palSlug: string | null;
  x: number;
  y: number;
}

const VIEW_W = 1000;
const VIEW_H = 700;

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
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null
  );

  const palCount = locations.filter((l) => l.type === "pal").length;
  const bossCount = locations.filter((l) => l.type === "boss").length;

  const filtered = useMemo(
    () => locations.filter((l) => l.type === filter),
    [locations, filter]
  );

  // 坐标归一化到 viewBox（pal-map 坐标系，实际范围约 -1750~950 / -2050~850）
  const MIN_X = -1800;
  const MAX_X = 1000;
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

  function display(l: MapItem): { main: string; secondary?: string } {
    if (zh) {
      return { main: l.zhName || l.name, secondary: l.zhName ? l.name : undefined };
    }
    return { main: l.name, secondary: l.zhName || undefined };
  }

  const sel = filtered.find((l) => l.id === selected);

  return (
    <div className="map-explorer">
      <div className="map-toolbar">
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
                r={l.type === "boss" ? 5 : 3}
                className={`map-dot map-dot-${l.type}${
                  selected === l.id ? " active" : ""
                }`}
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
            <div className="map-tooltip-type">
              {sel.type === "boss" ? (zh ? "Alpha Boss" : "Alpha Boss") : (zh ? "Pal" : "Pal")}
            </div>
            <strong className="map-tooltip-name">{display(sel).main}</strong>
            {display(sel).secondary && (
              <span className="map-tooltip-en">{display(sel).secondary}</span>
            )}
            <div className="map-tooltip-coord">
              {zh ? "坐标" : "Coords"}: {sel.x}, {sel.y}
            </div>
            {sel.palSlug && (
              <Link
                className="map-tooltip-link"
                href={`/${locale}/pal/${sel.palSlug}/location`}
              >
                {zh ? "查看位置详情 →" : "View location →"}
              </Link>
            )}
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
                  : `/${locale}/map`
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

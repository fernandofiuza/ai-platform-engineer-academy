"use client";

import * as React from "react";

type Datum = { label: string; value: number };

const W = 600;
const H = 120;
const PAD = 10;

export function MiniLineChart({
  data,
  valueSuffix = "",
  height = 120,
}: {
  data: Datum[];
  valueSuffix?: string;
  height?: number;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * (W - PAD * 2) + PAD : W / 2;
    const y = H - PAD - ((d.value - min) / range) * (H - PAD * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x},${H - PAD} L${points[0].x},${H - PAD} Z`
      : "";

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const shown = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">
        {shown ? (
          <>
            <span className="font-medium text-foreground">
              {shown.value}
              {valueSuffix}
            </span>{" "}
            — {shown.label}
          </>
        ) : (
          "Sem dados"
        )}
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        className="overflow-visible"
      >
        <path d={areaPath} className="fill-primary/10" />
        <path d={linePath} className="fill-none stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hoverIndex !== null && points[hoverIndex] ? (
          <line
            x1={points[hoverIndex].x}
            x2={points[hoverIndex].x}
            y1={PAD}
            y2={H - PAD}
            className="stroke-border"
            strokeWidth={1}
          />
        ) : null}
        {points.length > 0 ? (
          <>
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={6} className="fill-background" />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} className="fill-primary" />
          </>
        ) : null}
        {hoverIndex !== null && points[hoverIndex] ? (
          <>
            <circle cx={points[hoverIndex].x} cy={points[hoverIndex].y} r={6} className="fill-background" />
            <circle cx={points[hoverIndex].x} cy={points[hoverIndex].y} r={4} className="fill-primary" />
          </>
        ) : null}
      </svg>
    </div>
  );
}

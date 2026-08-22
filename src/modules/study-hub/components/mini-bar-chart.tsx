"use client";

import * as React from "react";

type Datum = { label: string; value: number };

export function MiniBarChart({
  data,
  valueSuffix = "",
  height = 96,
}: {
  data: Datum[];
  valueSuffix?: string;
  height?: number;
}) {
  const [hovered, setHovered] = React.useState<Datum | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const shown = hovered ?? data[data.length - 1] ?? null;

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
      <div className="flex items-end gap-0.5" style={{ height }}>
        {data.map((d, i) => {
          const percent = Math.max(2, Math.round((d.value / max) * 100));
          return (
            <button
              key={i}
              type="button"
              aria-label={`${d.label}: ${d.value}${valueSuffix}`}
              className="max-w-6 flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary focus-visible:bg-primary focus-visible:outline-none"
              style={{ height: `${percent}%` }}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(d)}
              onBlur={() => setHovered(null)}
            />
          );
        })}
      </div>
    </div>
  );
}

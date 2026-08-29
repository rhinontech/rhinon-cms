"use client";

import { useMemo, useState } from "react";
import { TbMapPin, TbWorldOff } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { MAP_HEIGHT, MAP_WIDTH, WORLD_LAND_PATH, projectLngLat } from "./worldMap";

export interface MappableVisitor {
  id: string;
  /** Null for anonymous pageview traffic; set for email-identified visitors. */
  email?: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  location: string | null;
  latitude?: number | null;
  longitude?: number | null;
  visitedAt: string;
  /** Email-identified visitors are drawn in a second colour. */
  identified?: boolean;
  channel?: string | null;
  company?: string | null;
}

interface Plotted {
  id: string;
  x: number;
  y: number;
  visitor: MappableVisitor;
}

/**
 * Deterministic jitter, derived from the visitor id.
 *
 * IP geolocation resolves to a city centroid, so every visitor from one city lands on the
 * exact same pixel and a hundred dots look like one. Nudging each dot a couple of px by a
 * hash of its id keeps "one dot = one visitor" true while making density visible. It must
 * be deterministic or dots would jump on every re-render.
 */
function jitter(id: string, axis: number): number {
  let h = 2166136261 ^ axis;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // → roughly -3.5 .. 3.5 viewBox units
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 7;
}

export function VisitorsMap({
  visitors,
  showSummary = true,
  className,
}: {
  visitors: MappableVisitor[];
  showSummary?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState<Plotted | null>(null);

  const { points, missing, countries } = useMemo(() => {
    const points: Plotted[] = [];
    let missing = 0;
    const countries = new Set<string>();

    for (const v of visitors) {
      if (typeof v.latitude !== "number" || typeof v.longitude !== "number") {
        missing++;
        continue;
      }
      const { x, y } = projectLngLat(v.longitude, v.latitude);
      points.push({
        id: v.id,
        x: x + jitter(v.id, 1),
        y: y + jitter(v.id, 2),
        visitor: v,
      });
      if (v.country) countries.add(v.country);
    }
    return { points, missing, countries: countries.size };
  }, [visitors]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Summary strip */}
      {showSummary && (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <strong className="font-semibold text-foreground">{points.length}</strong> plotted
        </span>
        <span>
          <strong className="font-semibold text-foreground">{countries}</strong>{" "}
          {countries === 1 ? "country" : "countries"}
        </span>
        {missing > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <TbWorldOff size={13} />
            {missing} without a resolved location
          </span>
        )}
      </div>
      )}

      <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-auto block"
          role="img"
          aria-label="World map of visitor locations"
          onMouseLeave={() => setHovered(null)}
        >
          {/* Graticule — light reference grid every 30° */}
          <g className="stroke-border/60" strokeWidth={0.5} fill="none">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={(i + 1) * (MAP_WIDTH / 12)} y1={0} x2={(i + 1) * (MAP_WIDTH / 12)} y2={MAP_HEIGHT} />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={(i + 1) * (MAP_HEIGHT / 6)} x2={MAP_WIDTH} y2={(i + 1) * (MAP_HEIGHT / 6)} />
            ))}
          </g>

          {/* Land */}
          <path
            d={WORLD_LAND_PATH}
            className="fill-foreground/[0.08] stroke-foreground/20"
            strokeWidth={0.4}
            strokeLinejoin="round"
          />

          {/* One dot per visitor. Halo first so it sits under every dot. */}
          <g>
            {points.map((p) => (
              <circle
                key={`halo-${p.id}`}
                cx={p.x}
                cy={p.y}
                r={4}
                className={p.visitor.identified ? "fill-emerald-500/20" : "fill-blue-500/15"}
              />
            ))}
            {points.map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={hovered?.id === p.id ? 4 : 2.2}
                className={cn(
                  "cursor-pointer transition-all",
                  hovered?.id === p.id
                    ? "stroke-white " + (p.visitor.identified ? "fill-emerald-300" : "fill-blue-300")
                    : p.visitor.identified
                      ? "fill-emerald-500"
                      : "fill-blue-500"
                )}
                strokeWidth={hovered?.id === p.id ? 1 : 0}
                onMouseEnter={() => setHovered(p)}
              />
            ))}
          </g>
        </svg>

        {/* Tooltip, positioned in percentage terms so it tracks the responsive SVG */}
        {hovered && (
          <div
            className="pointer-events-none absolute z-10 max-w-[240px] -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
            style={{
              left: `${(hovered.x / MAP_WIDTH) * 100}%`,
              top: `${(hovered.y / MAP_HEIGHT) * 100 - 1.5}%`,
            }}
          >
            <p className="truncate text-xs font-semibold text-foreground">
              {hovered.visitor.email || hovered.visitor.company || "Anonymous visitor"}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <TbMapPin size={11} />
              {hovered.visitor.location ||
                [hovered.visitor.city, hovered.visitor.region, hovered.visitor.country]
                  .filter(Boolean)
                  .join(", ") ||
                "Unknown"}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              {new Date(hovered.visitor.visitedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {hovered.visitor.channel ? ` · ${hovered.visitor.channel}` : ""}
            </p>
          </div>
        )}

        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <p className="text-sm text-muted-foreground">No visitors with a resolved location in this range.</p>
          </div>
        )}
      </div>
    </div>
  );
}

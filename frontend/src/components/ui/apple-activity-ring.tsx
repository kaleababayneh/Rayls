"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ActivityRingData {
  label: string;
  sublabel?: string;
  value: number;
  max: number;
  /** CSS colour — used for the arc stroke and glow */
  color: string;
  /** Track colour — defaults to color at 12% opacity */
  trackColor?: string;
}

interface AppleActivityCardProps {
  rings: ActivityRingData[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const SIZE = 200;
const STROKE = 14;
const GAP = 10; // px between rings

function SingleRing({
  ring,
  index,
}: {
  ring: ActivityRingData;
  index: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(
      () => setProgress(ring.max > 0 ? Math.min(ring.value / ring.max, 1) : 0),
      80 + index * 140
    );
    return () => clearTimeout(t);
  }, [ring.value, ring.max, index]);

  const r = SIZE / 2 - STROKE / 2 - index * (STROKE + GAP);
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  const track = ring.trackColor ?? ring.color;

  return (
    <g>
      {/* Track ring */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={STROKE}
        strokeOpacity={0.12}
        strokeLinecap="round"
      />
      {/* Progress arc */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={r}
        fill="none"
        stroke={ring.color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{
          transition: `stroke-dashoffset 1.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.18}s`,
          filter: `drop-shadow(0 0 5px ${ring.color}cc)`,
        }}
      />
      {/* Cap dot at start of arc so it looks sealed */}
      {progress > 0.005 && (
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2 - r}
          r={STROKE / 2}
          fill={ring.color}
          style={{ filter: `drop-shadow(0 0 3px ${ring.color})` }}
        />
      )}
    </g>
  );
}

export function AppleActivityCard({
  rings,
  title = "Chain Activity",
  subtitle,
  className,
}: AppleActivityCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6",
        className
      )}
    >
      {/* Ring diagram */}
      <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE}>
          {rings.map((ring, i) => (
            <SingleRing key={ring.label} ring={ring} index={i} />
          ))}
        </svg>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Total
          </span>
          <span className="text-3xl font-bold text-zinc-100 tabular-nums leading-none mt-0.5">
            {rings.reduce((s, r) => s + r.value, 0)}
          </span>
          <span className="text-[9px] text-zinc-600 mt-0.5 tracking-wider">events</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full">
        {title && (
          <h3 className="text-lg font-bold text-zinc-100 mb-1">{title}</h3>
        )}
        {subtitle && (
          <p className="text-xs text-zinc-500 mb-4">{subtitle}</p>
        )}
        <div className="space-y-3">
          {rings.map((ring) => {
            const pct = ring.max > 0 ? Math.round((ring.value / ring.max) * 100) : 0;
            return (
              <div key={ring.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: ring.color,
                        boxShadow: `0 0 6px ${ring.color}`,
                      }}
                    />
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
                      {ring.label}
                    </span>
                    {ring.sublabel && (
                      <span className="text-[10px] text-zinc-600">{ring.sublabel}</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-xl font-bold tabular-nums leading-none"
                      style={{ color: ring.color }}
                    >
                      {ring.value}
                    </span>
                    <span className="text-xs text-zinc-600">/ {ring.max}</span>
                  </div>
                </div>
                {/* Thin progress bar */}
                <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: ring.color,
                      boxShadow: `0 0 6px ${ring.color}88`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

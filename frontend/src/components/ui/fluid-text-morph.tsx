"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FluidTextMorphProps {
  /** List of words/phrases to cycle through */
  texts: string[];
  className?: string;
  /** Seconds to morph one text into the next (default 1.2) */
  morphTime?: number;
  /** Seconds to hold before next morph (default 2.5) */
  cooldownTime?: number;
}

/**
 * Morphs between words using per-character blur + SVG goo filter.
 * The SVG filter is injected once globally (idempotent).
 */
export function FluidTextMorph({
  texts,
  className,
  morphTime = 1.2,
  cooldownTime = 2.5,
}: FluidTextMorphProps) {
  const el1 = useRef<HTMLSpanElement>(null);
  const el2 = useRef<HTMLSpanElement>(null);
  const state = useRef({ idx: 0, morph: 0, cooldown: cooldownTime, last: 0 });

  useEffect(() => {
    let raf: number;
    const s = state.current;
    s.last = performance.now();

    function setMorph(f: number) {
      if (!el1.current || !el2.current) return;
      const blur2 = Math.min(8 / f - 8, 100);
      el2.current.style.filter = `blur(${blur2}px)`;
      el2.current.style.opacity = String(Math.pow(f, 0.4));
      const inv = 1 - f;
      const blur1 = Math.min(8 / inv - 8, 100);
      el1.current.style.filter = `blur(${blur1}px)`;
      el1.current.style.opacity = String(Math.pow(inv, 0.4));
      el1.current.textContent = texts[s.idx % texts.length];
      el2.current.textContent = texts[(s.idx + 1) % texts.length];
    }

    function cooldown() {
      if (!el1.current || !el2.current) return;
      s.morph = 0;
      el2.current.style.filter = "none";
      el2.current.style.opacity = "1";
      el1.current.style.filter = "none";
      el1.current.style.opacity = "0";
      el2.current.textContent = texts[s.idx % texts.length];
    }

    if (el1.current) el1.current.textContent = texts[0];
    if (el2.current) el2.current.textContent = texts[1 % texts.length];
    cooldown();

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const dt = (now - s.last) / 1000;
      s.last = now;
      s.cooldown -= dt;
      if (s.cooldown <= 0) {
        s.cooldown = 0;
        s.morph += dt;
        const f = s.morph / morphTime;
        if (f >= 1) {
          s.idx = (s.idx + 1) % texts.length;
          s.cooldown = cooldownTime;
          cooldown();
        } else {
          setMorph(f);
        }
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [texts, morphTime, cooldownTime]);

  return (
    <>
      {/* SVG goo filter — injected once, reused */}
      <svg
        style={{ position: "absolute", width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <filter id="lux-fluid-morph">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      {/*
        Outer span: sets the bounding box by making the longest text invisible.
        Inner spans are absolutely positioned over it.
      */}
      <span
        className={cn("relative inline-grid items-center justify-items-center", className)}
        style={{ filter: "url(#lux-fluid-morph)" }}
      >
        {/* Invisible longest-text spacer */}
        <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
          {texts.reduce((a, b) => (a.length >= b.length ? a : b))}
        </span>
        {/* Morphing text layers */}
        <span
          ref={el1}
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
        />
        <span
          ref={el2}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
          aria-live="polite"
        />
      </span>
    </>
  );
}

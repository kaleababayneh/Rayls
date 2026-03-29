"use client";

import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  /** Override default pill width (px). Default: 142 for text, 46 for icon. */
  width?: number;
}

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  viewMode = "text",
  width: widthOverride,
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered]     = useState(false);
  const [isPressed, setIsPressed]     = useState(false);
  const [ripples, setRipples]         = useState<Array<{ x: number; y: number; id: number }>>([]);
  const shaderRef   = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaderMount = useRef<any>(null);
  const buttonRef   = useRef<HTMLButtonElement>(null);
  const rippleId    = useRef(0);

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      const s = widthOverride ?? 46;
      return { width: s, height: s, innerWidth: s - 4, innerHeight: s - 4, shaderWidth: s, shaderHeight: s };
    }
    const w = widthOverride ?? 142;
    return { width: w, height: 46, innerWidth: w - 4, innerHeight: 42, shaderWidth: w, shaderHeight: 46 };
  }, [viewMode, widthOverride]);

  useEffect(() => {
    /* Inject per-canvas CSS once */
    const styleId = "lux-shader-canvas-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .lux-shader-container canvas {
          width: 100% !important; height: 100% !important;
          display: block !important; position: absolute !important;
          top: 0 !important; left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes lux-ripple {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    if (shaderRef.current) {
      if (shaderMount.current?.destroy) shaderMount.current.destroy();
      shaderMount.current = new ShaderMount(
        shaderRef.current,
        liquidMetalFragmentShader,
        {
          u_repetition: 4,
          u_softness: 0.5,
          u_shiftRed: 0.3,
          u_shiftBlue: 0.3,
          u_distortion: 0,
          u_contour: 0,
          u_angle: 45,
          u_scale: 8,
          u_shape: 1,
          u_offsetX: 0.1,
          u_offsetY: -0.1,
        },
        undefined,
        0.6
      );
    }

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy();
        shaderMount.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => { setIsHovered(true);  shaderMount.current?.setSpeed?.(1); };
  const handleMouseLeave = () => { setIsHovered(false); setIsPressed(false); shaderMount.current?.setSpeed?.(0.6); };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => shaderMount.current?.setSpeed?.(isHovered ? 1 : 0.6), 300);
    }
    if (buttonRef.current) {
      const rect   = buttonRef.current.getBoundingClientRect();
      const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 600);
    }
    onClick?.();
  };

  const transition = "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease";

  return (
    <div className="relative inline-block" style={{ perspective: "1000px", perspectiveOrigin: "50% 50%" }}>
      <div style={{ position: "relative", width: dimensions.width, height: dimensions.height, transformStyle: "preserve-3d", transition }}>

        {/* Label layer — z:30 */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transformStyle: "preserve-3d", transition, transform: "translateZ(20px)", zIndex: 30, pointerEvents: "none" }}>
          {viewMode === "icon" && (
            <Sparkles size={16} style={{ color: "#888", filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.5))", transition }} />
          )}
          {viewMode === "text" && (
            <span style={{ fontSize: 14, color: "#888", fontWeight: 400, textShadow: "0px 1px 2px rgba(0,0,0,0.5)", transition, whiteSpace: "nowrap" }}>
              {label}
            </span>
          )}
        </div>

        {/* Dark inner pill — z:20 */}
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transition, transform: `translateZ(10px) ${isPressed ? "translateY(1px) scale(0.98)" : ""}`, zIndex: 20 }}>
          <div style={{
            width: dimensions.innerWidth, height: dimensions.innerHeight, margin: 2,
            borderRadius: 100,
            background: "linear-gradient(180deg, #202020 0%, #000000 100%)",
            boxShadow: isPressed ? "inset 0px 2px 4px rgba(0,0,0,0.4), inset 0px 1px 2px rgba(0,0,0,0.3)" : "none",
            transition,
          }} />
        </div>

        {/* Shader chrome ring — z:10 */}
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transition, transform: `translateZ(0px) ${isPressed ? "translateY(1px) scale(0.98)" : ""}`, zIndex: 10 }}>
          <div style={{
            width: dimensions.width, height: dimensions.height, borderRadius: 100,
            boxShadow: isPressed
              ? "0px 0px 0px 1px rgba(0,0,0,0.5), 0px 1px 2px 0px rgba(0,0,0,0.3)"
              : isHovered
                ? "0px 0px 0px 1px rgba(0,0,0,0.4), 0px 12px 6px 0px rgba(0,0,0,0.05), 0px 8px 5px 0px rgba(0,0,0,0.1), 0px 4px 4px 0px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.2)"
                : "0px 0px 0px 1px rgba(0,0,0,0.3), 0px 20px 12px 0px rgba(0,0,0,0.08), 0px 9px 9px 0px rgba(0,0,0,0.12), 0px 2px 5px 0px rgba(0,0,0,0.15)",
            transition,
            background: "transparent",
          }}>
            <div
              ref={shaderRef}
              className="lux-shader-container"
              style={{ borderRadius: 100, overflow: "hidden", position: "relative", width: dimensions.shaderWidth, height: dimensions.shaderHeight }}
            />
          </div>
        </div>

        {/* Invisible clickable layer — z:40 */}
        <button
          ref={buttonRef}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          style={{ position: "absolute", inset: 0, background: "transparent", border: "none", cursor: "pointer", outline: "none", zIndex: 40, transformStyle: "preserve-3d", transform: "translateZ(25px)", transition, overflow: "hidden", borderRadius: 100 }}
          aria-label={label}
        >
          {ripples.map((r) => (
            <span
              key={r.id}
              style={{
                position: "absolute", left: r.x, top: r.y, width: 20, height: 20,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)",
                pointerEvents: "none",
                animation: "lux-ripple 0.6s ease-out",
              }}
            />
          ))}
        </button>
      </div>
    </div>
  );
}

"use client";

import {
  motion,
  LayoutGroup,
  AnimatePresence,
  type Transition,
} from "framer-motion";
import {
  List,
  LayoutGrid,
  Layers,
  Star,
  Tag,
  Watch,
  Shield,
  Award,
  Clock,
  Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

export interface CollectionItem {
  id: string;
  title: string;       // model name
  subtitle: string;    // brand
  idNumber: string;    // token id or reference number
  image: string;       // Unsplash URL
  score?: number;      // AI score
  condition?: string;
  year?: number;
  material?: string;
  brand?: string;
}

interface AnimatedCollectionProps {
  items: CollectionItem[];
  onItemClick?: (item: CollectionItem) => void;
  className?: string;
}

type ViewMode = "list" | "card" | "pack";

const snappySpring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 1,
};

const fastFade: Transition = {
  duration: 0.12,
  ease: "linear",
};

function getScoreColor(score?: number) {
  if (!score) return "text-zinc-500";
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function getScoreBg(score?: number) {
  if (!score) return "bg-zinc-800 border-zinc-700";
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

/* ── Icon for each watch category ── */
function WatchIcon({ condition }: { condition?: string }) {
  if (!condition) return <Watch size={12} className="text-emerald-400/70" />;
  const c = condition.toLowerCase();
  if (c.includes("mint") || c === "new") return <Gem size={12} className="text-emerald-400/70" />;
  if (c.includes("excel") || c === "unworn") return <Award size={12} className="text-blue-400/70" />;
  if (c.includes("good")) return <Shield size={12} className="text-amber-400/70" />;
  return <Clock size={12} className="text-zinc-400/70" />;
}

export function AnimatedCollection({
  items,
  onItemClick,
  className,
}: AnimatedCollectionProps) {
  const [view, setView] = useState<ViewMode>("list");

  if (items.length === 0) return null;

  return (
    <div className={cn("w-full", className)}>
      {/* View switcher */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-zinc-500 tracking-wide">
          {items.length} watch{items.length !== 1 ? "es" : ""} in your vault
        </p>
        <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800 gap-0.5">
          <TabBtn
            active={view === "list"}
            onClick={() => setView("list")}
            Icon={List}
            label="List"
          />
          <TabBtn
            active={view === "card"}
            onClick={() => setView("card")}
            Icon={LayoutGrid}
            label="Grid"
          />
          <TabBtn
            active={view === "pack"}
            onClick={() => setView("pack")}
            Icon={Layers}
            label="Pack"
          />
        </div>
      </div>

      {/* Separator */}
      <div className="h-px w-full bg-zinc-800 mb-6" />

      {/* Items */}
      <div className="relative min-h-[320px]">
        <LayoutGroup>
          <motion.div
            layout
            transition={snappySpring}
            className={cn(
              "w-full relative",
              view === "list" && "flex flex-col gap-3",
              view === "card" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5",
              view === "pack" && "flex items-center justify-center mt-8 h-72"
            )}
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                transition={snappySpring}
                onClick={() => onItemClick?.(item)}
                className={cn(
                  "relative flex items-center z-10 cursor-pointer group",
                  view === "list" && "flex-row gap-4 w-full",
                  view === "card" && "flex-col gap-0 w-full items-start rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-emerald-500/25 transition-colors",
                  view === "pack" && "absolute w-60 h-60 items-center justify-center rounded-3xl overflow-hidden"
                )}
                style={{
                  zIndex: view === "pack" ? items.length - index : 1,
                }}
                animate={
                  view === "pack"
                    ? {
                        rotate: index === 0 ? -14 : index === 1 ? 6 : index * 4,
                        x: index === 0 ? -30 : index === 1 ? 28 : index * 12,
                        y: index === 0 ? -8 : index * 4,
                      }
                    : { rotate: 0, x: 0, y: 0 }
                }
              >
                {/* Image */}
                <motion.div
                  layout
                  transition={snappySpring}
                  className={cn(
                    "relative overflow-hidden shrink-0 bg-zinc-950",
                    view === "list" && "w-16 h-16 rounded-xl border border-zinc-800",
                    view === "card" && "w-full aspect-[4/3] rounded-none",
                    view === "pack" && "w-full h-full rounded-3xl border border-zinc-800 shadow-2xl"
                  )}
                >
                  <motion.img
                    layout
                    transition={snappySpring}
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Score overlay in card/pack mode */}
                  {item.score !== undefined && view !== "list" && (
                    <div
                      className={cn(
                        "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm",
                        getScoreBg(item.score),
                        getScoreColor(item.score)
                      )}
                    >
                      AI {item.score}
                    </div>
                  )}
                </motion.div>

                {/* Info row — hidden in pack view */}
                <AnimatePresence mode="popLayout" initial={false}>
                  {view !== "pack" && (
                    <motion.div
                      key={`${item.id}-info`}
                      layout
                      initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                      transition={fastFade}
                      className={cn(
                        "flex justify-between items-center min-w-0",
                        view === "list" && "flex-1 px-0",
                        view === "card" && "w-full px-4 py-3"
                      )}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <motion.p
                          layout
                          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500"
                        >
                          {item.subtitle}
                        </motion.p>
                        <motion.h3
                          layout
                          className="font-semibold text-sm text-zinc-100 leading-tight truncate"
                        >
                          {item.title}
                        </motion.h3>
                        {view === "list" && (
                          <motion.div
                            layout
                            className="text-zinc-600 text-xs flex items-center gap-1.5 mt-0.5"
                          >
                            <WatchIcon condition={item.condition} />
                            <span className="truncate">
                              {item.condition}
                              {item.year ? ` · ${item.year}` : ""}
                              {item.material ? ` · ${item.material}` : ""}
                            </span>
                          </motion.div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.score !== undefined && view === "list" && (
                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full border",
                              getScoreBg(item.score),
                              getScoreColor(item.score)
                            )}
                          >
                            {item.score}
                          </span>
                        )}
                        <motion.div
                          layout
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400"
                        >
                          <Star size={9} className="text-amber-400 fill-amber-400" />
                          <span>#{item.idNumber}</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* Pack mode footer badge */}
          <AnimatePresence>
            {view === "pack" && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 5, filter: "blur(5px)" }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-20 text-center relative z-0"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wide">
                  <Tag size={11} />
                  <span>{items.length} watches · vault sealed</span>
                </div>
                <p className="text-xs text-zinc-600 mt-2">Click List or Grid to expand your collection</p>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all outline-none",
        active
          ? "text-zinc-950"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
      )}
    >
      {active && (
        <motion.div
          layoutId="active-collection-tab"
          className="absolute inset-0 bg-emerald-500 rounded-lg shadow-md"
          transition={snappySpring}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        <Icon size={13} className={cn("transition-transform duration-200", active && "scale-110")} />
        {label}
      </span>
    </button>
  );
}

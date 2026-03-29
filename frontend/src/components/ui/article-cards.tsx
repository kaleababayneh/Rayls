import React from "react";
import { cn } from "@/lib/utils";

interface ArticleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Brand / category label shown at top */
  category: string;
  /** Main title — model name */
  title: string;
  /** Optional subtitle — ref number, year, material */
  subTitle?: string;
  /** Numeric value — price in USDR, or AI score */
  price: number;
  /** Background image URL */
  imageUrl: string;
  /** Tailwind gradient classes for the overlay, e.g. 'from-zinc-900/80 to-emerald-950/90' */
  gradient: string;
  /** Override the bottom button label. Default: "View for $X.XX" */
  buttonLabel?: string;
  /** Currency / unit shown after price (e.g. "USDR"). If set, renders "X USDR" instead of "$X.XX" */
  priceUnit?: string;
  /** Click handler specifically for the bottom action button */
  onButtonClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  /** Small badge text rendered in top-right corner */
  badge?: string;
  /** Disable interactions (e.g. while a buy tx is pending) */
  disabled?: boolean;
}

export const ArticleCard = React.forwardRef<HTMLDivElement, ArticleCardProps>(
  (
    {
      category,
      title,
      subTitle,
      price,
      imageUrl,
      gradient,
      buttonLabel,
      priceUnit,
      onButtonClick,
      badge,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const defaultLabel = priceUnit
      ? `${price % 1 === 0 ? price : price.toFixed(2)} ${priceUnit}`
      : `$${price.toFixed(2)}`;

    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex h-80 cursor-pointer flex-col justify-between overflow-hidden rounded-xl bg-cover bg-center p-6 text-white shadow-lg transition-all duration-300 ease-in-out",
          !disabled && "hover:-translate-y-1 hover:scale-[1.03] hover:shadow-2xl",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
        style={{ backgroundImage: `url(${imageUrl})` }}
        {...props}
      >
        {/* Gradient overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t opacity-75 transition-opacity duration-300 group-hover:opacity-85",
            gradient
          )}
        />

        {/* Top-right badge */}
        {badge && (
          <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] font-semibold tracking-widest text-white/90 uppercase">
            {badge}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Top */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
              {category}
            </p>
            <h2 className="text-xl font-bold leading-tight text-white drop-shadow-sm">
              {title}
            </h2>
            {subTitle && (
              <p className="mt-1 text-xs text-white/50 tracking-wide">{subTitle}</p>
            )}
          </div>

          {/* Bottom action */}
          <div className="self-start">
            <span
              role="button"
              aria-label={buttonLabel ?? defaultLabel}
              onClick={
                onButtonClick
                  ? (e) => {
                      e.stopPropagation();
                      if (!disabled) onButtonClick(e);
                    }
                  : undefined
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md bg-white/15 px-4 py-2 text-xs font-semibold tracking-wide backdrop-blur-sm transition-all duration-300",
                !disabled && "group-hover:bg-white/25 group-hover:shadow-lg cursor-pointer"
              )}
            >
              {buttonLabel ?? defaultLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ArticleCard.displayName = "ArticleCard";

"use client";

interface WatchCardProps {
  tokenId: number;
  brand: string;
  model: string;
  reference: string;
  year: number;
  material: string;
  condition: string;
  score?: number;
  serialVerified?: boolean;
  imageCount?: number;
  onClick?: () => void;
  price?: string;
  status?: "attested" | "listed" | "sold" | "revealed";
}

export function WatchCard({
  tokenId,
  brand,
  model,
  reference,
  year,
  material,
  condition,
  score,
  serialVerified,
  imageCount,
  onClick,
  price,
  status,
}: WatchCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all ${
        onClick ? "cursor-pointer hover:shadow-lg hover:shadow-emerald-500/5" : ""
      }`}
    >
      {/* Placeholder image */}
      <div className="aspect-square bg-zinc-800 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
        <div className="text-zinc-600 text-4xl font-light">{brand.charAt(0)}</div>
        {status && (
          <div
            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
              status === "attested"
                ? "bg-emerald-500/20 text-emerald-400"
                : status === "listed"
                ? "bg-blue-500/20 text-blue-400"
                : status === "sold"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {status.toUpperCase()}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium">{brand}</p>
            <h3 className="font-semibold text-zinc-100">{model}</h3>
          </div>
          <span className="text-xs text-zinc-500">#{tokenId}</span>
        </div>

        <p className="text-sm text-zinc-400">
          Ref. {reference} &middot; {year}
        </p>

        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300">
            {material}
          </span>
          <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300">
            {condition}
          </span>
          {imageCount !== undefined && (
            <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300">
              {imageCount} photos
            </span>
          )}
        </div>

        {score !== undefined && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span
              className={`text-xs font-medium ${
                score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"
              }`}
            >
              {score}/100
            </span>
            {serialVerified && (
              <span className="text-xs text-emerald-400" title="Serial verified via Merkle proof">
                SN
              </span>
            )}
          </div>
        )}

        {price && (
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-emerald-400 font-semibold">{price} USDR</p>
          </div>
        )}
      </div>
    </div>
  );
}

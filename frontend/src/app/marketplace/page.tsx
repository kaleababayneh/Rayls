"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  PUBLIC_CHAIN_RPC,
  MARKETPLACE_ADDRESS,
  ATTESTATION_ADDRESS,
} from "@/lib/contracts";
import MarketplaceAbi from "@/lib/abis/Marketplace.json";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";
import Link from "next/link";
import CubeLoader from "@/components/ui/cube-loader";
import { ArticleCard } from "@/components/ui/article-cards";

/* ── Watch image pool ─────────────────────────────────────── */
const WATCH_IMAGES = [
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1622434641406-a158123450f7?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=640&h=400&fit=crop&q=80",
];

function getListingImage(tokenId: number) {
  return WATCH_IMAGES[(tokenId - 1) % WATCH_IMAGES.length];
}

function getListingGradient(score?: number) {
  if (score === undefined) return "from-zinc-900/85 to-zinc-950/95";
  if (score >= 70) return "from-emerald-950/85 to-zinc-950/95";
  if (score >= 50) return "from-amber-950/85 to-zinc-950/95";
  return "from-red-950/85 to-zinc-950/95";
}

interface Listing {
  id: number;
  token: string;
  tokenId: number;
  price: string;
  active: boolean;
  brand?: string;
  model?: string;
  reference?: string;
  year?: number;
  material?: string;
  condition?: string;
  score?: number;
  serialVerified?: boolean;
  summary?: string;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState<number | null>(null);
  const [buySuccess, setBuySuccess] = useState("");

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    if (!MARKETPLACE_ADDRESS) {
      setError("MARKETPLACE_ADDRESS not configured.");
      setLoading(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceAbi, provider);
      const items: Listing[] = [];

      const activeIds: bigint[] = await marketplace.getActiveListings();
      for (const id of activeIds) {
        const l = await marketplace.getListing(id);
        const item: Listing = {
          id: Number(id),
          token: l.token,
          tokenId: Number(l.tokenId),
          price: ethers.formatEther(l.price),
          active: l.active,
        };

        if (ATTESTATION_ADDRESS) {
          try {
            const attestation = new ethers.Contract(ATTESTATION_ADDRESS, LuxAttestationAbi, provider);
            const att = await attestation.getAttestation(item.tokenId);
            if (att.valid) {
              item.brand = att.brand;
              item.model = att.model;
              item.reference = att.referenceNumber;
              item.year = Number(att.yearOfProduction);
              item.material = att.caseMaterial;
              item.condition = att.conditionGrade;
              item.score = Number(att.aiScore);
              item.serialVerified = att.serialVerified;
              item.summary = att.aiSummary;
            }
          } catch { /* no attestation */ }
        }

        items.push(item);
      }

      setListings(items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(listing: Listing) {
    setBuying(listing.id);
    setBuySuccess("");
    setError("");

    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBuySuccess(
        `Purchased Token #${data.tokenId} for ${data.price} USDR! TX: ${data.txHash.slice(0, 18)}... The oracle will now trigger the metadata reveal.`
      );
      await loadListings();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBuying(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-zinc-400">
          Browse AI-attested watches on the Rayls Public Chain. Purchase with
          USDR to trigger the confidential metadata reveal.
        </p>
      </div>

      {buySuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 text-emerald-400 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{buySuccess}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <CubeLoader
          message="Fetching Listings"
          subMessage={`Scanning active listings on Rayls Public Chain${MARKETPLACE_ADDRESS ? ` · ${MARKETPLACE_ADDRESS.slice(0, 10)}…` : ""}`}
        />
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <p className="text-lg text-zinc-400 mb-2">No active listings</p>
          <p className="text-sm text-zinc-600 mb-6">Watches appear here after bridging to the Public Chain and listing on the marketplace.</p>
          <Link
            href="/dealer"
            className="inline-block px-5 py-2.5 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all"
          >
            Go to Dealer Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {listings.map((l) => (
            <ArticleCard
              key={l.id}
              category={l.brand ?? "LUXURY WATCH"}
              title={l.model ?? `Token #${l.tokenId}`}
              subTitle={[
                l.reference && `Ref. ${l.reference}`,
                l.year && String(l.year),
                l.material,
                l.serialVerified && "SN Verified ✓",
              ]
                .filter(Boolean)
                .join(" · ")}
              price={Number(l.price)}
              priceUnit="USDR"
              imageUrl={getListingImage(l.tokenId)}
              gradient={getListingGradient(l.score)}
              badge={l.score !== undefined ? `AI ${l.score}/100` : undefined}
              buttonLabel={
                buying === l.id
                  ? "Processing…"
                  : `Buy · ${Number(l.price).toLocaleString()} USDR`
              }
              disabled={buying !== null}
              onButtonClick={() => handleBuy(l)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  PUBLIC_CHAIN_RPC,
  MARKETPLACE_ADDRESS,
  ATTESTATION_ADDRESS,
  PUBLIC_EXPLORER,
} from "@/lib/contracts";
import MarketplaceAbi from "@/lib/abis/Marketplace.json";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";
import Link from "next/link";
import CubeLoader from "@/components/ui/cube-loader";

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
            <div
              key={l.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group"
            >
              {/* Image placeholder */}
              <div className="aspect-video bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                <span className="text-zinc-600 text-5xl font-light group-hover:scale-110 transition-transform duration-300">
                  {l.brand?.charAt(0) || "?"}
                </span>
                {l.score !== undefined && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-zinc-900/80 backdrop-blur-sm text-emerald-400 text-xs font-medium">
                    AI: {l.score}/100
                  </div>
                )}
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    {l.brand && (
                      <p className="text-xs text-emerald-400 font-medium">{l.brand}</p>
                    )}
                    <h3 className="font-semibold text-lg">
                      {l.model || `Token #${l.tokenId}`}
                    </h3>
                    {l.reference && (
                      <p className="text-sm text-zinc-400">
                        Ref. {l.reference} &middot; {l.year}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-600 font-mono">#{l.tokenId}</span>
                </div>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {l.material && (
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">{l.material}</span>
                  )}
                  {l.condition && (
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">{l.condition}</span>
                  )}
                  {l.serialVerified && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">
                      SN Verified
                    </span>
                  )}
                </div>

                {/* Score bar */}
                {l.score !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${l.score >= 70 ? "bg-emerald-500" : l.score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${l.score}%` }}
                      />
                    </div>
                  </div>
                )}

                {l.summary && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{l.summary}</p>
                )}

                <div className="pt-3 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-emerald-400">
                      {Number(l.price).toLocaleString()} USDR
                    </p>
                    <a
                      href={`${PUBLIC_EXPLORER}/address/${l.token}`}
                      target="_blank"
                      rel="noopener"
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Explorer
                    </a>
                  </div>

                  <button
                    onClick={() => handleBuy(l)}
                    disabled={buying !== null}
                    className="w-full py-2.5 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    {buying === l.id ? (
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Purchasing...
                      </span>
                    ) : (
                      `Buy for ${Number(l.price).toLocaleString()} USDR`
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

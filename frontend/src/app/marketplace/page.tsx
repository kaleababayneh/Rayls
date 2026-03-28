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

      const activeIds: bigint[] = await marketplace.getActiveListings();
      const items: Listing[] = [];

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

  async function handleBuy(listingId: number) {
    setBuying(listingId);
    setBuySuccess("");
    setError("");

    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
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
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 text-emerald-400">
          {buySuccess}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No active listings</p>
          <p className="text-sm">
            Watches appear here after bridging and listing on the marketplace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l) => (
            <div
              key={l.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <div className="aspect-video bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-600 text-5xl font-light">
                  {l.brand?.charAt(0) || "?"}
                </span>
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
                  <span className="text-xs text-zinc-500">Listing #{l.id}</span>
                </div>

                {l.score !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${l.score >= 70 ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${l.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-emerald-400">
                      AI: {l.score}/100
                    </span>
                    {l.serialVerified && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">
                        SN Verified
                      </span>
                    )}
                  </div>
                )}

                {l.summary && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{l.summary}</p>
                )}

                <div className="pt-3 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-emerald-400">{l.price} USDR</p>
                    <a
                      href={`${PUBLIC_EXPLORER}/address/${l.token}`}
                      target="_blank"
                      rel="noopener"
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      View on Explorer
                    </a>
                  </div>

                  <button
                    onClick={() => handleBuy(l.id)}
                    disabled={buying !== null}
                    className="w-full py-2.5 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {buying === l.id ? "Purchasing..." : `Buy for ${l.price} USDR`}
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

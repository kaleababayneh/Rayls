"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  PUBLIC_CHAIN_RPC,
  PRIVACY_NODE_RPC,
  ATTESTATION_ADDRESS,
  REVEAL_TRACKER_ADDRESS,
  TOKEN_ADDRESS,
  PUBLIC_EXPLORER,
} from "@/lib/contracts";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";
import RevealTrackerAbi from "@/lib/abis/RevealTracker.json";
import LuxWatchNFTAbi from "@/lib/abis/LuxWatchNFT.json";
import Link from "next/link";
import CubeLoader from "@/components/ui/cube-loader";

interface RevealedWatch {
  tokenId: number;
  buyer: string;
  purchasedAt: string;
  brand: string;
  model: string;
  reference: string;
  year: number;
  material: string;
  condition: string;
  score: number;
  summary: string;
  serial?: string;
  caliber?: string;
  dialColor?: string;
  braceletType?: string;
  caseDiameter?: number;
  conditionNotes?: string;
  images?: { imageType: string; imageUri: string }[];
  services?: { date: number; serviceCenter: string; workPerformed: string }[];
}

export default function CollectionPage() {
  const [watches, setWatches] = useState<RevealedWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reselling, setReselling] = useState<number | null>(null);
  const [resellPrice, setResellPrice] = useState("1");
  const [resellSuccess, setResellSuccess] = useState("");

  useEffect(() => {
    loadRevealed();
  }, []);

  async function loadRevealed() {
    if (!REVEAL_TRACKER_ADDRESS || !ATTESTATION_ADDRESS) {
      setError("Contract addresses not configured.");
      setLoading(false);
      return;
    }

    try {
      const publicProvider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
      const revealTracker = new ethers.Contract(
        REVEAL_TRACKER_ADDRESS,
        RevealTrackerAbi,
        publicProvider
      );
      const attestation = new ethers.Contract(
        ATTESTATION_ADDRESS,
        LuxAttestationAbi,
        publicProvider
      );

      const count = await revealTracker.getRevealedCount();
      const items: RevealedWatch[] = [];

      for (let i = 0; i < Number(count); i++) {
        const tokenId = Number(await revealTracker.revealedIds(i));
        const reveal = await revealTracker.reveals(tokenId);

        if (!reveal.revealed) continue;

        let att;
        try {
          att = await attestation.getAttestation(tokenId);
        } catch {
          continue;
        }

        const watch: RevealedWatch = {
          tokenId,
          buyer: reveal.buyer,
          purchasedAt: new Date(
            Number(reveal.purchasedAt) * 1000
          ).toLocaleString(),
          brand: att.brand,
          model: att.model,
          reference: att.referenceNumber,
          year: Number(att.yearOfProduction),
          material: att.caseMaterial,
          condition: att.conditionGrade,
          score: Number(att.aiScore),
          summary: att.aiSummary,
        };

        if (TOKEN_ADDRESS) {
          try {
            const privacyProvider = new ethers.JsonRpcProvider(PRIVACY_NODE_RPC);
            const nft = new ethers.Contract(
              TOKEN_ADDRESS,
              LuxWatchNFTAbi,
              privacyProvider
            );
            const data = await nft.getWatchData(tokenId);
            const images = await nft.getImages(tokenId);
            const services = await nft.getServices(tokenId);

            watch.serial = data.serialNumber;
            watch.caliber = data.movementCaliber;
            watch.dialColor = data.dialColor;
            watch.braceletType = data.braceletType;
            watch.caseDiameter = Number(data.caseDiameterMM);
            watch.conditionNotes = data.conditionNotes;
            watch.images = images.map((img: { imageType: string; imageUri: string }) => ({
              imageType: img.imageType,
              imageUri: img.imageUri,
            }));
            watch.services = services.map((svc: { date: bigint; serviceCenter: string; workPerformed: string }) => ({
              date: Number(svc.date),
              serviceCenter: svc.serviceCenter,
              workPerformed: svc.workPerformed,
            }));
          } catch {
            // Privacy node not accessible or token not found
          }
        }

        items.push(watch);
      }

      setWatches(items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleResell(tokenId: number) {
    setReselling(tokenId);
    setResellSuccess("");
    setError("");

    try {
      const res = await fetch("/api/resell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, price: resellPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResellSuccess(`Token #${tokenId} listed for ${resellPrice} USDR! TX: ${data.txHash.slice(0, 18)}...`);
      setReselling(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setReselling(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Collection</h1>
        <p className="text-zinc-400">
          Watches you&apos;ve purchased. Private metadata is revealed after
          payment confirmation. You can resell any watch back on the marketplace.
        </p>
      </div>

      {resellSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 text-emerald-400 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {resellSuccess}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <CubeLoader
          message="Decrypting Collection"
          subMessage="Fetching revealed watches from RevealTracker and Privacy Node…"
        />
      ) : watches.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-xl text-zinc-300 mb-2">No revealed watches yet</p>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-8">
            Purchase a watch on the marketplace to trigger the confidential metadata reveal.
            Once the oracle confirms the purchase, all private data becomes visible here.
          </p>
          <Link
            href="/marketplace"
            className="inline-block px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-6 stagger-children">
          {watches.map((w) => (
            <div
              key={w.tokenId}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-emerald-400 font-medium">
                      {w.brand}
                    </p>
                    <h3 className="text-xl font-bold">{w.model}</h3>
                    <p className="text-zinc-400">
                      Ref. {w.reference} &middot; {w.year}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 font-medium">
                      REVEALED
                    </span>
                    <span className="text-xs text-zinc-600 font-mono">
                      #{w.tokenId}
                    </span>
                  </div>
                </div>

                {/* Revealed private metadata */}
                {w.serial && (
                  <div className="bg-zinc-950 rounded-lg p-5 mb-4 border border-zinc-800/50">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      <h4 className="text-sm font-semibold text-emerald-400">
                        Private Metadata (Revealed)
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Serial Number</p>
                        <p className="font-mono text-sm">{w.serial}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Movement</p>
                        <p>Cal. {w.caliber}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Case</p>
                        <p>{w.material} {w.caseDiameter}mm</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Dial</p>
                        <p>{w.dialColor}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Bracelet</p>
                        <p>{w.braceletType}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Condition Notes</p>
                        <p className="text-xs text-zinc-300">{w.conditionNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expandable details */}
                <button
                  onClick={() => setExpanded(expanded === w.tokenId ? null : w.tokenId)}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-4"
                >
                  <svg className={`w-4 h-4 transition-transform ${expanded === w.tokenId ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {expanded === w.tokenId ? "Hide details" : "Show photos, services & AI assessment"}
                </button>

                {expanded === w.tokenId && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Images */}
                    {w.images && w.images.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-400 mb-2">
                          Photo Documentation ({w.images.length})
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {w.images.map((img, i) => (
                            <div
                              key={i}
                              className="w-20 h-20 bg-zinc-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-zinc-700/50"
                            >
                              <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[10px] text-zinc-500">{img.imageType}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    {w.services && w.services.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-400 mb-2">
                          Service History
                        </h4>
                        <div className="space-y-2">
                          {w.services.map((svc, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 text-sm bg-zinc-800/50 rounded-lg px-3 py-2"
                            >
                              <span className="text-zinc-500 text-xs">
                                {new Date(svc.date * 1000).toLocaleDateString()}
                              </span>
                              <span className="text-zinc-300">
                                {svc.serviceCenter}
                              </span>
                              <span className="text-zinc-500 text-xs ml-auto">
                                {svc.workPerformed}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Summary */}
                    <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm font-semibold text-zinc-400">
                          AI Assessment
                        </span>
                        <span
                          className={`text-sm font-bold ml-auto ${
                            w.score >= 70 ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {w.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">{w.summary}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Resell */}
              <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800">
                {reselling === w.tokenId ? (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Listing on marketplace...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        value={resellPrice}
                        onChange={(e) => setResellPrice(e.target.value)}
                        className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                        min="0.01"
                        step="0.1"
                      />
                      <span className="text-xs text-zinc-500">USDR</span>
                    </div>
                    <button
                      onClick={() => handleResell(w.tokenId)}
                      className="px-4 py-1.5 bg-amber-500 text-zinc-950 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-all"
                    >
                      Resell
                    </button>
                    <a
                      href={`${PUBLIC_EXPLORER}/address/${REVEAL_TRACKER_ADDRESS}`}
                      target="_blank"
                      rel="noopener"
                      className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
                    >
                      Explorer
                    </a>
                  </div>
                )}
                <p className="text-xs text-zinc-600 mt-2">Purchased: {w.purchasedAt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

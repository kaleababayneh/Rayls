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
import { AnimatedCollection, type CollectionItem } from "@/components/ui/animated-collection";

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

/* ── Watch image pool ─────────────────────────────────────── */
const WATCH_IMAGES = [
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=640&h=480&fit=crop&q=80",
  "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=640&h=480&fit=crop&q=80",
  "https://images.unsplash.com/photo-1622434641406-a158123450f7?w=640&h=480&fit=crop&q=80",
  "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=640&h=480&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=640&h=480&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=640&h=480&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=640&h=480&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=640&h=480&fit=crop&q=80",
];

function getWatchImage(tokenId: number) {
  return WATCH_IMAGES[(tokenId - 1) % WATCH_IMAGES.length];
}

export default function CollectionPage() {
  const [watches, setWatches] = useState<RevealedWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  /* ── Build CollectionItems for AnimatedCollection ── */
  const collectionItems: CollectionItem[] = watches.map((w) => ({
    id: String(w.tokenId),
    title: w.model || `Token #${w.tokenId}`,
    subtitle: w.brand || "Unknown Brand",
    idNumber: String(w.tokenId),
    image: getWatchImage(w.tokenId),
    score: w.score,
    condition: w.condition,
    year: w.year,
    material: w.material,
    brand: w.brand,
  }));

  /* ── Find full watch record for selected item ── */
  const selectedWatch = selectedId
    ? watches.find((w) => String(w.tokenId) === selectedId) ?? null
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Collection</h1>
        <p className="text-zinc-400">
          Watches you&apos;ve purchased. Private metadata is revealed after
          payment confirmation. Select a watch to view details or resell.
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Left: animated collection view ── */}
          <AnimatedCollection
            items={collectionItems}
            onItemClick={(item) =>
              setSelectedId(selectedId === item.id ? null : item.id)
            }
          />

          {/* ── Right: watch detail panel ── */}
          {selectedWatch ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-fade-in">
              {/* Hero image */}
              <div className="relative w-full aspect-[16/9] overflow-hidden">
                <img
                  src={getWatchImage(selectedWatch.tokenId)}
                  alt={selectedWatch.model}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mb-0.5">
                      {selectedWatch.brand}
                    </p>
                    <h3 className="text-2xl font-bold text-zinc-100">{selectedWatch.model}</h3>
                    <p className="text-zinc-400 text-sm">
                      Ref. {selectedWatch.reference} · {selectedWatch.year}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/20">
                      REVEALED
                    </span>
                    <span className={`text-lg font-bold ${selectedWatch.score >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                      {selectedWatch.score}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {/* Private metadata */}
                {selectedWatch.serial && (
                  <div className="bg-zinc-950 rounded-xl p-4 mb-4 border border-zinc-800/50">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Private Metadata · Unlocked</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { label: "Serial", value: selectedWatch.serial, mono: true },
                        { label: "Caliber", value: `Cal. ${selectedWatch.caliber}` },
                        { label: "Case", value: `${selectedWatch.material} ${selectedWatch.caseDiameter}mm` },
                        { label: "Dial", value: selectedWatch.dialColor },
                        { label: "Bracelet", value: selectedWatch.braceletType },
                        { label: "Grade", value: selectedWatch.condition },
                      ].map(({ label, value, mono }) => value ? (
                        <div key={label}>
                          <p className="text-zinc-600 text-[10px] mb-0.5 uppercase tracking-wider">{label}</p>
                          <p className={`text-zinc-300 ${mono ? "font-mono" : ""}`}>{value}</p>
                        </div>
                      ) : null)}
                    </div>
                    {selectedWatch.conditionNotes && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/50">
                        <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">Condition Notes</p>
                        <p className="text-zinc-400 text-xs">{selectedWatch.conditionNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Summary */}
                {selectedWatch.summary && (
                  <div className="bg-zinc-950 rounded-xl p-4 mb-4 border border-zinc-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">AI Assessment</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{selectedWatch.summary}</p>
                  </div>
                )}

                {/* Service history */}
                {selectedWatch.services && selectedWatch.services.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setExpanded(expanded === selectedWatch.tokenId ? null : selectedWatch.tokenId)}
                      className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors mb-2"
                    >
                      <svg className={`w-3.5 h-3.5 transition-transform ${expanded === selectedWatch.tokenId ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Service History ({selectedWatch.services.length} records)
                    </button>
                    {expanded === selectedWatch.tokenId && (
                      <div className="space-y-1.5 animate-fade-in">
                        {selectedWatch.services.map((svc, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-zinc-800/50 rounded-lg px-3 py-2">
                            <span className="text-zinc-600 flex-shrink-0">{new Date(svc.date * 1000).toLocaleDateString()}</span>
                            <span className="text-zinc-300 truncate">{svc.serviceCenter}</span>
                            <span className="text-zinc-500 ml-auto flex-shrink-0 truncate max-w-[120px]">{svc.workPerformed}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Resell bar */}
                <div className="border-t border-zinc-800 pt-4">
                  {reselling === selectedWatch.tokenId ? (
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
                        onClick={() => handleResell(selectedWatch.tokenId)}
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
                  <p className="text-xs text-zinc-700 mt-1.5">Purchased: {selectedWatch.purchasedAt}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder when nothing selected */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/20 py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500 max-w-xs">
                Select a watch from your collection to view its revealed private metadata, AI verdict, and resell options.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

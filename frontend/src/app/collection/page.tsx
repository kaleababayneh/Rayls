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

interface RevealedWatch {
  tokenId: number;
  buyer: string;
  purchasedAt: string;
  // Public attestation data
  brand: string;
  model: string;
  reference: string;
  year: number;
  material: string;
  condition: string;
  score: number;
  summary: string;
  // Revealed private data (from Privacy Node)
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

      // Get revealed count and iterate
      const count = await revealTracker.getRevealedCount();
      const items: RevealedWatch[] = [];

      for (let i = 0; i < Number(count); i++) {
        const tokenId = Number(await revealTracker.revealedIds(i));
        const reveal = await revealTracker.reveals(tokenId);

        if (!reveal.revealed) continue;

        // Get attestation data
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

        // Try to read private metadata (available because reveal confirmed)
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Collection</h1>
        <p className="text-zinc-400">
          Watches you&apos;ve purchased. Private metadata is revealed after
          payment confirmation.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : watches.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No revealed watches</p>
          <p className="text-sm">
            Purchase a watch on the marketplace to see its revealed metadata here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {watches.map((w) => (
            <div
              key={w.tokenId}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
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
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400">
                      REVEALED
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">
                      Token #{w.tokenId}
                    </p>
                  </div>
                </div>

                {/* Revealed private metadata */}
                {w.serial && (
                  <div className="bg-zinc-950 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-3">
                      Private Metadata (Revealed)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-zinc-500">Serial Number</p>
                        <p className="font-mono">{w.serial}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Movement</p>
                        <p>Cal. {w.caliber}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Case</p>
                        <p>
                          {w.material} {w.caseDiameter}mm
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Dial</p>
                        <p>{w.dialColor}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Bracelet</p>
                        <p>{w.braceletType}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Condition Notes</p>
                        <p className="text-xs">{w.conditionNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Images */}
                {w.images && w.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-zinc-400 mb-2">
                      Photo Documentation ({w.images.length})
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {w.images.map((img, i) => (
                        <div
                          key={i}
                          className="w-20 h-20 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500"
                        >
                          {img.imageType}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {w.services && w.services.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-zinc-400 mb-2">
                      Service History
                    </h4>
                    {w.services.map((svc, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-sm py-1"
                      >
                        <span className="text-zinc-500">
                          {new Date(svc.date * 1000).toLocaleDateString()}
                        </span>
                        <span className="text-zinc-300">
                          {svc.serviceCenter}
                        </span>
                        <span className="text-zinc-500">
                          {svc.workPerformed}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Summary */}
                <div className="bg-zinc-950 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-zinc-400">
                      AI Assessment
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        w.score >= 70 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {w.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{w.summary}</p>
                </div>
              </div>

              <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>Purchased: {w.purchasedAt}</span>
                <a
                  href={`${PUBLIC_EXPLORER}/address/${REVEAL_TRACKER_ADDRESS}`}
                  target="_blank"
                  rel="noopener"
                  className="hover:text-emerald-400"
                >
                  View on Explorer
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

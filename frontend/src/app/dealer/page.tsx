"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  PRIVACY_NODE_RPC,
  TOKEN_ADDRESS,
  ATTESTATION_ADDRESS,
  PUBLIC_CHAIN_RPC,
} from "@/lib/contracts";
import LuxWatchNFTAbi from "@/lib/abis/LuxWatchNFT.json";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";

interface WatchInfo {
  tokenId: number;
  brand: string;
  model: string;
  reference: string;
  year: number;
  serial: string;
  caliber: string;
  material: string;
  condition: string;
  imageCount: number;
  serviceCount: number;
  isAttested: boolean;
  attestationScore: number;
}

export default function DealerPage() {
  const [watches, setWatches] = useState<WatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWatches();
  }, []);

  async function loadWatches() {
    if (!TOKEN_ADDRESS) {
      setError("TOKEN_ADDRESS not configured. Deploy LuxWatchNFT first.");
      setLoading(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(PRIVACY_NODE_RPC);
      const nft = new ethers.Contract(TOKEN_ADDRESS, LuxWatchNFTAbi, provider);

      // Read tokens directly by iterating IDs (fast, no event scanning)
      const watchList: WatchInfo[] = [];
      for (let tokenId = 1; tokenId <= 50; tokenId++) {
        try {
          const data = await nft.getWatchData(tokenId);
          // Empty brand means token doesn't exist
          if (!data.brand) break;

          const images = await nft.getImages(tokenId);
          const services = await nft.getServices(tokenId);

          watchList.push({
            tokenId,
            brand: data.brand,
            model: data.model,
            reference: data.referenceNumber,
            year: Number(data.yearOfProduction),
            serial: data.serialNumber,
            caliber: data.movementCaliber,
            material: data.caseMaterial,
            condition: data.conditionGrade,
            imageCount: images.length,
            serviceCount: services.length,
            isAttested: data.isAttested,
            attestationScore: Number(data.attestationScore),
          });
        } catch {
          break; // No more tokens
        }
      }

      // Enrich with public chain attestation data
      if (ATTESTATION_ADDRESS && watchList.length > 0) {
        try {
          const publicProvider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
          const attestation = new ethers.Contract(
            ATTESTATION_ADDRESS,
            LuxAttestationAbi,
            publicProvider
          );
          for (const w of watchList) {
            try {
              const att = await attestation.getAttestation(w.tokenId);
              if (att.valid) {
                w.isAttested = true;
                w.attestationScore = Number(att.aiScore);
              }
            } catch {
              // Not attested yet
            }
          }
        } catch {
          // Public chain unavailable
        }
      }

      setWatches(watchList);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dealer Dashboard</h1>
        <p className="text-zinc-400">
          View minted watches on the Privacy Node and their attestation status.
          Use <code className="text-emerald-400">forge script script/MintWatch.s.sol</code> to mint new watches.
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
          <p className="text-lg mb-2">No watches minted yet</p>
          <p className="text-sm">
            Run the MintWatch script to create your first confidential watch NFT.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watches.map((w) => (
            <div
              key={w.tokenId}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-emerald-400 font-medium">
                    {w.brand}
                  </p>
                  <h3 className="font-semibold text-lg">{w.model}</h3>
                  <p className="text-sm text-zinc-400">
                    Ref. {w.reference} &middot; {w.year}
                  </p>
                </div>
                <span className="text-xs text-zinc-500">#{w.tokenId}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-zinc-500">Serial</p>
                  <p className="font-mono text-xs">{w.serial}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Caliber</p>
                  <p>{w.caliber}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Material</p>
                  <p>{w.material}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Condition</p>
                  <p>{w.condition}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Photos</p>
                  <p>{w.imageCount}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Services</p>
                  <p>{w.serviceCount}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                {w.isAttested ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          w.attestationScore >= 70
                            ? "bg-emerald-500"
                            : w.attestationScore >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${w.attestationScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-emerald-400">
                      {w.attestationScore}/100
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                      ATTESTED
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm text-amber-400">
                      Awaiting AI attestation...
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Pipeline Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: "Mint on Privacy Node", status: watches.length > 0 },
            {
              label: "AI Attestation",
              status: watches.some((w) => w.isAttested),
            },
            { label: "Bridge to Public", status: false },
            { label: "List on Marketplace", status: false },
            { label: "Buyer Reveal", status: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  step.status ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              />
              <span
                className={`text-sm ${
                  step.status ? "text-zinc-100" : "text-zinc-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

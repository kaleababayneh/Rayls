"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  PUBLIC_CHAIN_RPC,
  ATTESTATION_ADDRESS,
  MARKETPLACE_ADDRESS,
  REVEAL_TRACKER_ADDRESS,
  PUBLIC_EXPLORER,
} from "@/lib/contracts";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";

interface Activity {
  id: string;
  type: "attested" | "listed" | "purchased" | "revealed" | "duplicate" | "revoked";
  tokenId: number;
  brand?: string;
  model?: string;
  score?: number;
  price?: string;
  buyer?: string;
  txHash: string;
  blockNumber: number;
  timestamp?: number;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadEvents = useCallback(async () => {
    if (!ATTESTATION_ADDRESS) return;

    try {
      const provider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 5000);
      const items: Activity[] = [];

      // Attestation events
      const attestedTopic = ethers.id("Attested(uint256,string,string,uint8,bool)");
      const attestedIface = new ethers.Interface([
        "event Attested(uint256 indexed tokenId, string brand, string model, uint8 score, bool serialVerified)",
      ]);

      const attestLogs = await provider.getLogs({
        address: ATTESTATION_ADDRESS,
        topics: [attestedTopic],
        fromBlock,
        toBlock: currentBlock,
      });

      for (const log of attestLogs) {
        try {
          const parsed = attestedIface.parseLog({ topics: log.topics as string[], data: log.data });
          if (!parsed) continue;
          items.push({
            id: `att-${log.transactionHash}`,
            type: "attested",
            tokenId: Number(parsed.args.tokenId),
            brand: parsed.args.brand,
            model: parsed.args.model,
            score: Number(parsed.args.score),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        } catch { /* skip */ }
      }

      // Duplicate events
      const dupTopic = ethers.id("DuplicateDetected(uint256,uint256,bytes32)");
      const dupIface = new ethers.Interface([
        "event DuplicateDetected(uint256 indexed newTokenId, uint256 indexed originalTokenId, bytes32 serialHash)",
      ]);

      const dupLogs = await provider.getLogs({
        address: ATTESTATION_ADDRESS,
        topics: [dupTopic],
        fromBlock,
        toBlock: currentBlock,
      });

      for (const log of dupLogs) {
        try {
          const parsed = dupIface.parseLog({ topics: log.topics as string[], data: log.data });
          if (!parsed) continue;
          items.push({
            id: `dup-${log.transactionHash}`,
            type: "duplicate",
            tokenId: Number(parsed.args.newTokenId),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        } catch { /* skip */ }
      }

      // Revoked events
      const revokedTopic = ethers.id("Revoked(uint256)");
      const revokedIface = new ethers.Interface([
        "event Revoked(uint256 indexed tokenId)",
      ]);

      const revokedLogs = await provider.getLogs({
        address: ATTESTATION_ADDRESS,
        topics: [revokedTopic],
        fromBlock,
        toBlock: currentBlock,
      });

      for (const log of revokedLogs) {
        try {
          const parsed = revokedIface.parseLog({ topics: log.topics as string[], data: log.data });
          if (!parsed) continue;
          items.push({
            id: `rev-${log.transactionHash}`,
            type: "revoked",
            tokenId: Number(parsed.args.tokenId),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        } catch { /* skip */ }
      }

      // Marketplace listing events (Listed)
      if (MARKETPLACE_ADDRESS) {
        try {
          const listedTopic = ethers.id("Listed(uint256,address,uint256,uint256)");
          const listedIface = new ethers.Interface([
            "event Listed(uint256 indexed listingId, address indexed token, uint256 tokenId, uint256 price)",
          ]);
          const listLogs = await provider.getLogs({
            address: MARKETPLACE_ADDRESS,
            topics: [listedTopic],
            fromBlock,
            toBlock: currentBlock,
          });
          for (const log of listLogs) {
            try {
              const parsed = listedIface.parseLog({ topics: log.topics as string[], data: log.data });
              if (!parsed) continue;
              items.push({
                id: `list-${log.transactionHash}`,
                type: "listed",
                tokenId: Number(parsed.args.tokenId),
                price: ethers.formatEther(parsed.args.price),
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
              });
            } catch { /* skip */ }
          }
        } catch { /* marketplace events unavailable */ }
      }

      // Marketplace buy events
      if (MARKETPLACE_ADDRESS) {
        try {
          const boughtTopic = ethers.id("Bought(uint256,address,uint256)");
          const boughtIface = new ethers.Interface([
            "event Bought(uint256 indexed listingId, address indexed buyer, uint256 price)",
          ]);
          const buyLogs = await provider.getLogs({
            address: MARKETPLACE_ADDRESS,
            topics: [boughtTopic],
            fromBlock,
            toBlock: currentBlock,
          });
          for (const log of buyLogs) {
            try {
              const parsed = boughtIface.parseLog({ topics: log.topics as string[], data: log.data });
              if (!parsed) continue;
              items.push({
                id: `buy-${log.transactionHash}`,
                type: "purchased",
                tokenId: Number(parsed.args.listingId),
                buyer: parsed.args.buyer,
                price: ethers.formatEther(parsed.args.price),
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
              });
            } catch { /* skip */ }
          }
        } catch { /* marketplace events unavailable */ }
      }

      // Reveal events
      if (REVEAL_TRACKER_ADDRESS) {
        try {
          const revealTopic = ethers.id("RevealConfirmed(uint256)");
          const revealIface = new ethers.Interface([
            "event RevealConfirmed(uint256 indexed tokenId)",
          ]);
          const revealLogs = await provider.getLogs({
            address: REVEAL_TRACKER_ADDRESS,
            topics: [revealTopic],
            fromBlock,
            toBlock: currentBlock,
          });
          for (const log of revealLogs) {
            try {
              const parsed = revealIface.parseLog({ topics: log.topics as string[], data: log.data });
              if (!parsed) continue;
              items.push({
                id: `reveal-${log.transactionHash}`,
                type: "revealed",
                tokenId: Number(parsed.args.tokenId),
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
              });
            } catch { /* skip */ }
          }
        } catch { /* reveal events unavailable */ }
      }

      // Enrich attestation data for listed/purchased items
      if (ATTESTATION_ADDRESS) {
        const attestation = new ethers.Contract(ATTESTATION_ADDRESS, LuxAttestationAbi, provider);
        for (const item of items) {
          if (!item.brand && (item.type === "listed" || item.type === "revealed")) {
            try {
              const att = await attestation.getAttestation(item.tokenId);
              if (att.valid || att.brand) {
                item.brand = att.brand;
                item.model = att.model;
                item.score = Number(att.aiScore);
              }
            } catch { /* skip */ }
          }
        }
      }

      // Sort by block number descending (newest first)
      items.sort((a, b) => b.blockNumber - a.blockNumber);
      setActivities(items);
    } catch (e) {
      console.error("Failed to load activity:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auto-refresh every 5s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadEvents]);

  const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
    attested: { label: "AI Attested", color: "emerald", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    listed: { label: "Listed", color: "blue", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" },
    purchased: { label: "Purchased", color: "amber", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
    revealed: { label: "Revealed", color: "purple", icon: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" },
    duplicate: { label: "Duplicate Found", color: "red", icon: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    revoked: { label: "Revoked", color: "red", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Oracle Activity</h1>
          <p className="text-zinc-400">
            Live feed of autonomous oracle actions on the Public Chain.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              autoRefresh
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-800 text-zinc-500 border border-zinc-700"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button
            onClick={() => { setLoading(true); loadEvents(); }}
            className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {loading && activities.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48" />
                <div className="skeleton h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-lg text-zinc-400 mb-2">No activity yet</p>
          <p className="text-sm text-zinc-600">Oracle events will appear here as watches are minted and processed.</p>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {activities.map((a) => {
            const cfg = typeConfig[a.type];

            return (
              <div
                key={a.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  a.type === "attested" ? "bg-emerald-500/10" :
                  a.type === "listed" ? "bg-blue-500/10" :
                  a.type === "purchased" ? "bg-amber-500/10" :
                  a.type === "revealed" ? "bg-purple-500/10" :
                  "bg-red-500/10"
                }`}>
                  <svg className={`w-5 h-5 ${
                    a.type === "attested" ? "text-emerald-400" :
                    a.type === "listed" ? "text-blue-400" :
                    a.type === "purchased" ? "text-amber-400" :
                    a.type === "revealed" ? "text-purple-400" :
                    "text-red-400"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      a.type === "attested" ? "text-emerald-400" :
                      a.type === "listed" ? "text-blue-400" :
                      a.type === "purchased" ? "text-amber-400" :
                      a.type === "revealed" ? "text-purple-400" :
                      "text-red-400"
                    }`}>{cfg.label}</span>
                    <span className="text-zinc-600 text-xs">Token #{a.tokenId}</span>
                  </div>
                  <div className="text-sm text-zinc-400">
                    {a.brand && <span>{a.brand} {a.model}</span>}
                    {a.score !== undefined && <span> &middot; Score: {a.score}/100</span>}
                    {a.price && <span> &middot; {Number(a.price).toLocaleString()} USDR</span>}
                    {a.buyer && <span> &middot; {a.buyer.slice(0, 8)}...</span>}
                    {a.type === "duplicate" && <span className="text-red-400"> Serial collision detected</span>}
                    {a.type === "revoked" && <span className="text-red-400"> Attestation invalidated</span>}
                  </div>
                </div>

                <a
                  href={`${PUBLIC_EXPLORER}/tx/${a.txHash}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-zinc-600 hover:text-emerald-400 transition-colors font-mono flex-shrink-0"
                >
                  {a.txHash.slice(0, 10)}...
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

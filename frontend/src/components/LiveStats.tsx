"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  PUBLIC_CHAIN_RPC,
  ATTESTATION_ADDRESS,
} from "@/lib/contracts";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";

interface Stats {
  totalAttested: number;
  avgScore: number;
  passRate: number;
  duplicatesCaught: number;
}

export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    if (!ATTESTATION_ADDRESS) return;

    try {
      const provider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
      const attestation = new ethers.Contract(ATTESTATION_ADDRESS, LuxAttestationAbi, provider);

      const count = Number(await attestation.getAttestedCount());
      let totalScore = 0;
      let passCount = 0;
      let dupCount = 0;

      for (let i = 0; i < count; i++) {
        const tokenId = Number(await attestation.attestedIds(i));
        const att = await attestation.getAttestation(tokenId);
        const score = Number(att.aiScore);
        totalScore += score;
        if (att.valid && score >= 70) passCount++;
        try {
          const isDup = await attestation.isDuplicate(tokenId);
          if (isDup) dupCount++;
        } catch {}
      }

      setStats({
        totalAttested: count,
        avgScore: count > 0 ? Math.round(totalScore / count) : 0,
        passRate: count > 0 ? Math.round((passCount / count) * 100) : 0,
        duplicatesCaught: dupCount,
      });
    } catch {}
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {["AI Engine", "Merkle Proofs", "Bridge", "Privacy"].map((label) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center hover:border-zinc-700 transition-colors">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">{label}</p>
            <p className="text-lg font-bold text-emerald-400">Real</p>
            <p className="text-xs text-zinc-600">On-chain</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <StatCard label="Watches Attested" value={String(stats.totalAttested)} sub="On-chain verified" />
      <StatCard label="Avg AI Score" value={`${stats.avgScore}/100`} sub="Claude + Rules" />
      <StatCard label="Pass Rate" value={`${stats.passRate}%`} sub="Score >= 70" />
      <StatCard label="Duplicates Caught" value={String(stats.duplicatesCaught)} sub="Auto-revoked" />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center hover:border-zinc-700 transition-colors">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-lg font-bold text-emerald-400">{value}</p>
      <p className="text-xs text-zinc-600">{sub}</p>
    </div>
  );
}

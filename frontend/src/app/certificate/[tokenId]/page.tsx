"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useParams } from "next/navigation";
import {
  PUBLIC_CHAIN_RPC,
  ATTESTATION_ADDRESS,
  REASONING_LOG_ADDRESS,
  PUBLIC_EXPLORER,
} from "@/lib/contracts";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";
import AIReasoningLogAbi from "@/lib/abis/AIReasoningLog.json";
import Link from "next/link";

interface CertData {
  brand: string;
  model: string;
  reference: string;
  year: number;
  material: string;
  condition: string;
  aiScore: number;
  aiSummary: string;
  serialVerified: boolean;
  attestedAt: number;
  valid: boolean;
  isDuplicate: boolean;
  ruleScore?: number;
  llmScore?: number;
  passed?: boolean;
}

export default function CertificatePage() {
  const params = useParams();
  const tokenId = params.tokenId as string;
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCert();
  }, [tokenId]);

  async function loadCert() {
    if (!ATTESTATION_ADDRESS || !tokenId) return;

    try {
      const provider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
      const contract = new ethers.Contract(ATTESTATION_ADDRESS, LuxAttestationAbi, provider);
      const att = await contract.getAttestation(Number(tokenId));

      if (!att.valid && !att.brand) {
        setLoading(false);
        return;
      }

      let isDuplicate = false;
      try { isDuplicate = await contract.isDuplicate(Number(tokenId)); } catch {}

      const data: CertData = {
        brand: att.brand,
        model: att.model,
        reference: att.referenceNumber,
        year: Number(att.yearOfProduction),
        material: att.caseMaterial,
        condition: att.conditionGrade,
        aiScore: Number(att.aiScore),
        aiSummary: att.aiSummary,
        serialVerified: att.serialVerified,
        attestedAt: Number(att.attestedAt),
        valid: att.valid,
        isDuplicate,
      };

      if (REASONING_LOG_ADDRESS) {
        try {
          const reasoning = new ethers.Contract(REASONING_LOG_ADDRESS, AIReasoningLogAbi, provider);
          const r = await reasoning.getReasoning(Number(tokenId));
          if (Number(r.tokenId) > 0) {
            data.ruleScore = Number(r.ruleScore);
            data.llmScore = Number(r.llmScore);
            data.passed = r.passed;
          }
        } catch {}
      }

      setCert(data);
    } catch {
      // not found
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-zinc-400">No attestation found for Token #{tokenId}</p>
        <Link href="/verify" className="text-emerald-400 text-sm mt-4 inline-block hover:underline">Go to Verify page</Link>
      </div>
    );
  }

  const scoreColor = cert.aiScore >= 70 ? "text-emerald-400" : cert.aiScore >= 50 ? "text-amber-400" : "text-red-400";
  const scoreBg = cert.aiScore >= 70 ? "bg-emerald-500" : cert.aiScore >= 50 ? "bg-amber-500" : "bg-red-500";
  const date = new Date(cert.attestedAt * 1000);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Certificate card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-8 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-zinc-950 font-bold text-sm">LV</div>
            <div>
              <p className="font-semibold text-sm">LuxVerify</p>
              <p className="text-xs text-zinc-500">Certificate of Authenticity</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-zinc-500">Token</p>
              <p className="font-mono text-sm text-zinc-400">#{tokenId}</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-1">{cert.brand} {cert.model}</h1>
          <p className="text-zinc-400">Ref. {cert.reference} &middot; {cert.year} &middot; {cert.material}</p>
        </div>

        {/* Score */}
        <div className="p-8 border-b border-zinc-800">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${scoreColor}`}>{cert.aiScore}</div>
              <p className="text-xs text-zinc-500 mt-1">AI Score</p>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${scoreBg}`} style={{ width: `${cert.aiScore}%` }} />
              </div>
              <div className="flex gap-4 text-sm">
                {cert.ruleScore !== undefined && (
                  <div><span className="text-zinc-500">Rules:</span> <span className="text-zinc-200">{cert.ruleScore}/100</span></div>
                )}
                {cert.llmScore !== undefined && (
                  <div><span className="text-zinc-500">LLM:</span> <span className="text-zinc-200">{cert.llmScore}/100</span></div>
                )}
                <div>
                  <span className="text-zinc-500">Verdict:</span>{" "}
                  <span className={cert.valid ? "text-emerald-400" : "text-red-400"}>
                    {cert.valid ? "PASSED" : "FAILED"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-8 border-b border-zinc-800">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-zinc-500 text-xs mb-1">Condition</p>
              <p className="text-zinc-200">{cert.condition}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Serial Verification</p>
              <p className={cert.serialVerified ? "text-emerald-400" : "text-zinc-400"}>
                {cert.serialVerified ? "Merkle Verified" : "Unverified"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Attested</p>
              <p className="text-zinc-200">{date.toLocaleDateString()} {date.toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Status</p>
              <p className={cert.isDuplicate ? "text-red-400" : "text-emerald-400"}>
                {cert.isDuplicate ? "Duplicate Flagged" : "Valid"}
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="p-8 border-b border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">AI Assessment</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{cert.aiSummary}</p>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 flex items-center justify-between text-xs text-zinc-600">
          <span>Verified on Rayls Public Chain (ID: 7295799)</span>
          <a
            href={`${PUBLIC_EXPLORER}/address/${ATTESTATION_ADDRESS}`}
            target="_blank"
            rel="noopener"
            className="hover:text-emerald-400 transition-colors"
          >
            View on Explorer
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-6">
        <Link
          href={`/verify?id=${tokenId}`}
          className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          Full Verification Details
        </Link>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-emerald-500 text-zinc-950 rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors"
        >
          Print Certificate
        </button>
      </div>
    </div>
  );
}

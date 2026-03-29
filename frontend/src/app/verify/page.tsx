"use client";

import { useState } from "react";
import { ethers } from "ethers";
import {
  PUBLIC_CHAIN_RPC,
  ATTESTATION_ADDRESS,
  REASONING_LOG_ADDRESS,
  PUBLIC_EXPLORER,
} from "@/lib/contracts";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";
import AIReasoningLogAbi from "@/lib/abis/AIReasoningLog.json";
import CubeLoader from "@/components/ui/cube-loader";

interface AttestationData {
  brand: string;
  model: string;
  reference: string;
  yearOfProduction: number;
  caseMaterial: string;
  conditionGrade: string;
  ownerCount: number;
  longestHoldDays: number;
  averageHoldDays: number;
  imageCount: number;
  serviceCount: number;
  metadataHash: string;
  provenanceHash: string;
  aiScore: number;
  aiSummary: string;
  serialVerified: boolean;
  attestedAt: number;
  valid: boolean;
  isDuplicate: boolean;
}

interface ReasoningData {
  ruleNames: string[];
  rulePassed: boolean[];
  ruleReasons: string[];
  ruleScore: number;
  llmFindings: string[];
  riskFlags: string[];
  llmScore: number;
  finalScore: number;
  passed: boolean;
  timestamp: number;
}

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState("");
  const [attestation, setAttestation] = useState<AttestationData | null>(null);
  const [reasoning, setReasoning] = useState<ReasoningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  async function lookup() {
    if (!tokenId || !ATTESTATION_ADDRESS) {
      setError("Enter a token ID and ensure ATTESTATION_ADDRESS is configured.");
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);
    setAttestation(null);
    setReasoning(null);

    try {
      const provider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
      const contract = new ethers.Contract(ATTESTATION_ADDRESS, LuxAttestationAbi, provider);
      const att = await contract.getAttestation(Number(tokenId));

      if (!att.valid) {
        setNotFound(true);
        return;
      }

      let isDuplicate = false;
      try {
        isDuplicate = await contract.isDuplicate(Number(tokenId));
      } catch { /* old contract without isDuplicate */ }

      setAttestation({
        brand: att.brand,
        model: att.model,
        reference: att.referenceNumber,
        yearOfProduction: Number(att.yearOfProduction),
        caseMaterial: att.caseMaterial,
        conditionGrade: att.conditionGrade,
        ownerCount: Number(att.ownerCount),
        longestHoldDays: Number(att.longestHoldDays),
        averageHoldDays: Number(att.averageHoldDays),
        imageCount: Number(att.imageCount),
        serviceCount: Number(att.serviceCount),
        metadataHash: att.metadataHash,
        provenanceHash: att.provenanceHash,
        aiScore: Number(att.aiScore),
        aiSummary: att.aiSummary,
        serialVerified: att.serialVerified,
        attestedAt: Number(att.attestedAt),
        valid: att.valid,
        isDuplicate,
      });

      // Load reasoning log
      if (REASONING_LOG_ADDRESS) {
        try {
          const reasoningContract = new ethers.Contract(REASONING_LOG_ADDRESS, AIReasoningLogAbi, provider);
          const r = await reasoningContract.getReasoning(Number(tokenId));
          if (r.tokenId && Number(r.tokenId) > 0) {
            setReasoning({
              ruleNames: [...r.ruleNames],
              rulePassed: [...r.rulePassed],
              ruleReasons: [...r.ruleReasons],
              ruleScore: Number(r.ruleScore),
              llmFindings: [...r.llmFindings],
              riskFlags: [...r.riskFlags],
              llmScore: Number(r.llmScore),
              finalScore: Number(r.finalScore),
              passed: r.passed,
              timestamp: Number(r.timestamp),
            });
          }
        } catch { /* reasoning log not available */ }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verify Watch</h1>
        <p className="text-zinc-400">
          Look up any token ID to view its on-chain AI attestation, full reasoning log,
          and Merkle serial verification.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-8">
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Enter Token ID (e.g. 1)"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <button
          onClick={lookup}
          disabled={loading || !tokenId}
          className="px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking
            </span>
          ) : "Verify"}
        </button>
      </div>

      {loading && (
        <CubeLoader
          message="Verifying Token"
          subMessage={`Querying AI attestation for Token #${tokenId} on Rayls Public Chain…`}
        />
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {!loading && notFound && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-lg text-zinc-400 mb-2">No attestation found</p>
          <p className="text-sm text-zinc-500">Token #{tokenId} has not been attested by the AI oracle yet.</p>
        </div>
      )}

      {attestation && (
        <div className="space-y-6 animate-slide-up">
          {/* Duplicate warning */}
          {attestation.isDuplicate && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-400 font-semibold text-sm">Duplicate Serial Detected</p>
                <p className="text-red-400/70 text-xs">This serial number has been seen on another token. Both attestations are flagged.</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-emerald-400 font-medium">{attestation.brand}</p>
                <h2 className="text-2xl font-bold">{attestation.model}</h2>
                <p className="text-zinc-400">Ref. {attestation.reference} &middot; {attestation.yearOfProduction}</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${attestation.aiScore >= 70 ? "text-emerald-400" : attestation.aiScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                  {attestation.aiScore}
                </div>
                <p className="text-xs text-zinc-500">AI Score</p>
              </div>
            </div>

            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-700 ${attestation.aiScore >= 70 ? "bg-emerald-500" : attestation.aiScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${attestation.aiScore}%` }}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge label={attestation.serialVerified ? "Serial Verified (Merkle)" : "Serial Unverified"} ok={attestation.serialVerified} />
              <Badge label={`${attestation.ownerCount} Owner${attestation.ownerCount !== 1 ? "s" : ""}`} ok />
              <Badge label={`${attestation.imageCount} Photos`} ok={attestation.imageCount >= 2} />
              <Badge label={`${attestation.serviceCount} Services`} ok={attestation.serviceCount > 0} />
            </div>
          </div>

          {/* Provenance Timeline */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-5">Provenance Timeline</h3>
            <div className="space-y-0">
              {[
                { label: "Minted on Privacy Node", done: true, detail: `Confidential NFT created with encrypted metadata` },
                { label: "AI Oracle Attested", done: attestation.valid, detail: `Score: ${attestation.aiScore}/100 — ${attestation.serialVerified ? "Serial Merkle-verified" : "Serial unverified"}` },
                { label: "Bridged to Public Chain", done: attestation.attestedAt > 0, detail: attestation.attestedAt > 0 ? new Date(attestation.attestedAt * 1000).toLocaleString() : "Pending" },
                { label: "Listed on Marketplace", done: false, detail: "Available for purchase with USDR" },
                { label: "Purchased & Revealed", done: false, detail: "Private metadata revealed to buyer" },
              ].map((step, i, arr) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.done ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}>
                      {step.done ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : i + 1}
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`w-px h-8 ${step.done ? "bg-emerald-500/40" : "bg-zinc-800"}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-medium ${step.done ? "text-zinc-100" : "text-zinc-500"}`}>{step.label}</p>
                    <p className="text-xs text-zinc-500">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="font-semibold">AI Summary</h3>
              <a href={`/certificate/${tokenId}`} className="ml-auto text-xs text-emerald-400 hover:underline">View Certificate</a>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">{attestation.aiSummary}</p>
          </div>

          {/* Full Reasoning Log (on-chain) */}
          {reasoning && (
            <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="font-semibold">On-Chain AI Reasoning Log</h3>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-auto">Auditable</span>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-zinc-950 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">Rules (60%)</p>
                  <p className="text-xl font-bold text-zinc-100">{reasoning.ruleScore}</p>
                </div>
                <div className="bg-zinc-950 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">LLM (40%)</p>
                  <p className="text-xl font-bold text-zinc-100">{reasoning.llmScore}</p>
                </div>
                <div className="bg-zinc-950 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">Final</p>
                  <p className={`text-xl font-bold ${reasoning.passed ? "text-emerald-400" : "text-red-400"}`}>{reasoning.finalScore}</p>
                </div>
              </div>

              {/* Rule checks */}
              <div className="mb-5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Rule Checks (7)</p>
                <div className="space-y-1.5">
                  {reasoning.ruleNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0 ${reasoning.rulePassed[i] ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        {reasoning.rulePassed[i] ? "\u2713" : "\u2717"}
                      </span>
                      <span className="text-zinc-400 font-mono text-xs">{name}</span>
                      <span className="text-zinc-500 text-xs ml-auto truncate max-w-[50%]">{reasoning.ruleReasons[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LLM findings */}
              {reasoning.llmFindings.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">LLM Findings</p>
                  <ul className="space-y-1">
                    {reasoning.llmFindings.map((f, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk flags */}
              {reasoning.riskFlags.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Risk Flags</p>
                  <ul className="space-y-1">
                    {reasoning.riskFlags.map((f, i) => (
                      <li key={i} className="text-sm text-amber-400 flex items-start gap-2">
                        <span className="mt-0.5">&#x26A0;</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* On-Chain Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">On-Chain Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Detail label="Case Material" value={attestation.caseMaterial} />
              <Detail label="Condition" value={attestation.conditionGrade} />
              <Detail label="Longest Hold" value={`${attestation.longestHoldDays} days`} />
              <Detail label="Avg Hold" value={`${attestation.averageHoldDays} days`} />
              <Detail label="Attested" value={new Date(attestation.attestedAt * 1000).toLocaleString()} />
              <Detail label="Valid" value={attestation.valid ? "Yes" : "No"} />
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Metadata Hash</p>
                <p className="font-mono text-xs text-zinc-400 break-all bg-zinc-800/50 rounded px-2 py-1.5">{attestation.metadataHash}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Provenance Hash</p>
                <p className="font-mono text-xs text-zinc-400 break-all bg-zinc-800/50 rounded px-2 py-1.5">{attestation.provenanceHash}</p>
              </div>
            </div>
          </div>

          <a
            href={`${PUBLIC_EXPLORER}/address/${ATTESTATION_ADDRESS}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View contract on Rayls Explorer
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Hint when nothing searched */}
      {!attestation && !notFound && !error && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">Enter a token ID above to check its AI attestation, reasoning log, and verification status.</p>
        </div>
      )}
    </div>
  );
}

function Badge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ok ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs mb-0.5">{label}</p>
      <p className="text-zinc-200">{value}</p>
    </div>
  );
}

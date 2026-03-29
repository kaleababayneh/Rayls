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
import {
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Clock,
  Users,
  Image as ImageIcon,
  Wrench,
  Cpu,
  GitMerge,
  FileText,
  Lock,
} from "lucide-react";

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

/* ── Score ring gauge ───────────────────────────────────────────────────── */
function ScoreGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 70 ? "#34d399" : score >= 50 ? "#f59e0b" : "#ef4444";
  const glow  = score >= 70 ? "#34d39988" : score >= 50 ? "#f59e0b88" : "#ef444488";

  return (
    <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
      <svg width={130} height={130}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle
          cx={65} cy={65} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)",
            filter: `drop-shadow(0 0 8px ${glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">/ 100</span>
        <span className="text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5">AI Score</span>
      </div>
    </div>
  );
}

/* ── Provenance step ────────────────────────────────────────────────────── */
function ProvenanceStep({
  label, detail, done, last
}: { label: string; detail: string; done: boolean; last: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-700 ${
          done
            ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
            : "bg-zinc-800 border border-zinc-700"
        }`}>
          {done
            ? <CheckCircle2 className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
            : <div className="w-2 h-2 rounded-full bg-zinc-600" />}
        </div>
        {!last && (
          <div className={`w-px flex-1 mt-1 ${done ? "bg-emerald-500/30" : "bg-zinc-800"}`} style={{ minHeight: 32 }} />
        )}
      </div>
      <div className="pb-8">
        <p className={`text-sm font-semibold ${done ? "text-zinc-100" : "text-zinc-600"}`}>{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function VerifyPage() {
  const [tokenId, setTokenId]       = useState("");
  const [attestation, setAttestation] = useState<AttestationData | null>(null);
  const [reasoning, setReasoning]   = useState<ReasoningData | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [notFound, setNotFound]     = useState(false);
  const [showRules, setShowRules]   = useState(false);
  const [showHashes, setShowHashes] = useState(false);

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

      if (!att.valid) { setNotFound(true); return; }

      let isDuplicate = false;
      try { isDuplicate = await contract.isDuplicate(Number(tokenId)); } catch { /* old contract */ }

      setAttestation({
        brand: att.brand, model: att.model, reference: att.referenceNumber,
        yearOfProduction: Number(att.yearOfProduction), caseMaterial: att.caseMaterial,
        conditionGrade: att.conditionGrade, ownerCount: Number(att.ownerCount),
        longestHoldDays: Number(att.longestHoldDays), averageHoldDays: Number(att.averageHoldDays),
        imageCount: Number(att.imageCount), serviceCount: Number(att.serviceCount),
        metadataHash: att.metadataHash, provenanceHash: att.provenanceHash,
        aiScore: Number(att.aiScore), aiSummary: att.aiSummary,
        serialVerified: att.serialVerified, attestedAt: Number(att.attestedAt),
        valid: att.valid, isDuplicate,
      });

      if (REASONING_LOG_ADDRESS) {
        try {
          const rc = new ethers.Contract(REASONING_LOG_ADDRESS, AIReasoningLogAbi, provider);
          const r = await rc.getReasoning(Number(tokenId));
          if (r.tokenId && Number(r.tokenId) > 0) {
            setReasoning({
              ruleNames: [...r.ruleNames], rulePassed: [...r.rulePassed], ruleReasons: [...r.ruleReasons],
              ruleScore: Number(r.ruleScore), llmFindings: [...r.llmFindings], riskFlags: [...r.riskFlags],
              llmScore: Number(r.llmScore), finalScore: Number(r.finalScore),
              passed: r.passed, timestamp: Number(r.timestamp),
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

  const scoreColor = (s: number) => s >= 70 ? "text-emerald-400" : s >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/60 mb-2">Provenance Intelligence</p>
        <h1 className="text-3xl font-bold mb-2">Verify Authenticity</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Query any token ID to retrieve its on-chain AI attestation, full reasoning audit, and Merkle serial proof.
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="relative mb-10 group">
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none" />
        <div className="relative flex gap-3 p-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm group-focus-within:border-emerald-500/30 transition-colors duration-300">
          <div className="flex items-center gap-3 flex-1 pl-3">
            <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Enter Token ID  e.g. 1"
              className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none py-2"
              onKeyDown={(e) => e.key === "Enter" && lookup()}
            />
          </div>
          <button
            onClick={lookup}
            disabled={loading || !tokenId}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 text-sm font-bold hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/20 flex-shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Querying
              </span>
            ) : "Verify"}
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <CubeLoader
          message="Verifying Token"
          subMessage={`Querying AI attestation for Token #${tokenId} on Rayls Public Chain…`}
        />
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 mb-6 animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* ── Not found ── */}
      {!loading && notFound && (
        <div className="flex flex-col items-center py-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-zinc-600" strokeWidth={1.5} />
          </div>
          <p className="text-zinc-300 font-semibold mb-1">No attestation found</p>
          <p className="text-sm text-zinc-600 max-w-xs">
            Token #{tokenId} has not been attested by the AI oracle yet. The watch may still be pending.
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!attestation && !notFound && !error && !loading && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-2xl bg-zinc-900 border border-zinc-800 animate-glow-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-9 h-9 text-zinc-600" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-zinc-400 font-medium mb-2">Awaiting your query</p>
          <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
            Enter a token ID above to retrieve its AI attestation, reasoning audit, and Merkle serial proof.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["AI Verdict", "Serial Merkle Proof", "Provenance Chain", "Risk Flags"].map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-500">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {attestation && (
        <div className="space-y-4 animate-slide-up">

          {/* Duplicate warning */}
          {attestation.isDuplicate && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/25 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-red-400 font-semibold text-sm">Duplicate Serial Detected</p>
                <p className="text-red-400/60 text-xs mt-0.5">This serial number appears on another token. Both attestations are flagged as potentially fraudulent.</p>
              </div>
            </div>
          )}

          {/* ── Main attestation card ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            {/* Header band */}
            <div className={`h-1 w-full ${attestation.aiScore >= 70 ? "bg-emerald-500" : attestation.aiScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ boxShadow: attestation.aiScore >= 70 ? "0 0 20px rgba(52,211,153,0.4)" : attestation.aiScore >= 50 ? "0 0 20px rgba(245,158,11,0.4)" : "0 0 20px rgba(239,68,68,0.4)" }}
            />

            <div className="p-6">
              <div className="flex items-start gap-6">
                {/* Watch info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/80 mb-1">{attestation.brand}</p>
                  <h2 className="text-2xl font-bold text-zinc-100 leading-tight mb-1">{attestation.model}</h2>
                  <p className="text-zinc-500 text-sm">
                    Ref. {attestation.reference} &nbsp;&middot;&nbsp; {attestation.yearOfProduction}
                  </p>
                  <p className="text-zinc-600 text-xs mt-1">
                    {attestation.caseMaterial} &nbsp;&middot;&nbsp; {attestation.conditionGrade}
                  </p>
                </div>

                {/* Score gauge */}
                <ScoreGauge score={attestation.aiScore} />
              </div>

              {/* Score bar */}
              <div className="mt-5 mb-5">
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${attestation.aiScore >= 70 ? "bg-emerald-500" : attestation.aiScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${attestation.aiScore}%`, boxShadow: "0 0 8px currentColor" }}
                  />
                </div>
              </div>

              {/* Badge chips */}
              <div className="flex gap-2 flex-wrap">
                <ChipBadge
                  icon={<Fingerprint className="w-3 h-3" />}
                  label={attestation.serialVerified ? "Serial Verified" : "Serial Unverified"}
                  ok={attestation.serialVerified}
                  detail="Merkle proof"
                />
                <ChipBadge
                  icon={<Users className="w-3 h-3" />}
                  label={`${attestation.ownerCount} Owner${attestation.ownerCount !== 1 ? "s" : ""}`}
                  ok
                />
                <ChipBadge
                  icon={<ImageIcon className="w-3 h-3" />}
                  label={`${attestation.imageCount} Photos`}
                  ok={attestation.imageCount >= 2}
                />
                <ChipBadge
                  icon={<Wrench className="w-3 h-3" />}
                  label={`${attestation.serviceCount} Services`}
                  ok={attestation.serviceCount > 0}
                />
                <ChipBadge
                  icon={<Clock className="w-3 h-3" />}
                  label={`Avg ${attestation.averageHoldDays}d hold`}
                  ok
                />
              </div>
            </div>
          </div>

          {/* ── AI Summary ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-sm text-zinc-200">AI Verdict</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono uppercase tracking-widest">Claude AI</span>
              <a
                href={`/certificate/${tokenId}`}
                className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                Certificate
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">{attestation.aiSummary}</p>
          </div>

          {/* ── Provenance timeline ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <GitMerge className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-sm text-zinc-200">Provenance Chain</h3>
            </div>
            <div>
              {[
                {
                  label: "Minted on Privacy Node",
                  detail: "Confidential NFT created with encrypted metadata on sovereign Privacy Node",
                  done: true,
                },
                {
                  label: "AI Oracle Attested",
                  detail: `Score ${attestation.aiScore}/100 · ${attestation.serialVerified ? "Serial Merkle-verified" : "Serial unverified"} · ${attestation.brand} ${attestation.model}`,
                  done: attestation.valid,
                },
                {
                  label: "Bridged to Public Chain",
                  detail: attestation.attestedAt > 0
                    ? new Date(attestation.attestedAt * 1000).toLocaleString()
                    : "Pending — oracle must attest first",
                  done: attestation.attestedAt > 0,
                },
                {
                  label: "Listed on Marketplace",
                  detail: "Available for purchase with USDR escrow",
                  done: false,
                },
                {
                  label: "Purchased & Revealed",
                  detail: "Private metadata unlocked to buyer by RevealTracker contract",
                  done: false,
                },
              ].map((step, i, arr) => (
                <ProvenanceStep key={i} {...step} last={i === arr.length - 1} />
              ))}
            </div>
          </div>

          {/* ── On-chain reasoning log ── */}
          {reasoning && (
            <div className="rounded-2xl border border-emerald-500/20 bg-zinc-900/60 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-200">On-Chain Reasoning Audit</h3>
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${reasoning.passed ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                    {reasoning.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Rules (60%)", value: reasoning.ruleScore, color: "emerald" },
                    { label: "LLM (40%)", value: reasoning.llmScore, color: "blue" },
                    { label: "Final", value: reasoning.finalScore, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className={`rounded-xl p-4 text-center ${highlight ? "bg-zinc-800 border border-zinc-700" : "bg-zinc-950 border border-zinc-800"}`}>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">{label}</p>
                      <p className={`text-2xl font-bold tabular-nums ${highlight ? scoreColor(value) : "text-zinc-100"}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Rule checks — collapsible */}
                <button
                  onClick={() => setShowRules(!showRules)}
                  className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-3"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    Rule Checks ({reasoning.ruleNames.length})
                    <span className="text-emerald-400 text-[10px]">
                      {reasoning.rulePassed.filter(Boolean).length}/{reasoning.ruleNames.length} passed
                    </span>
                  </span>
                  {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showRules && (
                  <div className="space-y-1.5 mb-4 animate-fade-in">
                    {reasoning.ruleNames.map((name, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800/50">
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 ${reasoning.rulePassed[i] ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                          {reasoning.rulePassed[i]
                            ? <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                            : <XCircle className="w-3 h-3" strokeWidth={2.5} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-zinc-300">{name}</span>
                          {reasoning.ruleReasons[i] && (
                            <p className="text-zinc-600 mt-0.5 truncate">{reasoning.ruleReasons[i]}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* LLM findings */}
                {reasoning.llmFindings.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 px-1">Claude AI Findings</p>
                    <div className="space-y-1.5">
                      {reasoning.llmFindings.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800/50">
                          <span className="text-emerald-400 mt-0.5 flex-shrink-0">&#x2022;</span>
                          <span className="text-zinc-400">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk flags */}
                {reasoning.riskFlags.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 px-1">Risk Flags</p>
                    <div className="space-y-1.5">
                      {reasoning.riskFlags.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                          <span className="text-amber-300/80">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── On-chain data ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-sm text-zinc-200">On-Chain Record</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: "Case Material", value: attestation.caseMaterial },
                { label: "Condition", value: attestation.conditionGrade },
                { label: "Longest Hold", value: `${attestation.longestHoldDays} days` },
                { label: "Avg Hold", value: `${attestation.averageHoldDays} days` },
                { label: "Attested", value: new Date(attestation.attestedAt * 1000).toLocaleDateString() },
                { label: "Validity", value: attestation.valid ? "Valid" : "Invalid" },
              ].map(({ label, value }) => (
                <div key={label} className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800/50">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
                  <p className="text-sm text-zinc-200 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Hashes — collapsible */}
            <button
              onClick={() => setShowHashes(!showHashes)}
              className="flex items-center justify-between w-full py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <span className="font-mono">Cryptographic hashes</span>
              {showHashes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showHashes && (
              <div className="mt-3 space-y-3 animate-fade-in">
                {[
                  { label: "Metadata Hash", value: attestation.metadataHash },
                  { label: "Provenance Hash", value: attestation.provenanceHash },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1.5">{label}</p>
                    <p className="font-mono text-[11px] text-zinc-500 bg-zinc-950 rounded-lg px-3 py-2.5 border border-zinc-800/50 break-all leading-relaxed">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Explorer link */}
          <a
            href={`${PUBLIC_EXPLORER}/address/${ATTESTATION_ADDRESS}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-800 text-xs text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View attestation contract on Rayls Explorer
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────── */

function ChipBadge({
  icon, label, ok, detail
}: { icon: React.ReactNode; label: string; ok: boolean; detail?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border ${
      ok
        ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/20"
        : "bg-zinc-800 text-zinc-500 border-zinc-700"
    }`}>
      {icon}
      {label}
      {detail && <span className="text-[10px] opacity-60">· {detail}</span>}
    </span>
  );
}

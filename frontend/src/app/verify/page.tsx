"use client";

import { useState } from "react";
import { ethers } from "ethers";
import {
  PUBLIC_CHAIN_RPC,
  ATTESTATION_ADDRESS,
  PUBLIC_EXPLORER,
} from "@/lib/contracts";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";

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
}

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState("");
  const [attestation, setAttestation] = useState<AttestationData | null>(null);
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

    try {
      const provider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
      const contract = new ethers.Contract(
        ATTESTATION_ADDRESS,
        LuxAttestationAbi,
        provider
      );

      const att = await contract.getAttestation(Number(tokenId));

      if (!att.valid) {
        setNotFound(true);
        return;
      }

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
      });
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
          Look up any token ID to view its on-chain AI attestation, Merkle serial
          verification, and provenance data.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-8">
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Enter Token ID (e.g. 1)"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <button
          onClick={lookup}
          disabled={loading}
          className="px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Checking..." : "Verify"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      {notFound && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-lg text-zinc-400 mb-2">No attestation found</p>
          <p className="text-sm text-zinc-500">
            Token #{tokenId} has not been attested by the AI oracle yet.
          </p>
        </div>
      )}

      {attestation && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-emerald-400 font-medium">
                  {attestation.brand}
                </p>
                <h2 className="text-2xl font-bold">{attestation.model}</h2>
                <p className="text-zinc-400">
                  Ref. {attestation.reference} &middot;{" "}
                  {attestation.yearOfProduction}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${
                    attestation.aiScore >= 70
                      ? "text-emerald-400"
                      : attestation.aiScore >= 50
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {attestation.aiScore}
                </div>
                <p className="text-xs text-zinc-500">AI Score</p>
              </div>
            </div>

            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all ${
                  attestation.aiScore >= 70
                    ? "bg-emerald-500"
                    : attestation.aiScore >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${attestation.aiScore}%` }}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge
                label={
                  attestation.serialVerified
                    ? "Serial Verified (Merkle)"
                    : "Serial Unverified"
                }
                ok={attestation.serialVerified}
              />
              <Badge
                label={`${attestation.ownerCount} Owner${
                  attestation.ownerCount !== 1 ? "s" : ""
                }`}
                ok
              />
              <Badge
                label={`${attestation.imageCount} Photos`}
                ok={attestation.imageCount >= 2}
              />
              <Badge
                label={`${attestation.serviceCount} Services`}
                ok={attestation.serviceCount > 0}
              />
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3">AI Analysis</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {attestation.aiSummary}
            </p>
          </div>

          {/* Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">On-Chain Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Detail label="Case Material" value={attestation.caseMaterial} />
              <Detail label="Condition" value={attestation.conditionGrade} />
              <Detail
                label="Longest Hold"
                value={`${attestation.longestHoldDays} days`}
              />
              <Detail
                label="Avg Hold"
                value={`${attestation.averageHoldDays} days`}
              />
              <Detail
                label="Attested"
                value={new Date(
                  attestation.attestedAt * 1000
                ).toLocaleString()}
              />
              <Detail label="Valid" value={attestation.valid ? "Yes" : "No"} />
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
              <div>
                <p className="text-xs text-zinc-500">Metadata Hash</p>
                <p className="font-mono text-xs text-zinc-400 break-all">
                  {attestation.metadataHash}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Provenance Hash</p>
                <p className="font-mono text-xs text-zinc-400 break-all">
                  {attestation.provenanceHash}
                </p>
              </div>
            </div>
          </div>

          <a
            href={`${PUBLIC_EXPLORER}/address/${ATTESTATION_ADDRESS}`}
            target="_blank"
            rel="noopener"
            className="block text-center text-sm text-emerald-400 hover:text-emerald-300"
          >
            View contract on Rayls Explorer
          </a>
        </div>
      )}
    </div>
  );
}

function Badge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        ok
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-zinc-800 text-zinc-500"
      }`}
    >
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className="text-zinc-200">{value}</p>
    </div>
  );
}

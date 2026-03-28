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

// Preset watch templates for quick minting
const PRESETS = [
  {
    label: "Rolex Submariner Date",
    brand: "Rolex", model: "Submariner Date", reference: "126610LN",
    year: 2023, serial: "M126610LN-7E8F9A0B", caliber: "3235",
    material: "Oystersteel", dialColor: "Black", braceletType: "Oyster",
    caseDiameter: 41, appraisedValue: 14500, condition: "Excellent",
    conditionNotes: "Full set, warranty card dated 2023, minor bracelet wear",
    serviceCenter: "Rolex Service Centre Geneva", serviceWork: "Full movement service",
  },
  {
    label: "Rolex GMT-Master II (Batman)",
    brand: "Rolex", model: "GMT-Master II", reference: "126710BLNR",
    year: 2022, serial: "M126710BLNR-1C2D3E4F", caliber: "3285",
    material: "Oystersteel", dialColor: "Black", braceletType: "Jubilee",
    caseDiameter: 40, appraisedValue: 17200, condition: "Very Good",
    conditionNotes: "Light scratches on polished center links, bezel insert perfect",
    serviceCenter: "Watchfinder London", serviceWork: "Polish and pressure test",
  },
  {
    label: "Rolex Submariner (No Date)",
    brand: "Rolex", model: "Submariner", reference: "124060",
    year: 2024, serial: "M124060-9E0F1A2B", caliber: "3230",
    material: "Oystersteel", dialColor: "Black", braceletType: "Oyster",
    caseDiameter: 41, appraisedValue: 9800, condition: "Mint",
    conditionNotes: "Unworn, stickers removed, full set with hang tags",
    serviceCenter: "", serviceWork: "",
  },
];

export default function DealerPage() {
  const [watches, setWatches] = useState<WatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMintForm, setShowMintForm] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState("");

  // Form state
  const [form, setForm] = useState(PRESETS[0]);

  useEffect(() => {
    loadWatches();
  }, []);

  function applyPreset(idx: number) {
    setForm(PRESETS[idx]);
  }

  async function loadWatches() {
    if (!TOKEN_ADDRESS) {
      setError("TOKEN_ADDRESS not configured. Deploy LuxWatchNFT first.");
      setLoading(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(PRIVACY_NODE_RPC);
      const nft = new ethers.Contract(TOKEN_ADDRESS, LuxWatchNFTAbi, provider);

      const watchList: WatchInfo[] = [];
      for (let tokenId = 1; tokenId <= 50; tokenId++) {
        try {
          const data = await nft.getWatchData(tokenId);
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
          break;
        }
      }

      if (ATTESTATION_ADDRESS && watchList.length > 0) {
        try {
          const publicProvider = new ethers.JsonRpcProvider(PUBLIC_CHAIN_RPC);
          const attestation = new ethers.Contract(ATTESTATION_ADDRESS, LuxAttestationAbi, publicProvider);
          for (const w of watchList) {
            try {
              const att = await attestation.getAttestation(w.tokenId);
              if (att.valid) {
                w.isAttested = true;
                w.attestationScore = Number(att.aiScore);
              }
            } catch { /* not attested */ }
          }
        } catch { /* public chain unavailable */ }
      }

      setWatches(watchList);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleMint() {
    setMinting(true);
    setMintSuccess("");
    setError("");

    try {
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMintSuccess(`Token #${data.tokenId} minted! TX: ${data.txHash.slice(0, 18)}...`);
      setShowMintForm(false);
      await loadWatches();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setMinting(false);
    }
  }

  function updateForm(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dealer Dashboard</h1>
          <p className="text-zinc-400">
            Mint confidential watch NFTs on the Privacy Node. The AI oracle will
            automatically attest them.
          </p>
        </div>
        <button
          onClick={() => setShowMintForm(!showMintForm)}
          className="px-5 py-2.5 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-colors"
        >
          {showMintForm ? "Cancel" : "+ Mint Watch"}
        </button>
      </div>

      {mintSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 text-emerald-400">
          {mintSuccess}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      {/* Mint Form */}
      {showMintForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">Mint New Watch</h2>

          {/* Presets */}
          <div className="mb-6">
            <p className="text-xs text-zinc-500 mb-2">Quick presets:</p>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.serial === p.serial
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Brand" value={form.brand} onChange={(v) => updateForm("brand", v)} />
            <Field label="Model" value={form.model} onChange={(v) => updateForm("model", v)} />
            <Field label="Reference" value={form.reference} onChange={(v) => updateForm("reference", v)} />
            <Field label="Year" value={String(form.year)} onChange={(v) => updateForm("year", Number(v))} type="number" />
            <Field label="Serial Number" value={form.serial} onChange={(v) => updateForm("serial", v)} />
            <Field label="Caliber" value={form.caliber} onChange={(v) => updateForm("caliber", v)} />
            <Field label="Case Material" value={form.material} onChange={(v) => updateForm("material", v)} />
            <Field label="Dial Color" value={form.dialColor} onChange={(v) => updateForm("dialColor", v)} />
            <Field label="Bracelet" value={form.braceletType} onChange={(v) => updateForm("braceletType", v)} />
            <Field label="Case Diameter (mm)" value={String(form.caseDiameter)} onChange={(v) => updateForm("caseDiameter", Number(v))} type="number" />
            <Field label="Appraised Value (USD)" value={String(form.appraisedValue)} onChange={(v) => updateForm("appraisedValue", Number(v))} type="number" />
            <Field label="Condition" value={form.condition} onChange={(v) => updateForm("condition", v)} />
          </div>

          <div className="mt-4">
            <Field label="Condition Notes" value={form.conditionNotes} onChange={(v) => updateForm("conditionNotes", v)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Service Center (optional)" value={form.serviceCenter} onChange={(v) => updateForm("serviceCenter", v)} />
            <Field label="Service Work (optional)" value={form.serviceWork} onChange={(v) => updateForm("serviceWork", v)} />
          </div>

          <button
            onClick={handleMint}
            disabled={minting}
            className="mt-6 px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 w-full md:w-auto"
          >
            {minting ? "Minting on Privacy Node..." : "Mint Confidential NFT"}
          </button>
        </div>
      )}

      {/* Watch Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : watches.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No watches minted yet</p>
          <p className="text-sm">Click &quot;+ Mint Watch&quot; to create your first confidential watch NFT.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watches.map((w) => (
            <div key={w.tokenId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-emerald-400 font-medium">{w.brand}</p>
                  <h3 className="font-semibold text-lg">{w.model}</h3>
                  <p className="text-sm text-zinc-400">Ref. {w.reference} &middot; {w.year}</p>
                </div>
                <span className="text-xs text-zinc-500">#{w.tokenId}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-zinc-500">Serial</p><p className="font-mono text-xs">{w.serial}</p></div>
                <div><p className="text-zinc-500">Caliber</p><p>{w.caliber}</p></div>
                <div><p className="text-zinc-500">Material</p><p>{w.material}</p></div>
                <div><p className="text-zinc-500">Condition</p><p>{w.condition}</p></div>
                <div><p className="text-zinc-500">Photos</p><p>{w.imageCount}</p></div>
                <div><p className="text-zinc-500">Services</p><p>{w.serviceCount}</p></div>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                {w.isAttested ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          w.attestationScore >= 70 ? "bg-emerald-500" : w.attestationScore >= 50 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${w.attestationScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-emerald-400">{w.attestationScore}/100</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">ATTESTED</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm text-amber-400">Awaiting AI attestation...</span>
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
            { label: "AI Attestation", status: watches.some((w) => w.isAttested) },
            { label: "Bridge to Public", status: false },
            { label: "List on Marketplace", status: false },
            { label: "Buyer Reveal", status: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${step.status ? "bg-emerald-500" : "bg-zinc-700"}`} />
              <span className={`text-sm ${step.status ? "text-zinc-100" : "text-zinc-500"}`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}

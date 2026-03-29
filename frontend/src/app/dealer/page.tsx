"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  PRIVACY_NODE_RPC,
  TOKEN_ADDRESS,
  ATTESTATION_ADDRESS,
  PUBLIC_CHAIN_RPC,
} from "@/lib/contracts";
import LuxWatchNFTAbi from "@/lib/abis/LuxWatchNFT.json";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";
import CubeLoader from "@/components/ui/cube-loader";

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

const PRESETS = [
  {
    label: "Rolex Submariner Date",
    brand: "Rolex", model: "Submariner Date", reference: "126610LN",
    year: 2023, serial: `M126610LN-${Date.now().toString(36).toUpperCase()}`, caliber: "3235",
    material: "Oystersteel", dialColor: "Black", braceletType: "Oyster",
    caseDiameter: 41, appraisedValue: 14500, condition: "Excellent",
    conditionNotes: "Full set, warranty card dated 2023, minor bracelet wear",
    serviceCenter: "Rolex Service Centre Geneva", serviceWork: "Full movement service",
    fraud: false,
  },
  {
    label: "GMT-Master II Batman",
    brand: "Rolex", model: "GMT-Master II", reference: "126710BLNR",
    year: 2022, serial: `M126710BLNR-${Date.now().toString(36).toUpperCase()}`, caliber: "3285",
    material: "Oystersteel", dialColor: "Black", braceletType: "Jubilee",
    caseDiameter: 40, appraisedValue: 17200, condition: "Very Good",
    conditionNotes: "Light scratches on polished center links, bezel insert perfect",
    serviceCenter: "Watchfinder London", serviceWork: "Polish and pressure test",
    fraud: false,
  },
  {
    label: "Omega Speedmaster",
    brand: "Omega", model: "Speedmaster Moonwatch", reference: "310.30.42.50.01.001",
    year: 2023, serial: `OM310-${Date.now().toString(36).toUpperCase()}`, caliber: "3861",
    material: "Stainless Steel", dialColor: "Black", braceletType: "Bracelet",
    caseDiameter: 42, appraisedValue: 6500, condition: "Excellent",
    conditionNotes: "Full set with extract of archive, minor desk marks",
    serviceCenter: "Omega Boutique Zurich", serviceWork: "Battery and pressure test",
    fraud: false,
  },
  {
    label: "AP Royal Oak",
    brand: "Audemars Piguet", model: "Royal Oak", reference: "15500ST.OO.1220ST.01",
    year: 2021, serial: `AP15500-${Date.now().toString(36).toUpperCase()}`, caliber: "4302",
    material: "Stainless Steel", dialColor: "Blue", braceletType: "Integrated Bracelet",
    caseDiameter: 41, appraisedValue: 35000, condition: "Very Good",
    conditionNotes: "Complete set, light hairlines on bracelet and case",
    serviceCenter: "AP Service Center Le Brassus", serviceWork: "Full service and polish",
    fraud: false,
  },
];

const FRAUD_PRESETS = [
  {
    label: "Wrong Caliber (Frankenwatch)",
    brand: "Rolex", model: "Submariner Date", reference: "126610LN",
    year: 2023, serial: `FRAUD-CAL-${Date.now().toString(36).toUpperCase()}`, caliber: "4130",
    material: "Oystersteel", dialColor: "Black", braceletType: "Oyster",
    caseDiameter: 41, appraisedValue: 14500, condition: "Excellent",
    conditionNotes: "Purchased from unauthorized dealer, no papers",
    serviceCenter: "", serviceWork: "",
    fraud: true,
  },
  {
    label: "Fake Material",
    brand: "Rolex", model: "GMT-Master II", reference: "126710BLNR",
    year: 2022, serial: `FRAUD-MAT-${Date.now().toString(36).toUpperCase()}`, caliber: "3285",
    material: "Titanium", dialColor: "Black", braceletType: "Jubilee",
    caseDiameter: 40, appraisedValue: 17200, condition: "Mint",
    conditionNotes: "Seller claims special edition, no documentation",
    serviceCenter: "", serviceWork: "",
    fraud: true,
  },
  {
    label: "Impossible Year",
    brand: "Rolex", model: "Submariner Date", reference: "126610LN",
    year: 2015, serial: `FRAUD-YR-${Date.now().toString(36).toUpperCase()}`, caliber: "3235",
    material: "Oystersteel", dialColor: "Black", braceletType: "Oyster",
    caseDiameter: 41, appraisedValue: 14500, condition: "Excellent",
    conditionNotes: "Claims to be early release, no warranty card",
    serviceCenter: "", serviceWork: "",
    fraud: true,
  },
];

export default function DealerPage() {
  const [watches, setWatches] = useState<WatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMintForm, setShowMintForm] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState("");
  const [form, setForm] = useState(PRESETS[0]);

  const loadWatches = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadWatches();
  }, [loadWatches]);

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

      setMintSuccess(`Token #${data.tokenId} minted successfully! TX: ${data.txHash.slice(0, 18)}...`);
      setShowMintForm(false);
      setLoading(true);
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

  const attestedCount = watches.filter((w) => w.isAttested).length;
  const pipelineSteps = [
    { label: "Mint on Privacy Node", done: watches.length > 0 },
    { label: "AI Attestation", done: attestedCount > 0 },
    { label: "Bridge to Public", done: false },
    { label: "List on Marketplace", done: false },
    { label: "Buyer Reveal", done: false },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dealer Dashboard</h1>
          <p className="text-zinc-400">
            Mint confidential watch NFTs on the Privacy Node. The AI oracle automatically attests them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setLoading(true); loadWatches(); }}
            className="p-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setShowMintForm(!showMintForm)}
            className="px-5 py-2.5 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            {showMintForm ? "Cancel" : "+ Mint Watch"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {mintSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 text-emerald-400 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {mintSuccess}
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

      {/* Mint Form */}
      {showMintForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 animate-slide-up">
          <h2 className="font-semibold text-lg mb-1">Mint New Watch</h2>
          <p className="text-sm text-zinc-500 mb-5">Creates a confidential NFT on the Privacy Node with encrypted metadata.</p>

          {/* Presets */}
          <div className="mb-6">
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Authentic Watches</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setForm(PRESETS[i])}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    form.serial === p.serial
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-red-400/70 mb-2 uppercase tracking-wider">Fraud Test Cases</p>
            <div className="flex gap-2 flex-wrap">
              {FRAUD_PRESETS.map((p, i) => (
                <button
                  key={`fraud-${i}`}
                  onClick={() => setForm(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    form.serial === p.serial
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-zinc-800 text-red-400/60 border border-red-500/20 hover:border-red-500/40"
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
            disabled={minting || !form.brand || !form.serial}
            className="mt-6 px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:hover:bg-emerald-500 w-full md:w-auto hover:shadow-lg hover:shadow-emerald-500/20"
          >
            {minting ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Minting on Privacy Node...
              </span>
            ) : (
              "Mint Confidential NFT"
            )}
          </button>
        </div>
      )}

      {/* Stats bar */}
      {!loading && watches.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{watches.length}</p>
            <p className="text-xs text-zinc-500">Minted</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{attestedCount}</p>
            <p className="text-xs text-zinc-500">Attested</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-zinc-400">{watches.length - attestedCount}</p>
            <p className="text-xs text-zinc-500">Pending</p>
          </div>
        </div>
      )}

      {/* Watch Grid */}
      {loading ? (
        <CubeLoader
          message="Syncing Watches"
          subMessage={`Reading confidential NFTs from Privacy Node${TOKEN_ADDRESS ? ` · token ${TOKEN_ADDRESS.slice(0, 10)}…` : ""}`}
        />
      ) : watches.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-lg text-zinc-400 mb-2">No watches minted yet</p>
          <p className="text-sm text-zinc-600 mb-6">Create your first confidential watch NFT to get started.</p>
          <button
            onClick={() => setShowMintForm(true)}
            className="px-5 py-2.5 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all"
          >
            + Mint Watch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {watches.map((w) => (
            <div key={w.tokenId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-emerald-400 font-medium">{w.brand}</p>
                  <h3 className="font-semibold text-lg">{w.model}</h3>
                  <p className="text-sm text-zinc-400">Ref. {w.reference} &middot; {w.year}</p>
                </div>
                <span className="text-xs text-zinc-600 font-mono">#{w.tokenId}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-zinc-500 text-xs">Serial</p><p className="font-mono text-xs truncate">{w.serial}</p></div>
                <div><p className="text-zinc-500 text-xs">Caliber</p><p className="text-sm">{w.caliber}</p></div>
                <div><p className="text-zinc-500 text-xs">Material</p><p className="text-sm">{w.material}</p></div>
                <div><p className="text-zinc-500 text-xs">Condition</p><p className="text-sm">{w.condition}</p></div>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {w.imageCount} photos
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {w.serviceCount} services
                </span>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                {w.isAttested ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          w.attestationScore >= 70 ? "bg-emerald-500" : w.attestationScore >= 50 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${w.attestationScore}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${w.attestationScore >= 70 ? "text-emerald-400" : w.attestationScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {w.attestationScore}/100
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 font-medium">
                      ATTESTED
                    </span>
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

      {/* Pipeline Status */}
      <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-semibold mb-6">Pipeline Status</h2>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-0">
          {pipelineSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-0 flex-1">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step.done
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                }`}>
                  {step.done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-sm whitespace-nowrap ${step.done ? "text-zinc-100" : "text-zinc-500"}`}>
                  {step.label}
                </span>
              </div>
              {i < pipelineSteps.length - 1 && (
                <div className={`hidden md:block flex-1 h-px mx-4 ${
                  step.done ? "bg-emerald-500/40" : "bg-zinc-800"
                }`} />
              )}
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
      <label className="block text-xs text-zinc-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors placeholder:text-zinc-600"
      />
    </div>
  );
}

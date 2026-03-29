"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  FileLock2,
  Fingerprint,
  Gem,
  History,
  RefreshCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  PRIVACY_NODE_RPC,
  TOKEN_ADDRESS,
  ATTESTATION_ADDRESS,
  PUBLIC_CHAIN_RPC,
} from "@/lib/contracts";
import LuxWatchNFTAbi from "@/lib/abis/LuxWatchNFT.json";
import LuxAttestationAbi from "@/lib/abis/LuxAttestation.json";
import CubeLoader from "@/components/ui/cube-loader";
import { ArticleCard } from "@/components/ui/article-cards";

/* ── Watch image pool — Unsplash luxury photography ─────────── */
const WATCH_IMAGES = [
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1622434641406-a158123450f7?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=640&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=640&h=400&fit=crop&q=80",
];

function getWatchImage(tokenId: number) {
  return WATCH_IMAGES[(tokenId - 1) % WATCH_IMAGES.length];
}

function getPresetImage(brand: string, model: string) {
  const signature = `${brand} ${model}`.toLowerCase();
  if (signature.includes("submariner")) return WATCH_IMAGES[0];
  if (signature.includes("gmt")) return WATCH_IMAGES[1];
  if (signature.includes("speedmaster")) return WATCH_IMAGES[2];
  if (signature.includes("royal oak")) return WATCH_IMAGES[3];
  if (signature.includes("omega")) return WATCH_IMAGES[4];
  if (signature.includes("audemars")) return WATCH_IMAGES[5];
  return WATCH_IMAGES[6];
}

function getWatchGradient(w: { isAttested: boolean; attestationScore: number }) {
  if (!w.isAttested) return "from-amber-950/90 to-zinc-950/95";
  if (w.attestationScore >= 70) return "from-emerald-950/90 to-zinc-950/95";
  if (w.attestationScore >= 50) return "from-amber-950/85 to-zinc-950/95";
  return "from-red-950/85 to-zinc-950/95";
}

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

const CONDITION_OPTIONS = ["Mint", "Excellent", "Very Good", "Good", "Fair"];

export default function DealerPage() {
  const router = useRouter();
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
  const isFraudScenario = Boolean(form.fraud);
  const previewImage = getPresetImage(form.brand, form.model);
  const appraisalDensity = Math.round(form.appraisedValue / Math.max(form.caseDiameter, 1));
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
        <div className="mb-8 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30 animate-slide-up">
          <div className="grid xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="relative overflow-hidden border-b border-zinc-800 xl:border-b-0 xl:border-r">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${previewImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/10 via-zinc-950/60 to-zinc-950" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_44%)]" />

              <div className="relative flex h-full flex-col justify-between p-6 md:p-7">
                <div>
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      <FileLock2 className="h-3.5 w-3.5" />
                      Privacy Node Mint
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                        isFraudScenario
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-emerald-500/25 bg-zinc-900/60 text-zinc-200"
                      }`}
                    >
                      {isFraudScenario ? <AlertTriangle className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                      {isFraudScenario ? "Fraud Scenario" : "Authentic Profile"}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-emerald-300">{form.brand}</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">{form.model}</h2>
                  <p className="mt-2 text-sm text-zinc-300">
                    Ref. {form.reference} · {form.year} · Cal. {form.caliber}
                  </p>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
                    {isFraudScenario
                      ? "This preset is designed to trigger rule failures or suspicious signals so you can test the oracle path end to end."
                      : "This mint packages provenance, service history, and image commitments into a confidential NFT before public attestation begins."}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <PreviewStat label="Value" value={`$${form.appraisedValue.toLocaleString()}`} />
                    <PreviewStat label="Case" value={`${form.caseDiameter} mm`} />
                    <PreviewStat label="Material" value={form.material} />
                    <PreviewStat label="Condition" value={form.condition} />
                  </div>
                </div>

                <div className="mt-8 space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 backdrop-blur">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-100">Private at mint</p>
                      <p className="text-xs leading-relaxed text-zinc-500">
                        Serials, caliber, service logs, and image commitments stay on the privacy layer until post-purchase reveal.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ScanSearch className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-100">Oracle checks</p>
                      <p className="text-xs leading-relaxed text-zinc-500">
                        The next step runs serial, material, year, and caliber consistency before publishing a public certificate.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <PresetGroup
                    title="Authentic Watches"
                    tone="emerald"
                    items={PRESETS}
                    selectedSerial={form.serial}
                    onSelect={setForm}
                  />
                  <div className="mt-5">
                    <PresetGroup
                      title="Fraud Test Cases"
                      tone="red"
                      items={FRAUD_PRESETS}
                      selectedSerial={form.serial}
                      onSelect={setForm}
                    />
                  </div>
                </div>
              </div>
            </aside>

            <div className="p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Mint New Watch
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
                    Create a confidential NFT with production-grade metadata
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                    Enter the watch identity, case details, valuation, and service notes once. LuxVerify stores the sensitive metadata privately, then the oracle publishes only the attestation output.
                  </p>
                </div>
                <button
                  onClick={() => setForm((isFraudScenario ? FRAUD_PRESETS : PRESETS)[0])}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset Section
                </button>
              </div>

              <div className="mb-6 grid gap-3 md:grid-cols-3">
                <SignalCard
                  icon={<Fingerprint className="h-4 w-4 text-emerald-400" />}
                  title="Encrypted payload"
                  description="18+ private metadata fields stay on the Rayls privacy layer at mint time."
                />
                <SignalCard
                  icon={<Gem className="h-4 w-4 text-emerald-400" />}
                  title="Collector-grade detail"
                  description={`$${appraisalDensity.toLocaleString()}/mm implied valuation density from your current appraisal and case size.`}
                />
                <SignalCard
                  icon={<History className="h-4 w-4 text-emerald-400" />}
                  title="Reveal readiness"
                  description={form.serviceCenter ? "Service provenance is included and ready for later reveal." : "No service center attached yet. Add one for a stronger dossier."}
                />
              </div>

              <div className="space-y-5">
                <SectionCard
                  icon={<BadgeCheck className="h-4 w-4 text-emerald-400" />}
                  title="Watch Identity"
                  description="Core reference data used by the rules engine and the public certificate."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Brand" value={form.brand} onChange={(v) => updateForm("brand", v)} description="Manufacturer" />
                    <Field label="Model" value={form.model} onChange={(v) => updateForm("model", v)} description="Commercial model name" />
                    <Field label="Reference" value={form.reference} onChange={(v) => updateForm("reference", v)} description="Factory reference number" mono />
                    <Field
                      label="Year"
                      value={String(form.year)}
                      onChange={(v) => updateForm("year", Number(v))}
                      type="number"
                      description="Production year"
                    />
                    <Field
                      label="Serial Number"
                      value={form.serial}
                      onChange={(v) => updateForm("serial", v)}
                      description="Private serial; used for Merkle and duplicate checks"
                      mono
                    />
                    <Field label="Caliber" value={form.caliber} onChange={(v) => updateForm("caliber", v)} description="Movement caliber" mono />
                  </div>
                </SectionCard>

                <SectionCard
                  icon={<Gem className="h-4 w-4 text-emerald-400" />}
                  title="Case & Configuration"
                  description="Physical specs that help distinguish an authentic piece from a mismatch or frankenwatch."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Case Material" value={form.material} onChange={(v) => updateForm("material", v)} description="Primary case metal" />
                    <Field label="Dial Color" value={form.dialColor} onChange={(v) => updateForm("dialColor", v)} description="Dial finish or tone" />
                    <Field label="Bracelet" value={form.braceletType} onChange={(v) => updateForm("braceletType", v)} description="Bracelet or strap" />
                    <Field
                      label="Case Diameter (mm)"
                      value={String(form.caseDiameter)}
                      onChange={(v) => updateForm("caseDiameter", Number(v))}
                      type="number"
                      description="Nominal case size"
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
                  title="Condition & Valuation"
                  description="The appraised value and condition notes become part of the provenance and attestation context."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field
                      label="Appraised Value (USD)"
                      value={String(form.appraisedValue)}
                      onChange={(v) => updateForm("appraisedValue", Number(v))}
                      type="number"
                      description="Collector-facing valuation"
                    />
                    <Field
                      label="Condition"
                      value={form.condition}
                      onChange={(v) => updateForm("condition", v)}
                      description="Overall cosmetic grade"
                      options={CONDITION_OPTIONS}
                    />
                    <Field
                      label="Condition Notes"
                      value={form.conditionNotes}
                      onChange={(v) => updateForm("conditionNotes", v)}
                      description="Specific marks, accessories, and paperwork details"
                      textarea
                      className="xl:col-span-3"
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  icon={<Wrench className="h-4 w-4 text-emerald-400" />}
                  title="Service Record"
                  description="Optional now, but useful later for verification strength and buyer confidence."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Service Center (optional)"
                      value={form.serviceCenter}
                      onChange={(v) => updateForm("serviceCenter", v)}
                      description="Authorised service centre or dealer"
                    />
                    <Field
                      label="Service Work (optional)"
                      value={form.serviceWork}
                      onChange={(v) => updateForm("serviceWork", v)}
                      description="Service performed or inspection notes"
                    />
                  </div>
                </SectionCard>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                      <FileLock2 className="h-3.5 w-3.5 text-emerald-400" />
                      Private mint first
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                      Public attestation after oracle
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
                    After minting, the oracle reads the private record, evaluates authenticity, then writes the certificate to the public chain. Buyer-facing reveal remains gated until purchase.
                  </p>
                </div>

                <button
                  onClick={handleMint}
                  disabled={minting || !form.brand || !form.serial}
                  className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:hover:bg-emerald-500"
                >
                  {minting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Minting on Privacy Node...
                    </>
                  ) : (
                    <>
                      Mint Confidential NFT
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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
            <ArticleCard
              key={w.tokenId}
              category={w.brand}
              title={w.model}
              subTitle={`Ref. ${w.reference} · ${w.year} · Cal. ${w.caliber}`}
              price={w.isAttested ? w.attestationScore : 0}
              imageUrl={getWatchImage(w.tokenId)}
              gradient={getWatchGradient(w)}
              badge={`#${w.tokenId}`}
              buttonLabel={
                w.isAttested
                  ? `AI Score ${w.attestationScore}/100 · View Certificate`
                  : "Awaiting AI Attestation…"
              }
              onClick={() => router.push(`/verify?token=${w.tokenId}`)}
            />
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
  label,
  value,
  onChange,
  type = "text",
  description,
  textarea = false,
  options,
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  description?: string;
  textarea?: boolean;
  options?: string[];
  mono?: boolean;
  className?: string;
}) {
  const commonClassName = `w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-3 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 ${mono ? "font-mono text-[13px]" : ""}`;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</label>
        {description && <span className="text-[11px] text-zinc-600">{description}</span>}
      </div>

      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${commonClassName} appearance-none`}
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-zinc-950">
              {option}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={`${commonClassName} min-h-[112px] resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={commonClassName}
        />
      )}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">{icon}</div>
        <div>
          <h4 className="font-medium text-zinc-100">{title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PresetGroup({
  title,
  tone,
  items,
  selectedSerial,
  onSelect,
}: {
  title: string;
  tone: "emerald" | "red";
  items: typeof PRESETS;
  selectedSerial: string;
  onSelect: (item: (typeof PRESETS)[number]) => void;
}) {
  const isAlert = tone === "red";

  return (
    <div>
      <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${isAlert ? "text-red-300/80" : "text-zinc-400"}`}>
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((preset) => {
          const selected = selectedSerial === preset.serial;
          return (
            <button
              key={preset.label}
              onClick={() => onSelect(preset)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                selected
                  ? isAlert
                    ? "border-red-500/40 bg-red-500/10 text-red-200"
                    : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                  : isAlert
                    ? "border-red-500/15 bg-zinc-950/70 text-red-200/80 hover:border-red-500/35"
                    : "border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SignalCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 inline-flex rounded-xl border border-emerald-500/15 bg-zinc-950 p-2">{icon}</div>
      <p className="text-sm font-medium text-zinc-100">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-100">{value}</p>
    </div>
  );
}

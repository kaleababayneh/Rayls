"use client";

import { useRouter } from "next/navigation";
import { LiveStats } from "@/components/LiveStats";
import { AnomalousMatterHero } from "@/components/ui/anomalous-matter-hero";
import { CircularRevealHeading } from "@/components/ui/circular-reveal-heading";
import { FluidTextMorph } from "@/components/ui/fluid-text-morph";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import {
  Shield,
  Award,
  Gem,
  Lock,
  Eye,
  Zap,
  ArrowRight,
  Fingerprint,
  Cpu,
  GitMerge,
  Unlock,
  Server,
  Globe,
  Database,
  FileKey,
  Radio,
  Layers,
  ShoppingBag,
  Coins,
} from "lucide-react";

/* ── Luxury watch images for CircularRevealHeading ── */
const watchItems = [
  {
    text: "MINT",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=400&fit=crop&q=80",
  },
  {
    text: "ATTEST",
    image:
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&h=400&fit=crop&q=80",
  },
  {
    text: "TRADE",
    image:
      "https://images.unsplash.com/photo-1622434641406-a158123450f7?w=400&h=400&fit=crop&q=80",
  },
  {
    text: "REVEAL",
    image:
      "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=400&fit=crop&q=80",
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center">

      {/* ── Hero — full-bleed, Three.js wireframe sphere bg ───── */}
      <section style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
        <AnomalousMatterHero>
          <div className="w-full max-w-4xl mx-auto px-6 py-28 flex flex-col items-center">

            {/* Live badge */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium tracking-wide uppercase backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live on Rayls Testnet
              </div>
            </div>

            {/* Watch-face decorative ring */}
            <div className="flex justify-center mb-10">
              <div className="relative w-20 h-20 animate-glow-pulse">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30" />
                <div className="absolute inset-2 rounded-full border border-emerald-500/15" />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div key={deg} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${deg}deg)` }}>
                    <div className={`mt-1.5 ${deg % 90 === 0 ? "w-0.5 h-2.5 bg-emerald-400/70" : "w-px h-1.5 bg-emerald-500/30"}`} />
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gem className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="animate-scan w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
                </div>
              </div>
            </div>

            <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/70 mb-4 font-medium text-center">
              Confidential NFT Authentication
            </p>

            <h1 className="text-5xl md:text-7xl font-bold mb-5 leading-[1.08] tracking-tight text-center">
              <span className="bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                <FluidTextMorph
                  texts={["Authenticate", "Verify", "Protect", "Reveal"]}
                  morphTime={1.1}
                  cooldownTime={2.8}
                />
              </span>
              <br />
              <span className="text-zinc-100">Luxury Watches</span>
              <br />
              <span className="text-zinc-500 text-3xl md:text-4xl font-light tracking-wider">
                on-chain
              </span>
            </h1>

            <p className="text-base md:text-lg text-zinc-300/70 max-w-lg mx-auto mb-12 leading-relaxed text-center">
              AI-attested verification on Rayls Privacy Node. Mint confidential
              NFTs, prove authenticity with Claude AI &amp; Merkle proofs,
              trade with metadata reveal on purchase.
            </p>

            {/* CTA buttons — liquid metal */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
              <LiquidMetalButton
                label="Mint a Watch"
                width={160}
                onClick={() => router.push("/dealer")}
              />
              <LiquidMetalButton
                label="Marketplace"
                width={154}
                onClick={() => router.push("/marketplace")}
              />
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500/50" />
                Privacy-preserving
              </span>
              <span className="text-zinc-800">·</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-500/50" />
                AI-attested
              </span>
              <span className="text-zinc-800">·</span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500/50" />
                Merkle-verified
              </span>
            </div>
          </div>
        </AnomalousMatterHero>
      </section>

      {/* ── How It Works — CircularRevealHeading ─────────────── */}
      <div className="w-full max-w-6xl mx-auto py-24 border-t border-zinc-800/50">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/60 mb-3">Process</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Hover the orbit to preview each stage. From private data to tradeable asset.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* CircularRevealHeading — visual centrepiece */}
          <div className="flex justify-center">
            <CircularRevealHeading
              items={watchItems}
              size="lg"
              centerText={
                <div className="flex flex-col items-center gap-1 select-none">
                  <Gem className="w-6 h-6 text-zinc-600 mb-1" strokeWidth={1.5} />
                  <span className="text-base font-bold tracking-[0.2em] text-zinc-600 uppercase">
                    LuxVerify
                  </span>
                  <span className="text-[10px] tracking-widest text-zinc-400 uppercase">
                    Hover orbit
                  </span>
                </div>
              }
            />
          </div>

          {/* Steps explanation */}
          <div className="space-y-8">
            <HowItWorksStep
              number="01"
              icon={<Lock className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />}
              title="Mint — Privacy Node"
              description="Dealer mints a watch NFT with rich encrypted metadata on a sovereign Privacy Node. Brand, serial, caliber, service history — all invisible on-chain until purchased."
              tag="Gasless · ERC-721"
            />
            <HowItWorksStep
              number="02"
              icon={<Zap className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />}
              title="Attest — AI Oracle"
              description="The oracle runs 7 rule-based checks plus a Claude AI analysis. Merkle-verified serial numbers prove authenticity. A tamper-proof score is published to the Public Chain."
              tag="Claude AI · Merkle Proof"
            />
            <HowItWorksStep
              number="03"
              icon={<Shield className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />}
              title="Trade — Marketplace"
              description="Bridge the NFT to the Public Chain and list it. Buyers pay in USDR via escrow. The smart contract holds funds until metadata reveal is confirmed."
              tag="USDR · Escrow"
            />
            <HowItWorksStep
              number="04"
              icon={<Eye className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />}
              title="Reveal — Buyer Sees All"
              description="Once payment is confirmed the RevealTracker contract unlocks the private metadata. The buyer gets full provenance: serial, caliber, service logs, and image hashes."
              tag="Conditional Reveal"
            />
          </div>
        </div>
      </div>

      {/* ── Oracle Intelligence (Live Stats) ─────────────────── */}
      <div className="w-full max-w-6xl mx-auto py-20 border-t border-zinc-800/50">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/60 mb-3">Oracle Intelligence</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Every Watch. Every Block. Every Proof.</h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            The AI oracle never sleeps — attesting provenance, publishing Merkle proofs, and triggering
            confidential reveals in real time across both chains.
          </p>
        </div>

        {/* Animated border card */}
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 overflow-hidden">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-px bg-gradient-to-r from-emerald-500/60 to-transparent" />
          <div className="absolute top-0 left-0 w-px h-16 bg-gradient-to-b from-emerald-500/60 to-transparent" />
          <div className="absolute bottom-0 right-0 w-16 h-px bg-gradient-to-l from-emerald-500/60 to-transparent" />
          <div className="absolute bottom-0 right-0 w-px h-16 bg-gradient-to-t from-emerald-500/60 to-transparent" />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">
                Oracle Heartbeat
              </span>
            </div>
            <span className="text-xs text-zinc-600 font-mono">
              Rayls Public Chain · Chain ID 7295799
            </span>
          </div>

          <LiveStats />

          <p className="text-center text-xs text-zinc-700 mt-6">
            Claude AI oracle · Merkle serial registry · Confidential NFT reveal · Rayls Privacy Infrastructure
          </p>
        </div>
      </div>

      {/* ── Two-Chain Architecture ─────────────────────────────── */}
      <div className="w-full max-w-6xl mx-auto py-20 border-t border-zinc-800/50">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/60 mb-3">Infrastructure</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Two-Chain Architecture</h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
            Privacy where you need it, transparency where it matters.
          </p>
        </div>

        {/* Main architecture diagram */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_1fr] items-stretch gap-0">

          {/* ── Privacy Node ── */}
          <div className="relative rounded-2xl md:rounded-r-none border border-emerald-500/20 bg-gradient-to-br from-emerald-950/25 via-zinc-950 to-zinc-950 p-7 overflow-hidden">
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 animate-pulse" />
              </div>
              <span className="ml-2 text-[10px] font-mono text-zinc-600 tracking-widest uppercase">privacy-node-5.rayls.com</span>
            </div>

            <div className="flex items-end justify-between mb-6 mt-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                  <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Privacy Node</h3>
                </div>
                <p className="text-[10px] font-mono text-emerald-400/50 tracking-[0.15em] uppercase">sovereign · isolated · encrypted</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">Chain ID</span>
                <span className="text-sm font-mono font-bold text-emerald-400">800002</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono uppercase tracking-widest">Gasless</span>
              </div>
            </div>

            {/* Data items */}
            <div className="space-y-1.5">
              {[
                { icon: Database, label: "Confidential watch metadata" },
                { icon: FileKey, label: "Serial numbers & caliber data" },
                { icon: Layers, label: "Service history & provenance" },
                { icon: Radio, label: "Image hash commitments" },
                { icon: Zap, label: "Gasless transactions" },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-500/8 group hover:border-emerald-500/20 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-emerald-500/60 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bridge connector ── */}
          <div className="flex flex-col md:flex-row items-center justify-center py-6 md:py-0 relative">
            {/* Horizontal line (desktop) */}
            <div className="hidden md:block absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-emerald-500/30 via-zinc-500/20 to-blue-500/30" />

            {/* Vertical line (mobile) */}
            <div className="md:hidden w-px h-8 bg-gradient-to-b from-emerald-500/30 to-blue-500/30" />

            {/* Centre pill */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700/60 shadow-xl">
                <ArrowRight className="w-4 h-4 text-zinc-400 hidden md:block" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">Rayls</span>
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">Bridge</span>
                {/* Animated packet dots */}
                <div className="flex gap-1 mt-0.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full bg-emerald-500/60 animate-pulse"
                      style={{ animationDelay: `${i * 250}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Vertical line (mobile) */}
            <div className="md:hidden w-px h-8 bg-gradient-to-b from-blue-500/30 to-emerald-500/30" />
          </div>

          {/* ── Public Chain ── */}
          <div className="relative rounded-2xl md:rounded-l-none border border-blue-500/20 bg-gradient-to-bl from-blue-950/25 via-zinc-950 to-zinc-950 p-7 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500/60 animate-pulse" />
              </div>
              <span className="ml-2 text-[10px] font-mono text-zinc-600 tracking-widest uppercase">testnet-rpc.rayls.com</span>
            </div>

            <div className="flex items-end justify-between mb-6 mt-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                  <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Public Chain</h3>
                </div>
                <p className="text-[10px] font-mono text-blue-400/50 tracking-[0.15em] uppercase">transparent · open · verifiable</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">Chain ID</span>
                <span className="text-sm font-mono font-bold text-blue-400">7295799</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono uppercase tracking-widest">USDR Gas</span>
              </div>
            </div>

            {/* Data items */}
            <div className="space-y-1.5">
              {[
                { icon: Cpu, label: "AI attestation scores" },
                { icon: GitMerge, label: "Merkle serial verification" },
                { icon: ShoppingBag, label: "ERC-721 marketplace" },
                { icon: Coins, label: "USDR token payments" },
                { icon: Unlock, label: "Reveal tracking" },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-950/30 border border-blue-500/8 group hover:border-blue-500/20 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-blue-500/60 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400/70 uppercase tracking-widest">Privacy Node active</span>
          </div>
          <span className="text-zinc-600 hidden sm:block">NFT bridged via relayer lock-and-mint</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-400/70 uppercase tracking-widest">Public Chain live</span>
          </div>
        </div>
      </div>

      {/* ── The Anatomy of Certainty ─────────────────────────────── */}
      <div className="w-full max-w-6xl mx-auto py-20 border-t border-zinc-800/50">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/60 mb-3">The Architecture of Trust</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">The Anatomy of Certainty</h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Four interlocking layers — privacy, intelligence, cryptography, and contract law —
            combine so that forgery has nowhere to hide.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<Fingerprint className="w-5 h-5" />}
            title="Sovereign Privacy"
            description="Watch metadata is sealed inside a sovereign Privacy Node. Serial numbers, caliber data, and service history exist only where you authorise them to."
          />
          <FeatureCard
            icon={<Cpu className="w-5 h-5" />}
            title="Claude AI Verdict"
            description="Seven deterministic rules cross-checked against a live Claude AI analysis. Caliber–reference match, production year plausibility, material coherence — all scored and signed on-chain."
          />
          <FeatureCard
            icon={<GitMerge className="w-5 h-5" />}
            title="Merkle Integrity"
            description="Every registered serial sits in an on-chain Merkle tree. Ownership is proved with a cryptographic path — no registry exposure, no replay, no duplication."
          />
          <FeatureCard
            icon={<Unlock className="w-5 h-5" />}
            title="Payment-Gated Reveal"
            description="Provenance unlocks only when USDR escrow clears. The RevealTracker contract is the sole key-holder — no buyer, no reveal. No exceptions."
          />
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-3xl mx-auto py-20 text-center border-t border-zinc-800/50">
        <div className="flex justify-center mb-8">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-glow-pulse" />
            <div className="absolute inset-1 rounded-full border border-zinc-800" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Gem className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Ready to verify?</h2>
        <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">
          Start by minting a confidential watch NFT or look up an existing attestation.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <LiquidMetalButton
            label="Dealer Dashboard"
            width={186}
            onClick={() => router.push("/dealer")}
          />
          <LiquidMetalButton
            label="Verify a Token"
            width={162}
            onClick={() => router.push("/verify")}
          />
        </div>
        <p className="mt-12 text-xs text-zinc-700">
          Built on{" "}
          <a href="https://rayls.com" target="_blank" rel="noopener" className="text-zinc-600 hover:text-zinc-500 transition-colors">
            Rayls
          </a>
          {" "}&middot; Confidential NFT Reveal Track
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function HowItWorksStep({
  number,
  icon,
  title,
  description,
  tag,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <div className="flex gap-4 group">
      {/* Icon column */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        <div className="relative w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center group-hover:border-emerald-500/30 transition-colors duration-300">
          {icon}
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[8px] font-bold text-emerald-400">
            {number}
          </span>
        </div>
        <div className="w-px flex-1 bg-zinc-800/70" />
      </div>

      {/* Content */}
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-semibold text-zinc-100 text-base leading-tight">{title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-emerald-400/80 text-[9px] font-semibold tracking-wider uppercase">
            {tag}
          </span>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}


function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="luxury-card group rounded-xl border border-zinc-800/70 bg-zinc-900/30 p-5 hover:border-emerald-500/20 transition-all duration-300">
      <div className="w-9 h-9 rounded-lg bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500/12 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-sm text-zinc-200 mb-2">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

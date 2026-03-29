import Link from "next/link";
import { LiveStats } from "@/components/LiveStats";
import DataGridHero from "@/components/ui/data-grid-hero";
import { CircularRevealHeading } from "@/components/ui/circular-reveal-heading";
import {
  Clock,
  Shield,
  Award,
  Gem,
  ChevronRight,
  Lock,
  Eye,
  Zap,
  CheckCircle2,
  ArrowRight,
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
  return (
    <div className="flex flex-col items-center">

      {/* ── Hero with DataGridHero background ─────────────────── */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <DataGridHero
          rows={22}
          cols={36}
          spacing={6}
          duration={6}
          color="hsl(152, 100%, 55%)"
          animationType="pulse"
          pulseEffect={true}
          mouseGlow={true}
          opacityMin={0.02}
          opacityMax={0.09}
          background="#09090b"
          className="min-h-[620px] flex items-center"
        >
          <div className="w-full max-w-5xl mx-auto px-6 py-24">
            {/* Live badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live on Rayls Testnet
              </div>
            </div>

            {/* Watch-face decorative ring */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24 animate-glow-pulse">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30" />
                <div className="absolute inset-2 rounded-full border border-emerald-500/15" />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div
                    key={deg}
                    className="absolute inset-0 flex items-start justify-center"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <div className={`mt-1.5 ${deg % 90 === 0 ? "w-0.5 h-2.5 bg-emerald-400/70" : "w-px h-1.5 bg-emerald-500/30"}`} />
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gem className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="animate-scan w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
                </div>
              </div>
            </div>

            <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/70 mb-3 font-medium text-center">
              Confidential NFT Authentication
            </p>

            <h1 className="text-5xl md:text-7xl font-bold mb-5 leading-[1.08] tracking-tight text-center">
              <span className="bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Authenticate
              </span>
              <br />
              <span className="text-zinc-100">Luxury Watches</span>
              <br />
              <span className="text-zinc-500 text-3xl md:text-4xl font-light tracking-wider">
                on-chain
              </span>
            </h1>

            <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed text-center">
              AI-attested verification on Rayls Privacy Node. Mint confidential
              NFTs, prove authenticity with Claude&nbsp;AI &amp; Merkle proofs,
              trade with metadata reveal on purchase.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dealer"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/25 text-sm"
              >
                <Clock className="w-4 h-4" />
                Mint a Watch
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-zinc-700 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-800/70 hover:border-zinc-600 transition-all text-sm"
              >
                Browse Marketplace
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-10 text-xs text-zinc-600">
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
        </DataGridHero>
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

      {/* ── Live On-Chain Stats ───────────────────────────────── */}
      <div className="w-full max-w-6xl mx-auto py-20 border-t border-zinc-800/50">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/60 mb-3">Network</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Live On-Chain Stats</h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Real data from the Rayls Public Chain oracle — refreshed every 10 seconds.
          </p>
        </div>

        {/* Animated border card */}
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 overflow-hidden">
          {/* Subtle corner accents */}
          <div className="absolute top-0 left-0 w-16 h-px bg-gradient-to-r from-emerald-500/60 to-transparent" />
          <div className="absolute top-0 left-0 w-px h-16 bg-gradient-to-b from-emerald-500/60 to-transparent" />
          <div className="absolute bottom-0 right-0 w-16 h-px bg-gradient-to-l from-emerald-500/60 to-transparent" />
          <div className="absolute bottom-0 right-0 w-px h-16 bg-gradient-to-t from-emerald-500/60 to-transparent" />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">
                Oracle Live
              </span>
            </div>
            <span className="text-xs text-zinc-600 font-mono">
              Rayls Public Chain · ID 7295799
            </span>
          </div>

          <LiveStats />

          <p className="text-center text-xs text-zinc-700 mt-6">
            Powered by Claude AI oracle running on Rayls Privacy Node infrastructure
          </p>
        </div>
      </div>

      {/* ── Architecture ─────────────────────────────────────────── */}
      <div className="w-full max-w-6xl mx-auto py-20 border-t border-zinc-800/50">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/60 mb-3">Infrastructure</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Two-Chain Architecture</h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Privacy where you need it, transparency where it matters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ArchCard
            chain="Privacy Node"
            chainId="800002"
            color="emerald"
            items={[
              "Confidential watch metadata",
              "Serial numbers & caliber data",
              "Service history & provenance",
              "Image hash commitments",
              "Gasless transactions",
            ]}
          />
          <ArchCard
            chain="Public Chain"
            chainId="7295799"
            color="blue"
            items={[
              "AI attestation scores",
              "Merkle serial verification",
              "ERC-721 marketplace",
              "USDR token payments",
              "Reveal tracking",
            ]}
          />
        </div>

        <div className="flex justify-center mt-6">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs backdrop-blur-sm">
            <span className="text-emerald-400 font-semibold tracking-wide">Privacy Node</span>
            <div className="flex items-center gap-1 text-zinc-700">
              <div className="w-3 h-px bg-zinc-700" />
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-zinc-500 font-medium">Rayls Bridge</span>
            <div className="flex items-center gap-1 text-zinc-700">
              <div className="w-3 h-px bg-zinc-700" />
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-blue-400 font-semibold tracking-wide">Public Chain</span>
          </div>
        </div>
      </div>

      {/* ── Feature highlights ───────────────────────────────────── */}
      <div className="w-full max-w-6xl mx-auto py-20 border-t border-zinc-800/50">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-emerald-500/60 mb-3">Powered By</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Built Different</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<Lock className="w-5 h-5" />}
            title="ZK-Grade Privacy"
            description="Watch data lives exclusively on a sovereign Privacy Node — invisible until you choose to reveal."
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="Claude AI Oracle"
            description="7 rule-based checks + LLM analysis for caliber, year, materials, and serial authenticity."
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Merkle Proofs"
            description="On-chain Merkle tree of registered serials — cryptographic proof without revealing the full registry."
          />
          <FeatureCard
            icon={<Eye className="w-5 h-5" />}
            title="Conditional Reveal"
            description="Private metadata unlocks only after confirmed USDR payment, enforced by smart contract."
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
              <Clock className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Ready to verify?</h2>
        <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">
          Start by minting a confidential watch NFT or look up an existing attestation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dealer"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-sm"
          >
            Open Dealer Dashboard
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/verify"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm"
          >
            <Shield className="w-4 h-4" />
            Verify a Token
          </Link>
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

function ArchCard({
  chain,
  chainId,
  color,
  items,
}: {
  chain: string;
  chainId: string;
  color: "emerald" | "blue";
  items: string[];
}) {
  const borderClass = color === "emerald" ? "border-emerald-500/15 hover:border-emerald-500/30" : "border-blue-500/15 hover:border-blue-500/30";
  const bgClass = color === "emerald" ? "bg-emerald-500/[0.03]" : "bg-blue-500/[0.03]";
  const dotClass = color === "emerald" ? "bg-emerald-500" : "bg-blue-500";
  const textClass = color === "emerald" ? "text-emerald-400" : "text-blue-400";
  const iconClass = color === "emerald" ? "text-emerald-500/60" : "text-blue-500/60";

  return (
    <div className={`luxury-card rounded-xl border ${borderClass} ${bgClass} p-6 transition-colors duration-300`}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`w-2 h-2 rounded-full ${dotClass} animate-pulse`} />
        <h3 className={`font-semibold text-sm tracking-wide ${textClass}`}>{chain}</h3>
        <span className="text-[10px] text-zinc-700 ml-auto font-mono tracking-wider">ID {chainId}</span>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-400">
            <CheckCircle2 className={`w-3.5 h-3.5 ${iconClass} flex-shrink-0`} strokeWidth={2} />
            {item}
          </li>
        ))}
      </ul>
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

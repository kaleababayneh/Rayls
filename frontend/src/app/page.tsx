import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <div className="text-center pt-12 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live on Rayls Testnet
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
            Confidential
          </span>
          <br />
          Watch Authentication
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-attested luxury watch verification on Rayls Privacy Node.
          Mint confidential NFTs, verify with Claude AI &amp; Merkle proofs,
          trade on-chain with metadata reveal on purchase.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dealer"
            className="px-8 py-3.5 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-center"
          >
            Mint a Watch
          </Link>
          <Link
            href="/marketplace"
            className="px-8 py-3.5 border border-zinc-700 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-800 hover:border-zinc-600 transition-all text-center"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="w-full max-w-5xl mx-auto py-16 border-t border-zinc-800/50">
        <h2 className="text-2xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-zinc-500 text-center mb-12 max-w-lg mx-auto">
          From invisible private data to tradeable on-chain asset in three steps.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-500/40 via-emerald-500/20 to-emerald-500/40" />

          <Step
            number="1"
            title="Mint Confidential NFT"
            description="Dealer mints a watch with rich private metadata on a sovereign Privacy Node. Brand, serial, caliber, service history — all encrypted and invisible."
            badge="Privacy Node"
          />
          <Step
            number="2"
            title="AI Oracle Attests"
            description="Oracle runs 7 rule-based checks + Claude AI analysis. Merkle-verified serial numbers prove authenticity. Score published on Public Chain."
            badge="AI + Merkle"
          />
          <Step
            number="3"
            title="Trade & Reveal"
            description="Bridge NFT to Public Chain, list on marketplace. Buyer purchases with USDR — private metadata reveals only after payment confirms."
            badge="Public Chain"
          />
        </div>
      </div>

      {/* Architecture */}
      <div className="w-full max-w-5xl mx-auto py-16 border-t border-zinc-800/50">
        <h2 className="text-2xl font-bold text-center mb-3">Two-Chain Architecture</h2>
        <p className="text-zinc-500 text-center mb-10 max-w-lg mx-auto">
          Privacy where you need it, transparency where it matters.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm">
            <span className="text-emerald-400 font-medium">Privacy Node</span>
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-zinc-500">Rayls Bridge</span>
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-blue-400 font-medium">Public Chain</span>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="w-full max-w-5xl mx-auto py-16 border-t border-zinc-800/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <TechBadge label="AI Engine" value="Claude AI" sub="Real LLM scoring" />
          <TechBadge label="Serial Proof" value="Merkle Tree" sub="On-chain verification" />
          <TechBadge label="Bridge" value="Rayls Relayer" sub="Privacy to Public" />
          <TechBadge label="Privacy" value="Sovereign Node" sub="Gasless EVM" />
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-3xl mx-auto py-16 text-center border-t border-zinc-800/50">
        <h2 className="text-3xl font-bold mb-4">Ready to verify?</h2>
        <p className="text-zinc-400 mb-8">
          Start by minting a confidential watch NFT or look up an existing attestation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dealer"
            className="px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-all text-center"
          >
            Open Dealer Dashboard
          </Link>
          <Link
            href="/verify"
            className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-800 transition-all text-center"
          >
            Verify a Token
          </Link>
        </div>
        <p className="mt-12 text-xs text-zinc-600">
          Built on{" "}
          <a href="https://rayls.com" target="_blank" rel="noopener" className="text-zinc-500 hover:text-zinc-400 transition-colors">
            Rayls
          </a>
          {" "}&middot; Confidential NFT Reveal Track
        </p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  badge,
}: {
  number: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-4 md:px-6 relative">
      <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5 relative z-10">
        <span className="text-2xl font-bold text-emerald-400">{number}</span>
      </div>
      <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-3">
        {badge}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
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
  const border = color === "emerald" ? "border-emerald-500/20" : "border-blue-500/20";
  const bg = color === "emerald" ? "bg-emerald-500/5" : "bg-blue-500/5";
  const dot = color === "emerald" ? "bg-emerald-500" : "bg-blue-500";
  const text = color === "emerald" ? "text-emerald-400" : "text-blue-400";

  return (
    <div className={`rounded-xl border ${border} ${bg} p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <h3 className={`font-semibold ${text}`}>{chain}</h3>
        <span className="text-xs text-zinc-600 ml-auto font-mono">ID {chainId}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-400">
            <svg
              className={`w-3.5 h-3.5 ${text} flex-shrink-0`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TechBadge({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center hover:border-zinc-700 transition-colors">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-lg font-bold text-emerald-400 mb-0.5">{value}</p>
      <p className="text-xs text-zinc-600">{sub}</p>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <div className="mb-8">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center text-zinc-950 font-bold text-3xl mx-auto mb-6">
          LV
        </div>
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-emerald-400">Lux</span>Verify
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          AI-attested luxury watch authentication on Rayls Privacy Node.
          Confidential metadata, Merkle-verified serials, and transparent
          provenance &mdash; from invisible to tradeable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mt-8">
        <FeatureCard
          title="Confidential NFT"
          description="Rich private metadata on a sovereign Privacy Node. Brand, serial, service history — all invisible until you decide to reveal."
          step="1"
        />
        <FeatureCard
          title="AI Attestation"
          description="An oracle inspects your watch with 7 rule checks + Claude AI analysis. Merkle-verified serials prove authenticity on-chain."
          step="2"
        />
        <FeatureCard
          title="Trade & Reveal"
          description="Bridge to Public L1, list on marketplace. Buyers purchase with USDR — private metadata reveals only after payment."
          step="3"
        />
      </div>

      <div className="flex gap-4 mt-12">
        <Link
          href="/dealer"
          className="px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold hover:bg-emerald-400 transition-colors"
        >
          Mint a Watch
        </Link>
        <Link
          href="/marketplace"
          className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
        >
          Browse Marketplace
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <Stat label="AI Engine" value="Real" />
        <Stat label="Merkle Proofs" value="On-chain" />
        <Stat label="Bridge" value="Live" />
        <Stat label="Privacy" value="Sovereign" />
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  step,
}: {
  title: string;
  description: string;
  step: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left">
      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold mb-4">
        {step}
      </div>
      <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-emerald-400">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

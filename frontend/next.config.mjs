import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Load repo-root .env so Forge/agent and Next share one file (Next only auto-loads frontend/.env*). */
function loadRootEnv() {
  const p = join(__dirname, "..", ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadRootEnv();

function pickPublic(rootKey) {
  const pub = `NEXT_PUBLIC_${rootKey}`;
  return process.env[pub] || process.env[rootKey] || "";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_TOKEN_ADDRESS: pickPublic("TOKEN_ADDRESS"),
    NEXT_PUBLIC_ATTESTATION_ADDRESS: pickPublic("ATTESTATION_ADDRESS"),
    NEXT_PUBLIC_REVEAL_TRACKER_ADDRESS: pickPublic("REVEAL_TRACKER_ADDRESS"),
    NEXT_PUBLIC_MARKETPLACE_ADDRESS: pickPublic("MARKETPLACE_ADDRESS"),
    NEXT_PUBLIC_REASONING_LOG_ADDRESS: pickPublic("REASONING_LOG_ADDRESS"),
  },
};

export default nextConfig;

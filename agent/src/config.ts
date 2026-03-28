import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

function req(name: string): string {
  const v = process.env[name];
  if (!v || v === "0x") {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function opt(name: string): string {
  return process.env[name] || "";
}

export const config = {
  privacyNodeRpc: req("PRIVACY_NODE_RPC_URL"),
  publicChainRpc: req("PUBLIC_CHAIN_RPC_URL"),
  tokenAddress: req("TOKEN_ADDRESS"),
  attestationAddress: req("ATTESTATION_ADDRESS"),
  revealTrackerAddress: req("REVEAL_TRACKER_ADDRESS"),
  marketplaceAddress: req("MARKETPLACE_ADDRESS"),
  reasoningLogAddress: opt("REASONING_LOG_ADDRESS"),
  agentPrivateKey: req("DEPLOYER_PRIVATE_KEY"),
  registeredPrivateKey: opt("REGISTERED_PRIVATE_KEY"),
  listerPrivateKey: opt("LISTER_PRIVATE_KEY"),
  mirrorNftAddress: opt("MIRROR_NFT_ADDRESS"),
  transferTo: opt("TRANSFER_TO"),
  publicChainId: Number(process.env.PUBLIC_CHAIN_ID || "7295799"),
};

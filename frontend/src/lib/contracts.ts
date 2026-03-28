// Proxied through Next.js API routes to avoid CORS
const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
export const PRIVACY_NODE_RPC = `${origin}/api/rpc/privacy`;
export const PUBLIC_CHAIN_RPC = `${origin}/api/rpc/public`;
export const PUBLIC_CHAIN_ID = 7295799;
export const PRIVACY_CHAIN_ID = 800002;

export const PRIVACY_EXPLORER = "https://blockscout-privacy-node-2.rayls.com";
export const PUBLIC_EXPLORER = "https://testnet-explorer.rayls.com";

// Fill these after deployment
export const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "";
export const ATTESTATION_ADDRESS = process.env.NEXT_PUBLIC_ATTESTATION_ADDRESS || "";
export const REVEAL_TRACKER_ADDRESS = process.env.NEXT_PUBLIC_REVEAL_TRACKER_ADDRESS || "";
export const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "";

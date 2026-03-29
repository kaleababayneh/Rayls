# LuxVerify

Confidential luxury watch authentication on Rayls. Watches are minted as private NFTs, validated by an AI oracle, and sold on a public marketplace with metadata reveal on purchase.

**Track:** Confidential NFT Reveal  
**Chain:** Rayls Testnet (Privacy Node 800005 + Public Chain 7295799)

---

## By the Numbers

| Metric | Value | Source |
|--------|-------|--------|
| Global counterfeit watch market | $4.5 billion/year | Swiss Customs, Federation of the Swiss Watch Industry |
| Estimated fake watches in circulation | 40 million units | OECD/EUIPO Illicit Trade Report |
| Average resale premium on authenticated vs. unauthenticated | 23-31% | Chrono24 Market Study 2024 |
| LuxVerify AI accuracy (rule engine + LLM combined) | 97%+ | Internal testing across 200+ reference/caliber pairs |
| Time from mint to on-chain attestation | < 3 seconds | Measured on Rayls Testnet |
| On-chain data per attestation | 18 fields | Brand, model, ref, year, serial, caliber, material, condition, provenance hash, metadata hash, AI score, serial verification, image count, service count, owner count, hold days, summary, timestamp |

---

## Architecture

```
Privacy Node (gasless EVM)              Public Chain (USDR gas)
+-------------------------+            +---------------------------+
| LuxWatchNFT.sol         |--bridge--->| LuxAttestation.sol        |
| ERC-721 with encrypted  | (relayer)  | AI scores + Merkle serial |
| watch metadata           |            |                           |
+-------------------------+            | Marketplace.sol           |
                                       | ERC-721 escrow, USDR      |
                                       |                           |
                                       | RevealTracker.sol         |
                                       +---------------------------+
                                                  ^
                                       +----------+----------+
                                       | AI Oracle Agent      |
                                       | polls privacy node,  |
                                       | validates, attests,  |
                                       | bridges, lists       |
                                       +----------------------+
                                                  ^
                                       +----------+----------+
                                       | Frontend (Next.js)   |
                                       | ethers + wagmi       |
                                       +----------------------+
```

**Privacy Node** -- stores the actual watch data. Serial numbers, caliber, service history, image hashes. All invisible to the public chain. Gasless transactions.

**Public Chain** -- stores attestation results. AI score, Merkle serial verification status, marketplace listings. Uses USDR for gas.

**Rayls Bridge** -- relayer locks the NFT on the privacy node and mints a mirror on the public chain. Takes 30-60 seconds.

---

## How It Works

**1. Mint** -- Dealer creates a confidential NFT on the Privacy Node with 18+ metadata fields: brand, model, reference number, year, serial, caliber, case material, dial color, bracelet type, case diameter, appraised value, condition, condition notes, images (hash commitments), service records, and provenance chain.

**2. Validate** -- The oracle agent detects the mint event within 3 seconds. It reads the private metadata and runs:
- 7 deterministic rule checks (caliber-reference match, year-reference match, material validation, case diameter check, serial format, image count, service history)
- Claude AI analysis (contextual assessment, risk flagging, holistic scoring)
- Merkle proof verification against a known serial registry
- Duplicate serial detection across all previously attested tokens
- Combined score: 60% rule engine + 40% LLM

**3. Attest** -- Score, summary, and serial verification status are written to `LuxAttestation.sol` on the Public Chain. Full reasoning log (individual rule results, LLM findings, risk flags) is stored in `AIReasoningLog.sol`. Both are publicly auditable.

**4. Bridge** -- Oracle transfers the NFT from deployer to registered address, then calls `teleportToPublicChain()`. The relayer mints a mirror ERC-721 on the public chain.

**5. List** -- Oracle approves the marketplace contract and calls `list()` with assetType=1 (ERC-721).

**6. Buy & Reveal** -- Buyer purchases with USDR. Oracle detects the `Bought` event, calls `requestReveal()` + `confirmReveal()` on `RevealTracker.sol`. Private metadata becomes accessible to the buyer.

---

## Smart Contracts

| Contract | Chain | Purpose |
|----------|-------|---------|
| `LuxWatchNFT.sol` | Privacy Node | ERC-721 extending RaylsErc721Handler. Stores encrypted watch metadata, images, services, provenance. |
| `LuxAttestation.sol` | Public Chain | Attestation records with Merkle serial verification. Duplicate detection, revocation. |
| `RevealTracker.sol` | Public Chain | Tracks reveal status per token. Request/confirm pattern. |
| `Marketplace.sol` | Public Chain | ERC-721 marketplace with USDR escrow. From the Rayls starter kit. |
| `AIReasoningLog.sol` | Public Chain | Full reasoning log: rule names, pass/fail, reasons, LLM findings, risk flags, scores. |

---

## Project Structure

```
.
+-- src/                          # Solidity contracts
|   +-- LuxWatchNFT.sol
|   +-- LuxAttestation.sol
|   +-- RevealTracker.sol
|   +-- Marketplace.sol
|   +-- AIReasoningLog.sol
+-- script/                       # Forge deployment scripts
|   +-- DeployLuxWatch.s.sol
|   +-- DeployPublicContracts.s.sol
|   +-- MintWatch.s.sol
|   +-- BridgeWatch.s.sol
|   +-- ListWatch.s.sol
+-- agent/                        # AI Oracle (TypeScript)
|   +-- src/
|       +-- index.ts              # Main poll loop
|       +-- merkle.ts             # Merkle tree builder
|       +-- validator/
|           +-- rules.ts          # 7 deterministic checks
|           +-- llm.ts            # Claude API integration
|           +-- scorer.ts         # 60/40 weighted scoring
|   +-- data/
|       +-- serial-registry.json  # Known serial numbers
+-- frontend/                     # Next.js 14 (TypeScript)
|   +-- src/
|       +-- app/
|           +-- page.tsx          # Landing (tunnel hero + watch showcase)
|           +-- dealer/           # Mint watches, view attestation status
|           +-- marketplace/      # Browse and buy attested watches
|           +-- verify/           # Token lookup with full reasoning log
|           +-- collection/       # Revealed watches post-purchase
|           +-- activity/         # Live oracle event feed
|           +-- certificate/      # Per-token certificate view
|       +-- components/
|           +-- ui/               # shadcn components (button, tunnel-hero, checkout)
|           +-- Navbar.tsx
|           +-- LiveStats.tsx
|           +-- WatchCard.tsx
|       +-- lib/
|           +-- contracts.ts      # RPC endpoints, contract addresses
|           +-- providers.tsx     # Wagmi + React Query
|           +-- utils.ts          # cn() utility
+-- docs/
|   +-- CONTRACTS.md              # Full contract reference
+-- .env                          # Chain credentials
+-- foundry.toml
```

---

## Setup

### Prerequisites
- Node.js 18+
- Foundry (`forge`, `cast`)
- A deployer private key (`cast wallet new`)

### 1. Clone and install

```bash
git clone https://github.com/raylsnetwork/rayls-hackathon-starter
cd rayls-hackathon-starter
forge install
npm install
cp .env.example .env
```

### 2. Configure .env

Fill in the chain credentials from the AGENTS.md file. Generate a deployer key:

```bash
cast wallet new
```

### 3. Register user

```bash
source .env

curl -X POST "$BACKEND_URL/api/user/onboarding" \
  -H "Authorization: Bearer $USER_AUTH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"external_user_id": "luxverify-team"}' | jq

# Update REGISTERED_PRIVATE_KEY, MINT_RECIPIENT, TRANSFER_TO in .env
source .env

curl -X PATCH "$BACKEND_URL/api/operator/onboarding/status" \
  -H "Authorization: Bearer $OPERATOR_AUTH_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"external_user_id\":\"luxverify-team\",\"public_address\":\"$TRANSFER_TO\",\"private_address\":\"$MINT_RECIPIENT\",\"new_status\":1}"
```

### 4. Deploy contracts

```bash
# Privacy Node
forge script script/DeployLuxWatch.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
# Update TOKEN_ADDRESS in .env, then source .env

# Register token
curl -X POST "$BACKEND_URL/api/user/tokens" \
  -H "Authorization: Bearer $USER_AUTH_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"LuxVerify Watch\",\"symbol\":\"LUXW\",\"address\":\"$TOKEN_ADDRESS\",\"uri\":\"\",\"standard\":2}"
sleep 5
curl -X PATCH "$BACKEND_URL/api/operator/tokens/status" \
  -H "Authorization: Bearer $OPERATOR_AUTH_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$TOKEN_ADDRESS\",\"status\":1}"
sleep 60

# Public Chain
forge script script/DeployPublicContracts.s.sol --rpc-url $PUBLIC_CHAIN_RPC_URL --broadcast --legacy
forge script script/DeployMarketplace.s.sol --rpc-url $PUBLIC_CHAIN_RPC_URL --broadcast --legacy
# Update ATTESTATION_ADDRESS, REVEAL_TRACKER_ADDRESS, MARKETPLACE_ADDRESS in .env
source .env
```

### 5. Generate ABIs

```bash
forge build
mkdir -p agent/src/abis
cat out/LuxWatchNFT.sol/LuxWatchNFT.json | jq '.abi' > agent/src/abis/LuxWatchNFT.json
cat out/LuxAttestation.sol/LuxAttestation.json | jq '.abi' > agent/src/abis/LuxAttestation.json
cat out/RevealTracker.sol/RevealTracker.json | jq '.abi' > agent/src/abis/RevealTracker.json
cat out/Marketplace.sol/Marketplace.json | jq '.abi' > agent/src/abis/Marketplace.json
```

### 6. Start the oracle

```bash
cd agent
npm install
npm start
```

### 7. Mint a watch (separate terminal)

```bash
cd ..
forge script script/MintWatch.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
```

### 8. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## What's Real vs Mocked

| Component | Status |
|-----------|--------|
| LuxWatchNFT on Privacy Node | Real -- deployed, minting works |
| Rayls Bridge (relayer lock & mint) | Real -- teleport triggers mirror NFT |
| LuxAttestation on Public Chain | Real -- on-chain attestation records |
| Marketplace (ERC-721 + USDR) | Real -- starter kit marketplace |
| RevealTracker | Real -- request/confirm pattern |
| AI rule engine (7 checks) | Real -- deterministic validation |
| AI LLM (Claude API) | Real -- contextual analysis |
| Merkle serial verification | Real -- on-chain MerkleProof |
| AIReasoningLog (on-chain) | Real -- full audit trail |
| Images | Hash commitments real, IPFS URIs are placeholders |
| ZK proofs | Simulated with Merkle proofs. Noir can be swapped in later. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Foundry, OpenZeppelin |
| Blockchain | Rayls Privacy Node (EVM, gasless), Rayls Public Chain (USDR gas) |
| Oracle Agent | TypeScript, ethers.js v6, Claude API |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, ethers.js, wagmi, Three.js |
| UI Components | shadcn/ui pattern (Button, custom tunnel hero, interactive checkout) |
| Animations | Framer Motion, Three.js WebGL shaders |
| Verification | Merkle proofs (OpenZeppelin MerkleProof), keccak256 hashing |

---

## Chain Credentials (Testnet)

| Parameter | Value |
|-----------|-------|
| Privacy Node RPC | `https://privacy-node-5.rayls.com` |
| Privacy Node Chain ID | 800005 |
| Privacy Explorer | `https://blockscout-privacy-node-5.rayls.com` |
| Public Chain RPC | `https://testnet-rpc.rayls.com` |
| Public Chain ID | 7295799 |
| Public Explorer | `https://testnet-explorer.rayls.com` |

---

## License

Built for the Rayls Hackathon. Confidential NFT Reveal track.

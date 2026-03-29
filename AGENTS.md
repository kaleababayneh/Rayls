# AGENTS.md — LuxVerify

## What This Is

A luxury watch authentication system on Rayls. Watches are minted as confidential NFTs on a Privacy Node with rich private metadata. An AI oracle validates authenticity and publishes attestations to the Public Chain. Buyers purchase on a marketplace and private metadata reveals only after payment.

**Track:** Confidential NFT Reveal
**Built on:** [rayls-hackathon-starter](https://github.com/raylsnetwork/rayls-hackathon-starter)
**Detailed contracts & oracle code:** Read `docs/CONTRACTS.md` when implementing each component.

## Architecture

```
Privacy Node (gasless EVM)           Public Chain (USDR gas)
┌──────────────────────┐            ┌───────────────────────┐
│ LuxWatchNFT.sol      │──bridge──▶│ LuxAttestation.sol    │
│ (ERC-721, private    │ (relayer)  │ (AI + Merkle serial)  │
│  watch metadata)     │            │                       │
└──────────────────────┘            │ Marketplace.sol       │
                                    │ (starter, USDR escrow)│
                                    │                       │
                                    │ RevealTracker.sol     │
                                    └───────────────────────┘
                                             ▲
                                    ┌────────┴────────┐
                                    │ AI Oracle Agent  │
                                    │ (reads private,  │
                                    │  writes public)  │
                                    └─────────────────┘
                                             ▲
                                    ┌────────┴────────┐
                                    │ Frontend         │
                                    │ (Next.js + wagmi)│
                                    └─────────────────┘
```

## Chain Credentials

```env
PRIVACY_NODE_RPC_URL=https://privacy-node-5.rayls.com
DEPLOYMENT_PROXY_REGISTRY=0x75Da1758161588FD2ccbFd23AB87f373b0f73c8F
PRIVACY_NODE_CHAIN_ID=800005
PRIVACY_EXPLORER=https://blockscout-privacy-node-5.rayls.com
PUBLIC_CHAIN_RPC_URL=https://testnet-rpc.rayls.com
PUBLIC_CHAIN_ID=7295799
PUBLIC_EXPLORER=https://testnet-explorer.rayls.com
BACKEND_URL=https://rayls-backend-privacy-node-5.rayls.com
USER_AUTH_KEY=ce87c003337354d7e906d4dbd30d133affce711449801f16b58ff1c6b2ddf327
OPERATOR_AUTH_KEY=ce87c003337354d7e906d4dbd30d133affce711449801f16b58ff1c6b2ddf327
```

## Critical Rayls Rules

1. Privacy Node is **gasless**. All forge commands MUST use `--legacy`.
2. Public Chain uses **USDR** for gas.
3. Two keys: `DEPLOYER_PRIVATE_KEY` (owns contracts, mints) and `REGISTERED_PRIVATE_KEY` (from onboarding API, required for `teleportToPublicChain()`).
4. Constructors must use `_mint()` not `mint()`.
5. Token symbol must be unique. Use `LUXW`.
6. Mirror deployment takes 30-60s after token approval.
7. Before bridging, transfer NFT from deployer to registered address.
8. **Check `src/HackathonNFT.sol` and `src/base/RaylsErc721Handler.sol` for exact constructor signature before writing contracts. Match it exactly.**

## What to Build (read docs/CONTRACTS.md for full code)

### 1. LuxWatchNFT.sol → Privacy Node
ERC-721 extending `RaylsErc721Handler`. Private metadata per token: brand, model, reference, year, serial, caliber, material, images (hash commitments), services, provenance chain. Functions: `mintWatch()`, `addImage()`, `addService()`, `recordTransfer()`, `markAttested()`, `getWatchData()`, `getPublicSummary()`, `getSerialNumber()`, `getProvenanceSummary()`.

### 2. LuxAttestation.sol → Public Chain
Attestations with Merkle serial verification. `serialRegistryRoots` mapping (brand→root), `verifySerial()` with OpenZeppelin `MerkleProof`, `attest()` publishes full attestation.

### 3. RevealTracker.sol → Public Chain
Tracks reveal status. `requestReveal()`, `confirmReveal()`, `isRevealed()`.

### 4. Marketplace.sol → Public Chain
Use starter's Marketplace.sol as-is. ERC721 support with `assetType=1`.

### 5. AI Oracle Agent → TypeScript (extend agent/)
- `merkle.ts`: Build tree from serial-registry.json, generate proofs
- `validator/rules.ts`: 7 real checks (caliber-reference, year, materials, etc.)
- `validator/llm.ts`: Real Codex API call
- `validator/scorer.ts`: 60% rules + 40% LLM
- `index.ts`: Poll Privacy Node for mints → validate → attest on Public Chain. Poll marketplace for purchases → trigger reveal.
- Use `eth_getLogs` polling, not WebSocket subscriptions.

### 6. Frontend → Next.js 14
Pages: `/` (landing), `/dealer` (mint + attestation status), `/marketplace` (browse + buy), `/verify` (token lookup), `/collection` (revealed metadata).
Dark theme (`zinc-950`), emerald accent. ethers.js for Privacy Node reads, wagmi for Public Chain.

## Execution Order

```bash
# 0. Setup
git clone https://github.com/raylsnetwork/rayls-hackathon-starter
cd rayls-hackathon-starter && forge install && npm install
cp .env.example .env
cast wallet new  # save as DEPLOYER_PRIVATE_KEY

# 1. Fill .env with credentials above
source .env

# 2. Register + approve user
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

# 3. Deploy LuxWatchNFT to Privacy Node
forge script script/DeployLuxWatch.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
# Update TOKEN_ADDRESS in .env
source .env

# 4. Register + approve token
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
forge script script/CheckBalance.s.sol --rpc-url $PRIVACY_NODE_RPC_URL

# 5. Deploy public chain contracts
forge script script/DeployPublicContracts.s.sol --rpc-url $PUBLIC_CHAIN_RPC_URL --broadcast --legacy
forge script script/DeployMarketplace.s.sol --rpc-url $PUBLIC_CHAIN_RPC_URL --broadcast --legacy
# Update ATTESTATION_ADDRESS, REVEAL_TRACKER_ADDRESS, MARKETPLACE_ADDRESS
source .env

# 6. Generate ABIs
forge build
mkdir -p agent/src/abis
cat out/LuxWatchNFT.sol/LuxWatchNFT.json | jq '.abi' > agent/src/abis/LuxWatchNFT.json
cat out/LuxAttestation.sol/LuxAttestation.json | jq '.abi' > agent/src/abis/LuxAttestation.json
cat out/RevealTracker.sol/RevealTracker.json | jq '.abi' > agent/src/abis/RevealTracker.json
cat out/Marketplace.sol/Marketplace.json | jq '.abi' > agent/src/abis/Marketplace.json

# 7. Start oracle
cd agent && npm install && npm start

# 8. Mint (new terminal)
cd .. && forge script script/MintWatch.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy

# 9. Bridge (after attestation)
forge script script/BridgeWatch.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy

# 10. List + frontend
cd frontend && npm install && npm run dev
```

## What's Real vs Mocked

| Component | Status |
|-----------|--------|
| LuxWatchNFT on Privacy Node | ✅ REAL |
| Bridge (relayer lock & mint) | ✅ REAL |
| LuxAttestation on Public Chain | ✅ REAL |
| Marketplace (starter) | ✅ REAL |
| RevealTracker | ✅ REAL |
| AI rule engine | ✅ REAL |
| AI LLM (Codex API) | ✅ REAL |
| Merkle serial verification | ✅ REAL on-chain |
| ZK (Noir) | 🟡 SIMULATED — Merkle instead. Swap Noir in later. |
| Images | 🟡 Hash commitments real, IPFS URIs placeholder |

## File Structure

```
rayls-hackathon-starter/
├── AGENTS.md                        # THIS FILE
├── docs/CONTRACTS.md                # Full code reference
├── src/
│   ├── LuxWatchNFT.sol              # NEW
│   ├── LuxAttestation.sol           # NEW
│   ├── RevealTracker.sol            # NEW
│   └── (starter files)
├── script/
│   ├── DeployLuxWatch.s.sol         # NEW
│   ├── MintWatch.s.sol              # NEW
│   ├── BridgeWatch.s.sol            # NEW
│   ├── DeployPublicContracts.s.sol  # NEW
│   └── (starter scripts)
├── agent/
│   ├── src/
│   │   ├── index.ts                 # REPLACED
│   │   ├── merkle.ts                # NEW
│   │   ├── validator/               # NEW
│   │   └── abis/                    # GENERATED
│   └── data/serial-registry.json    # NEW
├── frontend/app/                    # NEW
├── .env
└── foundry.toml
```

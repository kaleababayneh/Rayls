/**
 * LuxVerify Autonomous AI Oracle Agent
 *
 * Fully autonomous pipeline — zero human intervention:
 *   1. Detect new mint on Privacy Node
 *   2. Validate (7 rules + Claude AI + Merkle serial)
 *   3. Check for duplicate serials
 *   4. Publish attestation + full reasoning log on Public Chain
 *   5. Auto-bridge NFT from Privacy Node to Public Chain
 *   6. Auto-list on marketplace
 *
 * "Humans watch; the agent operates."
 */
import { ethers } from "ethers";
import { config } from "./config.js";
import {
  buildSerialTree,
  getRoot,
  getLeaf,
  getProof,
  verifyLocally,
} from "./merkle.js";
import { validateWatch } from "./validator/rules.js";
import { analyzeWatch } from "./validator/llm.js";
import { calculateScore } from "./validator/scorer.js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import LuxWatchNFTAbi from "./abis/LuxWatchNFT.json" with { type: "json" };
import LuxAttestationAbi from "./abis/LuxAttestation.json" with { type: "json" };
import RevealTrackerAbi from "./abis/RevealTracker.json" with { type: "json" };
import MarketplaceAbi from "./abis/Marketplace.json" with { type: "json" };
import AIReasoningLogAbi from "./abis/AIReasoningLog.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

const POLL_INTERVAL = 3_000;
const BATCH_SIZE = 1000;
const BRIDGE_POLL_INTERVAL = 5_000;
const BRIDGE_TIMEOUT = 120_000; // 2 min max wait for mirror

// Minimal ERC721 ABI for approve
const ERC721_ABI = [
  "function approve(address to, uint256 tokenId)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
];

async function main() {
  console.log("=== LuxVerify Autonomous AI Oracle Agent ===\n");

  // ── Providers & Wallets ───────────────────────────────────────────
  const privacyProvider = new ethers.JsonRpcProvider(config.privacyNodeRpc);
  const publicProvider = new ethers.JsonRpcProvider(config.publicChainRpc);
  const oracleWallet = new ethers.Wallet(config.agentPrivateKey, publicProvider);
  const deployerWalletPrivacy = new ethers.Wallet(config.agentPrivateKey, privacyProvider);

  console.log("Oracle address:", oracleWallet.address);

  // Optional wallets for autonomous pipeline
  let registeredWalletPrivacy: ethers.Wallet | null = null;
  let listerWallet: ethers.Wallet | null = null;

  if (config.registeredPrivateKey) {
    registeredWalletPrivacy = new ethers.Wallet(config.registeredPrivateKey, privacyProvider);
    console.log("Registered wallet (privacy):", registeredWalletPrivacy.address);
  }
  if (config.listerPrivateKey) {
    listerWallet = new ethers.Wallet(config.listerPrivateKey, publicProvider);
    console.log("Lister wallet (public):", listerWallet.address);
  }

  const canAutoBridge = !!registeredWalletPrivacy && !!config.transferTo;
  const canAutoList = !!listerWallet && !!config.mirrorNftAddress;
  console.log(`Auto-bridge: ${canAutoBridge ? "ENABLED" : "DISABLED"}`);
  console.log(`Auto-list:   ${canAutoList ? "ENABLED" : "DISABLED"}`);

  // ── Contracts ─────────────────────────────────────────────────────
  const watchNFT = new ethers.Contract(config.tokenAddress, LuxWatchNFTAbi, privacyProvider);
  const watchNFTDeployer = new ethers.Contract(config.tokenAddress, LuxWatchNFTAbi, deployerWalletPrivacy);
  const attestation = new ethers.Contract(config.attestationAddress, LuxAttestationAbi, oracleWallet);
  const revealTracker = new ethers.Contract(config.revealTrackerAddress, RevealTrackerAbi, oracleWallet);
  const marketplace = new ethers.Contract(config.marketplaceAddress, MarketplaceAbi, publicProvider);

  let reasoningLog: ethers.Contract | null = null;
  if (config.reasoningLogAddress) {
    reasoningLog = new ethers.Contract(config.reasoningLogAddress, AIReasoningLogAbi, oracleWallet);
    console.log("Reasoning log:", config.reasoningLogAddress);
  }

  // ── Merkle Tree ───────────────────────────────────────────────────
  const registryPath = resolve(__dirname, "../data/serial-registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf-8"));
  const tree = buildSerialTree(registry.serials);
  const root = getRoot(tree);
  console.log(`Merkle tree: ${registry.serials.length} serials, root: ${root}`);

  const currentRoot = await attestation.serialRegistryRoots(registry.brand);
  if (currentRoot !== root) {
    console.log("Publishing serial registry root on-chain...");
    const tx = await attestation.updateSerialRegistry(registry.brand, root);
    await tx.wait();
    console.log("Registry root published:", tx.hash);
  } else {
    console.log("Serial registry root already current.");
  }

  // ── State ─────────────────────────────────────────────────────────
  const currentPrivacyBlockInit = await privacyProvider.getBlockNumber();
  let lastMintBlock = Math.max(0, currentPrivacyBlockInit - 5000);
  let lastBuyBlock = await publicProvider.getBlockNumber();
  const processedMints = new Set<number>();
  const processedBuys = new Set<number>();

  // ── Event Interfaces ──────────────────────────────────────────────
  const mintTopic = ethers.id("WatchMinted(uint256,string,string,string,bytes32)");
  const watchMintedIface = new ethers.Interface([
    "event WatchMinted(uint256 indexed tokenId, string brand, string model, string referenceNumber, bytes32 metadataHash)",
  ]);
  const boughtTopic = ethers.id("Bought(uint256,address,uint256)");
  const boughtIface = new ethers.Interface([
    "event Bought(uint256 indexed listingId, address indexed buyer, uint256 price)",
  ]);

  console.log("\nStarting autonomous poll loop...\n");

  // ── Poll Loop ─────────────────────────────────────────────────────
  while (true) {
    try {
      // ── 1. Poll Privacy Node for new mints ────────────────────────
      const currentPrivacyBlock = await privacyProvider.getBlockNumber();
      if (currentPrivacyBlock > lastMintBlock) {
        const fromBlock = lastMintBlock === 0 ? 0 : lastMintBlock + 1;
        const toBlock = Math.min(fromBlock + BATCH_SIZE, currentPrivacyBlock);

        const mintLogs = await privacyProvider.getLogs({
          address: config.tokenAddress,
          topics: [mintTopic],
          fromBlock,
          toBlock,
        });

        for (const log of mintLogs) {
          const parsed = watchMintedIface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (!parsed) continue;

          const tokenId = Number(parsed.args.tokenId);
          if (processedMints.has(tokenId)) continue;
          processedMints.add(tokenId);

          console.log(`\n${"━".repeat(50)}`);
          console.log(`  NEW MINT: Token #${tokenId}`);
          console.log(`  ${parsed.args.brand} ${parsed.args.model} Ref. ${parsed.args.referenceNumber}`);
          console.log(`${"━".repeat(50)}`);

          try {
            const attested = await processWatch(
              tokenId, watchNFT, attestation, reasoningLog, tree, registry.brand
            );

            // Autonomous pipeline: bridge + list
            if (attested && canAutoBridge) {
              await autoBridge(
                tokenId, watchNFTDeployer, registeredWalletPrivacy!,
                config.transferTo, config.publicChainId
              );

              if (canAutoList) {
                // Use a testnet-friendly price (1 USDR) since buyer wallets have limited funds
                const priceWei = ethers.parseEther("1");

                await autoList(
                  tokenId, listerWallet!, oracleWallet, config.mirrorNftAddress,
                  config.marketplaceAddress, priceWei
                );
              }
            }
          } catch (err: any) {
            console.error(`  Error processing token #${tokenId}:`, err.message);
          }
        }

        lastMintBlock = toBlock;
      }

      // ── 2. Poll Public Chain for marketplace purchases ────────────
      const currentPublicBlock = await publicProvider.getBlockNumber();
      if (currentPublicBlock > lastBuyBlock) {
        const buyLogs = await publicProvider.getLogs({
          address: config.marketplaceAddress,
          topics: [boughtTopic],
          fromBlock: lastBuyBlock + 1,
          toBlock: currentPublicBlock,
        });

        for (const log of buyLogs) {
          const parsed = boughtIface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (!parsed) continue;

          const listingId = Number(parsed.args.listingId);
          if (processedBuys.has(listingId)) continue;
          processedBuys.add(listingId);

          const buyer = parsed.args.buyer as string;
          console.log(`\n  PURCHASE: Listing #${listingId} by ${buyer.slice(0, 10)}...`);

          try {
            const listing = await marketplace.getListing(listingId);
            const tokenId = Number(listing.tokenId);

            const revealTx = await revealTracker.requestReveal(tokenId, buyer);
            await revealTx.wait();
            console.log(`  Reveal requested for token #${tokenId}`);

            const confirmTx = await revealTracker.confirmReveal(tokenId);
            await confirmTx.wait();
            console.log(`  Reveal confirmed for token #${tokenId}`);
          } catch (err: any) {
            console.error(`  Error processing purchase #${listingId}:`, err.message);
          }
        }

        lastBuyBlock = currentPublicBlock;
      }
    } catch (err: any) {
      console.error("Poll error:", err.message);
    }

    await sleep(POLL_INTERVAL);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Process Watch: validate → attest → log reasoning
// ═══════════════════════════════════════════════════════════════════════
async function processWatch(
  tokenId: number,
  watchNFT: ethers.Contract,
  attestation: ethers.Contract,
  reasoningLog: ethers.Contract | null,
  tree: any,
  brand: string
): Promise<boolean> {
  // Skip if already attested
  try {
    const existing = await attestation.getAttestation(tokenId);
    if (existing.valid) {
      console.log(`  Already attested (score: ${Number(existing.aiScore)}). Skipping.`);
      return false;
    }
  } catch { /* not attested yet */ }

  // 1. Read watch data (parallel)
  console.log("  [1/6] Reading watch data from Privacy Node...");
  const [watchData, images, services, provenanceTuple, mdHash] =
    await Promise.all([
      watchNFT.getWatchData(tokenId),
      watchNFT.getImages(tokenId),
      watchNFT.getServices(tokenId),
      watchNFT.getProvenanceSummary(tokenId),
      watchNFT.metadataHash(tokenId),
    ]);
  const [ownerCount, longestHoldDays, averageHoldDays] = provenanceTuple;
  const provHash = watchData.currentProvenanceHash;

  const watchObj = {
    brand: watchData.brand,
    model: watchData.model,
    referenceNumber: watchData.referenceNumber,
    yearOfProduction: Number(watchData.yearOfProduction),
    serialNumber: watchData.serialNumber,
    movementCaliber: watchData.movementCaliber,
    caseMaterial: watchData.caseMaterial,
    dialColor: watchData.dialColor,
    braceletType: watchData.braceletType,
    caseDiameterMM: Number(watchData.caseDiameterMM),
    conditionGrade: watchData.conditionGrade,
    conditionNotes: watchData.conditionNotes,
    appraisedValue: Number(watchData.appraisedValue),
    ownerCount: Number(ownerCount),
    imageCount: images.length,
    serviceCount: services.length,
  };

  console.log(`  ${watchObj.brand} ${watchObj.model} | Serial: ${watchObj.serialNumber}`);

  // 2. Merkle verification
  console.log("  [2/6] Verifying serial in Merkle tree...");
  const serialInTree = verifyLocally(tree, watchObj.serialNumber);
  console.log(`  Serial verified: ${serialInTree}`);

  // 3. Rule-based validation
  console.log("  [3/6] Running rule engine (7 checks)...");
  const ruleReport = validateWatch(watchObj);
  console.log(`  Rule score: ${ruleReport.totalScore.toFixed(1)}/100`);
  for (const r of ruleReport.results) {
    console.log(`    ${r.passed ? "PASS" : "FAIL"} ${r.name}: ${r.reason}`);
  }

  // 4. LLM analysis
  console.log("  [4/6] Claude AI analysis...");
  const llmAnalysis = await analyzeWatch(watchObj);
  console.log(`  LLM score: ${llmAnalysis.score}/100`);

  // 5. Combined score
  const finalScore = calculateScore(ruleReport, llmAnalysis);
  console.log(`  [5/6] Final: ${finalScore.overall}/100 (rules=${finalScore.ruleScore}, llm=${finalScore.llmScore})`);
  console.log(`  Verdict: ${finalScore.passed ? "PASSED" : "FAILED"}`);

  // 6. Publish attestation + reasoning on-chain
  console.log("  [6/6] Publishing on Public Chain...");
  const leaf = getLeaf(watchObj.serialNumber);
  const proof = getProof(tree, watchObj.serialNumber);

  const tx = await attestation.attest(
    tokenId, watchObj.brand, watchObj.model, watchObj.referenceNumber,
    watchObj.yearOfProduction, watchObj.caseMaterial, watchObj.conditionGrade,
    watchObj.ownerCount, Number(longestHoldDays), Number(averageHoldDays),
    watchObj.imageCount, watchObj.serviceCount, mdHash, provHash,
    finalScore.overall, finalScore.summary, leaf, proof
  );
  const receipt = await tx.wait();
  console.log(`  Attestation TX: ${tx.hash}`);

  // Check if duplicate was detected (read event logs)
  for (const log of receipt!.logs) {
    try {
      const iface = new ethers.Interface([
        "event DuplicateDetected(uint256 indexed newTokenId, uint256 indexed originalTokenId, bytes32 serialHash)"
      ]);
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === "DuplicateDetected") {
        console.log(`  DUPLICATE DETECTED: Token #${tokenId} shares serial with Token #${Number(parsed.args.originalTokenId)}`);
        console.log(`  Original attestation REVOKED. Both tokens flagged.`);
      }
    } catch { /* not a DuplicateDetected event */ }
  }

  // Log full reasoning on-chain
  if (reasoningLog) {
    try {
      const ruleNames = ruleReport.results.map(r => r.name);
      const rulePassed = ruleReport.results.map(r => r.passed);
      const ruleReasons = ruleReport.results.map(r => r.reason);

      const logTx = await reasoningLog.logReasoning(
        tokenId,
        ruleNames,
        rulePassed,
        ruleReasons,
        finalScore.ruleScore,
        llmAnalysis.findings,
        llmAnalysis.riskFlags,
        llmAnalysis.score,
        finalScore.overall,
        finalScore.passed
      );
      await logTx.wait();
      console.log(`  Reasoning log TX: ${logTx.hash}`);
    } catch (err: any) {
      console.error(`  Reasoning log failed: ${err.message}`);
    }
  }

  console.log(`  Token #${tokenId} attested with score ${finalScore.overall}`);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// Auto-Bridge: transfer to registered → teleport to public chain
// ═══════════════════════════════════════════════════════════════════════
async function autoBridge(
  tokenId: number,
  watchNFTDeployer: ethers.Contract,
  registeredWallet: ethers.Wallet,
  transferTo: string,
  publicChainId: number
) {
  console.log("  AUTO-BRIDGE: Initiating...");

  // Wait for any pending deployer txs to clear (mint API uses same key)
  const deployer = watchNFTDeployer.runner as ethers.Wallet;
  const deployerAddr = await deployer.getAddress();
  console.log("  Waiting for pending transactions to clear...");
  await waitForNonce(deployer);

  // Step 1: Transfer from deployer to registered address
  try {
    const currentOwner = await watchNFTDeployer.ownerOf(tokenId);
    if (currentOwner.toLowerCase() === deployerAddr.toLowerCase()) {
      const nonce = await deployer.getNonce("pending");
      const tx = await watchNFTDeployer.transferFrom(
        deployerAddr, registeredWallet.address, tokenId, { nonce }
      );
      await tx.wait();
      console.log(`  Transferred to registered address: ${registeredWallet.address}`);
    } else if (currentOwner.toLowerCase() === registeredWallet.address.toLowerCase()) {
      console.log("  Token already at registered address. Skipping transfer.");
    } else {
      console.log(`  Token owned by ${currentOwner.slice(0, 10)}... — cannot transfer.`);
      return;
    }
  } catch (err: any) {
    console.error(`  Transfer failed: ${err.message}`);
    return;
  }

  // Step 2: Teleport to public chain
  try {
    const nftAddress = await watchNFTDeployer.getAddress();
    const watchNFTRegistered = new ethers.Contract(
      nftAddress,
      LuxWatchNFTAbi,
      registeredWallet
    );
    const nonce = await registeredWallet.getNonce("pending");
    const tx = await watchNFTRegistered.teleportToPublicChain(
      transferTo, tokenId, publicChainId, { nonce }
    );
    await tx.wait();
    console.log(`  Teleport initiated → ${transferTo.slice(0, 10)}... on chain ${publicChainId}`);
    console.log(`  Waiting for relayer to mint mirror NFT (~30-60s)...`);
  } catch (err: any) {
    console.error(`  Teleport failed: ${err.message}`);
  }
}

async function waitForNonce(wallet: ethers.Wallet, maxWait = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const pending = await wallet.getNonce("pending");
    const confirmed = await wallet.getNonce("latest");
    if (pending === confirmed) return;
    await sleep(2000);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Auto-List: wait for mirror → transfer to owner → list on marketplace
// The marketplace's list() is onlyOwner, so the deployer (marketplace
// owner) must hold the NFT and call list.
// Flow: lister receives mirror → transfers to deployer → deployer lists
// ═══════════════════════════════════════════════════════════════════════
async function autoList(
  tokenId: number,
  listerWallet: ethers.Wallet,
  ownerWallet: ethers.Wallet,
  mirrorNftAddress: string,
  marketplaceAddress: string,
  priceWei: bigint,
) {
  console.log("  AUTO-LIST: Waiting for mirror NFT...");

  const mirrorNftLister = new ethers.Contract(mirrorNftAddress, ERC721_ABI, listerWallet);
  const mirrorNftOwner = new ethers.Contract(mirrorNftAddress, ERC721_ABI, ownerWallet);
  const marketplaceWrite = new ethers.Contract(
    marketplaceAddress,
    ["function list(address token, uint8 assetType, uint256 tokenId, uint256 amount, uint256 price) returns (uint256)"],
    ownerWallet
  );

  // Poll for mirror NFT to appear at lister address
  const deadline = Date.now() + BRIDGE_TIMEOUT;
  let mirrorOwner = "";

  while (Date.now() < deadline) {
    try {
      mirrorOwner = await mirrorNftLister.ownerOf(tokenId);
      if (mirrorOwner !== ethers.ZeroAddress) {
        console.log(`  Mirror NFT found! Owner: ${mirrorOwner.slice(0, 10)}...`);
        break;
      }
    } catch { /* mirror not yet minted */ }
    await sleep(BRIDGE_POLL_INTERVAL);
  }

  if (!mirrorOwner || mirrorOwner === ethers.ZeroAddress) {
    console.log("  Mirror NFT not found within timeout. Will list later.");
    return;
  }

  const ownerAddr = await ownerWallet.getAddress();

  // If lister has the NFT, transfer to marketplace owner (deployer)
  if (mirrorOwner.toLowerCase() === listerWallet.address.toLowerCase()) {
    try {
      const tx = await mirrorNftLister.transferFrom(listerWallet.address, ownerAddr, tokenId);
      await tx.wait();
      console.log(`  Transferred mirror to marketplace owner: ${ownerAddr.slice(0, 10)}...`);
    } catch (err: any) {
      console.error(`  Mirror transfer failed: ${err.message}`);
      return;
    }
  } else if (mirrorOwner.toLowerCase() !== ownerAddr.toLowerCase()) {
    console.log(`  Mirror owned by unknown address. Cannot list.`);
    return;
  }

  // Approve marketplace
  try {
    const approveTx = await mirrorNftOwner.approve(marketplaceAddress, tokenId);
    await approveTx.wait();
    console.log("  Approved marketplace for token");
  } catch (err: any) {
    console.error(`  Approve failed: ${err.message}`);
    return;
  }

  // List: assetType=1 (ERC721), amount=1
  try {
    const listTx = await marketplaceWrite.list(mirrorNftAddress, 1, tokenId, 1, priceWei);
    await listTx.wait();
    console.log(`  LISTED on marketplace! TX: ${listTx.hash}`);
    console.log(`  Price: ${ethers.formatEther(priceWei)} USDR`);
  } catch (err: any) {
    console.error(`  List failed: ${err.message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

/**
 * LuxVerify AI Oracle Agent
 *
 * Polls Privacy Node for WatchMinted events → validates → attests on Public Chain.
 * Polls Marketplace for purchases → triggers reveal via RevealTracker.
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

const __dirname = dirname(fileURLToPath(import.meta.url));

const POLL_INTERVAL = 10_000;
const BATCH_SIZE = 1000;

async function main() {
  console.log("=== LuxVerify AI Oracle Agent ===\n");

  // ── Providers & Wallets ───────────────────────────────────────────
  const privacyProvider = new ethers.JsonRpcProvider(config.privacyNodeRpc);
  const publicProvider = new ethers.JsonRpcProvider(config.publicChainRpc);
  const wallet = new ethers.Wallet(config.agentPrivateKey, publicProvider);

  console.log("Oracle address:", wallet.address);

  // ── Contracts ─────────────────────────────────────────────────────
  const watchNFT = new ethers.Contract(
    config.tokenAddress,
    LuxWatchNFTAbi,
    privacyProvider
  );
  const attestation = new ethers.Contract(
    config.attestationAddress,
    LuxAttestationAbi,
    wallet
  );
  const revealTracker = new ethers.Contract(
    config.revealTrackerAddress,
    RevealTrackerAbi,
    wallet
  );
  const marketplace = new ethers.Contract(
    config.marketplaceAddress,
    MarketplaceAbi,
    publicProvider
  );

  // ── Merkle Tree ───────────────────────────────────────────────────
  const registryPath = resolve(__dirname, "../data/serial-registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf-8"));
  const tree = buildSerialTree(registry.serials);
  const root = getRoot(tree);
  console.log(
    `Merkle tree: ${registry.serials.length} serials, root: ${root}`
  );

  // Publish root on-chain (only if different)
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
  // Start scanning from recent blocks (not genesis) to avoid 8M block scan
  const currentPrivacyBlockInit = await privacyProvider.getBlockNumber();
  let lastMintBlock = Math.max(0, currentPrivacyBlockInit - 5000);
  let lastBuyBlock = await publicProvider.getBlockNumber();
  const processedMints = new Set<number>();
  const processedBuys = new Set<number>();

  // ── Event Interfaces ──────────────────────────────────────────────
  const mintTopic = ethers.id(
    "WatchMinted(uint256,string,string,string,bytes32)"
  );
  const watchMintedIface = new ethers.Interface([
    "event WatchMinted(uint256 indexed tokenId, string brand, string model, string referenceNumber, bytes32 metadataHash)",
  ]);

  const boughtTopic = ethers.id("Bought(uint256,address,uint256)");
  const boughtIface = new ethers.Interface([
    "event Bought(uint256 indexed listingId, address indexed buyer, uint256 price)",
  ]);

  console.log("\nStarting poll loop...\n");

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

          console.log(`\n━━━ New Mint: Token #${tokenId} ━━━`);
          console.log(
            `  ${parsed.args.brand} ${parsed.args.model} Ref. ${parsed.args.referenceNumber}`
          );

          try {
            await processWatch(
              tokenId,
              watchNFT,
              attestation,
              tree,
              registry.brand
            );
          } catch (err: any) {
            console.error(
              `  Error processing token #${tokenId}:`,
              err.message
            );
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
          console.log(
            `\n━━━ Purchase: Listing #${listingId} by ${buyer} ━━━`
          );

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
            console.error(
              `  Error processing purchase #${listingId}:`,
              err.message
            );
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

async function processWatch(
  tokenId: number,
  watchNFT: ethers.Contract,
  attestation: ethers.Contract,
  tree: any,
  brand: string
) {
  // 1. Read watch data from Privacy Node
  console.log("  Reading watch data from Privacy Node...");
  const watchData = await watchNFT.getWatchData(tokenId);
  const images = await watchNFT.getImages(tokenId);
  const services = await watchNFT.getServices(tokenId);
  const [ownerCount, longestHoldDays, averageHoldDays] =
    await watchNFT.getProvenanceSummary(tokenId);
  const mdHash = await watchNFT.metadataHash(tokenId);
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

  console.log(
    `  ${watchObj.brand} ${watchObj.model} Ref. ${watchObj.referenceNumber}`
  );
  console.log(
    `  Serial: ${watchObj.serialNumber}, Year: ${watchObj.yearOfProduction}`
  );
  console.log(
    `  Photos: ${watchObj.imageCount}, Services: ${watchObj.serviceCount}`
  );

  // 2. Merkle verification
  console.log("  Verifying serial in Merkle tree...");
  const serialInTree = verifyLocally(tree, watchObj.serialNumber);
  console.log(`  Serial verified: ${serialInTree}`);

  // 3. Rule-based validation
  console.log("  Running rule engine...");
  const ruleReport = validateWatch(watchObj);
  console.log(`  Rule score: ${ruleReport.totalScore.toFixed(1)}`);
  if (ruleReport.criticalFailures.length > 0) {
    console.log(
      `  Critical failures: ${ruleReport.criticalFailures.join(", ")}`
    );
  }
  for (const r of ruleReport.results) {
    const status = r.passed ? "PASS" : "FAIL";
    console.log(`    [${status}] ${r.name}: ${r.reason} (${r.score})`);
  }

  // 4. LLM analysis
  console.log("  Calling Claude API for AI analysis...");
  const llmAnalysis = await analyzeWatch(watchObj);
  console.log(`  LLM score: ${llmAnalysis.score}`);
  console.log(`  Findings: ${llmAnalysis.findings.join("; ")}`);
  if (llmAnalysis.riskFlags.length > 0) {
    console.log(`  Risk flags: ${llmAnalysis.riskFlags.join("; ")}`);
  }

  // 5. Combined score
  const finalScore = calculateScore(ruleReport, llmAnalysis);
  console.log(
    `  Final: ${finalScore.overall} (rules=${finalScore.ruleScore}, llm=${finalScore.llmScore})`
  );
  console.log(`  Verdict: ${finalScore.passed ? "PASSED" : "FAILED"}`);

  // 6. Publish attestation on-chain
  console.log("  Publishing attestation on Public Chain...");
  const leaf = getLeaf(watchObj.serialNumber);
  const proof = getProof(tree, watchObj.serialNumber);

  const tx = await attestation.attest(
    tokenId,
    watchObj.brand,
    watchObj.model,
    watchObj.referenceNumber,
    watchObj.yearOfProduction,
    watchObj.caseMaterial,
    watchObj.conditionGrade,
    watchObj.ownerCount,
    Number(longestHoldDays),
    Number(averageHoldDays),
    watchObj.imageCount,
    watchObj.serviceCount,
    mdHash,
    provHash,
    finalScore.overall,
    finalScore.summary,
    leaf,
    proof
  );

  const receipt = await tx.wait();
  console.log(`  Attestation tx: ${tx.hash}`);
  console.log(
    `  Status: ${receipt!.status === 1 ? "SUCCESS" : "FAILED"}`
  );
  console.log(`  Token #${tokenId} attested with score ${finalScore.overall}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});

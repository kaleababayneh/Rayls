# docs/CONTRACTS.md — Full Code Reference

Read this file when implementing specific components. Don't load it all at once.

---

## LuxWatchNFT.sol

**BEFORE WRITING THIS CONTRACT:** Read `src/HackathonNFT.sol` and `src/base/RaylsErc721Handler.sol` from the starter to understand the exact constructor signature and inherited functions. The constructor parameters MUST match the base class. Adapt the code below if the base class signature differs.

**Deploy to: Privacy Node** | **File: `src/LuxWatchNFT.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./base/RaylsErc721Handler.sol";

contract LuxWatchNFT is RaylsErc721Handler {

    struct ImageCommitment {
        bytes32 imageHash;
        string imageUri;
        string imageType;
        uint256 capturedAt;
    }

    struct ServiceRecord {
        uint256 date;
        string serviceCenter;
        string workPerformed;
        uint256 cost;
    }

    struct ProvenanceEntry {
        address from;
        address to;
        uint256 timestamp;
        uint256 price;
        bytes32 previousHash;
    }

    struct WatchData {
        string brand;
        string model;
        string reference;
        uint256 yearOfProduction;
        string serialNumber;
        string movementCaliber;
        string caseMaterial;
        string dialColor;
        string braceletType;
        uint256 caseDiameterMM;
        bytes32 purchaseReceiptHash;
        uint256 appraisedValue;
        string conditionGrade;
        string conditionNotes;
        bytes32 currentProvenanceHash;
        uint8 ownerCount;
        bool isAttested;
        uint8 attestationScore;
        bool zkVerified;
    }

    mapping(uint256 => WatchData) private _watches;
    mapping(uint256 => ImageCommitment[]) private _images;
    mapping(uint256 => ServiceRecord[]) private _services;
    mapping(uint256 => ProvenanceEntry[]) private _provenance;
    mapping(uint256 => bytes32) public metadataHash;
    uint256 private _nextTokenId;

    event WatchMinted(uint256 indexed tokenId, string brand, string model, string reference, bytes32 metadataHash);
    event ImageAdded(uint256 indexed tokenId, string imageType, bytes32 imageHash);
    event ServiceAdded(uint256 indexed tokenId, uint256 date);
    event ProvenanceUpdated(uint256 indexed tokenId, bytes32 newHash, uint8 ownerCount);
    event WatchAttested(uint256 indexed tokenId, uint8 score, bool zkVerified);

    constructor(string memory uri, address _endpoint, address _userGovernance)
        RaylsErc721Handler(uri, "LuxVerify Watch", "LUXW", _endpoint, msg.sender, _userGovernance)
    {
        _nextTokenId = 1;
    }

    function mintWatch(
        string calldata brand, string calldata model, string calldata reference,
        uint256 yearOfProduction, string calldata serialNumber,
        string calldata movementCaliber, string calldata caseMaterial,
        string calldata dialColor, string calldata braceletType,
        uint256 caseDiameterMM, bytes32 purchaseReceiptHash,
        uint256 appraisedValue, string calldata conditionGrade, string calldata conditionNotes
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        WatchData storage w = _watches[tokenId];
        w.brand = brand; w.model = model; w.reference = reference;
        w.yearOfProduction = yearOfProduction; w.serialNumber = serialNumber;
        w.movementCaliber = movementCaliber; w.caseMaterial = caseMaterial;
        w.dialColor = dialColor; w.braceletType = braceletType;
        w.caseDiameterMM = caseDiameterMM; w.purchaseReceiptHash = purchaseReceiptHash;
        w.appraisedValue = appraisedValue; w.conditionGrade = conditionGrade;
        w.conditionNotes = conditionNotes; w.ownerCount = 1;

        bytes32 provHash = keccak256(abi.encodePacked(bytes32(0), msg.sender, block.timestamp, appraisedValue));
        w.currentProvenanceHash = provHash;
        _provenance[tokenId].push(ProvenanceEntry(address(0), msg.sender, block.timestamp, appraisedValue, bytes32(0)));

        bytes32 mHash = keccak256(abi.encodePacked(brand, model, reference, serialNumber, movementCaliber, yearOfProduction));
        metadataHash[tokenId] = mHash;
        _mint(msg.sender, tokenId);
        emit WatchMinted(tokenId, brand, model, reference, mHash);
        return tokenId;
    }

    function addImage(uint256 tokenId, bytes32 imageHash, string calldata imageUri, string calldata imageType, uint256 capturedAt) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "No token");
        _images[tokenId].push(ImageCommitment(imageHash, imageUri, imageType, capturedAt));
        emit ImageAdded(tokenId, imageType, imageHash);
    }

    function addService(uint256 tokenId, uint256 date, string calldata center, string calldata work, uint256 cost) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "No token");
        _services[tokenId].push(ServiceRecord(date, center, work, cost));
        emit ServiceAdded(tokenId, date);
    }

    function recordTransfer(uint256 tokenId, address from, address to, uint256 price) external onlyOwner {
        WatchData storage w = _watches[tokenId];
        bytes32 newHash = keccak256(abi.encodePacked(w.currentProvenanceHash, from, to, block.timestamp, price));
        _provenance[tokenId].push(ProvenanceEntry(from, to, block.timestamp, price, w.currentProvenanceHash));
        w.currentProvenanceHash = newHash; w.ownerCount++;
        emit ProvenanceUpdated(tokenId, newHash, w.ownerCount);
    }

    function markAttested(uint256 tokenId, uint8 score, bool zkOk) external onlyOwner {
        _watches[tokenId].isAttested = true; _watches[tokenId].attestationScore = score; _watches[tokenId].zkVerified = zkOk;
        emit WatchAttested(tokenId, score, zkOk);
    }

    function getWatchData(uint256 tokenId) external view returns (WatchData memory) { return _watches[tokenId]; }
    function getImages(uint256 tokenId) external view returns (ImageCommitment[] memory) { return _images[tokenId]; }
    function getServices(uint256 tokenId) external view returns (ServiceRecord[] memory) { return _services[tokenId]; }
    function getProvenance(uint256 tokenId) external view returns (ProvenanceEntry[] memory) { return _provenance[tokenId]; }
    function getSerialNumber(uint256 tokenId) external view returns (string memory) { return _watches[tokenId].serialNumber; }

    function getPublicSummary(uint256 tokenId) external view returns (
        string memory brand, string memory model, string memory reference,
        uint256 yearOfProduction, string memory caseMaterial, string memory conditionGrade,
        uint8 ownerCount, uint256 imageCount, uint256 serviceCount,
        bytes32 provenanceHash, bytes32 commitment
    ) {
        WatchData storage w = _watches[tokenId];
        return (w.brand, w.model, w.reference, w.yearOfProduction, w.caseMaterial, w.conditionGrade,
            w.ownerCount, _images[tokenId].length, _services[tokenId].length, w.currentProvenanceHash, metadataHash[tokenId]);
    }

    function getProvenanceSummary(uint256 tokenId) external view returns (uint8 ownerCount, uint256 longestHoldDays, uint256 averageHoldDays) {
        ProvenanceEntry[] storage chain = _provenance[tokenId];
        if (chain.length <= 1) return (_watches[tokenId].ownerCount, 0, 0);
        uint256 longest = 0; uint256 totalDays = 0;
        for (uint256 i = 1; i < chain.length; i++) {
            uint256 holdDays = (chain[i].timestamp - chain[i-1].timestamp) / 86400;
            if (holdDays > longest) longest = holdDays;
            totalDays += holdDays;
        }
        return (_watches[tokenId].ownerCount, longest, totalDays / (chain.length - 1));
    }
}
```

---

## Deploy Scripts

### DeployLuxWatch.s.sol (Privacy Node)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "forge-std/Script.sol";
import "../src/LuxWatchNFT.sol";

interface IDeploymentProxyRegistry {
    function getContract(string calldata name) external view returns (address);
}

contract DeployLuxWatch is Script {
    function run() external {
        address registry = vm.envAddress("DEPLOYMENT_PROXY_REGISTRY");
        IDeploymentProxyRegistry proxy = IDeploymentProxyRegistry(registry);
        address endpoint = proxy.getContract("RNEndpoint");
        address userGov = proxy.getContract("RNUserGovernance");
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        LuxWatchNFT nft = new LuxWatchNFT("https://luxverify.app/metadata/", endpoint, userGov);
        console.log("LuxWatchNFT deployed at:", address(nft));
        vm.stopBroadcast();
    }
}
```

### MintWatch.s.sol (Privacy Node)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "forge-std/Script.sol";
import "../src/LuxWatchNFT.sol";

contract MintWatch is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address nftAddr = vm.envAddress("TOKEN_ADDRESS");
        vm.startBroadcast(pk);
        LuxWatchNFT nft = LuxWatchNFT(nftAddr);
        uint256 tokenId = nft.mintWatch("Rolex", "Submariner Date", "126610LN", 2023,
            "M126610LN-9A2B3C4D", "3235", "Oystersteel", "Black", "Oyster", 41,
            bytes32(0), 1350000, "Excellent", "Minor desk diving marks on clasp, crystal perfect");
        nft.addImage(tokenId, keccak256("movement-photo"), "ipfs://QmMovement", "movement", block.timestamp);
        nft.addImage(tokenId, keccak256("dial-photo"), "ipfs://QmDial", "dial", block.timestamp);
        nft.addImage(tokenId, keccak256("caseback-photo"), "ipfs://QmCaseback", "caseback", block.timestamp);
        nft.addImage(tokenId, keccak256("full-photo"), "ipfs://QmFull", "full", block.timestamp);
        nft.addService(tokenId, 1718409600, "Rolex Service Centre Geneva", "Complete movement service", 80000);
        console.log("Minted tokenId:", tokenId);
        vm.stopBroadcast();
    }
}
```

### BridgeWatch.s.sol (Privacy Node)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "forge-std/Script.sol";
import "../src/LuxWatchNFT.sol";

contract BridgeWatch is Script {
    function run() external {
        address nftAddr = vm.envAddress("TOKEN_ADDRESS");
        address transferTo = vm.envAddress("TRANSFER_TO");
        uint256 publicChainId = vm.envUint("PUBLIC_CHAIN_ID");
        uint256 tokenId = vm.envOr("NFT_TRANSFER_TOKEN_ID", uint256(1));
        address registeredAddr = vm.envAddress("MINT_RECIPIENT");

        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPk);
        LuxWatchNFT nft = LuxWatchNFT(nftAddr);
        if (nft.ownerOf(tokenId) == vm.addr(deployerPk)) {
            nft.transferFrom(vm.addr(deployerPk), registeredAddr, tokenId);
        }
        vm.stopBroadcast();

        uint256 registeredPk = vm.envUint("REGISTERED_PRIVATE_KEY");
        vm.startBroadcast(registeredPk);
        nft = LuxWatchNFT(nftAddr);
        nft.teleportToPublicChain(transferTo, tokenId, publicChainId);
        console.log("Bridged tokenId", tokenId);
        vm.stopBroadcast();
    }
}
```

### DeployPublicContracts.s.sol (Public Chain)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "forge-std/Script.sol";
import "../src/LuxAttestation.sol";
import "../src/RevealTracker.sol";

contract DeployPublicContracts is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        LuxAttestation att = new LuxAttestation(vm.addr(pk));
        console.log("LuxAttestation:", address(att));
        RevealTracker tracker = new RevealTracker();
        console.log("RevealTracker:", address(tracker));
        vm.stopBroadcast();
    }
}
```

---

## LuxAttestation.sol (Public Chain)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract LuxAttestation is Ownable {
    struct Attestation {
        string brand; string model; string reference; uint256 yearOfProduction;
        string caseMaterial; string conditionGrade;
        uint8 ownerCount; uint256 longestHoldDays; uint256 averageHoldDays;
        uint256 imageCount; uint256 serviceCount;
        bytes32 metadataHash; bytes32 provenanceHash;
        uint8 aiScore; string aiSummary; bool serialVerified;
        uint256 attestedAt; bool valid;
    }

    mapping(uint256 => Attestation) public attestations;
    uint256[] public attestedIds;
    mapping(string => bytes32) public serialRegistryRoots;
    address public oracle;

    event Attested(uint256 indexed tokenId, string brand, string model, uint8 score, bool serialVerified);
    event Revoked(uint256 indexed tokenId);
    event RegistryUpdated(string brand, bytes32 newRoot);

    constructor(address _oracle) Ownable(msg.sender) { oracle = _oracle; }
    modifier onlyOracle() { require(msg.sender == oracle, "Not oracle"); _; }

    function updateSerialRegistry(string calldata brand, bytes32 root) external onlyOwner {
        serialRegistryRoots[brand] = root; emit RegistryUpdated(brand, root);
    }

    function verifySerial(string calldata brand, bytes32 leaf, bytes32[] calldata proof) public view returns (bool) {
        bytes32 root = serialRegistryRoots[brand];
        if (root == bytes32(0)) return false;
        return MerkleProof.verify(proof, root, leaf);
    }

    function attest(
        uint256 tokenId, string calldata brand, string calldata model, string calldata reference,
        uint256 yearOfProduction, string calldata caseMaterial, string calldata conditionGrade,
        uint8 ownerCount, uint256 longestHoldDays, uint256 averageHoldDays,
        uint256 imageCount, uint256 serviceCount,
        bytes32 metadataHash, bytes32 provenanceHash,
        uint8 aiScore, string calldata aiSummary,
        bytes32 serialLeaf, bytes32[] calldata merkleProof
    ) external onlyOracle {
        require(!attestations[tokenId].valid, "Already attested");
        bool serialOk = verifySerial(brand, serialLeaf, merkleProof);
        attestations[tokenId] = Attestation(brand, model, reference, yearOfProduction, caseMaterial, conditionGrade,
            ownerCount, longestHoldDays, averageHoldDays, imageCount, serviceCount,
            metadataHash, provenanceHash, aiScore, aiSummary, serialOk, block.timestamp, true);
        attestedIds.push(tokenId);
        emit Attested(tokenId, brand, model, aiScore, serialOk);
    }

    function revoke(uint256 tokenId) external onlyOracle { attestations[tokenId].valid = false; emit Revoked(tokenId); }
    function isValid(uint256 tokenId) external view returns (bool) { return attestations[tokenId].valid; }
    function getAttestedCount() external view returns (uint256) { return attestedIds.length; }
    function updateOracle(address _oracle) external onlyOwner { oracle = _oracle; }
}
```

---

## RevealTracker.sol (Public Chain)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

contract RevealTracker is Ownable {
    struct RevealStatus { uint256 tokenId; address buyer; uint256 purchasedAt; bool revealed; }
    mapping(uint256 => RevealStatus) public reveals;
    event RevealRequested(uint256 indexed tokenId, address buyer);
    event RevealConfirmed(uint256 indexed tokenId, address buyer);

    constructor() Ownable(msg.sender) {}

    function requestReveal(uint256 tokenId, address buyer) external onlyOwner {
        reveals[tokenId] = RevealStatus(tokenId, buyer, block.timestamp, false);
        emit RevealRequested(tokenId, buyer);
    }
    function confirmReveal(uint256 tokenId) external onlyOwner {
        require(reveals[tokenId].buyer != address(0), "No pending"); reveals[tokenId].revealed = true;
        emit RevealConfirmed(tokenId, reveals[tokenId].buyer);
    }
    function isRevealed(uint256 tokenId) external view returns (bool) { return reveals[tokenId].revealed; }
    function getBuyer(uint256 tokenId) external view returns (address) { return reveals[tokenId].buyer; }
}
```

---

## Oracle Agent Code

### merkle.ts
```typescript
import { keccak256, toUtf8Bytes } from "ethers";
import { MerkleTree } from "merkletreejs";

export function buildSerialTree(serials: string[]): MerkleTree {
  const leaves = serials.map((s) => Buffer.from(keccak256(toUtf8Bytes(s)).slice(2), "hex"));
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}
export function getRoot(tree: MerkleTree): string { return tree.getHexRoot(); }
export function getLeaf(serial: string): string { return keccak256(toUtf8Bytes(serial)); }
export function getProof(tree: MerkleTree, serial: string): string[] {
  const leaf = Buffer.from(keccak256(toUtf8Bytes(serial)).slice(2), "hex");
  return tree.getHexProof(leaf);
}
export function verifyLocally(tree: MerkleTree, serial: string): boolean {
  const leaf = Buffer.from(keccak256(toUtf8Bytes(serial)).slice(2), "hex");
  return tree.verify(tree.getProof(leaf), leaf, tree.getRoot());
}
```

### validator/rules.ts
```typescript
export interface RuleResult { name: string; passed: boolean; score: number; weight: number; reason: string; critical: boolean; }
export interface RuleReport { results: RuleResult[]; totalScore: number; criticalFailures: string[]; }

const KNOWN_CALIBERS: Record<string, string[]> = {
  "3235": ["126610LN", "126610LV", "126613LB", "124060"],
  "3285": ["126710BLNR", "126710BLRO", "126720VTNR"],
  "4131": ["126500LN"], "3230": ["124300"],
};
const PRODUCTION_YEARS: Record<string, [number, number]> = {
  "126610LN": [2020, 2026], "126610LV": [2020, 2026],
  "126710BLNR": [2019, 2026], "126710BLRO": [2023, 2026], "124060": [2020, 2026],
};
const ROLEX_MATERIALS = ["Oystersteel","Yellow Gold","White Gold","Everose Gold","Rolesor","Platinum"];

export function validateWatch(watch: any): RuleReport {
  const results: RuleResult[] = [];
  const validCals = Object.entries(KNOWN_CALIBERS).filter(([_,refs]) => refs.includes(watch.reference)).map(([c]) => c);
  const calOk = validCals.length === 0 || validCals.includes(watch.movementCaliber);
  results.push({ name:"caliber_reference_match", passed:calOk, score:calOk?100:0, weight:0.20, reason:calOk?`Caliber ${watch.movementCaliber} valid`:`Caliber mismatch`, critical:true });

  const yr = PRODUCTION_YEARS[watch.reference];
  const yrOk = !yr || (watch.yearOfProduction >= yr[0] && watch.yearOfProduction <= yr[1]);
  results.push({ name:"production_year", passed:yrOk, score:yrOk?100:0, weight:0.15, reason:yrOk?`Year ${watch.yearOfProduction} valid`:`Year out of range`, critical:true });

  const snOk = watch.serialNumber?.length >= 8;
  results.push({ name:"serial_format", passed:snOk, score:snOk?100:0, weight:0.10, reason:snOk?"Serial plausible":"Serial too short", critical:false });

  const age = new Date().getFullYear() - Number(watch.yearOfProduction);
  const svcOk = age < 5 || (watch.serviceCount||0) > 0;
  results.push({ name:"service_history", passed:svcOk, score:svcOk?100:(age>10?30:60), weight:0.15, reason:svcOk?`${watch.serviceCount||0} records`:`${age}yr, no service`, critical:false });

  const condOk = !(age > 15 && watch.conditionGrade === "Excellent");
  results.push({ name:"condition_age", passed:condOk, score:condOk?100:40, weight:0.10, reason:condOk?"Consistent":"Unusual", critical:false });

  const matOk = watch.brand !== "Rolex" || ROLEX_MATERIALS.includes(watch.caseMaterial);
  results.push({ name:"material_valid", passed:matOk, score:matOk?100:0, weight:0.15, reason:matOk?`"${watch.caseMaterial}" valid`:`Not recognized`, critical:true });

  const imgOk = (watch.imageCount||0) >= 2;
  results.push({ name:"image_documentation", passed:imgOk, score:imgOk?100:((watch.imageCount||0)===1?50:20), weight:0.15, reason:imgOk?`${watch.imageCount} photos`:`Only ${watch.imageCount||0}`, critical:false });

  const totalScore = results.reduce((s,r) => s + r.score * r.weight, 0);
  const criticalFailures = results.filter(r => r.critical && !r.passed).map(r => r.name);
  return { results, totalScore, criticalFailures };
}
```

### validator/llm.ts
```typescript
import Anthropic from "@anthropic-ai/sdk";
export interface LLMAnalysis { score: number; findings: string[]; riskFlags: string[]; summary: string; }

export async function analyzeWatch(watch: any): Promise<LLMAnalysis> {
  const client = new Anthropic();
  const prompt = `You are a luxury watch authentication AI oracle. Analyze this listing.

WATCH: ${watch.brand} ${watch.model} Ref. ${watch.reference}
Year: ${watch.yearOfProduction}, Caliber: ${watch.movementCaliber}
Case: ${watch.caseMaterial} ${watch.caseDiameterMM}mm, Dial: ${watch.dialColor}
Bracelet: ${watch.braceletType}, Condition: ${watch.conditionGrade} — ${watch.conditionNotes}
Owners: ${watch.ownerCount}, Photos: ${watch.imageCount||0}, Services: ${watch.serviceCount||0}

Evaluate: 1) Spec consistency 2) Frankenwatch indicators 3) Ownership pattern 4) Red flags

Respond ONLY with JSON: {"score":<0-100>,"findings":["..."],"riskFlags":["..."],"summary":"<public-safe paragraph>"}`;

  const response = await client.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: prompt }] });
  const text = response.content.filter((b:any) => b.type === "text").map((b:any) => b.text).join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
```

### validator/scorer.ts
```typescript
import type { RuleReport } from "./rules.js";
import type { LLMAnalysis } from "./llm.js";
export interface FinalScore { overall: number; ruleScore: number; llmScore: number; passed: boolean; criticalFailures: string[]; summary: string; }

export function calculateScore(ruleReport: RuleReport, llmAnalysis: LLMAnalysis): FinalScore {
  const overall = Math.round(ruleReport.totalScore * 0.6 + llmAnalysis.score * 0.4);
  return { overall, ruleScore: Math.round(ruleReport.totalScore), llmScore: llmAnalysis.score,
    passed: ruleReport.criticalFailures.length === 0 && overall >= 70,
    criticalFailures: ruleReport.criticalFailures, summary: llmAnalysis.summary };
}
```

### serial-registry.json
```json
{"brand":"Rolex","serials":["M126610LN-9A2B3C4D","M126610LN-7E8F9A0B","M126710BLNR-1C2D3E4F","M126710BLNR-5A6B7C8D","M124060-9E0F1A2B","M126613LB-3C4D5E6F","M126710BLRO-7A8B9C0D","M126610LV-1E2F3A4B"]}
```

### index.ts (main oracle loop)

See the full index.ts in the LUXVERIFY_FINAL_SPEC.md or CLAUDE_IMPLEMENTATION.md files. The oracle:
1. Builds Merkle tree from serial-registry.json
2. Publishes root to LuxAttestation (one-time)
3. Polls Privacy Node for WatchMinted events using `queryFilter`
4. For each mint: reads metadata → Merkle verify → rules → Claude LLM → score → publish attestation
5. Polls Public Chain marketplace for purchases → trigger reveal via RevealTracker

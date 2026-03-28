import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC_URL = "https://privacy-node-2.rayls.com";
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

// Minimal ABI for mintWatch + addImage + addService
const ABI = [
  "function mintWatch(string brand, string model, string referenceNumber, uint256 yearOfProduction, string serialNumber, string movementCaliber, string caseMaterial, string dialColor, string braceletType, uint256 caseDiameterMM, bytes32 purchaseReceiptHash, uint256 appraisedValue, string conditionGrade, string conditionNotes) returns (uint256)",
  "function addImage(uint256 tokenId, bytes32 imageHash, string imageUri, string imageType, uint256 capturedAt)",
  "function addService(uint256 tokenId, uint256 date, string center, string work, uint256 cost)",
];

export async function POST(req: NextRequest) {
  if (!DEPLOYER_KEY || DEPLOYER_KEY === "0x") {
    return NextResponse.json({ error: "DEPLOYER_PRIVATE_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);
    const nft = new ethers.Contract(TOKEN_ADDRESS, ABI, wallet);

    // Mint the watch
    const tx = await nft.mintWatch(
      body.brand,
      body.model,
      body.reference,
      body.year,
      body.serial,
      body.caliber,
      body.material,
      body.dialColor,
      body.braceletType,
      body.caseDiameter,
      ethers.ZeroHash,
      body.appraisedValue,
      body.condition,
      body.conditionNotes
    );
    const receipt = await tx.wait();

    // Parse tokenId from logs
    const iface = new ethers.Interface([
      "event WatchMinted(uint256 indexed tokenId, string brand, string model, string referenceNumber, bytes32 metadataHash)",
    ]);
    let tokenId = 0;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data });
        if (parsed?.name === "WatchMinted") {
          tokenId = Number(parsed.args.tokenId);
        }
      } catch {
        // skip non-matching logs
      }
    }

    // Add placeholder images
    const imageTypes = ["movement", "dial", "caseback", "full"];
    for (const imgType of imageTypes) {
      const imgTx = await nft.addImage(
        tokenId,
        ethers.keccak256(ethers.toUtf8Bytes(`${imgType}-photo`)),
        `ipfs://Qm${imgType.charAt(0).toUpperCase() + imgType.slice(1)}`,
        imgType,
        Math.floor(Date.now() / 1000)
      );
      await imgTx.wait();
    }

    // Add a service record if provided
    if (body.serviceCenter) {
      const svcTx = await nft.addService(
        tokenId,
        Math.floor(Date.now() / 1000),
        body.serviceCenter,
        body.serviceWork || "Full service",
        body.serviceCost || 50000
      );
      await svcTx.wait();
    }

    return NextResponse.json({
      success: true,
      tokenId,
      txHash: tx.hash,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

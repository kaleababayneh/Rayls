import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC_URL = "https://testnet-rpc.rayls.com";
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "";
// Server-side buyer wallet (registered public chain key from onboarding)
const BUYER_KEY = process.env.BUYER_PRIVATE_KEY || "";

const ABI = [
  "function buy(uint256 listingId) payable",
  "function getListing(uint256 listingId) view returns (tuple(address token, uint8 assetType, uint256 tokenId, uint256 amount, uint256 price, bool active))",
];

export async function POST(req: NextRequest) {
  if (!BUYER_KEY) {
    return NextResponse.json({ error: "BUYER_PRIVATE_KEY not configured" }, { status: 500 });
  }

  try {
    const { listingId } = await req.json();
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BUYER_KEY, provider);
    const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, ABI, wallet);

    // Get listing price
    const listing = await marketplace.getListing(listingId);
    if (!listing.active) {
      return NextResponse.json({ error: "Listing is no longer active" }, { status: 400 });
    }

    const tx = await marketplace.buy(listingId, { value: listing.price });
    await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      buyer: wallet.address,
      tokenId: Number(listing.tokenId),
      price: ethers.formatEther(listing.price),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

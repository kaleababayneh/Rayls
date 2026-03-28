import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const PUBLIC_RPC = "https://testnet-rpc.rayls.com";
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "";
const MIRROR_NFT_ADDRESS = "0x81536b089Fcf2C1959Bf93A4BD271C58058998BE";
const BUYER_KEY = process.env.BUYER_PRIVATE_KEY || "";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const ERC721_ABI = [
  "function approve(address to, uint256 tokenId)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
];

const MARKETPLACE_ABI = [
  "function list(address token, uint8 assetType, uint256 tokenId, uint256 amount, uint256 price) returns (uint256)",
];

export async function POST(req: NextRequest) {
  if (!BUYER_KEY || !DEPLOYER_KEY) {
    return NextResponse.json({ error: "Keys not configured" }, { status: 500 });
  }

  try {
    const { tokenId, price } = await req.json();
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
    const buyerWallet = new ethers.Wallet(BUYER_KEY, provider);
    const deployerWallet = new ethers.Wallet(DEPLOYER_KEY, provider);

    const mirrorNft = new ethers.Contract(MIRROR_NFT_ADDRESS, ERC721_ABI, buyerWallet);
    const mirrorNftDeployer = new ethers.Contract(MIRROR_NFT_ADDRESS, ERC721_ABI, deployerWallet);

    // Verify buyer owns the token
    const owner = await mirrorNft.ownerOf(tokenId);
    if (owner.toLowerCase() !== buyerWallet.address.toLowerCase()) {
      return NextResponse.json({ error: "You don't own this token" }, { status: 400 });
    }

    // Transfer from buyer to deployer (marketplace owner)
    const transferTx = await mirrorNft.transferFrom(buyerWallet.address, deployerWallet.address, tokenId);
    await transferTx.wait();

    // Deployer approves marketplace
    const approveTx = await mirrorNftDeployer.approve(MARKETPLACE_ADDRESS, tokenId);
    await approveTx.wait();

    // Deployer lists on marketplace (onlyOwner)
    const priceWei = ethers.parseEther(String(price));
    const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, deployerWallet);
    const listTx = await marketplace.list(MIRROR_NFT_ADDRESS, 1, tokenId, 1, priceWei);
    await listTx.wait();

    return NextResponse.json({
      success: true,
      tokenId,
      price,
      txHash: listTx.hash,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

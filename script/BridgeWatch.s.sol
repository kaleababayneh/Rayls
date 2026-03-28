// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LuxWatchNFT} from "../src/LuxWatchNFT.sol";

/// @title BridgeWatch
/// @notice Transfers NFT from deployer to registered address, then teleports to Public Chain.
///
/// Usage:
///   source .env
///   forge script script/BridgeWatch.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
contract BridgeWatch is Script {
    function run() external {
        address nftAddr = vm.envAddress("TOKEN_ADDRESS");
        address transferTo = vm.envAddress("TRANSFER_TO");
        uint256 publicChainId = vm.envUint("PUBLIC_CHAIN_ID");
        uint256 tokenId = vm.envOr("NFT_TRANSFER_TOKEN_ID", uint256(1));
        address registeredAddr = vm.envAddress("MINT_RECIPIENT");

        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        LuxWatchNFT nft = LuxWatchNFT(nftAddr);

        // Step 1: Transfer from deployer to registered address (if deployer still owns it)
        vm.startBroadcast(deployerPk);
        if (nft.ownerOf(tokenId) == vm.addr(deployerPk)) {
            nft.transferFrom(vm.addr(deployerPk), registeredAddr, tokenId);
            console.log("Transferred tokenId %s to registered address", tokenId);
        }
        vm.stopBroadcast();

        // Step 2: Teleport from registered address to public chain
        uint256 registeredPk = vm.envUint("REGISTERED_PRIVATE_KEY");
        vm.startBroadcast(registeredPk);
        nft = LuxWatchNFT(nftAddr);
        bool success = nft.teleportToPublicChain(transferTo, tokenId, publicChainId);
        vm.stopBroadcast();

        require(success, "teleportToPublicChain failed");

        console.log("=== Bridge Initiated ===");
        console.log("  Token ID: ", tokenId);
        console.log("  To:       ", transferTo);
        console.log("  Chain ID: ", publicChainId);
        console.log("  NFT locked on Privacy Node. Relayer will mint on Public Chain.");
    }
}

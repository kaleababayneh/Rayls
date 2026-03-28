// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LuxWatchNFT} from "../src/LuxWatchNFT.sol";

/// @title MintWatch
/// @notice Mints a sample Rolex Submariner with images and service history.
///
/// Usage:
///   source .env
///   forge script script/MintWatch.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
contract MintWatch is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address nftAddr = vm.envAddress("TOKEN_ADDRESS");

        vm.startBroadcast(pk);

        LuxWatchNFT nft = LuxWatchNFT(nftAddr);

        uint256 tokenId = nft.mintWatch(
            "Rolex",
            "Submariner Date",
            "126610LN",
            2023,
            "M126610LN-9A2B3C4D",
            "3235",
            "Oystersteel",
            "Black",
            "Oyster",
            41,
            bytes32(0),
            1350000,
            "Excellent",
            "Minor desk diving marks on clasp, crystal perfect"
        );

        nft.addImage(tokenId, keccak256("movement-photo"), "ipfs://QmMovement", "movement", block.timestamp);
        nft.addImage(tokenId, keccak256("dial-photo"), "ipfs://QmDial", "dial", block.timestamp);
        nft.addImage(tokenId, keccak256("caseback-photo"), "ipfs://QmCaseback", "caseback", block.timestamp);
        nft.addImage(tokenId, keccak256("full-photo"), "ipfs://QmFull", "full", block.timestamp);

        nft.addService(tokenId, 1718409600, "Rolex Service Centre Geneva", "Complete movement service", 80000);

        vm.stopBroadcast();

        console.log("=== Minted ===");
        console.log("  Token ID:", tokenId);
        console.log("  Brand: Rolex Submariner Date Ref. 126610LN");
        console.log("  Serial: M126610LN-9A2B3C4D");
        console.log("  Images: 4, Services: 1");
    }
}

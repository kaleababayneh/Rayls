// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Marketplace} from "../src/Marketplace.sol";
import {IDeploymentProxyRegistryV1} from "rayls-protocol-sdk/interfaces/IDeploymentProxyRegistryV1.sol";

interface IRNTokenGovernanceReader {
    function getPublicAddressByPrivateAddress(address privateAddress) external view returns (address);
}

/// @title ListWatch
/// @notice Lists a bridged watch NFT on the marketplace.
///
/// Usage:
///   source .env
///   forge script script/ListWatch.s.sol:ListWatch --rpc-url $PUBLIC_CHAIN_RPC_URL --broadcast --legacy
contract ListWatch is Script {
    function run() external {
        uint256 tokenId = vm.envOr("NFT_TRANSFER_TOKEN_ID", uint256(1));
        address marketplaceAddr = vm.envAddress("MARKETPLACE_ADDRESS");
        uint256 price = vm.envOr("LISTING_PRICE", uint256(0.5 ether)); // 0.5 USDR

        // Find the mirror contract address
        address registryAddr = vm.envAddress("DEPLOYMENT_PROXY_REGISTRY");
        address tokenAddr = vm.envAddress("TOKEN_ADDRESS");
        string memory privacyRpc = vm.envString("PRIVACY_NODE_RPC_URL");

        // Query privacy node for mirror address
        vm.createSelectFork(privacyRpc);
        IDeploymentProxyRegistryV1 registry = IDeploymentProxyRegistryV1(registryAddr);
        address tokenGovAddr = registry.getContract("RNTokenGovernance");
        address mirrorAddr = IRNTokenGovernanceReader(tokenGovAddr)
            .getPublicAddressByPrivateAddress(tokenAddr);
        require(mirrorAddr != address(0), "Mirror not found");
        console.log("Mirror contract:", mirrorAddr);

        // Switch to public chain
        string memory publicRpc = vm.envString("PUBLIC_CHAIN_RPC_URL");
        vm.createSelectFork(publicRpc);

        // First: transfer from registered address to deployer (marketplace owner)
        uint256 registeredPk = vm.envUint("REGISTERED_PRIVATE_KEY");
        address registeredPublicAddr = vm.envAddress("TRANSFER_TO");
        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployerAddr = vm.addr(deployerPk);

        IERC721 nft = IERC721(mirrorAddr);

        if (nft.ownerOf(tokenId) == registeredPublicAddr) {
            vm.startBroadcast(registeredPk);
            nft.transferFrom(registeredPublicAddr, deployerAddr, tokenId);
            vm.stopBroadcast();
            console.log("Transferred to deployer");
        }

        // Approve marketplace and list
        vm.startBroadcast(deployerPk);
        nft.approve(marketplaceAddr, tokenId);
        uint256 listingId = Marketplace(marketplaceAddr).list(
            mirrorAddr,
            Marketplace.AssetType.ERC721,
            tokenId,
            1,
            price
        );
        vm.stopBroadcast();

        console.log("=== Listed ===");
        console.log("  Listing ID:", listingId);
        console.log("  Token ID:  ", tokenId);
        console.log("  Price:     ", price / 1e18, "USDR");
    }
}

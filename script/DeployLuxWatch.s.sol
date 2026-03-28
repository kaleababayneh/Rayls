// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LuxWatchNFT} from "../src/LuxWatchNFT.sol";
import {IDeploymentProxyRegistryV1} from "rayls-protocol-sdk/interfaces/IDeploymentProxyRegistryV1.sol";

/// @title DeployLuxWatch
/// @notice Deploys LuxWatchNFT to the Privacy Node.
///
/// Usage:
///   source .env
///   forge script script/DeployLuxWatch.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy
contract DeployLuxWatch is Script {
    function run() external {
        address registryAddr = vm.envAddress("DEPLOYMENT_PROXY_REGISTRY");
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        IDeploymentProxyRegistryV1 registry = IDeploymentProxyRegistryV1(registryAddr);

        address endpoint = registry.getContract("Endpoint");
        address rnEndpoint = registry.getContract("RNEndpoint");
        address userGovernance = registry.getContract("RNUserGovernance");

        require(endpoint != address(0), "Endpoint not found");
        require(rnEndpoint != address(0), "RNEndpoint not found");
        require(userGovernance != address(0), "RNUserGovernance not found");

        console.log("=== Infrastructure ===");
        console.log("  Endpoint:        ", endpoint);
        console.log("  RNEndpoint:      ", rnEndpoint);
        console.log("  RNUserGovernance:", userGovernance);

        vm.startBroadcast(deployerKey);

        LuxWatchNFT nft = new LuxWatchNFT(
            "https://luxverify.app/metadata/",
            endpoint,
            rnEndpoint,
            userGovernance
        );

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployed ===");
        console.log("  LuxWatchNFT:", address(nft));
        console.log("");
        console.log("Set TOKEN_ADDRESS=%s in .env", vm.toString(address(nft)));
    }
}

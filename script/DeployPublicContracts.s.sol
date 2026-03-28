// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LuxAttestation} from "../src/LuxAttestation.sol";
import {RevealTracker} from "../src/RevealTracker.sol";

/// @title DeployPublicContracts
/// @notice Deploys LuxAttestation and RevealTracker to the Public Chain.
///
/// Usage:
///   source .env
///   forge script script/DeployPublicContracts.s.sol --rpc-url $PUBLIC_CHAIN_RPC_URL --broadcast --legacy
contract DeployPublicContracts is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address oracleAddr = vm.addr(pk);

        vm.startBroadcast(pk);

        LuxAttestation att = new LuxAttestation(oracleAddr);
        console.log("LuxAttestation:", address(att));

        RevealTracker tracker = new RevealTracker();
        console.log("RevealTracker: ", address(tracker));

        vm.stopBroadcast();

        console.log("");
        console.log("Add to .env:");
        console.log("  ATTESTATION_ADDRESS=%s", vm.toString(address(att)));
        console.log("  REVEAL_TRACKER_ADDRESS=%s", vm.toString(address(tracker)));
    }
}

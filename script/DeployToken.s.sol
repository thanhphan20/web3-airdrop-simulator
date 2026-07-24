// SPDX-License-Identifier: MIT
pragma solidity 0.8.35;

import {Script, console} from "forge-std/Script.sol";
import {TestToken} from "../src/TestToken.sol";

contract DeployToken is Script {
    function run() external returns (TestToken) {
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        TestToken token = new TestToken("Airdrop Test Token", "ATT", 1_000_000e18);
        vm.stopBroadcast();

        console.log("TestToken deployed at:", address(token));
        return token;
    }
}

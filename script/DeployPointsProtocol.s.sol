// SPDX-License-Identifier: MIT
pragma solidity 0.8.35;

import {Script, console} from "forge-std/Script.sol";
import {PointsProtocol} from "../src/PointsProtocol.sol";

contract DeployPointsProtocol is Script {
    function run() external returns (PointsProtocol) {
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        PointsProtocol pointsProtocol = new PointsProtocol();
        vm.stopBroadcast();

        console.log("PointsProtocol deployed at:", address(pointsProtocol));
        return pointsProtocol;
    }
}

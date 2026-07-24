// SPDX-License-Identifier: MIT
pragma solidity 0.8.35;

import {Test} from "forge-std/Test.sol";
import {TestToken} from "../src/TestToken.sol";

contract TestTokenTest is Test {
    TestToken token;
    address deployer = address(this);
    address alice = address(0xA11CE);

    function setUp() public {
        token = new TestToken("Airdrop Test Token", "ATT", 1_000_000e18);
    }

    function test_ConstructorMintsSupplyToDeployer() public view {
        assertEq(token.totalSupply(), 1_000_000e18);
        assertEq(token.balanceOf(deployer), 1_000_000e18);
    }

    function test_TransferMovesBalance() public {
        token.transfer(alice, 100e18);
        assertEq(token.balanceOf(alice), 100e18);
        assertEq(token.balanceOf(deployer), 1_000_000e18 - 100e18);
    }
}

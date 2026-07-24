// SPDX-License-Identifier: MIT
pragma solidity 0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @notice Merkle-tree airdrop claim contract (testnet learning project, no real value).
/// @dev No access control on claim(): the merkle proof itself is what gates eligibility,
/// not caller identity, so anyone may submit a claim transaction on behalf of an
/// eligible `account` (matching the original Uniswap UNI airdrop pattern).
contract MerkleAirdrop {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    bytes32 public immutable merkleRoot;

    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed account, uint256 amount);

    error AlreadyClaimed();
    error InvalidProof();

    constructor(address token_, bytes32 merkleRoot_) {
        token = IERC20(token_);
        merkleRoot = merkleRoot_;
    }

    function claim(address account, uint256 amount, bytes32[] calldata merkleProof) external {
        if (hasClaimed[account]) revert AlreadyClaimed();

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) revert InvalidProof();

        // effects before interaction
        hasClaimed[account] = true;
        emit Claimed(account, amount);

        token.safeTransfer(account, amount);
    }
}

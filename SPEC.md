# Spec: Sepolia Merkle-Tree Airdrop (learning project)

## Purpose and scope

This project exists to learn how a real merkle-tree airdrop claim system works
(the pattern Uniswap's original UNI airdrop used) — not to launch a token or
distribute anything of real value. Explicit scope boundaries:

- **Testnet only** (Sepolia). No mainnet deployment, ever.
- **Fake eligibility data.** The addresses in `merkle/eligibility.json` are
  Anvil's well-known default test addresses, not real recipients.
- **No token sale, no real value, no real users.** This sidesteps the
  regulatory exposure and sybil-farming problems that a real airdrop would
  have to solve — those are explicitly out of scope for this project.

## Architecture

The core idea: the entire eligibility list (who's eligible, for how much)
lives off-chain as static JSON. The contract only ever stores a single
`bytes32 merkleRoot` plus a per-address claimed flag. Nothing else needs to be
on-chain — no relational data, no queryable list, no loops over "all
eligible addresses."

```
merkle/eligibility.json  --generate-merkle-tree.mjs-->  merkle/output/{merkle-root.json, merkle-proofs.json}
                                                                  |
                                                    root -> constructor arg
                                                    proofs -> copied into frontend/src/data/
```

### `MerkleAirdrop.sol`

```solidity
contract MerkleAirdrop {
    IERC20 public immutable token;
    bytes32 public immutable merkleRoot;
    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed account, uint256 amount);
    error AlreadyClaimed();
    error InvalidProof();

    function claim(address account, uint256 amount, bytes32[] calldata merkleProof) external {
        if (hasClaimed[account]) revert AlreadyClaimed();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) revert InvalidProof();
        hasClaimed[account] = true;   // effects before interaction
        emit Claimed(account, amount);
        token.safeTransfer(account, amount);
    }
}
```

Design decisions:

- **`account` is a parameter, not `msg.sender`.** Anyone can submit the claim
  transaction on behalf of an eligible address — matches the real UNI airdrop
  pattern (lets a relayer/gas-sponsor submit it). The proof, not the caller's
  identity, is what gates eligibility.
- **No access control on `claim()`, and that's deliberate.** The merkle proof
  cryptographically proves `(account, amount)` was in the eligibility set, so
  no `onlyOwner`/role check is needed. (An `emergencyWithdraw`-style function,
  if ever added, would be different — it moves funds with no proof attached,
  and would need `onlyOwner`.)
- **Plain `mapping(address => bool)` for claimed-tracking**, not a packed
  bitmap. Simpler to reason about; gas doesn't matter on testnet.
- **`hasClaimed` is the only storage variable.** Everything else in `claim()`
  (the leaf hash, the proof array) is transient computation.
- **O(1) regardless of eligibility-list size.** `claim()` never loops over the
  full set of eligible addresses — the merkle proof lets a single address
  verify membership in a set of any size with a fixed number of hash ops.
- **Double-hashing convention.** OZ's `MerkleProof.verify` expects leaves
  double-hashed — `keccak256(bytes.concat(keccak256(abi.encode(account, amount))))`
  — to prevent second-preimage attacks. This must match exactly between the
  Solidity leaf construction and the JS tree-generation script, or valid
  proofs get rejected. `@openzeppelin/merkle-tree`'s `StandardMerkleTree`
  produces this format automatically.

### Merkle generation (`merkle/generate-merkle-tree.mjs`)

Reads `eligibility.json` (`[{address, amount}]`), builds a
`StandardMerkleTree.of(values, ["address", "uint256"])`, and writes:

- `output/merkle-root.json` — `{ root, tokenTotal, decimals }`
- `output/merkle-proofs.json` — `{ [address]: { amount, proof } }`, copied
  into `frontend/src/data/` for the claim page to look up directly (no
  backend needed).

### Deploy scripts (`script/`)

`DeployToken.s.sol` mints the test token to the deployer. `DeployAirdrop.s.sol`
reads the generated root via `vm.readFile` (permitted through `foundry.toml`'s
`fs_permissions`), deploys `MerkleAirdrop`, and transfers the full `tokenTotal`
to it — funding is easy to forget and claims will revert without it.

### Frontend (`frontend/`)

React + Vite + TanStack Router (file-based routes under `src/routes/`) +
wagmi/viem + shadcn/ui (Radix base) + Tailwind CSS v4.

- `ConnectButton.tsx` — wallet connect/disconnect via wagmi hooks.
- `ClaimCard.tsx` — the state machine: not connected → not eligible (address
  absent from the bundled `merkle-proofs.json`) → eligible (read `hasClaimed`
  on-chain) → claiming → claimed. No routing beyond the single index route,
  no design system beyond shadcn's defaults.

## Testing (`test/MerkleAirdrop.t.sol`)

A fixed tree (generated once via the JS script, pasted in as constants) is
used to cover: valid claim, invalid-proof revert, double-claim revert,
wrong-amount revert, wrong-account-uses-another's-proof revert, and a fuzz
test asserting random proofs never let a claim through. These adversarial
cases matter more than the happy path — a contract with a subtle
leaf/proof-matching bug can still pass a happy-path-only test suite.

## Out of scope

- Mainnet deployment of any kind.
- Real tokenomics, vesting, or cliffs.
- Sybil-resistance / eligibility mechanisms beyond a static list (proof of
  humanity, on-chain activity snapshots, etc.) — not needed since eligibility
  data is fake.
- UI polish or a broader design system beyond shadcn's defaults.
- Multi-chain support, DAO/governance features, backend/database (eligibility
  data is static JSON, not a live system).

## Verification checklist

- `forge build` succeeds with no errors.
- `forge test -vv` — all cases pass, especially invalid-proof and
  double-claim.
- `node merkle/generate-merkle-tree.mjs` produces root/proofs matching the
  eligibility input.
- Local Anvil dry run: deploy, fund, `cast send` a real claim, confirm balance
  change and `hasClaimed` flips to `true`.
- Sepolia: both contracts deployed; claiming through the actual frontend with
  a MetaMask-connected eligible address succeeds once and correctly shows
  "already claimed" on a second attempt.

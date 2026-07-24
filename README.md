# web3-airdrop-simulator

A testnet-only learning project for understanding how merkle-tree airdrop claim
systems actually work (the pattern Uniswap's original UNI airdrop used) — not a
real token launch. No mainnet deployment, no real value, no real users. See
[SPEC.md](SPEC.md) for the full design rationale and [AGENTS.md](AGENTS.md) for
conventions if you're an AI agent (or a person) picking this repo back up.

## What's here

- **Contracts** (`src/`) — `TestToken.sol` (a plain mintable ERC20) and
  `MerkleAirdrop.sol` (the claim contract: verifies a merkle proof, prevents
  double-claiming, transfers the token).
- **Tests** (`test/`) — full coverage including invalid-proof, double-claim,
  wrong-amount, and wrong-account cases, plus a fuzz test.
- **Merkle generation** (`merkle/`) — a Node script that builds the merkle
  tree from a fake eligibility list and outputs the root + per-address proofs.
- **Deploy scripts** (`script/`) — Foundry scripts for Sepolia.
- **Frontend** (`frontend/`) — a minimal claim page: React + Vite + TanStack
  Router + wagmi/viem + shadcn/ui.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `anvil`, `cast`)
- [Bun](https://bun.sh) 1.3+ (package manager and runtime for `merkle/` and `frontend/`)

## Contracts: build, test, local dry run

```shell
forge build
forge test -vv
```

Generate the merkle tree from the fake eligibility list:

```shell
cd merkle
bun install
bun run generate   # writes output/merkle-root.json and output/merkle-proofs.json
```

Local end-to-end dry run on Anvil (no real ETH needed):

```shell
anvil   # in a separate terminal

# from the project root, with anvil running:
forge create src/TestToken.sol:TestToken --rpc-url http://127.0.0.1:8545 \
  --private-key <anvil_default_key> --broadcast \
  --constructor-args "Airdrop Test Token" "ATT" 1000000000000000000000000

forge create src/MerkleAirdrop.sol:MerkleAirdrop --rpc-url http://127.0.0.1:8545 \
  --private-key <anvil_default_key> --broadcast \
  --constructor-args <token_address> <merkle_root>
```

## Deploying to Sepolia

Never commit real secrets — `.env` is gitignored.

```shell
cp .env.example .env
# fill in SEPOLIA_RPC_URL and PRIVATE_KEY (a funded Sepolia testnet key only)

forge script script/DeployToken.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
# note the printed token address, set TOKEN_ADDRESS in .env

forge script script/DeployAirdrop.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
# this also funds the airdrop contract with the full tokenTotal
```

## Frontend

```shell
cd frontend
bun install
cp .env.local.example .env.local
# fill in VITE_TOKEN_ADDRESS and VITE_AIRDROP_ADDRESS from the deploy step above
bun run dev
```

Connect an eligible wallet (see `merkle/eligibility.json`) via MetaMask on
Sepolia to check eligibility and claim.

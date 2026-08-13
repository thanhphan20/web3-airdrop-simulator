# AGENTS.md

Conventions for AI coding agents (and anyone else) working in this repo. See
[README.md](README.md) for setup/usage commands.

## What this is

A Genshin-Impact-style wish simulator with a light web3 layer on top: connect a
wallet from the Paimon menu, but everything else (wishes, banners, inventory,
settings, persistence) runs client-side in the browser. Nothing goes on-chain,
no real value, no mainnet.

## Hard constraints

- **No mainnet, no real value.** The web3 layer is connect-only. Never add an
  on-chain action, a mainnet path, or real funds.
- **Never commit or print real secrets.** `.env` (gitignored) holds the legacy
  stack's Sepolia key material. Never ask a user to paste a private key into
  chat.
- **Don't extend the legacy Solidity stack** (`src/`, `test/`, `script/`,
  `merkle/`, `bot/`). It's a leftover experiment from an earlier design, still
  present but not wired into the app.
- **Commits use a Conventional Commits prefix** (`feat:`, `fix:`, `chore:`,
  `docs:`, `ci:`, etc.) and **no `Co-Authored-By` AI trailer** — standing
  preferences for this repo.

## Repo layout

| Path | What |
|---|---|
| `frontend/` | The app: SvelteKit port of the wish simulator (Bun, SvelteKit, viem) |
| `lib/Genshin-Impact-Wish-Simulator/` | Vendored upstream source, gitignored reference copy |
| `src/`, `test/`, `script/`, `merkle/`, `bot/` | Legacy experiment from an earlier design — read-only, don't extend |
| `lib/forge-std`, `lib/openzeppelin-contracts` | Git submodules for the legacy stack — see `.gitmodules` |

## Build / test loop

```shell
cd frontend && bun run check   # svelte-check
cd frontend && bun run build   # vite build
```

`bun run dev` runs the dev server. Package manager is **Bun, not npm** — if you
add a dependency, use `bun add`; don't reintroduce `package-lock.json`.

## Known gotchas

- **`frontend/` has its own nested `.git/`** (the upstream repo) while its files
  are tracked by this repo. Don't commit inside `frontend/` expecting the parent
  to see it — commit from the repo root.
- **Wallet connect is intentional but shallow** (`frontend/src/lib/web3/wallet.js`):
  injected wallet via `window.ethereum`, or a fixed simulated address. No env
  vars, no network calls. Keep it that way unless told otherwise.
- **CI is stale** (`.github/workflows/ci.yml`): it still runs Foundry and
  merkle jobs against the legacy stack, and the frontend job predates the
  SvelteKit port. Fix it when you touch CI; don't trust its pass/fail as
  meaningful for the app.

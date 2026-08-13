# Genshin-Impact-Style Wish Simulator

A Genshin-Impact-style wish (gacha) simulator with a light web3 layer on top:
connect a wallet from the Paimon menu and your address is available to the app,
but every wish, banner, pity counter, and inventory item lives in your browser.
Nothing goes on-chain, no real money, no mainnet.

The gacha core is a port of the
[Genshin-Impact-Wish-Simulator](https://github.com/AguzzTN54/Genshin-Impact-Wish-Simulator),
rewritten in SvelteKit. It ships as a landscape-optimized PWA.

## Get started

```shell
cd frontend
bun install
bun run dev
```

Open the printed URL in landscape orientation. `bun run build` produces a
production build (PWA, `fullscreen` display mode), `bun run preview` serves it,
`bun run check` runs `svelte-check`. The package manager is [Bun](https://bun.sh).

## What it does

- **Wish pulls** with the real Genshin pity and probability rules, applied per
  banner (character event, weapon event, beginner, standard).
- **Banners and inventory** with full detail pages, plus a shop and settings
  for language, currency, and roll amounts.
- **Custom banners** and the ability to share them.
- **Local persistence** via localStorage and IndexedDB: no account, no backend.
- **PWA** installable, fullscreen, landscape-first.

## The web3 layer

Open the Paimon menu, then **Wallet**. Two ways to connect:

- **Connect Wallet** uses `window.ethereum` (MetaMask or any injected wallet)
  through `viem`. It requests your address only: no signature, no transaction.
- **Simulate Connect Wallet** signs in with a fixed demo address, so you can
  try the flow without a wallet extension.

Connect-only by design: the address feeds a reactive store
(`frontend/src/lib/web3/wallet.js`) that the rest of the app can read. There are
no env variables or network dependencies involved.

## Repo layout

| Path | What |
|---|---|
| `frontend/` | The app: SvelteKit port of the wish simulator (Bun, SvelteKit, viem) |
| `lib/Genshin-Impact-Wish-Simulator/` | Vendored upstream source, kept as a reference copy (gitignored) |
| `src/`, `test/`, `script/`, `merkle/`, `bot/` | Legacy experiment from an earlier design: Solidity contracts, Foundry tests, merkle-tree scripts, and a farming bot. Still present in the repo but no longer wired into the app |

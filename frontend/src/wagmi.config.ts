import { http, createConfig } from "wagmi";
import { sepolia, foundry } from "wagmi/chains";
import { injected, mock } from "wagmi/connectors";

// One of the fixed eligible test addresses (see merkle-proofs.json) — lets anyone try
// the real eligibility flow without a browser wallet extension. The mock connector
// can't sign transactions, so ClaimCard doesn't offer "Claim" while simulate-connected
// — it points to the real "Connect Wallet" path for that instead.
export const SIMULATED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;

// `foundry` (chain id 31337) is the local Anvil node the points-farming demo runs
// against — kept alongside `sepolia` (the real claim flow's chain), not replacing it.
export const config = createConfig({
  chains: [sepolia, foundry],
  connectors: [injected(), mock({ accounts: [SIMULATED_ADDRESS] })],
  transports: {
    [sepolia.id]: http(),
    [foundry.id]: http("http://127.0.0.1:8545"),
  },
});

export const AIRDROP_ADDRESS = import.meta.env.VITE_AIRDROP_ADDRESS as `0x${string}`;
export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS as `0x${string}`;
export const POINTS_ADDRESS = import.meta.env.VITE_POINTS_ADDRESS as `0x${string}`;

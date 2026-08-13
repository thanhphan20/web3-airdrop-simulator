import { writable } from 'svelte/store';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { sepolia, foundry } from 'viem/chains';

// One of the fixed eligible test addresses (see merkle-proofs.json) — lets anyone try
// the real eligibility flow without a browser wallet extension. The simulated path
// can't sign transactions, so ClaimCard doesn't offer "Claim" while simulate-connected
// — it points to the real "Connect Wallet" path for that instead.
export const SIMULATED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

export const AIRDROP_ADDRESS = import.meta.env.VITE_AIRDROP_ADDRESS;
export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
export const POINTS_ADDRESS = import.meta.env.VITE_POINTS_ADDRESS;

// Public clients — the claim flow reads on Sepolia, the points demo reads on the
// local Anvil node (chain id 31337).
export const sepoliaClient = createPublicClient({ chain: sepolia, transport: http() });
export const foundryClient = createPublicClient({ chain: foundry, transport: http('http://127.0.0.1:8545') });

// Reactive account state — Svelte counterpart of wagmi's useAccount.
// Shape: { address, isConnected, connector: { type: 'injected' | 'mock' } } | null
export const account = writable(null);

let walletClient = null;

export function getWalletClient() {
	return walletClient;
}

export async function connectInjected() {
	if (typeof window === 'undefined' || !window.ethereum) {
		const err = new Error('provider not found');
		throw err;
	}
	walletClient = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) });
	const [address] = await walletClient.requestAddresses();
	account.set({ address, isConnected: true, connector: { type: 'injected' } });
	return address;
}

export function connectSimulated() {
	walletClient = null;
	account.set({ address: SIMULATED_ADDRESS, isConnected: true, connector: { type: 'mock' } });
	return SIMULATED_ADDRESS;
}

export function disconnect() {
	walletClient = null;
	account.set(null);
}

export async function switchToFoundry() {
	if (!walletClient) return;
	await walletClient.switchChain({ id: foundry.id });
}

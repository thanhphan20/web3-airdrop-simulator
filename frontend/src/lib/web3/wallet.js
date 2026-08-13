import { writable } from 'svelte/store';
import { createWalletClient, custom } from 'viem';

// Fixed demo address — lets anyone try the connect flow without a wallet extension.
export const SIMULATED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Reactive account state. Shape: { address, isConnected, connector: { type: 'injected' | 'mock' } } | null
export const account = writable(null);

let walletClient = null;

export async function connectInjected() {
	if (typeof window === 'undefined' || !window.ethereum) {
		throw new Error('provider not found');
	}
	walletClient = createWalletClient({ transport: custom(window.ethereum) });
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

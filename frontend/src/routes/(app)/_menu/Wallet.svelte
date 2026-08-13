<script>
	import { account, connectInjected, connectSimulated, disconnect } from '$lib/web3/wallet';
	import ButtonModal from '$lib/components/ButtonModal.svelte';

	let error = '';
	let connecting = false;

	const truncate = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

	const handleConnect = async () => {
		error = '';
		connecting = true;
		try {
			await connectInjected();
		} catch (e) {
			error =
				e?.message === 'provider not found'
					? 'No wallet extension detected. Install MetaMask or use Simulate Connect below.'
					: e?.message || 'Failed to connect';
		} finally {
			connecting = false;
		}
	};
</script>

<div class="content-container">
	<h2>Wallet</h2>
	<div class="wallet-card">
		{#if $account?.isConnected}
			<p class="status connected">
				<i class="gi-circle-o" />
				<span>Connected</span>
			</p>
			<code class="address">{$account.address}</code>
			{#if $account.connector?.type === 'mock'}
				<small class="hint">Simulated account — a real injected wallet sign in for on-chain actions.</small>
			{/if}
			<ButtonModal light on:click={disconnect}>Disconnect</ButtonModal>
		{:else}
			<p>Connect a wallet to bring web3 into this simulator — no transactions, just your address.</p>
			<ButtonModal disabled={connecting} on:click={handleConnect}>
				{connecting ? 'Connecting…' : 'Connect Wallet'}
			</ButtonModal>
			<ButtonModal light on:click={connectSimulated}>Simulate Connect Wallet</ButtonModal>
			{#if error}
				<small class="error">{error}</small>
			{/if}
		{/if}
	</div>
</div>

<style>
	.wallet-card {
		background-color: #fff;
		padding: 1rem 2rem 1.5rem;
		border-radius: 0.3rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: flex-start;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: #4a5265;
		font-weight: 600;
		margin: 0;
	}
	.status i {
		color: #4caf50;
	}
	.address {
		font-family: 'Courier New', monospace;
		background-color: #f3efe6;
		padding: 0.4rem 0.75rem;
		border-radius: 0.3rem;
		color: #4a5265;
		word-break: break-all;
	}
	.hint,
	.error {
		font-size: 0.85rem;
	}
	.hint {
		color: #8a8577;
	}
	.error {
		color: #c0392b;
	}
</style>
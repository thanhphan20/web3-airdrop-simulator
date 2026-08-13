<script>
	import { account, disconnect } from './wallet';

	$: address = $account?.address;
	$: isConnected = Boolean($account?.isConnected && address);
	$: short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
</script>

{#if isConnected}
	<div class="conn-row">
		<div class="conn-id">
			<div class="conn-avatar" />
			<span class="conn-addr">{short}</span>
		</div>
		<button class="conn-disconnect" on:click={disconnect}>Disconnect</button>
	</div>
{/if}

<style>
	.conn-row {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		background: oklch(1 0 0 / 0.66);
		border: 1px solid oklch(1 0 0 / 0.85);
		border-radius: 12px;
		padding: 10px 12px;
		backdrop-filter: blur(8px);
		box-shadow: 0 4px 18px oklch(0.62 0.06 80 / 0.16);
	}
	.conn-id {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}
	.conn-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: linear-gradient(135deg, oklch(0.78 0.13 250), oklch(0.76 0.15 300));
		flex-shrink: 0;
		box-shadow: 0 0 12px oklch(0.76 0.14 285 / 0.5);
	}
	.conn-addr {
		font-family: 'Geist Mono Variable', monospace;
		font-size: 13px;
		color: oklch(0.32 0.02 80);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.conn-disconnect {
		flex-shrink: 0;
		height: 30px;
		padding: 0 13px;
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: oklch(0.5 0.09 66);
		background: oklch(1 0 0 / 0.7);
		border: 1px solid oklch(0.75 0.09 78 / 0.5);
		border-radius: 8px;
		cursor: pointer;
	}
</style>

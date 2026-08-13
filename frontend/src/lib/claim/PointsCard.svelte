<script>
	import { onDestroy } from 'svelte';
	import { foundryClient, POINTS_ADDRESS, account, connectInjected, switchToFoundry, getWalletClient } from './wallet';
	import { TASK_IDS } from './points';
	import { isProviderNotFoundError, shortErrorMessage } from './errors';
	import pointsProtocolAbiJson from '$lib/abi/PointsProtocol.json';

	const pointsProtocolAbi = pointsProtocolAbiJson;

	let isConnecting = false;
	let connectError = null;
	let pendingAction = null; // 'checkIn' | { taskId } | null
	let points = undefined;
	let lastCheckIn = undefined;
	let checkInInterval = undefined;
	let completedTasks = [];
	let hash = undefined;
	let isWritePending = false;
	let writeError = null;
	let isConfirming = false;
	let isConfirmed = false;

	let now = Math.floor(Date.now() / 1000);
	const tick = setInterval(() => (now = Math.floor(Date.now() / 1000)), 1000);
	onDestroy(() => clearInterval(tick));

	$: address = $account?.address;
	$: chainId = $account?.chainId;
	$: isConnected = Boolean($account?.isConnected && address);
	$: onFoundry = chainId === 31337;
	$: enabled = Boolean(address && onFoundry);

	async function loadAll() {
		if (!enabled) return;
		try {
			points = await foundryClient.readContract({
				address: POINTS_ADDRESS,
				abi: pointsProtocolAbi,
				functionName: 'points',
				args: [address]
			});
			lastCheckIn = await foundryClient.readContract({
				address: POINTS_ADDRESS,
				abi: pointsProtocolAbi,
				functionName: 'lastCheckIn',
				args: [address]
			});
			checkInInterval = await foundryClient.readContract({
				address: POINTS_ADDRESS,
				abi: pointsProtocolAbi,
				functionName: 'CHECK_IN_INTERVAL'
			});
			const results = await foundryClient.multicall({
				contracts: TASK_IDS.map((taskId) => ({
					address: POINTS_ADDRESS,
					abi: pointsProtocolAbi,
					functionName: 'hasCompletedTask',
					args: [address, taskId]
				}))
			});
			completedTasks = results;
		} catch (e) {
			console.error('load points failed:', e);
		}
	}

	$: if (enabled) loadAll();
	$: if (isConfirmed) {
		pendingAction = null;
		hash = undefined;
		isConfirmed = false;
		loadAll();
	}

	$: nextCheckInTime = lastCheckIn && checkInInterval ? Number(lastCheckIn) + Number(checkInInterval) : 0;
	$: onCooldown = nextCheckInTime > now;
	$: isBusy = isWritePending || isConfirming;
	$: errorMessage = writeError ? shortErrorMessage(writeError) : null;
	$: connectErrorMessage = connectError
		? isProviderNotFoundError(connectError)
			? 'No wallet extension detected. Install one (e.g. MetaMask) to use this demo.'
			: shortErrorMessage(connectError)
		: null;

	const handleConnect = async () => {
		isConnecting = true;
		connectError = null;
		try {
			await connectInjected();
		} catch (e) {
			connectError = e;
		} finally {
			isConnecting = false;
		}
	};

	const handleSwitchChain = async () => {
		try {
			await switchToFoundry();
		} catch (e) {
			console.error('switch chain failed:', e);
		}
	};

	const runWrite = (fn) => {
		const wallet = getWalletClient();
		if (!wallet) return;
		writeError = null;
		isWritePending = true;
		wallet
			.writeContract(fn)
			.then((txHash) => {
				hash = txHash;
				isWritePending = false;
				isConfirming = true;
				return foundryClient.waitForTransactionReceipt({ hash: txHash });
			})
			.then(() => {
				isConfirming = false;
				isConfirmed = true;
			})
			.catch((e) => {
				isWritePending = false;
				isConfirming = false;
				writeError = e;
			});
	};

	const handleCheckIn = () => {
		pendingAction = 'checkIn';
		runWrite({ address: POINTS_ADDRESS, abi: pointsProtocolAbi, functionName: 'checkIn' });
	};

	const handleCompleteTask = (taskId) => {
		pendingAction = { taskId };
		runWrite({ address: POINTS_ADDRESS, abi: pointsProtocolAbi, functionName: 'completeTask', args: [taskId] });
	};
</script>

<div class="card">
	<div class="card-head">
		<div class="card-title">Points farming demo</div>
		{#if isConnected}
			<div class="card-desc">Check in and complete tasks to accumulate points, same mechanic the bot script in <code>bot/</code> automates across several test wallets. Points convert to an airdrop amount via a diminishing-returns curve (roughly √points), so farming more doesn't proportionally win more.</div>
		{/if}
	</div>

	{#if !isConnected}
		<div class="card-body" style="display: flex; flex-direction: column; gap: 12px;">
			<div class="card-desc">Connect a wallet on your local Anvil node to farm points manually.</div>
			<button class="btn" on:click={handleConnect} disabled={isConnecting}>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</button>
			{#if connectErrorMessage}<p class="err">{connectErrorMessage}</p>{/if}
		</div>
	{:else if !onFoundry}
		<div class="card-body">
			<div class="card-desc">This demo runs against a local Anvil node (chain id 31337), not your currently connected network.</div>
			<button class="btn" on:click={handleSwitchChain}>Switch to Anvil Local</button>
		</div>
	{:else}
		<div class="card-body" style="display: flex; flex-direction: column; gap: 16px;">
			<div class="points">{points === undefined ? '…' : String(points)} points</div>

			<div style="display: flex; flex-direction: column; gap: 4px;">
				<button class="btn" on:click={handleCheckIn} disabled={isBusy || onCooldown}>
					{pendingAction === 'checkIn' && isBusy ? 'Checking in…' : 'Check In'}
				</button>
				{#if onCooldown}
					<span class="hint">Next check-in available at {new Date(nextCheckInTime * 1000).toLocaleString()}.</span>
				{/if}
			</div>

			<div style="display: flex; flex-direction: column; gap: 8px;">
				<span class="tasks-label">Tasks</span>
				<div style="display: flex; flex-wrap: wrap; gap: 8px;">
					{#each TASK_IDS as taskId, i}
						{@const done = Boolean(completedTasks?.[i]?.result)}
						{@const isThisPending = typeof pendingAction === 'object' && pendingAction?.taskId === taskId && isBusy}
						<button class="btn btn-small {done ? 'btn-muted' : 'btn-outline'}" disabled={done || isBusy} on:click={() => handleCompleteTask(taskId)}>
							{done ? `Task ${taskId} ✓` : isThisPending ? 'Completing…' : `Complete Task ${taskId}`}
						</button>
					{/each}
				</div>
			</div>

			{#if errorMessage}<p class="err">{errorMessage}</p>{/if}
		</div>
	{/if}
</div>

<style>
	.card {
		width: 100%;
		max-width: 560px;
		background: oklch(1 0 0 / 0.72);
		border: 1px solid oklch(1 0 0 / 0.9);
		border-radius: 16px;
		backdrop-filter: blur(16px);
		box-shadow: 0 30px 70px oklch(0.55 0.07 78 / 0.22);
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.card-head {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.card-title {
		font-family: 'Cinzel', serif;
		font-size: 17px;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: oklch(0.32 0.03 80);
	}
	.card-desc {
		font-size: 13px;
		color: oklch(0.5 0.02 82);
		line-height: 1.55;
	}
	.card-body {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.btn {
		height: 42px;
		padding: 0 20px;
		width: 100%;
		font: inherit;
		font-size: 14px;
		font-weight: 600;
		color: oklch(0.3 0.05 62);
		background: linear-gradient(100deg, oklch(0.8 0.11 80), oklch(0.9 0.09 88) 45%, oklch(0.99 0.03 96) 50%, oklch(0.9 0.09 88) 55%, oklch(0.8 0.11 80));
		background-size: 220% 100%;
		animation: om-sweep 3.4s linear infinite;
		border: 1px solid oklch(0.74 0.1 80);
		border-radius: 12px;
		cursor: pointer;
		box-shadow: 0 8px 26px oklch(0.78 0.11 82 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.6);
	}
	.btn:disabled {
		animation: none;
		opacity: 0.55;
		cursor: default;
		box-shadow: none;
	}
	.btn-small {
		width: auto;
		height: 34px;
		padding: 0 14px;
		font-size: 12px;
	}
	.btn-outline {
		background: oklch(1 0 0 / 0.6);
		border: 1px solid oklch(0.72 0.06 80 / 0.4);
		color: oklch(0.5 0.09 66);
		animation: none;
		box-shadow: none;
	}
	.btn-muted {
		background: oklch(0.95 0.02 88 / 0.8);
		border: 1px solid oklch(0.72 0.06 80 / 0.3);
		color: oklch(0.55 0.02 82);
		animation: none;
		box-shadow: none;
	}
	.points {
		font-family: 'Cinzel', serif;
		font-size: 32px;
		font-weight: 700;
		color: oklch(0.3 0.03 72);
	}
	.tasks-label {
		font-size: 14px;
		font-weight: 600;
		color: oklch(0.4 0.02 80);
	}
	.hint {
		font-size: 12px;
		color: oklch(0.56 0.02 82);
	}
	.err {
		margin: 0;
		font-size: 12px;
		color: oklch(0.55 0.12 38);
	}
</style>

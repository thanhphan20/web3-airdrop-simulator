<script>
	import { onMount, onDestroy } from 'svelte';
	import { formatUnits } from 'viem';
	import merkleAirdropAbi from '$lib/abi/MerkleAirdrop.json';
	import proofs from '$lib/data/merkle-proofs.json';
	import { sepoliaClient, AIRDROP_ADDRESS, account, connectInjected, connectSimulated, disconnect, getWalletClient } from './wallet';
	import { TIERS, cornerBracketStyle, rollTier } from './tiers';
	import { drawTier } from './gacha';
	import { isInsufficientFundsError, isProviderNotFoundError, shortErrorMessage } from './errors';
	import WishReveal from './WishReveal.svelte';

	const proofsByAddress = proofs;

	const CLAIMS_KEY = 'mrkl_gacha_claims_v1';

	function readClaimTier(address) {
		try {
			const map = JSON.parse(localStorage.getItem(CLAIMS_KEY) || '{}');
			return map[address.toLowerCase()];
		} catch {
			return undefined;
		}
	}
	function saveClaimTier(address, tierIdx) {
		try {
			const map = JSON.parse(localStorage.getItem(CLAIMS_KEY) || '{}');
			map[address.toLowerCase()] = tierIdx;
			localStorage.setItem(CLAIMS_KEY, JSON.stringify(map));
		} catch {
			/* storage unavailable */
		}
	}

	let isConnecting = false;
	let connectError = null;

	// Real claim tx state
	let writeHash = undefined;
	let isWritePending = false;
	let writeError = null;
	let isWriteConfirming = false;
	let isWriteConfirmed = false;

	// Simulated path state
	let simPending = false;
	let simConfirmed = false;
	let simTimer = null;

	$: address = $account?.address;
	$: isSimulatedWallet = $account?.connector?.type === 'mock';

	let entry = undefined;
	$: entry = address ? Object.entries(proofsByAddress).find(([addr]) => addr.toLowerCase() === address.toLowerCase())?.[1] : undefined;

	let hasClaimed = undefined;

	const loadHasClaimed = async () => {
		if (!address || !entry) {
			hasClaimed = undefined;
			return;
		}
		try {
			const data = await sepoliaClient.readContract({
				address: AIRDROP_ADDRESS,
				abi: merkleAirdropAbi,
				functionName: 'hasClaimed',
				args: [address]
			});
			hasClaimed = data;
		} catch (e) {
			console.error('hasClaimed read failed:', e);
		}
	};

	$: if (address && entry) loadHasClaimed();

	let justClaimed = false;
	let revealFinished = false;
	let tierIdx = null;
	let showReveal = false;

	$: storedTierIdx = address ? readClaimTier(address) : undefined;
	$: hasClaimedAny = Boolean(hasClaimed) || storedTierIdx !== undefined;

	// Switching accounts must not carry over the previous account's claim state.
	let prevAddress = undefined;
	$: if (prevAddress !== address) {
		prevAddress = address;
		justClaimed = false;
		revealFinished = false;
		tierIdx = null;
		showReveal = false;
		writeHash = undefined;
		isWritePending = false;
		writeError = null;
		isWriteConfirming = false;
		isWriteConfirmed = false;
		if (simTimer) clearTimeout(simTimer);
		simPending = false;
		simConfirmed = false;
	}

	onDestroy(() => {
		if (simTimer) clearTimeout(simTimer);
	});

	// Fires the cosmetic pity draw exactly once, right when our own claim confirms.
	$: if (isConfirmed && justClaimed && tierIdx === null) {
		const drawn = drawTier();
		tierIdx = drawn.tierIdx;
		if (address) saveClaimTier(address, drawn.tierIdx);
	}

	// Returning visitor: resolve a stable cosmetic without replaying the reveal.
	$: if (address && hasClaimedAny && !justClaimed && tierIdx === null) {
		const stored = readClaimTier(address);
		const idx = stored ?? rollTier();
		tierIdx = idx;
		if (stored === undefined) saveClaimTier(address, idx);
	}

	$: isPending = isSimulatedWallet ? simPending : isWritePending;
	$: isConfirming = isSimulatedWallet ? false : isWriteConfirming;
	$: isConfirmed = isSimulatedWallet ? simConfirmed : isWriteConfirmed;
	$: txHash = isSimulatedWallet ? undefined : writeHash;
	$: error = isSimulatedWallet ? null : writeError;

	$: step = !address
		? 'disconnected'
		: !entry
			? 'not_eligible'
			: isPending || isConfirming
				? 'claiming'
				: isConfirmed && justClaimed && !revealFinished
					? 'reveal'
					: hasClaimedAny || isConfirmed
						? justClaimed && revealFinished
							? 'claimed'
							: 'already_claimed'
						: 'eligible';

	$: activeTierIdx = tierIdx ?? 0;
	$: t = TIERS[activeTierIdx] ?? TIERS[0];
	$: isAlready = step === 'already_claimed';
	$: amountTokens = entry ? formatUnits(BigInt(entry.amount), 18) : '0';

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

	const handleSimulateConnect = async () => {
		isConnecting = true;
		connectError = null;
		try {
			await connectSimulated();
		} catch (e) {
			connectError = e;
		} finally {
			isConnecting = false;
		}
	};

	const handleDisconnect = () => disconnect();

	const handleClaim = () => {
		if (!address || !entry) return;
		justClaimed = true;
		revealFinished = false;
		tierIdx = null;
		showReveal = false;

		if (isSimulatedWallet) {
			if (simTimer) clearTimeout(simTimer);
			simConfirmed = false;
			simPending = true;
			simTimer = setTimeout(() => {
				simPending = false;
				simConfirmed = true;
			}, 1800);
			return;
		}

		const wallet = getWalletClient();
		if (!wallet) return;
		isWritePending = true;
		wallet
			.writeContract({
				address: AIRDROP_ADDRESS,
				abi: merkleAirdropAbi,
				functionName: 'claim',
				args: [address, BigInt(entry.amount), entry.proof]
			})
			.then((hash) => {
				writeHash = hash;
				isWritePending = false;
				isWriteConfirming = true;
				return sepoliaClient.waitForTransactionReceipt({ hash });
			})
			.then(() => {
				isWriteConfirming = false;
				isWriteConfirmed = true;
			})
			.catch((e) => {
				isWritePending = false;
				isWriteConfirming = false;
				writeError = e;
			});
	};

	const finishReveal = () => {
		revealFinished = true;
		showReveal = false;
	};

	$: connectErrorMessage = connectError
		? isProviderNotFoundError(connectError)
			? 'No wallet extension detected. Install one, or use Simulate Connect Wallet below.'
			: shortErrorMessage(connectError)
		: null;
	$: claimErrorMessage = error
		? isInsufficientFundsError(error)
			? "Your wallet doesn't have enough Sepolia ETH to cover gas."
			: shortErrorMessage(error)
		: null;
	$: replayHint = isAlready ? 'Pull already played' : 'Reward saved';

	const gold = 'oklch(0.56 0.11 70)';
	const green = 'oklch(0.5 0.12 150)';
	const red = 'oklch(0.55 0.12 38)';
	const mut = 'oklch(0.5 0.02 82)';

	const pillMap = {
		disconnected: ['Not connected', mut, 'oklch(0.97 0.02 88 / 0.85)', 'oklch(0.7 0.06 80 / 0.28)'],
		not_eligible: ['Ineligible', red, 'oklch(0.96 0.03 38 / 0.85)', 'oklch(0.7 0.1 38 / 0.35)'],
		eligible: ['Eligible', gold, 'oklch(0.96 0.05 86 / 0.9)', 'oklch(0.75 0.1 80 / 0.45)'],
		claiming: ['Confirming', gold, 'oklch(0.96 0.05 86 / 0.9)', 'oklch(0.75 0.1 80 / 0.45)'],
		reveal: ['Confirming', gold, 'oklch(0.96 0.05 86 / 0.9)', 'oklch(0.75 0.1 80 / 0.45)'],
		claimed: ['Claimed', green, 'oklch(0.95 0.05 150 / 0.9)', 'oklch(0.7 0.12 150 / 0.4)'],
		already_claimed: ['Claimed', green, 'oklch(0.95 0.05 150 / 0.9)', 'oklch(0.7 0.12 150 / 0.4)']
	};

	$: [statusLabel, pc, pbg, pbd] = pillMap[step];
	$: trophyBg = isAlready ? 'oklch(0.985 0.012 88 / 0.8)' : `color-mix(in oklch, ${t.accentLight} 12%, oklch(1 0 0 / 0.82))`;
	$: trophyBorder = isAlready ? 'oklch(0.72 0.06 80 / 0.28)' : `color-mix(in oklch, ${t.accentLight} 45%, transparent)`;
	$: trophyShadow = isAlready ? 'none' : `0 0 30px color-mix(in oklch, ${t.glowLight} 28%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.7)`;
	$: sigilShadow = isAlready ? 'none' : `0 4px 18px color-mix(in oklch, ${t.glowLight} 55%, transparent)`;
</script>

<div class="claim-wrap" style="width: 100%; display: flex; flex-direction: column; gap: 22px;">
	<div class="claim-card">
		<span style={cornerBracketStyle('tl')} />
		<span style={cornerBracketStyle('tr')} />
		<span style={cornerBracketStyle('bl')} />
		<span style={cornerBracketStyle('br')} />
		<div class="claim-inner">
			<div class="claim-head">
				<span class="claim-label">Airdrop status</span>
				<span class="claim-pill" style="color: {pc}; background: {pbg}; border: 1px solid {pbd};">{statusLabel}</span>
			</div>

			{#if step === 'disconnected'}
				<div style="display: flex; flex-direction: column; gap: 14px;">
					<p class="claim-text">Connect your wallet to check eligibility.</p>
					<button class="cta" on:click={handleConnect} disabled={isConnecting}>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</button>
					{#if connectErrorMessage}<p class="claim-error">{connectErrorMessage}</p>{/if}
					<button class="simulate-btn" on:click={handleSimulateConnect}>Simulate Connect Wallet</button>
					<p class="claim-hint">No wallet extension? The simulator connects as a fixed test address from the eligibility list.</p>
				</div>
			{:else if step === 'not_eligible'}
				<div class="claim-noteligible">
					<span style="font-size: 15px; line-height: 1.3; color: oklch(0.6 0.11 40);">○</span>
					<div style="display: flex; flex-direction: column; gap: 4px;">
						<span style="font-size: 14px; font-weight: 600; color: oklch(0.34 0.03 40);">Not eligible for this airdrop</span>
						<span style="font-size: 13px; color: oklch(0.5 0.03 40); line-height: 1.5;">
							This address isn't in the eligibility set. Only the fixed list committed to the merkle root can claim.
						</span>
					</div>
				</div>
			{:else if step === 'eligible' && entry}
				<div style="display: flex; flex-direction: column; gap: 16px;">
					<div class="claim-amount-box">
						<span class="claim-amount-label">Eligible amount</span>
						<div style="display: flex; align-items: baseline; gap: 9px;">
							<span class="claim-amount">{amountTokens}</span>
							<span style="font-size: 15px; font-weight: 600; color: oklch(0.56 0.1 72);">MRKL</span>
						</div>
						<span class="claim-wei">{entry.amount} wei</span>
					</div>
					<button class="cta" on:click={handleClaim}>Claim {amountTokens} MRKL</button>
					<p class="claim-hint">
						{isSimulatedWallet ? 'Simulated · no real transaction is sent' : 'Verified by merkle proof · no gas on testnet'}
					</p>
					{#if claimErrorMessage}<p class="claim-error">{claimErrorMessage}</p>{/if}
				</div>
			{:else if step === 'claiming'}
				<div style="display: flex; flex-direction: column; gap: 16px;">
					<div class="claim-confirming">
						<span class="claim-spinner" />
						<div style="display: flex; flex-direction: column; gap: 2px;">
							<span style="font-size: 14px; font-weight: 600; color: oklch(0.34 0.02 80);">
								{isSimulatedWallet ? 'Simulating claim…' : 'Submitting claim…'}
							</span>
							<span style="font-size: 13px; color: oklch(0.5 0.02 82);">
								{isSimulatedWallet ? 'No real transaction is sent.' : 'Waiting for on-chain confirmation.'}
							</span>
						</div>
					</div>
					<button class="cta cta-disabled" disabled>Claiming…</button>
				</div>
			{:else if step === 'claimed' || step === 'already_claimed'}
				<div style="display: flex; flex-direction: column; gap: 16px;">
					<div class="claim-claimed">
						<div style="display: flex; flex-direction: column; gap: 3px;">
							<span class="claim-claimed-label">Claimed</span>
							<div style="display: flex; align-items: baseline; gap: 7px;">
								<span style="font-family: 'Cinzel', serif; font-size: 28px; font-weight: 700; color: oklch(0.3 0.03 160);">{amountTokens}</span>
								<span style="font-size: 14px; font-weight: 600; color: oklch(0.52 0.1 150);">MRKL</span>
							</div>
						</div>
						<span style="font-size: 22px; color: oklch(0.6 0.15 150); text-shadow: 0 0 14px oklch(0.7 0.16 150 / 0.5);">✓</span>
					</div>

					<div class="claim-trophy" style="background: {trophyBg}; border: 1px solid {trophyBorder}; box-shadow: {trophyShadow};">
						<div style="display: flex; align-items: center; gap: 13px;">
							<div class="claim-sigil" style="background: linear-gradient(150deg, {t.glowLight}, {t.accentLight}); box-shadow: {sigilShadow};">{t.sigil}</div>
							<div style="display: flex; flex-direction: column; gap: 3px; min-width: 0;">
								<span style="font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {t.accentLight};">{t.name} · cosmetic</span>
								<span style="font-family: 'Cinzel', serif; font-size: 17px; font-weight: 600; letter-spacing: 0.01em; color: oklch(0.3 0.02 80);">{t.flavor}</span>
							</div>
						</div>
						<p style="margin: 0; font-size: 12px; color: oklch(0.5 0.02 82); line-height: 1.5;">{t.blurb}</p>
					</div>

					<div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
						{#if txHash}
							<a href="https://sepolia.etherscan.io/tx/{txHash}" target="_blank" rel="noreferrer">View transaction ↗</a>
						{:else if isSimulatedWallet}
							<span style="font-size: 12px; color: oklch(0.58 0.02 82);">Simulated · no on-chain transaction</span>
						{:else}
							<span />
						{/if}
						<span style="font-size: 12px; color: oklch(0.58 0.02 82);">{replayHint}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if step === 'reveal'}
		<WishReveal tierIdx={activeTierIdx} on:continue={finishReveal} />
	{/if}
</div>

<style>
	.claim-wrap {
		font-family: 'Geist Variable', system-ui, sans-serif;
	}
	.claim-card {
		position: relative;
		background: oklch(1 0 0 / 0.66);
		border: 1px solid oklch(1 0 0 / 0.9);
		border-radius: 16px;
		backdrop-filter: blur(16px);
		box-shadow: 0 30px 70px oklch(0.55 0.07 78 / 0.22), 0 0 46px oklch(0.9 0.09 88 / 0.28), inset 0 1px 0 oklch(1 0 0 / 0.9);
	}
	.claim-inner {
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 22px;
	}
	.claim-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.claim-label {
		font-family: 'Cinzel', serif;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: oklch(0.42 0.04 72);
	}
	.claim-pill {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		border-radius: 999px;
		padding: 4px 11px;
	}
	.claim-text {
		margin: 0;
		font-size: 14px;
		color: oklch(0.46 0.02 82);
		line-height: 1.55;
	}
	.claim-error {
		margin: 0;
		font-size: 12px;
		color: oklch(0.55 0.12 38);
		text-align: center;
	}
	.claim-hint {
		margin: 0;
		font-size: 12px;
		color: oklch(0.56 0.02 82);
		text-align: center;
		line-height: 1.45;
	}
	.cta {
		height: 46px;
		padding: 0 18px;
		width: 100%;
		font: inherit;
		font-family: 'Cinzel', serif;
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: oklch(0.3 0.05 62);
		border: 1px solid oklch(0.74 0.1 80);
		border-radius: 12px;
		cursor: pointer;
		background: linear-gradient(100deg, oklch(0.8 0.11 80) 0%, oklch(0.9 0.09 88) 42%, oklch(0.99 0.03 96) 50%, oklch(0.9 0.09 88) 58%, oklch(0.8 0.11 80) 100%);
		background-size: 220% 100%;
		animation: om-sweep 3.4s linear infinite;
		box-shadow: 0 8px 26px oklch(0.78 0.11 82 / 0.4), 0 0 30px oklch(0.9 0.09 88 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.6);
	}
	.cta-disabled {
		animation: none;
		opacity: 0.55;
		cursor: default;
		box-shadow: none;
	}
	.simulate-btn {
		align-self: center;
		height: 32px;
		padding: 0 14px;
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: oklch(0.5 0.09 66);
		background: oklch(1 0 0 / 0.6);
		border: 1px solid oklch(0.72 0.06 80 / 0.4);
		border-radius: 8px;
		cursor: pointer;
	}
	.claim-noteligible {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 15px;
		background: oklch(0.98 0.02 40 / 0.75);
		border: 1px solid oklch(0.72 0.09 38 / 0.35);
		border-radius: 11px;
	}
	.claim-amount-box {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 18px;
		background: linear-gradient(160deg, oklch(0.99 0.02 92 / 0.85), oklch(0.97 0.04 88 / 0.7));
		border: 1px solid oklch(0.78 0.1 82 / 0.4);
		border-radius: 11px;
		box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.8);
	}
	.claim-amount-label {
		font-size: 11px;
		font-weight: 600;
		color: oklch(0.58 0.1 72);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}
	.claim-amount {
		font-family: 'Cinzel', serif;
		font-size: 36px;
		font-weight: 700;
		letter-spacing: 0.005em;
		color: oklch(0.32 0.03 72);
	}
	.claim-wei {
		font-family: 'Geist Mono Variable', monospace;
		font-size: 11px;
		color: oklch(0.62 0.02 82);
	}
	.claim-confirming {
		display: flex;
		align-items: center;
		gap: 13px;
		padding: 18px;
		background: oklch(0.98 0.015 92 / 0.75);
		border: 1px solid oklch(0.8 0.08 84 / 0.35);
		border-radius: 11px;
	}
	.claim-spinner {
		width: 19px;
		height: 19px;
		border: 2px solid oklch(0.86 0.04 90);
		border-top-color: oklch(0.68 0.12 76);
		border-radius: 50%;
		animation: om-spin 0.7s linear infinite;
		flex-shrink: 0;
	}
	.claim-claimed {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px;
		background: oklch(0.98 0.02 150 / 0.75);
		border: 1px solid oklch(0.72 0.13 150 / 0.35);
		border-radius: 11px;
	}
	.claim-claimed-label {
		font-size: 11px;
		font-weight: 600;
		color: oklch(0.52 0.12 150);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}
	.claim-trophy {
		display: flex;
		flex-direction: column;
		gap: 11px;
		padding: 17px;
		border-radius: 11px;
	}
	.claim-sigil {
		width: 44px;
		height: 44px;
		border-radius: 11px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		color: oklch(0.99 0 0);
		flex-shrink: 0;
	}
</style>

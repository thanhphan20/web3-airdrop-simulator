<script>
	import '$lib/claim/claim.css';
	import ClaimCard from '$lib/claim/ClaimCard.svelte';
	import ConnectButton from '$lib/claim/ConnectButton.svelte';
</script>

<svelte:head>
	<title>Claim your allocation | Merkle Airdrop</title>
</svelte:head>

<div class="claim-page">
	<div class="claim-rays" />
	<div class="claim-glow" />

	<div class="claim-col">
		<div class="claim-top">
			<div class="claim-brand">
				<div class="claim-brand-icon">❖</div>
				<span class="claim-brand-text">MERKLE AIRDROP</span>
			</div>
			<span class="claim-badge">
				<span class="claim-badge-dot" />
				Sepolia testnet
			</span>
		</div>

		<div class="claim-hero">
			<h1 class="claim-title">Claim your allocation</h1>
			<div class="claim-divider">
				<span class="claim-divider-line" />
				<span>◆</span>
				<span class="claim-divider-line-right" />
			</div>
			<p class="claim-sub">Eligibility is verified against a fixed merkle proof. Connect a wallet to check your address.</p>
		</div>

		<ConnectButton />
		<ClaimCard />

		<p class="claim-foot">Testnet demo · tokens have no value. The cosmetic reward is decided client-side and never touches the real claim.</p>

		<a class="claim-link" href="/points">Points farming demo (local Anvil) →</a>
		<a class="claim-link" href="/">Gacha simulator →</a>
	</div>
</div>

<script>
	import '$lib/claim/claim.css';
	import PointsCard from '$lib/claim/PointsCard.svelte';
	import ConnectButton from '$lib/claim/ConnectButton.svelte';
</script>

<svelte:head>
	<title>Points farming demo | Merkle Airdrop</title>
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
				Local Anvil
			</span>
		</div>

		<div class="claim-hero">
			<h1 class="claim-title">Points farming demo</h1>
			<div class="claim-divider">
				<span class="claim-divider-line" />
				<span>◆</span>
				<span class="claim-divider-line-right" />
			</div>
			<p class="claim-sub">Manually exercise the same check-in / task mechanics the automated bot drives.</p>
		</div>

		<ConnectButton />
		<PointsCard />

		<p class="claim-foot">Testnet demo · tokens have no value. Requires a local Anvil node (chain id 31337) with PointsProtocol deployed.</p>

		<a class="claim-link" href="/claim">Claim your allocation →</a>
		<a class="claim-link" href="/">Gacha simulator →</a>
	</div>
</div>

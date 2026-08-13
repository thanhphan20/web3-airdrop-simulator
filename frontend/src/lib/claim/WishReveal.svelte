<script>
	import { onMount, onDestroy } from 'svelte';
	import { TIERS } from './tiers';
	import { currentOdds, drawTier } from './gacha';

	export let tierIdx;
	export let pityKey = undefined;

	let phase = 'idle';
	let activeTier = tierIdx;
	let odds = pityKey ? currentOdds(pityKey) : currentOdds();
	let motes = [];
	let timers = [];

	function makeMotes(glow) {
		const arr = [];
		for (let i = 0; i < 14; i++) {
			const x = 20 + Math.random() * 60;
			const delay = Math.random() * 1.2;
			const dur = 1.6 + Math.random() * 1.4;
			const sz = 2 + Math.random() * 3;
			arr.push({
				style: `left: ${x}%; bottom: 40%; width: ${sz}px; height: ${sz}px; background: ${glow}; box-shadow: 0 0 8px ${glow}; animation: wr-rise ${dur}s ${delay}s ease-out infinite;`
			});
		}
		return arr;
	}

	function clearTimers() {
		timers.forEach(clearTimeout);
		timers = [];
	}

	function begin(idx) {
		clearTimers();
		phase = 'charge';
		activeTier = idx;
		motes = makeMotes(TIERS[idx].glowDark);
		timers = [
			setTimeout(() => (phase = 'beam'), 1100),
			setTimeout(() => (phase = 'burst'), 2000),
			setTimeout(() => (phase = 'card'), 2450),
			setTimeout(() => (phase = 'flipped'), 3050),
			setTimeout(() => (phase = 'done'), 3900)
		];
	}

	onMount(() => {
		begin(tierIdx);
	});

	onDestroy(() => {
		clearTimers();
	});

	const skip = () => {
		clearTimers();
		phase = 'done';
	};

	const replay = () => {
		const d = pityKey ? drawTier(pityKey) : drawTier();
		odds = pityKey ? currentOdds(pityKey) : currentOdds();
		begin(d.tierIdx);
	};

	$: t = TIERS[activeTier] ?? TIERS[2];
	$: cardShown = phase === 'card' || phase === 'flipped' || phase === 'done';
	$: flipped = phase === 'flipped' || phase === 'done';
	$: done = phase === 'done';
	$: beamOn = phase === 'beam' || phase === 'burst';
	$: motesShown = phase === 'burst' || phase === 'card' || phase === 'flipped' || phase === 'done';
	$: legPct = odds.legendary < 10 ? odds.legendary.toFixed(1) : Math.round(odds.legendary);
	$: pityLabel = `Legendary pity  ${odds.p5} / ${odds.hard5}`;
	$: oddsLabel = `next-pull odds  ${legPct}%`;
</script>

<div class="wr-stage">
	<div class="wr-starfield" />
	<div
		class="wr-glow"
		style="background: radial-gradient(circle, {t.glowDark}, transparent 70%); transform: translate(-50%,-50%) scale({phase === 'charge' ? 7 : 0}); opacity: {phase === 'charge' ? 1 : 0};"
	/>
	<div
		class="wr-beam"
		style="width: {beamOn ? 150 : 0}px; background: linear-gradient(to right, transparent, {t.glowDark}, transparent); opacity: {phase === 'beam' ? 0.95 : phase === 'burst' ? 0.4 : 0};"
	/>
	<div class="wr-flash" style="background: radial-gradient(circle at center, {t.glowDark}, transparent 55%); opacity: {phase === 'burst' ? 0.85 : 0};" />
	{#if motesShown}
		{#each motes as m}
			<span class="wr-mote" style={m.style} />
		{/each}
	{/if}

	<div class="wr-pretext" style="opacity: {phase === 'charge' || phase === 'beam' ? 0.85 : 0};">The proof resolves…</div>

	<div class="wr-cardwrap" style="opacity: {cardShown ? 1 : 0}; transform: translateY({cardShown ? 0 : 24}px) scale({cardShown ? 1 : 0.92});">
		<div class="wr-cardinner" style="transform: {flipped ? 'rotateY(0deg)' : 'rotateY(180deg)'};">
			<div class="wr-cardback"><div style="font-size: 44px; opacity: 0.9;">◈</div></div>
			<div class="wr-cardfront" style="background: linear-gradient(165deg, color-mix(in oklch, {t.accentDark} 24%, oklch(0.16 0.01 265)), oklch(0.13 0.01 265)); border: 1.5px solid {t.accentDark}; box-shadow: 0 0 60px color-mix(in oklch, {t.glowDark} 55%, transparent), inset 0 0 50px oklch(0 0 0 / 0.35);">
				<div class="wr-cardtag" style="color: {t.glowDark}; border: 1px solid color-mix(in oklch, {t.accentDark} 60%, transparent);">{t.name}</div>
				<div class="wr-cardsigil" style="color: {t.glowDark}; text-shadow: 0 0 30px {t.glowDark}; animation: {done ? 'wr-halo 2.4s ease-in-out infinite' : 'none'};">{t.sigil}</div>
				<div style="display: flex; flex-direction: column; gap: 6px; align-items: center;">
					<div style="font-size: 22px; font-weight: 600; letter-spacing: -0.01em; color: oklch(0.98 0 0); text-align: center;">{t.flavor}</div>
					<div style="font-size: 12px; color: oklch(0.72 0 0); text-align: center; line-height: 1.5; max-width: 210px;">{t.blurb}</div>
				</div>
				<div style="font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: oklch(0.6 0 0);">Cosmetic · no value</div>
			</div>
		</div>
	</div>

	<div class="wr-actions" style="opacity: {done ? 1 : 0}; transform: translateY({done ? 0 : 10}px); pointer-events: {done ? 'auto' : 'none'};">
		<button class="wr-replay" on:click={replay}>Pull again</button>
		<button class="wr-continue" on:click={() => (phase = 'done')}>Continue</button>
	</div>

	<div class="wr-pity">
		<span>{pityLabel}</span>
		<span>{oddsLabel}</span>
	</div>

	<div class="wr-credit" style="opacity: {done ? 0.7 : 0};">Pity model ported from Mantan21/Genshin-Impact-Wish-Simulator (MIT) · all visuals original</div>

	<button class="wr-skip" on:click={skip} style="opacity: {done ? 0 : 0.8}; pointer-events: {done ? 'none' : 'auto'};">Skip ›</button>
</div>

<style>
	.wr-stage {
		position: fixed;
		inset: 0;
		z-index: 50;
		font-family: 'Geist Variable', system-ui, sans-serif;
		background: radial-gradient(circle at 50% 55%, oklch(0.19 0.015 265), oklch(0.09 0.01 265));
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.wr-starfield {
		position: absolute;
		inset: 0;
		background: radial-gradient(1px 1px at 20% 30%, oklch(1 0 0 / 0.5), transparent),
			radial-gradient(1px 1px at 70% 20%, oklch(1 0 0 / 0.4), transparent),
			radial-gradient(1.5px 1.5px at 40% 70%, oklch(1 0 0 / 0.35), transparent),
			radial-gradient(1px 1px at 85% 65%, oklch(1 0 0 / 0.4), transparent),
			radial-gradient(1px 1px at 55% 45%, oklch(1 0 0 / 0.3), transparent),
			radial-gradient(1px 1px at 12% 80%, oklch(1 0 0 / 0.35), transparent);
		opacity: 0.9;
		animation: wr-twinkle 3s ease-in-out infinite;
	}
	.wr-glow {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		transition: transform 1s ease-out, opacity 0.6s ease;
	}
	.wr-beam {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		filter: blur(7px);
		transition: width 0.45s ease-out, opacity 0.7s ease;
	}
	.wr-flash {
		position: absolute;
		inset: 0;
		transition: opacity 0.5s ease;
		pointer-events: none;
	}
	.wr-mote {
		position: absolute;
		border-radius: 50%;
	}
	.wr-pretext {
		position: absolute;
		top: 30%;
		font-size: 13px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: oklch(0.7 0 0);
		transition: opacity 0.5s ease;
	}
	.wr-cardwrap {
		position: relative;
		width: 260px;
		height: 380px;
		perspective: 1400px;
		transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.wr-cardinner {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		transition: transform 0.85s cubic-bezier(0.2, 0.75, 0.2, 1);
	}
	.wr-cardback,
	.wr-cardfront {
		position: absolute;
		inset: 0;
		border-radius: 18px;
		backface-visibility: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.wr-cardback {
		transform: rotateY(180deg);
		background: linear-gradient(160deg, oklch(0.28 0.02 265), oklch(0.16 0.02 265));
		border: 1px solid oklch(1 0 0 / 0.12);
		color: oklch(0.7 0 0);
		box-shadow: inset 0 0 40px oklch(0 0 0 / 0.4);
	}
	.wr-cardfront {
		gap: 20px;
		padding: 28px 22px;
	}
	.wr-cardtag {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		border-radius: 999px;
		padding: 4px 12px;
	}
	.wr-cardsigil {
		font-size: 84px;
		line-height: 1;
	}
	.wr-actions {
		position: absolute;
		bottom: 52px;
		display: flex;
		gap: 12px;
		align-items: center;
		transition: opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s;
	}
	.wr-continue {
		height: 42px;
		padding: 0 28px;
		font: inherit;
		font-size: 14px;
		font-weight: 500;
		color: oklch(0.14 0 0);
		background: oklch(0.97 0 0);
		border: none;
		border-radius: 10px;
		cursor: pointer;
	}
	.wr-replay {
		height: 42px;
		padding: 0 20px;
		font: inherit;
		font-size: 14px;
		font-weight: 500;
		color: oklch(0.9 0 0);
		background: transparent;
		border: 1px solid oklch(1 0 0 / 0.22);
		border-radius: 10px;
		cursor: pointer;
	}
	.wr-pity {
		position: absolute;
		top: 28px;
		left: 28px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		font-family: 'Geist Mono Variable', ui-monospace, monospace;
		font-size: 11px;
		letter-spacing: 0.04em;
		color: oklch(0.66 0 0);
		opacity: 0.85;
	}
	.wr-credit {
		position: absolute;
		bottom: 18px;
		font-size: 10px;
		letter-spacing: 0.03em;
		color: oklch(0.5 0 0);
		transition: opacity 0.5s ease 0.3s;
		text-align: center;
	}
	.wr-skip {
		position: absolute;
		top: 28px;
		right: 28px;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		color: oklch(0.6 0 0);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: opacity 0.4s ease;
	}
</style>

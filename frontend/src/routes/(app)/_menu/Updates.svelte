<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import OverlayScrollbars from 'overlayscrollbars';
	import updates from '$lib/data/updates.json';

	let updatesContainer;
	onMount(() => {
		OverlayScrollbars(updatesContainer, { sizeAutoCapable: false, className: 'os-theme-light' });
	});
</script>

<div class="updates content-container" in:fade={{ duration: 200 }}>
	<div class="update-item" bind:this={updatesContainer}>
		{#each [...updates.data].reverse() as { description, date }, i (i)}
			<h2>
				<i class="tgl"> {date} </i>
				{#if i === 0} ( Latest Update ) {/if}
			</h2>
			{#each description as txt} <p>{@html txt}</p> {/each}
		{/each}
	</div>
</div>

<style>
	.updates .update-item {
		font-weight: 100;
		background-color: #fff;
		padding: 1rem 2.5rem 0.5rem;
		font-size: 0.87rem;
		border-radius: 0.3rem;
	}

	.update-item {
		height: 100%;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		font-size: 0.97rem;
		display: block;
		overflow: hidden;
	}

	.updates p {
		position: relative;
		padding-left: 1rem;
	}
	.updates p::before {
		content: '*';
		display: inline-block;
		width: 10px;
		line-height: 0;
		font-size: 1.3rem;
		padding-top: 0.5rem;
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
	}
	.updates h2:nth-child(1) {
		margin-top: 0;
	}
	.updates h2 {
		margin-left: -1rem;
		font-weight: bold;
		color: #f7cf33;
	}
	.updates .tgl {
		color: #bd6932;
	}
</style>

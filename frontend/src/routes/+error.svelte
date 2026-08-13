<script>
	import { page } from '$app/stores';
</script>

<div class="error-page">
	<h1>Error</h1>
	<p>{$page.error?.message ?? 'Something went wrong.'}</p>
	<a href="/">← Back to home</a>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		font-family: system-ui, sans-serif;
		background: oklch(0.97 0.02 88);
		color: oklch(0.32 0.02 80);
	}
	a {
		color: oklch(0.5 0.09 66);
	}
</style>

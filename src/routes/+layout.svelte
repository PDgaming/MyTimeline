<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="main bg-base-300 h-screen overflow-y-hidden p-1">
	{@render children()}
</div>

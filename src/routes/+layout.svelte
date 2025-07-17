<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="main bg-base-300 p-1">
	{@render children()}
</div>

<script>
  import "#/styles/picnic.scss";
  import { fade } from "svelte/transition";

  export let data;
</script>

{#key data.pathname}
  <div class="app">
    <slot />
  </div>
{/key}

<style>
  .app {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>

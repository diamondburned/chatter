<script>
  import "#/styles/picnic.scss";
  import { fade } from 'svelte/transition'

  export let data
</script>

{#key data.pathname}
  <div 
    class="app"
    in:fade={{ duration: 300, delay:400 }}
    out:fade={{ duration: 300 }}
  >
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

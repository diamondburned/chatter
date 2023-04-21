<script lang="ts">
  import Symbol from "#/components/Symbol.svelte";

  export let symbol: string;
  export let open: boolean;
</script>

<button
  class="toggle-button"
  class:open
  on:click={() => {
    open = !open;
  }}
>
  <Symbol inline name={symbol} />
</button>

<style lang="scss">
  .toggle-button {
    color: $picnic-black;
    background: none;

    padding: 0.25em 0.5em;
    margin: 0;

    &.open {
      background: $picnic-primary;
      color: $picnic-white;
    }

    &:hover {
      background: $picnic-dull;
    }
  }
</style>

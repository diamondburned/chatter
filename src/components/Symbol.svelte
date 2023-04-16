<script lang="ts">
  export let name: string;
  export let tooltip = "";
  export let large = false;
  export let inline = false;
</script>

<span
  class="material-symbols-rounded symbol"
  class:large
  class:inline
  title={tooltip}
>
  {name}
</span>

<style lang="scss">
  .material-symbols-rounded {
    cursor: default;
    user-select: none;
    font-size: 1.35em;

    &.large {
      font-size: 2.25em;
    }

    &.inline {
      font-size: 1.5em;
      margin: 0 -0.1em;
      vertical-align: bottom;
      display: inline-flex;
    }
  }
</style>

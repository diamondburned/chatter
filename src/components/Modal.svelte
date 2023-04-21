<script lang="ts">
  import * as svelte from "svelte";
  import { fly } from "svelte/transition";

  export let transition = true;
  export let x: number | undefined = undefined;
  export let y: number | undefined = undefined;
  export let duration = 100;

  const dispatch = svelte.createEventDispatcher<{
    blur: void;
  }>();

  const maybeTrans = (e: Element) => {
    if (transition) return fly(e, { x, y, duration });
  };

  // Keep track of the initial click which is to trigger the open of this menu.
  let modal: HTMLElement | null = null;
  let initialClick = false;

  function handleClick(ev: MouseEvent) {
    if (!modal) {
      return;
    }
    if (!initialClick) {
      initialClick = true;
      return;
    }
    if (!modal.contains(ev.target as Node)) {
      dispatch("blur");
      initialClick = false;
    }
  }
</script>

<svelte:window on:click={handleClick} />

<div class="modal" bind:this={modal} transition:maybeTrans>
  <slot />
</div>

<style lang="scss">
  .modal {
    background-color: $picnic-white;
    height: inherit;
  }
</style>

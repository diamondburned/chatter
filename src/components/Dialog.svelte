<script lang="ts">
  import { fly, fade } from "svelte/transition";

  import Modal from "#/components/Modal.svelte";
  import Symbol from "#/components/Symbol.svelte";

  export let id = "";
  export let open = false;
</script>

<dialog {id} class="dialog" open transition:fade={{ duration: 200 }}>
  <Modal y={100} duration={200} on:blur={() => (open = false)}>
    <button class="close" on:click={() => (open = false)}>
      <Symbol name="close" />
    </button>
    <div class="contents">
      <slot />
    </div>
  </Modal>
</dialog>

<style lang="scss">
  dialog {
    position: fixed;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    padding: 0.5em;

    display: flex;
    align-items: center;
    justify-content: center;

    border: none;
    outline: none;

    z-index: 100;
    background-color: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px);
  }

  :global(dialog.dialog .modal) {
    width: clamp(300px, 75%, 600px);
    height: initial;

    max-width: 100%;
    max-height: min(100%, 600px);

    color: $picnic-black;
    background-color: $picnic-white;
    border-radius: $picnic-radius;
    box-shadow: 0 0 10px -4px rgba(0, 0, 0, 0.2);

    position: relative;
    text-align: left;

    display: flex;
    flex-direction: column;

    button.close {
      position: absolute;
      top: 0;
      right: 0;
      background: none;
      color: $picnic-black;
      line-height: 0;
      padding: 0.5em;
    }
  }

  .contents {
    flex: 1;
    overflow: hidden;
    margin: 0.35rem 1rem;
    padding: 0;
  }
</style>

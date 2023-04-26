<script lang="ts">
  import { goto } from "$app/navigation";
  import { token, sync, addToast, toasts } from "#/lib/frontend/state.js";
  import * as api from "#/lib/api/index.js";
  import * as svelte from "svelte";

  import Symbol from "#/components/Symbol.svelte";
  import Room from "#/routes/room/[id]/+page.svelte";

  svelte.onMount(async () => {
    if (!$token) {
      goto("/login");
    }

    try {
      await sync();
    } catch (err) {
      if (err instanceof api.HTTPError && err.code == 401) {
        // 401 Unauthorized, go back to login
        goto("/login");
      } else {
        addToast("error", `Sync error: ${err}`);
      }
    }
  });
</script>

<div id="toasts">
  {#each $toasts as toast}
    <div class="toast toast-{toast.type}">
      {#if toast.type == "error"}
        <Symbol name="error" />
      {:else if toast.type == "success"}
        <Symbol name="check" />
      {/if}
      <p>{toast.message}</p>
      <!-- TODO: close button -->
    </div>
  {/each}
</div>

<Room data={{ roomID: "" }} />

<style lang="scss">
  #toasts {
    position: fixed;
    z-index: 1000;

    padding: 0.5em;
    width: 100%;
    top: 0;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5em;

    .toast {
      border-radius: $picnic-radius;
      border: 2px solid var(--primary);

      background-color: rgba($picnic-white, 0.85);
      backdrop-filter: blur(8px);

      width: min(100%, 25em);
      overflow: hidden;

      display: flex;
      padding: 0.5em;
      gap: 0.5em;

      p {
        flex: 1;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    }

    .toast-success {
      --primary: #{lighten($picnic-success, $picnic-color-variation)};
    }

    .toast-error {
      --primary: #{lighten($picnic-error, $picnic-color-variation)};
    }
  }
</style>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { token, sync, settings } from "#/lib/frontend/state.js";
  import * as svelte from "svelte";

  import Room from "#/routes/room/[id]/+page.svelte";

  svelte.onMount(() => {
    if (!$token) {
      goto("/login");
    }

    let stop = false;
    async function start() {
      if (!stop) {
        await sync();
        window.setTimeout(start, $settings.syncDuration);
      }
    }
    start();
    return () => (stop = true);
  });
</script>

<Room data={{ roomID: "" }} />

<script lang="ts">
  import { goto } from "$app/navigation";
  import { token } from "#/lib/frontend/state.js";
  import * as svelte from "svelte";

  import Room from "#/routes/room/[id]/+page.svelte";

  svelte.onMount(() => {
    if (!$token) {
      goto("/login");
    }
  });
</script>

<Room data={{ roomID: "" }} />

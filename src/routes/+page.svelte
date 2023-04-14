<script lang="ts">
  import { goto } from "$app/navigation";
  import * as svelte from "svelte";

  let token: string;

  svelte.onMount(() => {
    token = localStorage.getItem("chatter_token");
    if (!token) {
      goto("/login");
    }
  });
</script>

<p>Hello!</p>

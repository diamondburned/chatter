<script lang="ts">
  import type * as api from "#/lib/api/index.js";

  export let event: Extract<api.RoomEvent, { type: "message_create" }>;
</script>

<p class="markdown">{event.content.markdown}</p>

<style lang="scss">
  p {
    margin: 0;
  }
</style>

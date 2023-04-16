<script lang="ts">
  import * as api from "#/lib/api/index.js";
  import { token } from "#/lib/frontend/state.js";

  import Icon from "#/components/Icon.svelte";
  import Dialog from "#/components/Dialog.svelte";
  import Symbol from "#/components/Symbol.svelte";

  export let open = false;

  let busy = false;
  let error = "";

  let rooms: api.Room[] = [];
  let hasMore = false;

  async function searchRoom(event: SubmitEvent) {
    busy = true;

    const data = new FormData(event.target as HTMLFormElement);
    const body: api.ListRoomsRequest = {
      query: data.get("query") as string,
    };

    try {
      const resp = await api.request<api.ListRoomsResponse>("/api/v0/rooms", {
        body: JSON.stringify(body),
        headers: { Authorization: $token },
      });
      rooms = resp.rooms;
      hasMore = resp.hasMore;
    } catch (err) {
      error = err.message;
    } finally {
      busy = false;
    }
  }
</script>

<Dialog id="join-room" bind:open>
  <h2>Join Room</h2>
  <form class="search" on:submit|preventDefault={searchRoom}>
    <p class="error">{error}</p>
    <input type="text" name="query" placeholder="Search" />
    <button class="search-button" type="submit" disabled={busy}>
      <Symbol inline name="search" />
    </button>
  </form>
  <div class="room-list">
    {#each rooms as room}
      <a role="button" href="/room/{room.id}">
        <Icon
          url={room.attributes.avatar}
          name={room.name}
          symbol="chat_bubble"
        />
        <p>
          <span class="room-name">{room.name}</span>
        </p>
      </a>
    {:else}
      <div class="placeholder">
        <p>Search for a room to join!</p>
      </div>
    {/each}
  </div>
</Dialog>

<style lang="scss">
  :global(#join-room) {
    :global(.contents > *) {
      margin: 0.35rem 1rem;
      padding: 0;
    }
  }

  :global(#join-room) {
    .search {
      display: flex;
      flex-direction: row;
      gap: 0.25em;

      input[type="text"] {
        flex: 1;
      }

      button {
        padding: 0.35em;
        margin: 0;

        :global(.symbol) {
          line-height: 0.75;
        }
      }
    }

    .room-list {
      height: 100%;
      overflow-y: auto;

      display: flex;
      flex-direction: column;

      .placeholder {
        text-align: center;
        margin: 1.5em;
      }
    }
  }
</style>

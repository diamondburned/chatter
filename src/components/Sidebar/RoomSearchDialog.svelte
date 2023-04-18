<script lang="ts">
  import * as api from "#/lib/api/index.js";
  import { state, token } from "#/lib/frontend/state.js";

  import Icon from "#/components/Icon.svelte";
  import Dialog from "#/components/Dialog.svelte";
  import Symbol from "#/components/Symbol.svelte";
  import RoomItem from "#/components/Sidebar/RoomItem.svelte";

  export let open = false;

  let busy = false;
  let error = "";

  let rooms: api.Room[] = [];
  let hasMore = false;

  async function searchRoom(event: SubmitEvent) {
    busy = true;

    const data = new FormData(event.target as HTMLFormElement);
    const url = `/api/v0/rooms?query=${data.get("query")}`;

    try {
      const resp = await api.request<api.ListRoomsResponse>(url, {
        headers: { Authorization: $token },
      });
      rooms = resp.rooms;
      hasMore = resp.hasMore;
    } catch (err) {
      error = `${err}`;
    } finally {
      busy = false;
    }
  }

  let joining: Record<string, boolean> = {};
  let joined: Record<string, boolean> = {};
  $: {
    joined = {};
    $state.me
      ? $state.me.joinedRooms.forEach((room) => (joined[room.id] = true))
      : null;
  }

  function joinRoom(room: api.Room) {
    joining[room.id] = true;

    try {
    } catch (err) {
      error = `${err}`;
    }
  }
</script>

<Dialog id="join-room" bind:open>
  <h2>Join Room</h2>
  <p class="error">{error}</p>
  <form class="search" on:submit|preventDefault={searchRoom}>
    <input type="text" name="query" placeholder="Search" />
    <button class="search-button" type="submit" disabled={busy}>
      <Symbol inline name="search" />
    </button>
  </form>
  <div class="room-list">
    {#each rooms as room}
      <RoomItem
        {room}
        disabled={joining[room.id] || joined[room.id]}
        on:select={(ev) => joinRoom(ev.detail)}
      >
        <span slot="name" class="room-name">
          <span class="name">{room.name}</span>
          {#if room.attributes.topic}
            <br />
            <span class="topic">{room.attributes.topic}</span>
          {/if}
        </span>
        <div slot="action" class="room-action">
          {#if joined[room.id]}
            <span class="joined">Joined</span>
          {/if}
        </div>
      </RoomItem>
    {:else}
      <div class="placeholder">
        <p>Search for a room to join!</p>
      </div>
    {/each}
  </div>
</Dialog>

<style lang="scss">
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
    min-height: 250px;
    overflow-y: auto;

    display: flex;
    flex-direction: column;

    .placeholder {
      text-align: center;
      margin: 1.5em;
    }
  }

  .room-name .topic {
    font-size: 0.9em;
  }

  .room-action {
    .joined {
      text-transform: uppercase;
      font-size: 0.75em;
    }
  }
</style>

<script lang="ts">
  import * as api from "#/lib/api/index.js";
  import { state } from "#/lib/frontend/state.js";
  import { fly } from "svelte/transition";

  import Icon from "#/components/Icon.svelte";
  import Modal from "#/components/Modal.svelte";
  import Symbol from "#/components/Symbol.svelte";
  import Settings from "#/components/Sidebar/Settings.svelte";
  import RoomItem from "#/components/Sidebar/RoomItem.svelte";
  import RoomSearchDialog from "#/components/Sidebar/RoomSearchDialog.svelte";
  import RoomCreateDialog from "#/components/Sidebar/RoomCreateDialog.svelte";

  export let selectedRoomID: string | undefined;

  let showCreateRoom = false;
  let showSettings = false;
  let showAddRoom = false;
  let showMenu = false;

  let searchRoom = "";
  $: rooms = $state.me
    ? searchRoom == ""
      ? $state.me.joinedRooms
      : $state.me.joinedRooms.filter((room) =>
          room.name.toLowerCase().includes(searchRoom.toLowerCase())
        )
    : [];
</script>

<aside>
  <section class="rooms">
    <div class="search">
      <input type="text" placeholder="Search" bind:value={searchRoom} />
      <button
        class="menu"
        title="Menu"
        class:active={showMenu}
        on:click={() => (showMenu = true)}
      >
        <Symbol name="menu" />
      </button>
      {#if showMenu}
        <Modal duration={100} x={-100} on:blur={() => (showMenu = false)}>
          <h4>Menu</h4>
          <ul>
            <li>
              <button
                class="discover-room"
                on:click={() => {
                  showMenu = false;
                  showAddRoom = true;
                }}
              >
                <Symbol inline name="forum" />
                <span>Discover Room</span>
              </button>
            </li>
            <li>
              <button
                class="create-room"
                on:click={() => {
                  showMenu = false;
                  showCreateRoom = true;
                }}
              >
                <Symbol inline name="add" />
                <span>Create Room</span>
              </button>
            </li>
          </ul>
        </Modal>
      {/if}
    </div>
    <div class="room-list">
      {#if rooms}
        <h4>Rooms</h4>
        <ul>
          {#each rooms as room}
            <li>
              <RoomItem
                {room}
                href="/room/{room.id}"
                selected={selectedRoomID == room.id}
              />
            </li>
          {/each}
        </ul>
      {:else}
        <div class="placeholder">
          <p>You haven't joined any rooms!</p>
          <p>Click the <Symbol name="add" inline /> button to join one.</p>
        </div>
      {/if}
    </div>
  </section>
  <section class="bottom-pane">
    {#if $state.me}
      <div class="user-info">
        <Icon
          url={$state.me.attributes.avatar}
          name={$state.me.username}
          symbol="face"
        />
        <p>
          <span class="username">{$state.me.username}</span>
          <br />
          <span class="short">#{api.shortenID($state.me.id)}</span>
        </p>
      </div>
      <button class="settings" on:click={() => (showSettings = true)}>
        <Symbol name="settings" />
      </button>
    {/if}
  </section>
</aside>

{#if showAddRoom}
  <RoomSearchDialog bind:open={showAddRoom} />
{/if}

{#if showCreateRoom}
  <RoomCreateDialog bind:open={showCreateRoom} />
{/if}

{#if showSettings}
  <Settings bind:open={showSettings} />
{/if}

<!-- <dialog id="settings" open={showSettings} /> -->

<style lang="scss">
  aside {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  h4 {
    padding-bottom: 0;
    text-align: center;
  }

  .rooms {
    flex: 1;
  }

  .search {
    display: flex;
    flex-direction: row;
    position: relative;

    margin: 0.25em;
    gap: 0.25em;

    & > button {
      line-height: 0;
      padding: 0.35em;
      margin: 0;
    }

    input[type="text"] {
      flex: 1;
      border: none;
      background-color: #0001;
    }

    button.menu {
      background: #0001;
      color: $picnic-black;

      &:hover {
        background: $picnic-dull;
      }

      &.active {
        background: $picnic-primary;
        color: $picnic-white;
      }
    }

    :global(.modal) {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1;
      margin-top: 0.35em;

      font-size: 0.95em;

      box-shadow: 0 0 0.5em #0003;
      border-radius: $picnic-radius;

      :global(ul) {
        list-style: none;
        padding: 0.25em;
        margin: 0;

        display: flex;
        flex-direction: column;
        gap: 0.25em;

        :global(li) {
          margin: 0;
        }
      }

      :global(button) {
        width: 100%;
        text-align: left;
        background: none;
        color: $picnic-black;

        margin: 0;
        padding: 0.35em 0.5em;

        &:hover {
          background: $picnic-dull;
        }

        :global(span) {
          margin-left: 0.25rem;
        }
      }
    }
  }

  .room-list {
    margin: 0.25em;
    height: 100%;
    overflow-y: auto;

    display: flex;
    flex-direction: column;

    .placeholder {
      font-size: 0.85em;
      text-align: center;

      margin: 1.5em;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;

      display: flex;
      flex-direction: column;
      gap: 0.25em;

      li {
        margin: 0;
      }
    }
  }

  .bottom-pane {
    border-top: 1px solid $picnic-dull;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.5em;
    padding: 0.25em 0.45em;

    button {
      padding: 0.25em;
      background: none;
      line-height: 0;
      color: $picnic-black;

      &:hover {
        background-color: $picnic-dull;
      }
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.45em;

    overflow: hidden;

    p {
      margin: 0;

      line-height: 1;
      font-size: 0.85em;

      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      .short {
        font-size: 0.8em;
        opacity: 0.8;
      }
    }
  }
</style>

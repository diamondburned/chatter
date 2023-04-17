<script lang="ts">
  import { state } from "#/lib/frontend/state.js";

  import Sidebar from "#/components/Sidebar/Sidebar.svelte";
  import MessageView from "#/components/MessageView/MessageView.svelte";

  // this is weird, why can I not just do like $page.params.id lol
  export let data: { roomID: string };

  $: room = $state.me
    ? $state.me.joinedRooms.find((room) => room.id == data.roomID)
    : null;
</script>

<div class="room-page">
  <div class="sidebar">
    <Sidebar selectedRoomID={room?.id} />
  </div>
  <div class="message-view">
    {#if room}
      <MessageView {room} />
    {:else}
      <div class="placeholder">
        <span class="brand">chatter</span>
        <p>Join a room to start chatting!</p>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .room-page {
    display: flex;
    flex-direction: row;
    height: 100%;

    .sidebar {
      border-right: 1px solid $picnic-dull;
      box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);

      height: 100%;
      width: clamp(200px, 35%, 300px);
      max-width: 100%;

      z-index: 1;
    }

    .message-view {
      width: 100%;

      display: flex;
      flex-direction: column;

      .placeholder {
        flex: 1;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        margin: 1em;

        .brand {
          font-size: 2em;
        }

        p {
          margin-top: 0.5em;
        }
      }
    }
  }
</style>

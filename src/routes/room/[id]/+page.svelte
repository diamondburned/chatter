<script lang="ts">
  import { state } from "#/lib/frontend/state.js";

  import Modal from "#/components/Modal.svelte";
  import Sidebar from "#/components/Sidebar/Sidebar.svelte";
  import MessageView from "#/components/MessageView/MessageView.svelte";
  import ToggleButton from "#/components/ToggleButton.svelte";

  // this is weird, why can I not just do like $page.params.id lol
  export let data: { roomID: string };

  let revealSidebar = false;

  $: room = $state.me
    ? $state.me.joinedRooms.find((room) => room.id == data.roomID)
    : null;
</script>

<div class="room-page" class:has-room={!!room}>
  <div class="sidebar" class:reveal={revealSidebar}>
    <Modal transition={false} on:blur={() => (revealSidebar = false)}>
      <Sidebar selectedRoomID={room?.id} />
    </Modal>
  </div>
  <div class="message-view">
    {#if room}
      <MessageView {room}>
        <div slot="header-start" class="menu-button">
          <ToggleButton symbol="menu" bind:open={revealSidebar} />
        </div>
      </MessageView>
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
      --shadow-size: 0 0 10px 0;

      background-color: $picnic-white;
      border-right: 1px solid $picnic-dull;
      box-shadow: var(--shadow-size) rgba(0, 0, 0, 0.1);

      height: 100%;
      width: clamp(200px, 35%, 300px);
      max-width: 100%;

      z-index: 1;

      @media (max-width: $mobile-width) {
        width: min(80%, 250px);
        left: -100%;
        position: absolute;
        transition: left 150ms ease;
        box-shadow: var(--shadow-size) rgba(0, 0, 0, 0.25);

        &.reveal {
          left: 0;
        }
      }
    }

    .message-view {
      width: 100%;
      overflow: hidden;

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

  .menu-button {
    display: none;

    @media (max-width: $mobile-width) {
      display: block;
    }
  }
</style>

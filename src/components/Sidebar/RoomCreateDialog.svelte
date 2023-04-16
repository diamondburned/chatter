<script lang="ts">
  import * as api from "#/lib/api/index.js";
  import { compressImage } from "#/lib/frontend/image.js";
  import { token, sync } from "#/lib/frontend/state.js";
  import { slide } from "svelte/transition";

  import Dialog from "#/components/Dialog.svelte";

  export let open = false;

  let busy = false;
  let error = "";

  let avatarFiles: FileList;
  let creatingRoom = {
    name: "",
    attributes: {} as api.Room["attributes"],
  };
  let creatingRoomExtras = "";

  async function createRoom() {
    busy = true;

    try {
      for (const [name, value] of Object.entries(creatingRoom.attributes)) {
        if (!value) {
          delete creatingRoom.attributes[name];
        }
      }

      if (avatarFiles) {
        creatingRoom.attributes.avatar = await compressImage(avatarFiles[0], {
          maxWidth: 128,
          maxHeight: 128,
        });
      }

      if (creatingRoomExtras) {
        const extras = JSON.parse(creatingRoomExtras);
        creatingRoom.attributes = { ...creatingRoom.attributes, ...extras };
      }

      if (!creatingRoom.name) {
        throw new Error("room name is required");
      }

      await api.request<api.CreateRoomResponse>("/api/v0/rooms", {
        method: "POST",
        body: JSON.stringify(creatingRoom),
        headers: { Authorization: $token },
      });

      await sync();
      open = false;
    } catch (err) {
      error = err.message;
    } finally {
      busy = false;
    }
  }
</script>

<Dialog id="create-room" bind:open>
  <h2>Create Room</h2>
  <form on:submit|preventDefault={createRoom}>
    <p class="error">{error ? `Error: ${error}` : ""}</p>
    <formset>
      <h5>Required</h5>
      <div />

      <label for="name">Name</label>
      <input
        type="text"
        name="name"
        id="name"
        placeholder="Personal Workspace"
        bind:value={creatingRoom.name}
      />

      <h5>Optional</h5>
      <div />

      <label for="topic">Topic</label>
      <input
        type="text"
        name="topic"
        id="topic"
        placeholder="Just a place to chat"
        bind:value={creatingRoom.attributes.topic}
      />

      <label for="color">Color</label>
      <div class="color-form">
        <label>
          <input
            type="checkbox"
            on:click={() => {
              if (creatingRoom.attributes.color) {
                creatingRoom.attributes.color = undefined;
              } else {
                creatingRoom.attributes.color = "#62A0EA";
              }
            }}
          />
          <span class="checkable" />
        </label>
        {#if creatingRoom.attributes.color}
          <input
            type="color"
            name="color"
            id="color"
            bind:value={creatingRoom.attributes.color}
            transition:slide={{ duration: 75, axis: "x" }}
          />
        {/if}
      </div>

      <label for="avatar">Avatar</label>
      <input type="file" name="avatar" id="avatar" bind:files={avatarFiles} />

      <label for="extras">Metadata</label>
      <textarea
        name="extras"
        id="extras"
        placeholder={"{}"}
        bind:value={creatingRoomExtras}
      />
    </formset>

    <button type="submit" disabled={busy}>Create</button>
  </form>
</Dialog>

<style lang="scss">
  :global(#create-room) {
    :global(.contents) {
      display: flex;
      flex-direction: column;

      & > * {
        margin: 0.35rem 1rem;
        padding: 0;
      }
    }

    form {
      flex: 1;
      overflow-y: auto;

      display: flex;
      flex-direction: column;

      p.error {
        margin-top: 0;
      }

      h5 {
        padding: 0;
      }

      & > formset {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-column-gap: 0.75em;
        grid-row-gap: 0.5em;
        align-items: center;

        margin-bottom: 0.75rem;

        @media (max-width: $mobile-width) {
          grid-template-columns: 1fr;
          grid-row-gap: 0.25em;
        }
      }

      input[type="color"] {
        width: 4em;
      }

      button[type="submit"] {
        margin-top: auto;
        padding: 0.75em;
      }

      .color-form {
        height: 2.1em;
        margin: 0;

        display: flex;
        align-items: center;

        span.checkable {
          margin: 0;
        }
      }
    }
  }
</style>

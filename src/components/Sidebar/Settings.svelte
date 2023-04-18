<script lang="ts">
  import * as api from "#/lib/api/index.js";
  import { sync, settings } from "#/lib/frontend/state.js";

  import Dialog from "#/components/Dialog.svelte";

  export let open = false;
  let error = "";

  let savingUserSettings = false;
  async function submitUserSettings(ev: SubmitEvent) {
    const data = new FormData(ev.target as HTMLFormElement);
  }
</script>

<Dialog id="settings" bind:open>
  <h2>Settings</h2>
  <p class="error">{error}</p>
  <section class="general-settings">
    <h3>General Settings <small>(auto-saved)</small></h3>
    <form class="general-settings" on:submit|preventDefault={() => {}}>
      <formset>
        <label for="sync-duration">Sync Duration (ms)</label>
        <input
          type="number"
          name="sync-duration"
          id="sync-duration"
          min={1000}
          max={30000}
          step={1000}
          bind:value={$settings.syncDuration}
        />
      </formset>
    </form>
  </section>
  <section class="user-settings">
    <h3>User Settings</h3>
    <form class="user-settings" on:submit|preventDefault={submitUserSettings}>
      <formset>
        <label for="username">Username</label>
        <input
          type="text"
          name="username"
          id="username"
          placeholder="(unchanged)"
        />
        <label for="avatar">Avatar</label>
        <input type="file" name="avatar" id="avatar" />
      </formset>
      <button type="submit" disabled={savingUserSettings}>Save</button>
    </form>
  </section>
</Dialog>

<style lang="scss">
  h2 {
    padding: 0;
  }

  section:last-child {
    margin-bottom: 0.25em;
  }

  h3 {
    padding: 0.25em 0;
  }

  form {
    display: flex;
    flex-direction: column;

    formset {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-column-gap: 0.75em;
      grid-row-gap: 0.5em;
      align-items: center;

      @media (max-width: $mobile-width) {
        grid-template-columns: 1fr;
        grid-row-gap: 0.25em;
      }
    }

    button {
      margin: 0.5em 0;
      margin-bottom: 0;
      margin-left: auto;
    }
  }
</style>

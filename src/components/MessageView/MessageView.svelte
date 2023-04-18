<script lang="ts">
  import * as api from "#/lib/api/index.js";
  import { state, token, sync, addToast } from "#/lib/frontend/state.js";

  import Icon from "#/components/Icon.svelte";
  import Symbol from "#/components/Symbol.svelte";
  import Event from "#/components/MessageView/Event.svelte";

  export let room: api.Room;

  let events: (api.RoomEvent & { compact: boolean })[];
  $: {
    events = [];

    const rawEvents = $state.events[room.id] || [];
    for (let i = 0; i < rawEvents.length; i++) {
      const event = rawEvents[i];
      switch (event.type) {
        case "message_create": {
          const prev = rawEvents[i + 1];
          const curr = event;
          let compact = false;
          if (prev) {
            const deltaTime =
              api.DateFromID(curr.id).getTime() -
              api.DateFromID(prev.id).getTime();
            compact =
              prev.author.id == curr.author.id && deltaTime < 1000 * 60 * 5;
          }
          events.push({ ...event, compact });
          continue;
        }
        case "message_update": {
          const target = events.find((e) => e.id === event.id);
          if (target) {
            target.content = event.content;
            continue;
          }
          break;
        }
        case "message_delete": {
          const target = events.find((e) => e.id === event.id);
          if (target) {
            events.splice(events.indexOf(target), 1);
            continue;
          }
          break;
        }
      }
      events.push({
        ...event,
        compact: false,
      });
    }

    console.log(events);
  }

  let sending = false;
  let input = "";
  $: disabled = sending || !input;
  $: multiline = input.includes("\n");

  async function sendMessage() {
    if (disabled) {
      return;
    }

    sending = true;
    try {
      const body: api.SendEventRequest = {
        type: "message_create",
        content: {
          markdown: input,
        },
      };

      await api.request<api.SendEventResponse>(
        `/api/v0/rooms/${room.id}/events`,
        {
          method: "POST",
          headers: {
            Authorization: $token,
          },
          body: JSON.stringify(body),
        }
      );

      await sync();
      input = "";
    } catch (err) {
      console.error("could not send message", err);
      addToast("error", `${err}`);
    } finally {
      // TODO: message send
      sending = false;
    }
  }

  function onInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<header>
  <Icon url={room.attributes.avatar} name={room.name} symbol="chat_bubble" />
  <div class="info">
    <h2>{room.name}</h2>
    {#if room.attributes.topic}
      <p class="topic">{room.attributes.topic}</p>
    {/if}
  </div>
</header>

<div class="messages">
  {#each events as event}
    <Event {event} compact={event.compact} />
  {/each}
</div>

<footer>
  <form class="message-form" on:submit|preventDefault={sendMessage}>
    <textarea
      name="message"
      rows={1}
      placeholder="Send a message"
      class:multiline
      on:keydown={onInputKeyDown}
      bind:value={input}
      disabled={sending}
    />
    <button type="submit" {disabled}>
      <Symbol inline name="send" />
    </button>
  </form>
</footer>

<style lang="scss">
  header {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0.5em;

    .info {
      font-size: 0.8em;
      h2,
      p {
        margin: 0;
        padding: 0;
        line-height: 1.2;
      }
    }
  }

  div.messages {
    height: 100%;
    flex: 1;
    padding-bottom: 0.5em;

    display: flex;
    flex-direction: column-reverse;

    overflow-y: auto;
    overflow-x: hidden;
  }

  footer form {
    display: flex;
    margin: 0.5em;
    gap: 0.5em;

    button {
      padding: 0.35em 0.5em;
      margin: 0;
    }

    textarea.multiline {
      height: 5em;
    }
  }
</style>

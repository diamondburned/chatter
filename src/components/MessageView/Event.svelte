<script lang="ts" context="module">
  export function summarize(event: api.RoomEvent) {
    switch (event.type) {
      case "update_room":
        return `updated the room.`;
      case "member_join":
        return `joined the room.`;
      case "member_leave":
        return `left the room.`;
      default:
        return `sent event ${event.type}.`;
    }
  }
</script>

<script lang="ts">
  import * as api from "#/lib/api/index.js";
  import * as svelte from "svelte";
  import { shortTime, onMidnight } from "#/lib/frontend/time.js";

  import Icon from "#/components/Icon.svelte";
  import Message from "#/components/MessageView/Message.svelte";

  export let event: api.RoomEvent;
  export let compact = false;
  $: createdAt = api.DateFromID(event.id);
  $: createdAtString = shortTime(createdAt);

  svelte.onMount(() => {
    return onMidnight(() => {
      createdAtString = shortTime(createdAt);
    });
  });
</script>

<div class="event event-{event.type}" class:compact>
  <div class="lhs">
    {#if !compact}
      <Icon
        url={event.author.attributes.avatar}
        name={event.author.username}
        symbol="face"
        inline={event.type != "message_create"}
      />
    {/if}
  </div>
  <div class="rhs">
    {#if !compact}
      <div class="top">
        <p>
          <span class="author">{event.author.username}</span>
          {#if event.type != "message_create"}
            <span class="content">{summarize(event)}</span>
          {/if}
        </p>
        <time
          datetime={createdAt.toISOString()}
          title={createdAt.toLocaleString()}
        >
          {createdAtString}
        </time>
      </div>
    {/if}
    {#if event.type == "message_create"}
      <Message {event} />
    {/if}
  </div>
</div>

<style lang="scss">
  div.event {
    display: flex;
    gap: 0.5em;

    margin: 0 0.5rem;
    &:not(.compact) {
      margin-top: 0.5em;
    }

    p {
      margin: 0;
    }

    .lhs {
      --size: 2.25em;
      width: var(--size);

      display: flex;
      align-items: baseline;
      justify-content: flex-end;
    }

    .rhs {
      flex: 1;

      display: flex;
      flex-direction: column;
      justify-content: center;

      :global(p) {
        line-height: 1.25;
      }
    }
  }

  .top {
    display: flex;
    align-items: baseline;
    gap: 0.25em;

    line-height: 1;

    p:empty {
      display: none;
    }

    span.author {
      font-weight: bold;
    }
  }

  time {
    margin-left: auto;
    font-size: 0.75em;
    opacity: 0.75;
  }

  span.author,
  span.content {
    font-size: 0.9em;
  }
</style>

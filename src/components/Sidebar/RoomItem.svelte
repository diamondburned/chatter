<script lang="ts">
  import type * as api from "#/lib/api/index.js";
  import * as svelte from "svelte";

  import Icon from "#/components/Icon.svelte";

  const dispatch = svelte.createEventDispatcher<{
    select: api.Room;
  }>();

  export let room: api.Room;
  export let href = "";
  export let selected = false;
  export let disabled = false;
</script>

<a
  {href}
  role="button"
  on:click={() => dispatch("select", room)}
  class:selected
  class:disabled
>
  <Icon url={room.attributes.avatar} name={room.name} symbol="chat_bubble" />
  <p>
    <slot name="name">
      <span class="room-name">{room.name}</span>
    </slot>
  </p>
  <div class="action">
    <slot name="action" />
  </div>
</a>

<style lang="scss">
  a[role="button"] {
    width: 100%;
    margin: 0;
    padding: 0.25em 0.5em;

    display: flex;
    align-items: center;
    gap: 0.35em;

    background: none;
    color: $picnic-black;
    transition: all 0.2s ease-in-out;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    &:not(.disabled) {
      &:hover {
        background: $picnic-dull;
      }

      &.selected {
        background: $picnic-primary;
        color: $picnic-white;
      }
    }

    p {
      margin: 0;
      text-align: left;
      line-height: 1.2;

      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    div.action {
      margin-left: auto;
    }
  }
</style>

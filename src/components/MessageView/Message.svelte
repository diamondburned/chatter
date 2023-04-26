<script lang="ts" context="module">
  // Stolen from my own code :)
  // See github.com/diamondburned/kaicord

  import * as simplemarkdown from "simple-markdown";
  import * as discordmarkdown from "discord-markdown-parser";
  import twitchEmojis from "#/lib/twitch-emojis.json";

  type outputFn = simplemarkdown.NodeOutput<HTMLElement | string>;

  type Rule = simplemarkdown.ParserRule & {
    elem: outputFn;
  };

  type ArrayRule = simplemarkdown.ArrayRule & {
    elem: simplemarkdown.ArrayNodeOutput<HTMLElement | string>;
  };

  function newArrayElem(): HTMLSpanElement {
    const span = document.createElement("span");
    span.classList.add("md-array");
    return span;
  }

  function w(
    tag: string,
    inner?: string | HTMLElement,
    attrs?: Record<string, string>
  ): HTMLElement {
    const el = document.createElement(tag);
    if (inner) {
      el.append(inner);
    }
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
      }
    }
    return el;
  }

  function sv<T extends any>(
    component: T,
    props: Record<string, any>
  ): HTMLElement {
    const div = newArrayElem();
    new (component as any)({
      target: div,
      props,
    });
    return div;
  }

  const rules: Record<string, Rule> = {
    blockQuote: {
      ...discordmarkdown.rules.blockQuote,
      elem: (node, elem, state) => w("blockquote", elem(node.content, state)),
    },
    codeBlock: {
      ...discordmarkdown.rules.codeBlock,
      elem: (node) =>
        w("pre", w("code", node.content), { "data-lang": node.lang }),
    },
    em: {
      ...discordmarkdown.rules.em,
      elem: (node, elem, state) => w("em", elem(node.content, state)),
    },
    strong: {
      ...discordmarkdown.rules.strong,
      elem: (node, elem, state) => w("strong", elem(node.content, state)),
    },
    underline: {
      ...discordmarkdown.rules.underline,
      elem: (node, elem, state) => w("u", elem(node.content, state)),
    },
    inlineCode: {
      ...discordmarkdown.rules.inlineCode,
      elem: (node) => w("code", node.content),
    },
    br: {
      ...discordmarkdown.rules.br,
      elem: () => w("br"),
    },
    text: {
      ...discordmarkdown.rules.text,
      elem: (node) => node.content,
    },
    newline: {
      ...discordmarkdown.rules.newline,
      elem: () => "\n",
    },
    escape: {
      // What is this even for?
      ...discordmarkdown.rules.escape,
      elem: (node, elem, state) => elem(node.content, state),
    },
    autolink: {
      ...discordmarkdown.rules.autolink,
      elem: (node) => {
        const href = node.target.replaceAll("https?://", ""); // honestly?
        return w("a", href, { href, target: "_blank" });
      },
    },
    url: {
      ...discordmarkdown.rules.url,
      elem: (node, elem, state) => {
        const href = node.target.replaceAll("https?://", "");
        return w("a", elem(node.content, state), { href, target: "_blank" });
      },
    },
    emoji: {
      order: simplemarkdown.defaultRules.strong.order,
      match: (source) => {
        const capture = source.match(/^:(\w+):/);
        if (capture && twitchEmojis[capture[1]]) {
          return capture;
        }
        return null;
      },
      parse: (capture) => {
        const name = capture[1];
        return {
          name,
          url: twitchEmojis[name],
        };
      },
      elem: (node) => {
        const img = document.createElement("img");
        img.src = node.url;
        img.alt = `${node.name} emoji`;
        img.title = `:${node.name}:`;
        img.classList.add("twitch-emoji");
        return img;
      },
    },
  };

  const allRules = {
    ...rules,
    Array: {
      elem: (array, elem, state) => {
        if (array.length == 1) {
          return elem(array[0], state);
        }
        const span = newArrayElem();
        array.forEach((e) => span.append(elem(e, state)));
        return span;
      },
    } as ArrayRule,
  };

  export const renderer = simplemarkdown.outputFor(allRules, "elem");
  export const parser = simplemarkdown.parserFor(allRules);
</script>

<script lang="ts">
  import type * as api from "#/lib/api/index.js";

  export let event: Extract<api.RoomEvent, { type: "message_create" }>;

  let p: HTMLElement | undefined;
  let prev: string;
  let onlyEmoji = false;
  $: {
    if (p && prev != event.content.markdown) {
      const ast = parser(event.content.markdown, { inline: true });
      const out = renderer(ast, { event });
      p.replaceChildren(out);
      prev = event.content.markdown;
      // onlyEmoji is true if the rendered HTML has no text nodes at all.
      // It's a pretty lazy way to check this.
      onlyEmoji = out.textContent?.trim() == "";
    }
  }
</script>

{#key event.content.markdown}
  <p class="markdown" class:only-emoji={onlyEmoji} bind:this={p} />
{/key}

<style lang="scss">
  p {
    margin: 0;
    white-space: pre-wrap;
    overflow: hidden;

    :global(code) {
      padding: 0;
      background: none;
      font-size: inherit;
    }

    :global(pre) {
      margin: 0.25em 0;
      overflow: auto;
      scrollbar-width: thin;
    }

    :global(img.twitch-emoji) {
      --size: 1.15em;
      width: var(--size);
      height: var(--size);
      object-fit: contain;
    }

    &.only-emoji :global(img.twitch-emoji) {
      --size: 2em;
    }

    &:not(.only-emoji) :global(img.twitch-emoji) {
      vertical-align: middle;
    }
  }
</style>

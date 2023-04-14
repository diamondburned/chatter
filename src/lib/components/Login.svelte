<script lang="ts">
  import * as api from "#/lib/api/index.js";
  import { goto } from "$app/navigation";

  export let register = false;
  $: title = register ? "Register" : "Login";

  let error = "";
  let busy = false;

  function submit(e: SubmitEvent) {
    let path = "/api/v0/" + (register ? "register" : "login");
    let headers = new Headers();

    let data = new FormData(e.target as HTMLFormElement);
    if (data.has("secret")) {
      headers.append("X-Registration-Secret", data.get("secret") as string);
    }

    let body = {}; // same as RegisterRequest
    for (let [key, value] of data) {
      body[key] = value as string;
    }

    busy = true;
    error = "";
    (async () => {
      try {
        const res = await api.request<api.LoginResponse>(path, {
          body: JSON.stringify(body),
          method: "POST",
          headers,
        });
        localStorage.setItem("chatter_token", res.token);
        goto("/");
      } catch (err) {
        error = `${err}`;
      } finally {
        busy = false;
      }
    })();
  }
</script>

<main>
  <h2>
    {title} to
    <span class="brand">chatter</span>
  </h2>
  <form on:submit|preventDefault={submit}>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <input type="text" name="username" placeholder="Username" />
    <input type="password" name="password" placeholder="Password" />
    {#if register}
      <input type="password" name="secret" placeholder="Registration Secret" />
    {/if}
    <button type="submit" disabled={busy}>{title}</button>
    {#if register}
      <p class="extra">
        Already have an account? <a href="/login">Login instead.</a>
      </p>
    {:else}
      <p class="extra">
        Don't have an account? <a href="/register">Register here!</a>
      </p>
    {/if}
  </form>
</main>

<style lang="scss">
  span.brand {
    font-family: Nunito, sans-serif;
  }

  main {
    width: 100%;
    max-width: 400px;
    margin: auto;
    padding: 1em;
    font-size: 1.1em;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  form > *,
  form > [type="submit"] {
    margin: 0;
    padding: 0.5em;
    height: auto;
  }

  p.error {
    padding: 0;
  }

  p.extra {
    text-align: center;
  }
</style>

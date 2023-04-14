<script>
  import "#/styles/picnic.scss";
</script>

<div class="app">
  <slot />
</div>

<style>
  .app {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>

import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import path from "path";

// https://github.com/vitejs/vite/issues/7385#issuecomment-1286606298
export default defineConfig({
  plugins: [sveltekit()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: [
          `@import "${path.resolve("./src/styles/variables.scss")}";`,
        ].join("\n"),
      },
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  resolve: {
    alias: {
      "#": path.resolve("./src"),
    },
  },
});

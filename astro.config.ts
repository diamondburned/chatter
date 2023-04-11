import { defineConfig } from "astro/config";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { config as viteConfig } from "./vite.config.js";
import path from "path";

export default defineConfig({
  // your configuration options here...
  // https://docs.astro.build/en/reference/configuration-reference/
  output: "server",
  server: {
    host: true,
    port: 3000,
  },
  vite: viteConfig,
});

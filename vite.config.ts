import { defineConfig } from "vite";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import path from "path";

// https://github.com/vitejs/vite/issues/7385#issuecomment-1286606298
export default defineConfig({
  resolve: {
    alias: {
      "#lib": path.resolve(__dirname, "./src/lib/"),
      "#pages": path.resolve(__dirname, "./src/pages/"),
      "#components": path.resolve(__dirname, "./src/components/"),
    },
  },
});

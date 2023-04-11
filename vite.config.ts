import { defineConfig } from "vite";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import path from "path";

export const config = {
  resolve: {
    alias: {
      "#lib": path.resolve("./src/lib/"),
      "#pages": path.resolve("./src/pages/"),
      "#components": path.resolve("./src/components/"),
    },
  },
};

// https://github.com/vitejs/vite/issues/7385#issuecomment-1286606298
export default defineConfig(config);

import { defineConfig } from "vite";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import path from "path";

export const config = {
  resolve: {
    alias: {
      "#": path.resolve("./src"),
    },
  },
};

// https://github.com/vitejs/vite/issues/7385#issuecomment-1286606298
export default defineConfig(config);

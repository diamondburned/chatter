import netlify from "@sveltejs/adapter-netlify";
import { vitePreprocess } from "@sveltejs/kit/vite";

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: netlify({
      // split: true,
    }),
  },
};

export default config;

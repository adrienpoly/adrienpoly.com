// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { figureCaptions, quoteAttributions } from "./src/markdown/hast-plugins.mjs";
import { codeTitle } from "./src/markdown/shiki-code-title.mjs";

export default defineConfig({
  site: "https://adrienpoly.com",
  trailingSlash: "always",
  integrations: [sitemap()],
  markdown: {
    processor: satteri({ hastPlugins: [figureCaptions, quoteAttributions] }),
    shikiConfig: {
      theme: "vesper",
      transformers: [codeTitle()],
    },
  },
});

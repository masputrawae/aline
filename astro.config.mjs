// @ts-check
import { defineConfig } from "astro/config"
import { unified } from "@astrojs/markdown-remark"

import path from "node:path"

import tailwindcss from "@tailwindcss/vite"

// remark plugins
import remarkRelativePath from "./src/lib/plugins/remark-relative-path"
import remarkWikiLink from "./src/lib/plugins/remark-wiki-link"
import remarkFrontmatter from "./src/lib/plugins/remark-frontmatter"

// https://astro.build/config
export default defineConfig({
  site: "http://localhost:4321",
  base: "/",
  trailingSlash: "always",
  publicDir: path.resolve("registry/assets"),
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkRelativePath,
        [
          remarkWikiLink,
          {
            contentDir: path.resolve("registry"),
            assetDir: path.resolve("registry/assets"),
            assetAlias: "@assets",
          },
        ],
        remarkFrontmatter,
      ],
    }),
  },
})

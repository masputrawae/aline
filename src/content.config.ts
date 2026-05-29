import type { ImageFunction } from "astro:content"
import { defineCollection } from "astro:content"
import { z } from "astro/zod"
import { glob } from "astro/loaders"
import { generateId } from "@lib/utils/generate-id"
import path from "node:path"

const REGISTRY = "registry"
const AUTHOR = "John Doe"

const defaultSchema = (image: ImageFunction) =>
  z.object({
    title: z.string(),
    description: z.string().optional().nullable(),

    tags: z.array(z.string()).optional().nullable(),
    categories: z.array(z.string()).optional().nullable(),
    images: z.array(image()).optional().nullable(),

    pubDate: z.coerce.date().optional().nullable(),
    updatedDate: z.coerce.date().optional().nullable(),

    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    author: z.string().default(AUTHOR),
  })

// 0. Index: index or _index files
const index = defineCollection({
  loader: glob({
    base: path.resolve(REGISTRY),
    pattern: "**/*{_index,index}.md",
    generateId: ({ entry }) => generateId(entry),
  }),
  schema: ({ image }) =>
    defaultSchema(image).extend({
      pageType: z
        .enum([
          "Website",
          "WebPage",
          "CollectionPage",
          "BlogPost",
          "Article",
          "NewsArticle",
          "AboutPage",
        ])
        .default("Website"),
    }),
})

// 1. Pages: Root-level files only (about.md, index.md, etc.)
const pages = defineCollection({
  loader: glob({
    base: path.resolve(REGISTRY),
    pattern: ["!**/*{_index,index}.md", "*.md"],
    generateId: ({ entry }) => generateId(entry),
  }),
  schema: ({ image }) =>
    defaultSchema(image).extend({
      pageType: z
        .enum([
          "Website",
          "WebPage",
          "CollectionPage",
          "BlogPost",
          "Article",
          "NewsArticle",
          "AboutPage",
        ])
        .default("WebPage"),
    }),
})

// 2. Blog: Professional content with strict requirements
const blog = defineCollection({
  loader: glob({
    base: path.resolve(REGISTRY, "blog"),
    pattern: ["**/*.md", "!**/*{_index,index}.md"],
    generateId: ({ entry }) => generateId(entry),
  }),
  schema: ({ image }) =>
    defaultSchema(image).extend({
      pubDate: z.coerce.date(), // Required for blog
      pageType: z
        .enum(["BlogPost", "Article", "NewsArticle"])
        .default("BlogPost"),
    }),
})

// 3. Projects: Showcase content with specific fields
const projects = defineCollection({
  loader: glob({
    base: path.resolve(REGISTRY, "projects"),
    pattern: ["**/*.md", "!**/*{_index,index}.md"],
    generateId: ({ entry }) => generateId(entry),
  }),
  schema: ({ image }) =>
    defaultSchema(image).extend({
      repoURL: z.url(),
      demoURL: z.url().optional().nullable(),
      stacks: z.array(z.string()).default([]),
      pageType: z.literal("CreativeWork").default("CreativeWork"),
    }),
})

// 4. Notes: Digital Garden - Flexible and catch-all
const notes = defineCollection({
  loader: glob({
    base: path.resolve(REGISTRY, "notes"),
    pattern: ["**/*.md", "!**/*{_index,index}.md"],
    generateId: ({ entry }) => generateId(entry),
  }),
  schema: z
    .object({
      title: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
    })
    .catchall(z.any()),
})

export const collections = { pages, blog, projects, notes, index }

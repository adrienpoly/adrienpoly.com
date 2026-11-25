import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One folder per article: src/content/articles/<slug>/index.md, images next to it.
const articles = defineCollection({
  loader: glob({ base: "./src/content/articles", pattern: "*/index.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };

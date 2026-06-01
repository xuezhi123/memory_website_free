import { defineCollection, z } from "astro:content";

/**
 * Article collection schema.
 * Each .md file in src/content/articles/ must include frontmatter matching this shape.
 */
const articles = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string().optional(),
  }),
});

export const collections = { articles };

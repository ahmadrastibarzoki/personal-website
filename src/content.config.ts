import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const insights = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/insights'
  }),
  schema: z.object({
    title: z.string().min(15).max(120),
    description: z.string().min(70).max(190),
    summary: z.string().min(60).max(500),
    category: z.string().min(2).max(80),
    datePublished: z.coerce.date(),
    dateModified: z.coerce.date().optional(),
    keywords: z.array(z.string().min(2).max(80)).min(3).max(12),
    image: z.string().min(2),
    imageAlt: z.string().min(5).max(180),
    draft: z.boolean().default(false),
    sources: z.array(
      z.object({
        title: z.string().min(2).max(180),
        url: z.string().url()
      })
    ).default([])
  })
});

export const collections = { insights };

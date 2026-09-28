import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const schema = z.object({
  title: z.string().min(10).max(140),
  description: z.string().min(60).max(220),
  summary: z.string().min(50).max(600),
  category: z.string().min(2).max(80),
  datePublished: z.coerce.date(),
  dateModified: z.coerce.date().optional(),
  keywords: z.array(z.string().min(2).max(80)).min(3).max(14),
  image: z.string().min(2),
  imageAlt: z.string().min(5).max(200),
  draft: z.boolean().default(false),
  sources: z.array(z.object({ title:z.string(), url:z.string().url() })).default([])
});

const insights = defineCollection({ loader:glob({pattern:'**/*.md',base:'./src/content/insights'}), schema });
const insightsFa = defineCollection({ loader:glob({pattern:'**/*.md',base:'./src/content/insights-fa'}), schema });
export const collections = { insights, insightsFa };

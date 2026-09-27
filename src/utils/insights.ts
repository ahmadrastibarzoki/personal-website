import { getCollection, type CollectionEntry } from 'astro:content';

export type InsightEntry = CollectionEntry<'insights'>;

export async function getPublishedInsights(): Promise<InsightEntry[]> {
  const posts = await getCollection('insights', ({ data }) => !data.draft);

  return posts.sort(
    (a, b) => b.data.datePublished.getTime() - a.data.datePublished.getTime()
  );
}

export function estimateReadingTime(body?: string): string {
  const cleaned = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned ? cleaned.split(' ').length : 0;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

export function formatInsightDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function insightModifiedDate(post: InsightEntry): Date {
  return post.data.dateModified ?? post.data.datePublished;
}

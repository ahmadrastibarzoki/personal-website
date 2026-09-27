import type { APIRoute } from 'astro';
import { getPublishedInsights, insightModifiedDate } from '../utils/insights';

export const prerender = true;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('Site URL is not configured.', { status: 500 });
  }

  const posts = await getPublishedInsights();
  const channelURL = new URL('/insights', site).href;
  const latest = posts[0] ? insightModifiedDate(posts[0]) : new Date('2026-09-27T00:00:00Z');

  const items = posts.slice(0, 50).map((post) => {
    const url = new URL(`/insights/${post.id}`, site).href;

    return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${post.data.datePublished.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description)}</description>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Insights by Ahmad Rasti Barzoki</title>
    <link>${escapeXml(channelURL)}</link>
    <description>Technical and research insights on AI, data science, graph machine learning, analytics engineering and responsible AI.</description>
    <language>en</language>
    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8'
    }
  });
};

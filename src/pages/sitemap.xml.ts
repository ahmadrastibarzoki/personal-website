import type { APIRoute } from 'astro';
import { getPublishedInsights, insightModifiedDate } from '../utils/insights';

export const prerender = true;

const staticPaths = [
  '/',
  '/about',
  '/research',
  '/projects',
  '/publications',
  '/cv',
  '/contact'
];

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
  const latestInsightDate = posts[0] ? insightModifiedDate(posts[0]) : undefined;

  const staticUrls = staticPaths.map((pathname) => ({
    loc: new URL(pathname, site).href
  }));

  const insightIndex = {
    loc: new URL('/insights', site).href,
    lastmod: latestInsightDate?.toISOString().slice(0, 10)
  };

  const insightUrls = posts.map((post) => ({
    loc: new URL(`/insights/${post.id}`, site).href,
    lastmod: insightModifiedDate(post).toISOString().slice(0, 10)
  }));

  const urls = [...staticUrls, insightIndex, ...insightUrls];

  const body = urls
    .map(({ loc, lastmod }) => {
      const modified = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
      return `  <url><loc>${escapeXml(loc)}</loc>${modified}</url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};

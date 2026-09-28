import type { APIRoute } from 'astro';
import { getPublishedPersianInsights, insightModifiedDate } from '../../utils/insights';
export const prerender=true;
const esc=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

export const GET:APIRoute=async({site})=>{
  if(!site) return new Response('Site URL is not configured.',{status:500});
  const posts=await getPublishedPersianInsights();
  const link=new URL('/fa/insights',site).href;
  const latest=posts[0]?insightModifiedDate(posts[0]):new Date('2026-09-27T00:00:00Z');
  const items=posts.slice(0,50).map(post=>{
    const url=new URL(`/fa/insights/${post.id}`,site).href;
    return `    <item><title>${esc(post.data.title)}</title><link>${esc(url)}</link><guid isPermaLink="true">${esc(url)}</guid><pubDate>${post.data.datePublished.toUTCString()}</pubDate><description>${esc(post.data.description)}</description></item>`;
  }).join('\n');
  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>یادداشت‌های احمد راستی برزکی</title>
<link>${esc(link)}</link>
<description>یادداشت‌های فنی و پژوهشی درباره هوش مصنوعی، علم داده، یادگیری ماشین روی گراف و مهندسی داده.</description>
<language>fa</language><lastBuildDate>${latest.toUTCString()}</lastBuildDate>
${items}
</channel></rss>`;
  return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
};

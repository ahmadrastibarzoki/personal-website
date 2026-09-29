import type { APIRoute } from 'astro';
import { getPublishedInsights, getPublishedPersianInsights, insightModifiedDate } from '../utils/insights';
export const prerender = true;

const staticPairs=[
  ['/','/fa'],['/about','/fa/about'],['/research','/fa/research'],['/projects','/fa/projects'],
  ['/publications','/fa/publications'],['/services','/fa/services'],['/cv','/fa/cv'],['/contact','/fa/contact'],['/insights','/fa/insights']
] as const;

const esc=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const alts=(en:string,fa:string)=>[
  `<xhtml:link rel="alternate" hreflang="en" href="${esc(en)}" />`,
  `<xhtml:link rel="alternate" hreflang="fa" href="${esc(fa)}" />`,
  `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(en)}" />`
].join('');

export const GET: APIRoute=async({site})=>{
  if(!site) return new Response('Site URL is not configured.',{status:500});
  const enPosts=await getPublishedInsights(), faPosts=await getPublishedPersianInsights();
  const em=new Map(enPosts.map(p=>[p.id,p])), fm=new Map(faPosts.map(p=>[p.id,p]));
  const out:string[]=[];

  for(const [ep,fp] of staticPairs){
    const en=new URL(ep,site).href, fa=new URL(fp,site).href, links=alts(en,fa);
    out.push(`  <url><loc>${esc(en)}</loc>${links}</url>`);
    out.push(`  <url><loc>${esc(fa)}</loc>${links}</url>`);
  }

  for(const slug of new Set([...em.keys(),...fm.keys()])){
    const e=em.get(slug), f=fm.get(slug);
    if(e&&f){
      const en=new URL(`/insights/${slug}`,site).href, fa=new URL(`/fa/insights/${slug}`,site).href, links=alts(en,fa);
      out.push(`  <url><loc>${esc(en)}</loc><lastmod>${insightModifiedDate(e).toISOString().slice(0,10)}</lastmod>${links}</url>`);
      out.push(`  <url><loc>${esc(fa)}</loc><lastmod>${insightModifiedDate(f).toISOString().slice(0,10)}</lastmod>${links}</url>`);
    } else if(e){
      const en=new URL(`/insights/${slug}`,site).href;
      out.push(`  <url><loc>${esc(en)}</loc><lastmod>${insightModifiedDate(e).toISOString().slice(0,10)}</lastmod></url>`);
    } else if(f){
      const fa=new URL(`/fa/insights/${slug}`,site).href;
      out.push(`  <url><loc>${esc(fa)}</loc><lastmod>${insightModifiedDate(f).toISOString().slice(0,10)}</lastmod></url>`);
    }
  }

  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${out.join('\n')}
</urlset>
`;
  return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};

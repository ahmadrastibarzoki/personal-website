import { getCollection, type CollectionEntry } from 'astro:content';
export type InsightEntry = CollectionEntry<'insights'>;
export type PersianInsightEntry = CollectionEntry<'insightsFa'>;

export async function getPublishedInsights() {
  return (await getCollection('insights',({data})=>!data.draft))
    .sort((a,b)=>b.data.datePublished.getTime()-a.data.datePublished.getTime());
}
export async function getPublishedPersianInsights() {
  return (await getCollection('insightsFa',({data})=>!data.draft))
    .sort((a,b)=>b.data.datePublished.getTime()-a.data.datePublished.getTime());
}
export function estimateReadingMinutes(body='') {
  const t=body.replace(/```[\s\S]*?```/g,' ').replace(/`[^`]*`/g,' ')
    .replace(/<[^>]+>/g,' ').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
    .replace(/[#>*_~|-]/g,' ').replace(/\s+/g,' ').trim();
  return Math.max(1,Math.ceil((t?t.split(' ').length:0)/220));
}
export const estimateReadingTime=(body='')=>`${estimateReadingMinutes(body)} min read`;
export const formatInsightDate=(d)=>new Intl.DateTimeFormat('en-US',{
  month:'long',day:'numeric',year:'numeric',timeZone:'UTC'
}).format(d);
export const formatPersianInsightDate=(d)=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{
  year:'numeric',month:'long',day:'numeric',timeZone:'UTC'
}).format(d);
export const insightModifiedDate=(p)=>p.data.dateModified ?? p.data.datePublished;

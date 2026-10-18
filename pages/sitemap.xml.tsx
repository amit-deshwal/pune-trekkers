import type { GetServerSideProps } from 'next'
import { site,routes } from '../lib/site'
import { crew } from '../lib/crew'
import { getCachedContent } from '../lib/content'
import { upcomingTreks } from '../lib/content-schema'
import { maharashtraGuides } from '../lib/maharashtra-explorer'
const xmlEscape=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')
export const getServerSideProps:GetServerSideProps=async({res})=>{const {content,contentUnavailable}=await getCachedContent(res);const dynamic=[...(!contentUnavailable?upcomingTreks(content.treks).map(t=>`/treks/${t.slug}`):[]),...content.impactReports.map(r=>`/conservation/${r.slug}`),...maharashtraGuides.map(guide=>`/treks-near-pune/${guide.slug}`)];res.setHeader('Content-Type','application/xml');res.write(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site.launchReady?[...routes,...(crew.length?['/crew']:[]),...dynamic].map(route=>`<url><loc>${xmlEscape(site.url+route)}</loc></url>`).join(''):''}</urlset>`);res.end();return {props:{}}}
export default function Sitemap(){return null}

import type { GetServerSideProps } from 'next'
import { site } from '../lib/site'
export const getServerSideProps:GetServerSideProps=async({res})=>{res.setHeader('Content-Type','text/plain');res.setHeader('Cache-Control','public, s-maxage=86400');res.write(site.launchReady?`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: ${site.url}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');res.end();return {props:{}}}
export default function Robots(){return null}

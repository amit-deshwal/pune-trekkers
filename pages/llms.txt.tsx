import type { GetServerSideProps } from 'next'
import { site } from '../lib/site'
import { faqs } from '../components/Shared'
import { maharashtraGuides } from '../lib/maharashtra-explorer'
// Plain-text summary for AI assistants (llmstxt.org). Mirrors facts already shown on the site.
const body=()=>`# ${site.name}

> ${site.description}

Pune Trekkers is a free, volunteer-run trekking community in Pune, Maharashtra, with about 2,300 members across three WhatsApp groups. It started from a Reddit conversation and grew by word of mouth. It is not a tour company: there is no membership fee, plans are shared openly, and participants split actual costs (transport, food, entry fees) with no markup or profit. Beginners, women and solo trekkers are welcome.

Past community treks include Rajgad, Sinhagad (K2S), Harishchandragad, Kalsubai, Ratangad, Visapur, Sudhagad, Kalavantin and Prabalgad, Tung, Rohida, Jivdhan and Chanderi, plus hill-cleaning and tree-plantation drives.

## Key pages
- [Join the free WhatsApp group](${site.url}/join): rules and the official invite link
- [Upcoming treks](${site.url}/treks): organizer-confirmed and proposed treks
- [Member hikes](${site.url}/plans): hikes proposed by members
- [Treks near Pune](${site.url}/treks-near-pune): forts and trails by distance and difficulty
- [Our story](${site.url}/about)
- [FAQ](${site.url}/faq)
- [Safety & inclusion](${site.url}/safety)
- [Past treks & gallery](${site.url}/past-treks)

## Trek guides
${maharashtraGuides.map(g=>`- [${g.name}](${site.url}/treks-near-pune/${g.slug}): ${g.short}`).join('\n')}

## FAQ
${faqs.map(([q,a])=>`### ${q}\n${a}`).join('\n\n')}
`
export const getServerSideProps:GetServerSideProps=async({res})=>{if(!site.launchReady){res.statusCode=404;res.end();return {props:{}}}res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','public, s-maxage=86400');res.write(body());res.end();return {props:{}}}
export default function Llms(){return null}

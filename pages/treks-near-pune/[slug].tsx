import { readFileSync } from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import type { GetStaticPaths, GetStaticProps } from 'next'
import Seo from '../../components/Seo'
import { ButtonLink, Note, PageIntro } from '../../components/Shared'
import { guideBySlug, maharashtraGuides, type MaharashtraGuide } from '../../lib/maharashtra-explorer'
import { km, PUNE } from '../../lib/hikes'
import { breadcrumbJsonLd } from '../../lib/seo'
import { site } from '../../lib/site'

type Start={name:string;note:string;lat:number;lon:number;verified:boolean}
type Facts={heightM:number|null;km:number;starts:Start[]}
const directions=(s:{lat:number;lon:number})=>`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}&travelmode=driving`

// Guides are bundled editorial content, so every page is built ahead of time.
export const getStaticPaths:GetStaticPaths=async()=>({paths:maharashtraGuides.map(guide=>({params:{slug:guide.slug}})),fallback:false})
// Height and start points come from the sourced fort dataset; only verified base villages are shown as starts.
export const getStaticProps:GetStaticProps=async({params})=>{
  const guide=guideBySlug(String(params?.slug||''));if(!guide)return{notFound:true}
  const hikes:{slug:string;lat:number;lon:number;elevationM:number|null;starts:Start[]}[]=JSON.parse(readFileSync(path.join(process.cwd(),'public/data/hikes.json'),'utf8'))
  const hike=hikes.find(h=>h.slug===guide.hike)
  const starts=hike?.starts.filter(s=>s.verified).map(({name,note,lat,lon,verified})=>({name,note:note||'',lat,lon,verified}))??[]
  const facts:Facts|null=hike?{heightM:hike.elevationM,km:Math.round(Math.min(km(PUNE,hike),...starts.map(s=>km(PUNE,s)))),starts}:null
  return{props:{guide,facts}}
}
export default function MaharashtraGuidePage({guide,facts}:{guide:MaharashtraGuide;facts:Facts|null}){const starts=facts?.starts??[];const startNames=starts.map(s=>s.name).join(' or ');const related=maharashtraGuides.filter(item=>item.slug!==guide.slug&&item.difficulty===guide.difficulty).slice(0,2);return <><Seo title={`${guide.name} trek from Pune: ${starts.length?'start point, ':''}distance & difficulty`} description={[`${guide.name} trek: ${guide.difficulty.toLowerCase()}`,facts?.heightM?`${facts.heightM} m high`:'',facts?`about ${facts.km} km from Pune`:'',startNames?`starting from ${startNames}`:''].filter(Boolean).join(', ')+`. ${guide.short} Who it suits, when to go and how to prepare.`} jsonLd={breadcrumbJsonLd(site.url,[['Home','/'],['Treks near Pune','/treks-near-pune'],[guide.name,`/treks-near-pune/${guide.slug}`]])}/><PageIntro eyebrow={`${guide.difficulty.toUpperCase()} · ${guide.kind.toUpperCase()}`} title={guide.name}>{guide.region} · An original orientation guide for a self-planned day outdoors.</PageIntro><article className="container guide-layout"><div className="guide-main"><p className="guide-lede">{guide.intro}</p>{starts.length>0&&<><h2>Where the {guide.name} trek starts</h2><ul>{starts.map(s=><li key={s.name}><strong>{s.name}</strong>{s.note?`: ${s.note}`:''} <a href={directions(s)} target="_blank" rel="noopener noreferrer">Directions ↗</a></li>)}</ul></>}<h2>Who this suits</h2><p>{guide.goodFor}</p><h2>Before you leave</h2><ul>{guide.readiness.map(item=><li key={item}>{item}</li>)}</ul><h2>Season and conditions</h2><p>{guide.season}</p><h2>Leave the place better</h2><p>{guide.respect}</p><Note><strong>Not a live route briefing.</strong> Check local access, forecasts, transport, permissions and trail condition on the day. Turn back early if the conditions, route or group no longer feel safe.</Note><h2>Where these facts came from</h2><p>This guide is original Pune Trekkers writing. We used <a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer">{guide.sourceLabel} ↗</a> to verify high-level destination context; it is not an endorsement or a substitute for local instructions.</p><ButtonLink href="/safety" secondary>Read safety and preparation</ButtonLink></div><aside className="guide-aside"><span className={`guide-level difficulty-${guide.difficulty.toLowerCase()}`}>{guide.difficulty}</span><dl><div><dt>Region</dt><dd>{guide.region}</dd></div><div><dt>Experience</dt><dd>{guide.kind}</dd></div>{facts?.heightM?<div><dt>Height</dt><dd>{facts.heightM.toLocaleString('en-IN')} m</dd></div>:null}{facts&&<div><dt>From Pune</dt><dd>About {facts.km} km in a straight line; the drive is longer</dd></div>}{startNames&&<div><dt>Base village</dt><dd>{startNames}</dd></div>}<div><dt>Format</dt><dd>Independent planning guide</dd></div></dl>{related.length?<><h2>Same level, another day</h2>{related.map(item=><Link key={item.slug} href={`/treks-near-pune/${item.slug}`}>{item.name} →</Link>)}</>:null}<Link href="/treks-near-pune">All treks near Pune →</Link></aside></article></>}

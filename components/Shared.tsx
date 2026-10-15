import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Icon, { type IconName } from './Icon'
import TripModal from './TripModal'
import { formatDate, formatMonth, formatTime } from '../lib/site'
import { realText, type Place } from '../lib/places'
import type { Trek, Photo } from '../lib/content-schema'
export function ButtonLink({ href, children, secondary=false }: { href:string;children:ReactNode;secondary?:boolean }) { return <Link href={href} className={`button ${secondary?'button-outline':''}`}>{children}<Icon name="arrow" size={18}/></Link> }
export function PageIntro({ eyebrow, title, children }: {eyebrow:string;title:string;children:ReactNode}) {return <div className="page-intro container"><span className="eyebrow"><span/>{eyebrow}</span><h1>{title}</h1><p>{children}</p></div>}
export function SectionHeading({ eyebrow,title,children,href,link }: {eyebrow:string;title:string;children?:ReactNode;href?:string;link?:string}) {return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{children&&<p>{children}</p>}</div>{href&&<Link href={href} className="text-link">{link}<Icon name="arrow" size={19}/></Link>}</div>}
export function Note({children}: {children:ReactNode}) {return <div className="note"><Icon name="compass" size={20}/><div>{children}</div></div>}
export function JoinBanner() {return <section className="join-banner container"><div className="join-icon"><Icon name="mountain" size={58}/></div><div><span className="eyebrow">YOUR NEXT CHAPTER STARTS OUTSIDE</span><h2>Come for the trail. Stay for the people.</h2><p>You don’t need a group of friends to start. You’ll find one here.</p></div><ButtonLink href="/join">Find your community</ButtonLink></section>}
export function PhotoImage({photo,priority=false, className=''}: {photo:Photo;priority?:boolean;className?:string}) {const [failed,setFailed]=useState(false);return failed?<div className={`photo-fallback ${className}`}><Icon name="mountain" size={40}/><span>Photo unavailable</span></div>:<Image className={className} src={photo.src} alt={photo.alt} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" priority={priority} unoptimized={photo.src.startsWith('/api/media/')} onError={()=>setFailed(true)} style={{objectFit:'cover'}}/>}
const previews:Record<string,number>={'jivdhan-night-camping':13,'devkund-waterfall':11,'ratangad':10,'tarsar-marsar-trek':9,'rohida-fort':7,'goradeshwar':6,'kalavantin-and-prabalgad':5,'rajgad-fort':1}
export const hasArchiveImage=(trek:Trek,preview:boolean)=>Boolean(trek.photos[0]||(preview&&previews[trek.slug]))
export function ArchiveImage({trek,preview=false}: {trek:Trek;preview?:boolean}) {
  const [missing,setMissing]=useState(false);const ref=useRef<HTMLImageElement>(null)
  useEffect(()=>{const el=ref.current;if(el&&el.complete&&el.naturalWidth===0)setMissing(true)},[])
  if(trek.photos[0])return <PhotoImage photo={trek.photos[0]}/>
  if(preview&&previews[trek.slug]&&!missing)return <img ref={ref} src={`/api/preview-photo/${previews[trek.slug]}`} alt={`Original ${trek.name} archive photograph, local preview`} loading="lazy" onError={()=>setMissing(true)}/>
  return null
}
const plural=(n:number,word:string)=>`${n} ${word}${n===1?'':'s'}`
export function PlaceCard({place,preview=false}: {place:Place;preview?:boolean}) {
  const [open,setOpen]=useState(false)
  const {visits}=place,latest=visits[0],single=visits.length===1
  const cover=visits.find(v=>v.photos.length)||latest
  const photos=visits.reduce((n,v)=>n+v.photos.length,0),videos=visits.reduce((n,v)=>n+v.videos.length,0)
  const chip=[!single&&`${visits.length} visits`,photos&&plural(photos,'photo'),videos&&plural(videos,'video')].filter(Boolean).join(' · ')
  const title=single?latest.name:place.name
  const location=single?realText(latest.destination):''
  const summary=single?realText(latest.summary):''
  const date=latest.date?(single?formatDate(latest.date):`Last visit ${formatMonth(latest.date)}`):''
  return <article className="trek-card past-card">{hasArchiveImage(cover,preview)&&<div className="card-picture"><ArchiveImage trek={cover} preview={preview}/>{chip&&<span className="media-chip">{chip}</span>}</div>}<div className="card-body">{date&&<span className="card-meta"><Icon name="calendar" size={14}/>{date}</span>}<div className="card-title-row"><h3><button type="button" className="card-open" onClick={()=>setOpen(true)} aria-haspopup="dialog">{title}</button></h3><Icon name="arrow" size={19}/></div>{location&&location.toLowerCase()!==title.toLowerCase()&&<span className="card-meta"><Icon name="pin" size={14}/>{location}</span>}{summary&&<p>{summary}</p>}</div><TripModal place={place} open={open} onClose={()=>setOpen(false)} fallback={trek=><ArchiveImage trek={trek} preview={preview}/>}/></article>
}
export function TrekCard({trek,preview=false}: {trek:Trek;preview?:boolean}) {const past=trek.status==='completed';if(past)return <PlaceCard place={{key:trek.slug,name:trek.name,visits:[trek]}} preview={preview}/>;return <article className="trek-card">{(()=>{const tag=past?'FROM THE ARCHIVE':trek.status==='confirmed'?'CONFIRMED':'PROPOSED · NOT CONFIRMED';return hasArchiveImage(trek,preview)?<Link href={`${past?'/past-treks':'/treks'}/${trek.slug}`} className="card-picture" tabIndex={-1} aria-hidden="true"><ArchiveImage trek={trek} preview={preview}/><span className="image-tag">{tag}</span></Link>:null})()}<div className="card-body">{!hasArchiveImage(trek,preview)&&<span className="status-chip">{past?'FROM THE ARCHIVE':trek.status==='confirmed'?'CONFIRMED':'PROPOSED · NOT CONFIRMED'}</span>}<span className="card-meta"><Icon name="pin" size={14}/>{trek.destination}</span><h3><Link href={`${past?'/past-treks':'/treks'}/${trek.slug}`}>{trek.name}</Link></h3><p>{past?(trek.summary||'Small moments. Shared adventures. Stories worth keeping.'):trek.summary}</p><div className="card-bottom"><span>{trek.date?formatDate(trek.date)+(trek.startTime?` · ${formatTime(trek.startTime)}`:''):past?'Trek date being verified':'Date to be confirmed'}</span><Link href={`${past?'/past-treks':'/treks'}/${trek.slug}`} aria-label={`Explore ${trek.name}`}><Icon name="arrow" size={19}/></Link></div></div></article>}
export function Value({icon,title,children}: {icon:IconName;title:string;children:ReactNode}) {return <div className="value"><span className="icon-box"><Icon name={icon} size={25}/></span><h3>{title}</h3><p>{children}</p></div>}
export const faqs = [
  ['Is Pune Trekkers free to join?', 'Yes. Joining the community is free and there is no membership fee. On a trek, participants split the actual agreed expenses, such as transport, food and entry fees, and nobody makes a profit. On Maharashtra treks with 10 or more participants, an organiser may choose to have their own share covered by the group; our community rules explain how.'],
  ['Can I join on my own?', 'Absolutely. Many friendships begin at the meeting point. Introduce yourself to the coordinator, ask about the buddy arrangement, and choose a trek that suits your ability.'],
  ['I’m a beginner. Is this for me?', 'Yes, when the route suits your fitness and experience. Read the difficulty, duration and terrain notes, and speak with the coordinator before registering. “Easy” still means outdoor walking and uneven ground.'],
  ['Are women welcome?', 'Yes. Women are welcome as participants, coordinators and volunteers. Respect, consent and our anti-harassment rules apply to everyone. Check the safety page for reporting information and ask about arrangements before a trek.'],
  ['How much does a trek cost?', 'Current community treks are not organized for profit. Participants share actual agreed expenses, such as transport, entry fees and food. The estimate may change with group size or supplier costs; ask for the breakdown before committing.'],
  ['Does joining WhatsApp reserve a trek slot?', 'No. Community membership and trek registration are separate. Follow the individual trek’s registration steps and wait for an explicit slot confirmation from the coordinator.'],
  ['What if I cancel, or the weather changes?', 'Read the trek-specific cancellation terms before paying. Refunds depend on recoverable supplier costs and any replacement participant. Organizers may change or cancel a route for weather, access restrictions or safety; ask how shared costs will be settled.'],
  ['Is transport included?', 'It depends on the trek. The confirmed briefing will state the meeting point, transport arrangements and what the cost includes. Do not assume pickup or a return time unless the coordinator confirms it.'],
  ['How do I join the Pune Trekkers WhatsApp group?', 'Read the community rules on our Join page, then use the official WhatsApp invitation link there. About 2,300 people are in our three groups. Joining may make your phone number visible to other members, and group membership does not reserve a trek slot.'],
  ['How is this different from a paid trek company?', 'A commercial trek company sets a package price that includes its margin. Pune Trekkers is a volunteer-run community: plans are shared openly and costs are split among participants with no markup. Volunteer coordinators are not professional guides, so ask about the safety arrangements for each trek.'],
  ['Can I opt out of photos?', 'Yes. Tell the coordinator and photographer before the trek. We respect no-photo requests, and you can ask us to remove a website image at any time.'],
]
export function FAQList({limit,items=faqs}: {limit?:number;items?:string[][]}) {return <div className="faq-list">{items.slice(0,limit).map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>}

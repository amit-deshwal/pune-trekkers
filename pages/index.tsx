import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { getCachedContent } from '../lib/content'
import { upcomingTreks, type SiteContent } from '../lib/content-schema'
import { maharashtraGuides } from '../lib/maharashtra-explorer'
import Seo from '../components/Seo'
import Icon from '../components/Icon'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { phaseAt, phases, type Phase } from '../lib/phase'
import PuneWeather from '../components/PuneWeather'
import { ButtonLink, SectionHeading, TrekCard, PlaceCard, Value, JoinBanner, FAQList, PhotoImage } from '../components/Shared'
import { groupPlaces } from '../lib/places'
import { site } from '../lib/site'
import { organizationJsonLd, websiteJsonLd } from '../lib/seo'

const HeroScene=dynamic(()=>import('../components/HeroScene'),{ssr:false})

export const getServerSideProps:GetServerSideProps=async({res})=>({props:await getCachedContent(res)})

export default function Home({content,preview,contentUnavailable}: {content:SiteContent;preview:boolean;contentUnavailable:boolean}) {
  // Scene follows the visitor's local time; the Morning/Day/Dusk/Night buttons let anyone preview the others.
  const [phase,setPhase]=useState<Phase>('morning');const [manual,setManual]=useState(false)
  useEffect(()=>{if(manual)return;const sync=()=>setPhase(phaseAt());sync();const timer=setInterval(sync,60000);return()=>clearInterval(timer)},[manual])
  useEffect(()=>{document.documentElement.dataset.phase=phase},[phase])
  const upcoming=contentUnavailable?[]:upcomingTreks(content.treks)
  const past=content.treks.filter(t=>t.status==='completed')
  // Places with uploaded photos first, then the most recent.
  const diary=groupPlaces(past).sort((a,b)=>Number(b.visits.some(v=>v.photos.length))-Number(a.visits.some(v=>v.photos.length))).slice(0,3)
  const guides=maharashtraGuides.slice(0,5)
  return <>
    <Seo title="Free trekking group in Pune" fullTitle="Pune Trekkers: Free Trekking Group & Community in Pune" jsonLd={[organizationJsonLd(site),websiteJsonLd(site)]}/>

    <section className="hero2 container" aria-label="Introduction">
      <h1 className="hero2-title"><span>Good trails.</span><span>Better company.</span></h1>
      <div className="hero2-left">
        <span className="eyebrow">Free Pune trekking group</span>
        <p className="hero2-lede">Pune Trekkers is a free, volunteer-run trekking group that helps people in Pune get outdoors together. Treks are planned openly, actual costs are shared and no one makes a profit. Beginners and solo trekkers are welcome.</p>
        <div className="hero2-actions">
          <Link href="/join" className="cta-pill"><span className="cta-dot"><Icon name="arrow" size={20}/></span>Join the community</Link>
          <Link href="/treks" className="quiet-link">See upcoming treks</Link>
        </div>
      </div>
      <div className="scene-panel">
        <div className="scene-bg">
          <svg className="scene-poster" viewBox="0 0 800 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M0 420 160 300l90 70 150-190 140 170 90-60 170 150v200H0Z" className="ridge-far"/><path d="M400 180 372 222l16-8 12 16 12-16 16 8Z" fill="#fff" opacity=".9"/><path d="M0 500c140-90 260-60 380-120s250-20 420 70v190H0Z" className="ridge-mid"/><path d="M0 590c180-60 300-20 440-60s240-10 360 30v80H0Z" className="ridge-near"/></svg>
          {content.hero?<PhotoImage photo={content.hero} priority/>:<HeroScene phase={phase}/>}
        </div>
        <div className="scene-phases" role="group" aria-label="Time of day. The scene follows your local time; choose one to preview.">
          {phases.map(p=><button key={p.id} type="button" aria-pressed={p.id===phase} onClick={()=>{setManual(true);setPhase(p.id)}}>{p.label}</button>)}
        </div>
        <ul className="scene-chips" aria-label="What to expect">
          <li className="chip-a"><span className="chip-icon orange"><Icon name="rupee" size={18}/></span><span><small>Shared costs</small><b>Zero markup</b></span></li>
          <li className="chip-b"><span className="chip-icon logo"><img src="/images/brand/pune-trekkers-hiking-mark-v3-header.webp" alt="" width={30} height={30}/></span><span><small>New here?</small><b>Beginners welcome</b></span></li>
          <li className="chip-c"><span className="chip-icon green"><Icon name="chat" size={18}/></span><span><small>3 groups</small><b>Join on WhatsApp</b></span></li>
        </ul>
        <div className="scene-stat">
          <span className="stat-faces" aria-hidden="true"><i><Icon name="people" size={18}/></i><i><Icon name="heart" size={18}/></i><i><Icon name="mountain" size={18}/></i></span>
          <p><strong>~2,300</strong><span>members across 3 groups</span></p>
        </div>
        <PuneWeather/>
        {content.hero&&<p className="scene-caption">{content.hero.caption}</p>}
      </div>
      <ul className="hero2-pills">
        <li><Link href="/treks"><Icon name="calendar" size={18}/>Upcoming treks</Link></li>
        <li><Link href="/treks-near-pune"><Icon name="compass" size={18}/>Treks near Pune</Link></li>
        <li><Link href="/safety"><Icon name="shield" size={18}/>Safety &amp; preparation</Link></li>
        <li><Link href="/volunteer"><Icon name="heart" size={18}/>Volunteer</Link></li>
      </ul>
    </section>

    <section className="container section-space" style={{paddingTop:0}}>
      <SectionHeading eyebrow="Get involved" title="There’s a place for you here."/>
      <div className="involve-grid">
        <article className="involve-card"><span className="icon-box"><Icon name="chat" size={24}/></span><h3>Join the community</h3><p>Read the community rules and join our WhatsApp groups to hear about every plan.</p><Link href="/join" className="text-link">How to join <Icon name="arrow" size={18}/></Link></article>
        <article className="involve-card"><span className="icon-box"><Icon name="heart" size={24}/></span><h3>Volunteer</h3><p>Help with coordination, safety, photography or conservation. Every role is explained before you commit.</p><Link href="/volunteer" className="text-link">See volunteer roles <Icon name="arrow" size={18}/></Link></article>
        <article className="involve-card"><span className="icon-box"><Icon name="leaf" size={24}/></span><h3>Give back to the trails</h3><p>Learn how we plan to care for the places we walk, and how you can help.</p><Link href="/conservation" className="text-link">Our conservation vision <Icon name="arrow" size={18}/></Link></article>
      </div>
    </section>

    <section className="section-tinted">
      <div className="container section-space">
        <SectionHeading eyebrow="Upcoming treks" title="Find your next trail." href="/treks" link="View all treks">Each plan lists difficulty, cost and meeting details. A date on this site means the organizers have confirmed it.</SectionHeading>
        {upcoming.length
          ?<div className="card-grid">{upcoming.slice(0,3).map(t=><TrekCard key={t.slug} trek={t}/>)}</div>
          :<div className="upcoming-empty">
            <div className="empty-art"><Icon name="mountain" size={56}/></div>
            <div>
              <span className="status-pill"><span/>{contentUnavailable?'Schedule temporarily unavailable':'No confirmed treks right now'}</span>
              <h3>{contentUnavailable?'We couldn’t load the latest schedule.':'The next trek is being planned.'}</h3>
              <p>{contentUnavailable?'Please check back soon or email the coordinators before making plans.':'Join the community to hear as soon as the next plan is confirmed.'}</p>
              <ButtonLink href="/join">Join to get updates</ButtonLink>
            </div>
            <div className="empty-side"><p>Want to see what we’ve done before?</p><Link href="/past-treks">Browse the trek archive</Link></div>
          </div>}
        <div className="section-footnote"><Icon name="shield" size={18}/>Plans depend on weather, permissions and group readiness. Always follow the latest organizer briefing.</div>
      </div>
    </section>

    <section className="container section-space">
      <SectionHeading eyebrow="New to trekking?" title="How joining a trek works."/>
      <ol className="step-row">
        <li><h3>Join the community</h3><p>Read the rules and use the official WhatsApp invitation. Joining may make your phone number visible to other members.</p></li>
        <li><h3>Read the plan</h3><p>Check the difficulty, transport and cost. Ask the coordinator anything; no question is too basic.</p></li>
        <li><h3>Wait for confirmation</h3><p>Registration is separate from joining the group. Meet at the trailhead once a coordinator confirms your place.</p></li>
      </ol>
    </section>

    <section className="container section-space" style={{paddingTop:0}}>
      <SectionHeading eyebrow="Explore on your own" title="Trek guides near Pune." href="/treks-near-pune" link="Find a trek near Pune">Independent planning notes by difficulty. These are route ideas, not Pune Trekkers events.</SectionHeading>
      <div className="explore-rows">
        {guides.map(g=><Link key={g.slug} href={`/treks-near-pune/${g.slug}`} className="explore-row">
          <h3>{g.name}</h3>
          <span className="where">{g.region}</span>
          <span className={`chip difficulty-${g.difficulty.toLowerCase()}`}>{g.difficulty}</span>
          <span className="go" aria-hidden="true"><Icon name="arrow" size={20}/></span>
        </Link>)}
      </div>
      <p className="explore-note">Difficulty is an editorial starting point, not a live safety rating. Check local conditions before you set out.</p>
    </section>

    {diary.length>0&&    <section className="section-tinted">
      <div className="container section-space">
        <SectionHeading eyebrow="Trail diary" title="From our community archive." href="/past-treks" link="Browse the archive">Places we have explored together. Photos appear once permission is recorded.</SectionHeading>
        <div className="card-grid">{diary.map(p=><PlaceCard key={p.key} place={p} preview={preview}/>)}</div>
        {preview&&<p className="subtle-note">Local preview only: legacy photos await renewed website permission.</p>}
      </div>
    </section>}

    <section className="container section-space">
      <SectionHeading eyebrow="How we work" title="A trekking community, not a tour company.">Joining is free and there is no organiser fee. Participants split the actual cost of transport, food and entry fees, so a trek near Pune costs only what it really costs.</SectionHeading>
      <div className="values-grid">
        <Value icon="rupee" title="Shared costs, no profit">We split the actual agreed expenses. Current community treks are not organized for profit.</Value>
        <Value icon="people" title="Everyone belongs">Women, solo trekkers and first-timers are welcome on treks that suit their ability.</Value>
        <Value icon="shield" title="Safety and consent">Preparation and respect are part of every trek. Gallery uploads are managed by admins.</Value>
        <Value icon="leaf" title="Leave it better">Carry back your waste, respect local communities and care for the places we walk.</Value>
      </div>
      <p style={{marginTop:24}}><Link href="/safety" className="text-link">Read our safety and community guidelines <Icon name="arrow" size={18}/></Link></p>
    </section>

    <section className="container" style={{paddingBottom:'clamp(32px,5vw,64px)'}}>
      <div className="conserve">
        <div>
          <span className="eyebrow">Beyond the summit</span>
          <h2>Caring for the places we walk.</h2>
          <p>We are exploring trail cleanups, habitat restoration and outdoor education, guided by local people and experts. These are plans we are growing into, not completed projects.</p>
          <div className="inline-actions"><ButtonLink href="/conservation">Read our vision</ButtonLink></div>
        </div>
        <ul className="conserve-points">
          <li><Icon name="leaf" size={22}/>Trail cleanups</li>
          <li><Icon name="sun" size={22}/>Habitat restoration</li>
          <li><Icon name="people" size={22}/>Outdoor education</li>
        </ul>
      </div>
    </section>

    <section className="container faq-home">
      <div><span className="eyebrow">Questions</span><h2>Things people often ask.</h2><Link href="/faq" className="text-link">See all questions <Icon name="arrow" size={18}/></Link></div>
      <FAQList limit={4}/>
    </section>

    <JoinBanner/>
  </>
}

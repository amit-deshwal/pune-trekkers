import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { GetStaticProps } from 'next'
import Seo from '../../components/Seo'
import { getStaticContent } from '../../lib/content'
import type { SiteContent } from '../../lib/content-schema'
import Icon, { type IconName } from '../../components/Icon'
import { formatDate, site } from '../../lib/site'
import { aboutPageJsonLd, organizationJsonLd } from '../../lib/seo'
import { crew } from '../../lib/crew'

const HeroScene = dynamic(() => import('../../components/HeroScene'), { ssr: false })
export const getStaticProps:GetStaticProps=getStaticContent

const milestones: { label: string; title: string; detail: string; icon: IconName }[] = [
  { icon: 'chat', label: 'The beginning', title: 'A conversation on Reddit', detail: 'People in Pune wanted company for a trek. That conversation brought the first group together.' },
  { icon: 'heart', label: 'Along the way', title: 'Grown by word of mouth', detail: 'We never did any marketing. Members told friends, and friends told friends. Along the way, many people found their best trail buddies and lifelong friends.' },
  { icon: 'people', label: 'Today', title: 'A community of about 2,300', detail: 'Members connect across three WhatsApp groups. Joining is free, and community treks share actual costs without profit.' },
]

const welcome: { icon: IconName; title: string; text: string }[] = [
  { icon: 'mountain', title: 'No experience needed', text: 'Everyone starts somewhere. Pick a trek that suits you and ask anything. No question is too basic.' },
  { icon: 'people', title: 'Come alone, leave with friends', text: 'Many members arrived on their own and found their best trail buddies along the way.' },
  { icon: 'rupee', title: 'Free and shared', text: 'Joining costs nothing. On treks we split the actual expenses, and nobody makes a profit.' },
]

export default function About({ content }: { content: SiteContent }) {
  return <>
    <Seo title="Our story: from Reddit to the trail" description="How Pune Trekkers grew from a Reddit conversation into a free trekking community of about 2,300 people." jsonLd={[aboutPageJsonLd(site),organizationJsonLd(site)]} />
    <section className="about-hero container" aria-labelledby="about-title">
      <div className="about-hero-copy">
        <span className="eyebrow">Our story</span>
        <h1 id="about-title">From Reddit to the trail.</h1>
        <p>One conversation became a friendly community that keeps getting outdoors together. You are welcome here.</p>
        <ul className="about-facts" aria-label="Pune Trekkers at a glance"><li><strong>~2,300</strong> members</li><li><strong>3</strong> WhatsApp groups</li><li><strong>Free</strong> to join</li></ul>
      </div>
      <div className="about-hero-visual">
        <div className="scene-bg">
          <svg className="scene-poster" viewBox="0 0 800 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M0 420 160 300l90 70 150-190 140 170 90-60 170 150v200H0Z" className="ridge-far"/><path d="M0 500c140-90 260-60 380-120s250-20 420 70v190H0Z" className="ridge-mid"/><path d="M0 590c180-60 300-20 440-60s240-10 360 30v80H0Z" className="ridge-near"/></svg>
          <HeroScene phase="morning" />
        </div>
      </div>
    </section>

    <section className="about-story section-tinted" aria-labelledby="story-title"><div className="container section-space">
      <h2 id="story-title">How we got here</h2>
      <ol className="about-milestones">
        {milestones.map(item => <li key={item.label}><span className="about-milestone-number" aria-hidden="true"><Icon name={item.icon} size={26} /></span><div><span className="about-milestone-label">{item.label}</span><h3>{item.title}</h3><p>{item.detail}</p></div></li>)}
        {content.timeline.map(item => <li key={item.date + item.title}><span className="about-milestone-number" aria-hidden="true"><Icon name="mountain" size={26} /></span><div><time className="about-milestone-label" dateTime={item.date}>{formatDate(item.date)}</time><h3>{item.title}</h3><p>{item.detail}</p></div></li>)}
      </ol>
    </div></section>

    {crew.length>0&&<section className="container about-crew" aria-labelledby="crew-title">
      <span className="eyebrow">Hall of fame</span>
      <h2 id="crew-title">The volunteers behind it.</h2>
      <ul className="about-crew-list">{crew.map(member=><li key={member.name}>{member.photo?<img src={member.photo} alt="" width={72} height={72} loading="lazy"/>:<span aria-hidden="true">{member.name.trim()[0]?.toUpperCase()}</span>}<div><strong>{member.name}</strong><small>{member.role}</small></div></li>)}</ul>
      <Link href="/crew" className="text-link">Meet the crew<Icon name="arrow" size={18}/></Link>
    </section>}

    <section className="container about-welcome" aria-labelledby="welcome-title">
      <span className="eyebrow">New here?</span>
      <h2 id="welcome-title">You will fit right in.</h2>
      <div className="about-welcome-grid">{welcome.map(item => <article key={item.title}><span className="about-welcome-icon"><Icon name={item.icon} size={26} /></span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>

    <section className="container about-cta" aria-labelledby="about-cta-title">
      <div className="about-cta-card">
        <h2 id="about-cta-title">Your first trek starts here.</h2>
        <p>Join the free WhatsApp group, say hello, and come along when a plan feels right. We will be happy to see you on the trail.</p>
        <div className="about-story-links"><Link href="/join" className="cta-pill"><span className="cta-dot"><Icon name="arrow" size={20} /></span>Join the community</Link><Link href="/past-treks" className="quiet-link">See past treks</Link></div>
      </div>
    </section>
  </>
}

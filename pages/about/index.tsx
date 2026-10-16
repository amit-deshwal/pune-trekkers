import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { GetServerSideProps } from 'next'
import Seo from '../../components/Seo'
import { getCachedContent } from '../../lib/content'
import type { SiteContent } from '../../lib/content-schema'
import { formatDate } from '../../lib/site'

const HeroScene = dynamic(() => import('../../components/HeroScene'), { ssr: false })
export const getServerSideProps: GetServerSideProps = async ({ res }) => ({ props: await getCachedContent(res) })

const milestones = [
  { label: 'The beginning', title: 'A conversation on Reddit', detail: 'People in Pune wanted company for a trek. That conversation brought the first group together.' },
  { label: 'Along the way', title: 'Grown by word of mouth', detail: 'We never did any marketing. Members told friends, and friends told friends. Along the way, many people found their best trail buddies and lifelong friends.' },
  { label: 'Today', title: 'A community of about 2,300', detail: 'Members connect across three WhatsApp groups. Joining is free, and community treks share actual costs without profit.' },
]

export default function About({ content }: { content: SiteContent }) {
  return <>
    <Seo title="Our story: from Reddit to the trail" description="How Pune Trekkers grew from a Reddit conversation into a free trekking community of about 2,300 people." />
    <section className="about-hero container" aria-labelledby="about-title">
      <div className="about-hero-copy">
        <span className="eyebrow">Our story</span>
        <h1 id="about-title">From Reddit to the trail.</h1>
        <p>One conversation became a community that keeps getting outdoors together.</p>
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
        {milestones.map((item, index) => <li key={item.label}><span className="about-milestone-number">0{index + 1}</span><div><span className="about-milestone-label">{item.label}</span><h3>{item.title}</h3><p>{item.detail}</p></div></li>)}
        {content.timeline.map(item => <li key={item.date + item.title}><span className="about-milestone-number">+</span><div><time className="about-milestone-label" dateTime={item.date}>{formatDate(item.date)}</time><h3>{item.title}</h3><p>{item.detail}</p></div></li>)}
      </ol>
      <div className="about-story-links"><Link href="/past-treks" className="text-link">Explore past treks →</Link><Link href="/join" className="button">Join the community</Link></div>
    </div></section>
  </>
}

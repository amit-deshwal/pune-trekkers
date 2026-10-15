import { readFileSync } from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import Seo from '../../components/Seo'
import Icon from '../../components/Icon'
import HikeFinder, { type Hike } from '../../components/HikeFinder'
import { PageIntro, FAQList, JoinBanner, SectionHeading } from '../../components/Shared'
import { maharashtraGuides } from '../../lib/maharashtra-explorer'
import { nearbyHikes, type NearbyHike } from '../../lib/hikes'
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '../../lib/seo'
import { site } from '../../lib/site'
import hikeReview from '../../data/hike-review.json'

// Matches "Harishchandragad Fort" to the "Harishchandragad" guide, "Sinhagad" to "Sinhagad Fort", and so on.
const key = (name: string) => name.toLowerCase().replace(/\b(fort|peak)\b/g, '').replace(/[^a-z]/g, '')

// The featured destinations are rendered into the page; the finder loads the wider sourced listings in the browser.
export async function getStaticProps() {
  const hikes: Hike[] = JSON.parse(readFileSync(path.join(process.cwd(), 'public/data/hikes.json'), 'utf8'))
  const featuredSlugs = hikeReview.featured.map(h => h.slug)
  const featured = new Set(featuredSlugs)
  const guideSlugs = new Map(maharashtraGuides.map(g => [key(g.name), g.slug]))
  const guides = Object.fromEntries(hikes.flatMap(h => guideSlugs.has(key(h.name)) ? [[h.slug, guideSlugs.get(key(h.name))!]] : []))
  return { props: { initialHikes: hikes.filter(h => featured.has(h.slug)), guides, trails: nearbyHikes(hikes, featuredSlugs) } }
}

export default function TreksNearPune({ initialHikes, guides, trails }: { initialHikes: Hike[]; guides: Record<string, string>; trails: NearbyHike[] }) {
  const closest = trails.slice(0, 5)
  const faq = [
    ['Which treks are closest to Pune?', `${closest.slice(0, -1).map(t => t.name).join(', ')} and ${closest[closest.length - 1].name} are among the closest well-known forts, roughly ${closest[0].km}–${closest[closest.length - 1].km} km from central Pune in a straight line. The drive is longer than that, especially on ghat roads.`],
    ['Which trek near Pune is good for beginners?', 'Lohagad is a common first fort walk. Our guide rates it Easy, though wet stone gets slippery. Sinhagad and Rajgad suit people who are comfortable with sustained uphill walking. Whatever you choose, start early and go with a prepared companion or group.'],
    ['What is the best time to trek near Pune?', 'October to February usually brings cooler weather and clearer views. The monsoon, from June to September, turns the Sahyadris green and fills the waterfalls, but trails get slippery and some routes become risky or closed. In summer, start very early and carry extra water.'],
    ['Is there a free trekking group in Pune?', 'Yes. Pune Trekkers is a free-to-join, volunteer-run community of about 2,300 people across three WhatsApp groups. There is no organiser fee: participants split the actual cost of transport, food and entry fees.'],
  ]
  const jsonLd = [
    breadcrumbJsonLd(site.url, [['Home', '/'], ['Treks near Pune', '/treks-near-pune']]),
    itemListJsonLd('Treks near Pune', trails.map(t => ({ name: t.name, url: guides[t.slug] ? `${site.url}/treks-near-pune/${guides[t.slug]}` : undefined }))),
    faqJsonLd(faq),
  ]
  return <>
    <Seo title="Treks near Pune: forts within 50 km, 100 km & beyond" description="Find treks near Pune by distance, from Sinhagad and Rajgad to Kalsubai. Search forts, see base villages and directions, read trek guides, and join a free group to trek with." jsonLd={jsonLd}/>
    <PageIntro eyebrow="TREKS NEAR PUNE" title="Find a trek near Pune.">Well-known Sahyadri forts and peaks, sorted by distance. Search a fort, change where you start from, or read a guide before you go.</PageIntro>
    <HikeFinder initialHikes={initialHikes} guides={guides}/>

    <section className="container">
      <section id="guides" className="section-space" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <SectionHeading eyebrow="Trek guides" title="Trek guides by difficulty">Original planning notes on who each route suits, when to go and how to prepare.</SectionHeading>
        <div className="explore-rows">{maharashtraGuides.map(g => <Link key={g.slug} href={`/treks-near-pune/${g.slug}`} className="explore-row">
          <h3>{g.name}</h3>
          <span className="where">{g.region}</span>
          <span className={`chip difficulty-${g.difficulty.toLowerCase()}`}>{g.difficulty}</span>
          <span className="go" aria-hidden="true"><Icon name="arrow" size={20}/></span>
        </Link>)}</div>
        <p className="explore-note">Difficulty is an editorial starting point, not a live safety rating. Check local conditions before you set out.</p>
      </section>

      <section id="when-to-trek" className="section-space" style={{ paddingBottom: 0 }}>
        <SectionHeading eyebrow="Best season" title="When to trek near Pune"/>
        <div className="three-columns policy-cards" style={{ marginTop: 0 }}>
          <div><h3>Monsoon · June to September</h3><p>Green hills, waterfalls and cloud-covered forts. Rock gets slippery, streams can rise quickly and some routes are closed or risky. Pick well-used trails and turn back early.</p></div>
          <div><h3>Post-monsoon and winter · October to February</h3><p>The most comfortable months for most treks near Pune: cooler air, clearer views and drier paths. A good time for longer day treks, sunrise climbs and night treks.</p></div>
          <div><h3>Summer · March to May</h3><p>Hot, exposed and dry. Start before sunrise, carry more water than you think you need, and choose shorter or shaded routes.</p></div>
        </div>
      </section>

      <section id="trek-with-a-group" className="section-space" style={{ paddingBottom: 0 }}>
        <SectionHeading eyebrow="Trek with us" title="Prefer to trek with a group?"/>
        <p style={{ maxWidth: 680, fontSize: 18 }}>Pune Trekkers is a free, volunteer-run trekking community in Pune. Members plan treks openly and split the actual cost of transport, food and entry fees, with no organiser fee or markup. Beginners, women and solo trekkers are welcome on routes that suit their ability.</p>
        <p><Link href="/treks" className="text-link">See upcoming treks from Pune <Icon name="arrow" size={18}/></Link></p>
      </section>

      <section className="section-space">
        <SectionHeading eyebrow="Questions" title="Questions about treks near Pune"/>
        <FAQList items={faq}/>
      </section>
    </section>
    <JoinBanner/>
  </>
}

import type { GetStaticPaths, GetStaticProps } from 'next'
import Seo from '../../components/Seo'
import EventSignupForm from '../../components/EventSignupForm'
import Icon, { type IconName } from '../../components/Icon'
import { Note } from '../../components/Shared'
import { eventBySlug, events, type CommunityEvent } from '../../lib/events'
import { communityEventJsonLd } from '../../lib/seo'
import { formatDate, formatTime, site } from '../../lib/site'

export const getStaticPaths: GetStaticPaths = async () => ({ paths: events.map(event => ({ params: { slug: event.slug } })), fallback: false })
export const getStaticProps: GetStaticProps = async ({ params }) => ({ props: { event: eventBySlug(String(params?.slug)) ?? null } })

const learn: { icon: IconName; title: string; text: string }[] = [
  { icon: 'compass', title: 'Take a bearing', text: 'Point a compass at where you want to go and walk straight to it, even with no trail to follow.' },
  { icon: 'mountain', title: 'Read contour lines', text: 'Spot ridges, valleys and steep slopes on a map before you ever see them.' },
  { icon: 'pin', title: 'Find a grid reference', text: 'Turn a set of numbers into an exact place on the map.' },
  { icon: 'chat', title: 'Follow a waypoint', text: 'Use an offline map app on your phone to reach a point, with no signal needed.' },
]
const day = [
  ['7:00', 'Meet and team up', 'Say hello and meet your team of four. We mix people who’ve trekked a lot with people who haven’t.'],
  ['7:10', 'Learn the basics', 'A short, hands-on lesson in the four skills above. No experience needed.'],
  ['7:45', 'Clue one', 'An easy first clue, with a volunteer close by to check your answer.'],
  ['Then', 'The hunt', 'Clues get trickier as you go. Each one uses a skill you just learned, and each one gets you closer to the treasure.'],
  ['11:30', 'Turnaround', 'Whether or not you’ve found it, everyone heads to the finish together.'],
  ['12:30', 'Treasure and debrief', 'Open the treasure, share stories and talk about the trickiest clue.'],
]
const bring = ['Water: at least 1.5 litres each', 'Sturdy shoes with good grip', 'A hat, sunscreen and a light snack', 'A fully charged phone with an offline map app such as Organic Maps or OsmAnd (we’ll tell you which area to download)', 'A compass, if you have one. We’ll bring printed maps.']
const faq = [
  ['Do I need any experience?', 'None. The hunt starts with a short lesson, and every team has a mix of experience levels.'],
  ['Can I come alone?', 'Yes. Sign up on your own and we’ll put you in a friendly team. If you’re coming with friends, tell us their names and we’ll keep you together.'],
  ['Where is it?', 'That’s part of the surprise. It’s a gentle spot near Pune, and we’ll message the meeting point on WhatsApp to everyone who signs up, a few days before.'],
  ['What does it cost?', 'Nothing. Pune Trekkers is free, volunteer-run and not for profit.'],
  ['What if the weather is bad?', 'We check the forecast the evening before. If it isn’t safe, we’ll message everyone straight away and set a new date.'],
]

export default function EventPage({ event }: { event: CommunityEvent | null }) {
  if (!event) return null
  const when = `${formatDate(event.date)} · ${formatTime(event.startTime)}`
  return <>
    <Seo title={`${event.title}: a free navigation treasure hunt near Pune`} description={`${event.description} ${formatDate(event.date)}, free, teams of ${event.teamSize}, beginners welcome.`} image={event.image} imageAlt="Illustrated treasure map with a dotted trail, a red X and a compass" jsonLd={communityEventJsonLd(event, site)}/>
    <div className="page-intro container"><span className="eyebrow"><span/>FREE · {when.toUpperCase()}</span><h1>{event.title}</h1><p>{event.tagline} Learn to navigate, then put it to work.</p></div>
    <section className="container event-hero"><img src={event.image} alt="Illustrated treasure map with a dotted trail, a red X and a compass" width={1200} height={630}/></section>
    <section className="container form-layout">
      <div>
        <h2>Somewhere near Pune, a treasure is waiting.</h2>
        <p>To find it, your team will follow a trail of clues that only make sense if you can read the land: a bearing to walk, a grid reference to find on the map, a ridge to spot from the contour lines, a waypoint to track down on your phone.</p>
        <p>You’ll learn real navigation skills while you play. Volunteers walk the trail with you, and a sweeper stays at the back, so you’re never on your own out there.</p>
        <dl className="event-facts">
          <div><dt>When</dt><dd>{formatDate(event.date)}, {formatTime(event.startTime)} to {formatTime(event.endTime)}</dd></div>
          <div><dt>Where</dt><dd>A surprise near Pune. Shared on WhatsApp after you sign up</dd></div>
          <div><dt>Teams</dt><dd>Groups of {event.teamSize}, {event.capacity} spots in all</dd></div>
          <div><dt>Cost</dt><dd>Free</dd></div>
        </dl>
        <h2>What you’ll learn</h2>
        <div className="role-grid">{learn.map(item => <div key={item.title}><span className="icon-box"><Icon name={item.icon}/></span><h3>{item.title}</h3><p>{item.text}</p></div>)}</div>
        <h2>How the day goes</h2>
        <ol className="steps">{day.map(([time, title, text]) => <li key={time}><strong>{time} · {title}</strong><p>{text}</p></li>)}</ol>
        <h2>What to bring</h2>
        <ul className="event-bring">{bring.map(item => <li key={item}>{item}</li>)}</ul>
        <Note><strong>Safety comes first.</strong> A sweeper walks at the back, a first-aid volunteer is on the trail, and there’s a hard turnaround time. Stay with your team, stay off exposed edges, and stop whenever you need to. Nobody has to finish.</Note>
        <h2>Questions</h2>
        <div className="faq-list">{faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div>
      <EventSignupForm event={event}/>
    </section>
  </>
}

import Link from 'next/link'
import Seo from '../components/Seo'
import Icon from '../components/Icon'
import { PageIntro, ButtonLink } from '../components/Shared'
import { crew } from '../lib/crew'
import type { CrewMember } from '../lib/crew-schema'
import { sinceLabel } from '../lib/site'

// Read at build time, so the browser never loads the crew.json validator.
export const getStaticProps = () => ({ props: { crew } })

export default function Crew({ crew }: { crew: CrewMember[] }) {
  return <>
    {/* An empty page would be thin content, so it stays out of search until the first volunteer is added. */}
    <Seo title="The crew behind Pune Trekkers" description="Meet the volunteers who run Pune Trekkers: the writers, photographers, trek leads and social handlers behind a free trekking community in Pune." noindex={crew.length === 0}/>
    <PageIntro eyebrow="HALL OF FAME" title="The people who make it happen.">Pune Trekkers has no staff and no profit. Everything here is done by volunteers who give their weekends and their skills. Thank you.</PageIntro>
    <section className="container crew-section">
      {crew.length ? <ul className="crew-grid">{crew.map(member => <li key={member.name} className="crew-card">
        <div className="crew-photo">{member.photo?<img src={member.photo} alt={`${member.name}, ${member.role}`} width={640} height={800} loading="lazy"/>:<span aria-hidden="true">{member.name.trim()[0]?.toUpperCase()}</span>}</div>
        <div className="crew-body">
          <h2>{member.name}</h2>
          <p className="crew-role">{member.role}</p>
          {member.blurb && <p>{member.blurb}</p>}
          {member.since&&<p className="small">Volunteering since {sinceLabel(member.since)}</p>}
          {(member.website||member.instagram||member.email)&&<div className="crew-links">
            {member.website&&<a href={member.website} target="_blank" rel="noopener noreferrer" className="text-link">Website<Icon name="arrow" size={16}/></a>}
            {member.instagram&&<a href={member.instagram} target="_blank" rel="noopener noreferrer" className="text-link">Instagram<Icon name="arrow" size={16}/></a>}
            {member.email&&<a href={`mailto:${member.email}`} className="text-link">Email<Icon name="arrow" size={16}/></a>}
          </div>}
        </div>
      </li>)}</ul>
      : <div className="interest-form"><h2>This wall is waiting for its first names.</h2><p>Volunteers are listed here, with their permission, once they’ve started. Write trek reports, shoot the trail, run Instagram or Reddit, or help lead and sweep treks, and your name goes up.</p><ButtonLink href="/volunteer">See volunteer roles</ButtonLink></div>}
      {crew.length > 0 && <p className="crew-join">Want your name here? <Link href="/volunteer" className="text-link">See the volunteer roles<Icon name="arrow" size={18}/></Link></p>}
    </section>
  </>
}

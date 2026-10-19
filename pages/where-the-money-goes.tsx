import Link from 'next/link'
import Seo from '../components/Seo'
import { PageIntro, Note, ButtonLink } from '../components/Shared'
import { site } from '../lib/site'
import { breadcrumbJsonLd, faqJsonLd } from '../lib/seo'
import { trekCosts, total, rupees } from '../lib/trek-costs'

const dateLabel = (date: string) => new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
const questions = [
  ['Does Pune Trekkers make a profit on treks?', 'No. There is no membership fee, organiser fee or commission. Participants split the actual cost of transport, guides, food and entry fees, and this page publishes the real cost sheets from past treks.'],
  ['How much does a trek from Pune cost with Pune Trekkers?', `It depends on the transport, the guide and the group size. Recent examples: ${trekCosts.map(c => `${c.trek} came to ${rupees(c.perPerson)} per person`).join('; ')}.`],
]

export default function WhereTheMoneyGoes() {
  return <>
    <Seo title="Where the money goes: real trek costs, no profit" description="Real cost sheets from Pune Trekkers treks: transport, guides and food split among participants, with no organiser fee, no markup and no profit." jsonLd={[breadcrumbJsonLd(site.url, [['Home', '/'], ['Where the money goes', '/where-the-money-goes']]), faqJsonLd(questions)]}/>
    <PageIntro eyebrow="EVERY RUPEE, IN THE OPEN" title="Where the money goes.">We say there is no markup and no profit. These are the real cost sheets from our treks, so you can check for yourself.</PageIntro>
    <article className="container prose">
      <h2>How we split costs.</h2>
      <ul>
        <li>Nobody pays to join the community, and there is no organiser fee or commission.</li>
        <li>A trek costs what the bus, guide, food and entry fees actually cost. We divide the total among the people who go.</li>
        <li>The cost sheet goes to the trek’s group after the trek, and the balance is settled from it.</li>
      </ul>
      <Note>These sheets are copied from our trek groups. We leave out names, phone numbers and payment IDs.</Note>
      {trekCosts.map(cost => {
        const spent = total(cost.expenses)
        return <section key={cost.trek + cost.date} className="cost-sheet">
          <h2>{cost.trek}</h2>
          <p className="small"><time dateTime={cost.date}>{dateLabel(cost.date)}</time> · {cost.people} people · {rupees(cost.perPerson)} per person</p>
          <div className="table-wrap"><table className="difficulty-table cost-table">
            <thead><tr><th scope="col">What we paid for</th><th scope="col">Amount</th></tr></thead>
            <tbody>{cost.expenses.map(line => <tr key={line.label}><td>{line.label}</td><td>{rupees(line.amount)}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">Total</th><td>{rupees(spent)}</td></tr></tfoot>
          </table></div>
          <h3>Who paid what</h3>
          <ul>{cost.shares.map(line => <li key={line.label}>{line.label}: {rupees(line.amount)}</li>)}</ul>
          <p>{cost.settlement}</p>
          {cost.note && <p>{cost.note}</p>}
        </section>
      })}
      <h2>Questions people ask about money.</h2>
      {questions.map(([q, a]) => <div key={q}><h3>{q}</h3><p>{a}</p></div>)}
      <p>Have a question about a cost sheet? Ask in the trek’s group, or write to <a href={`mailto:${site.email}`}>{site.email}</a>. For how cancellations are settled, see the <Link href="/faq">FAQ</Link>.</p>
      <ButtonLink href="/join">Join free on WhatsApp</ButtonLink>
    </article>
  </>
}

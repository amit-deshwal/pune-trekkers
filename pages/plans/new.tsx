import { FormEvent, useState } from 'react'
import Seo from '../../components/Seo'
import { PageIntro, Note } from '../../components/Shared'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export default function NewPlan() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    const form = new FormData(event.currentTarget)
    const get = (key: string) => String(form.get(key) || '').trim()
    const max = get('maxPeople')
    setBusy(true)
    try {
      const response = await fetch('/api/plans/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: get('name'), whatsapp: get('whatsapp'), destination: get('destination'), date: get('date'), startTime: get('startTime'),
        meetingPoint: get('meetingPoint'), difficulty: get('difficulty'), maxPeople: max ? Number(max) : null, summary: get('summary'),
        consent: form.get('consent') === 'on', website: get('website'),
      }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not send your plan.')
      setSent(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send your plan.') } finally { setBusy(false) }
  }
  return <>
    <Seo title="Share your hike plan" noindex/>
    <PageIntro eyebrow="MEMBER HIKES" title="Share your hike plan.">Going out on your own? Tell the community where and when, and let people who are keen get in touch.</PageIntro>
    <section className="container admin-layout">
      {sent ? <div className="interest-form"><h2>Thanks, your plan is with our admins.</h2><p>We review every plan before it goes live, usually within a day or two. Once approved, it appears on the member hikes page and people can message you on WhatsApp.</p></div>
      : <form className="interest-form" onSubmit={submit}>
        <Note>Your WhatsApp number is <strong>never shown on the site</strong>. Interested people tap a button that opens a chat with you. This is a member-organised hike, not an official Pune Trekkers trek.</Note>
        <div className="form-row"><label>Your first name<input required name="name" maxLength={40} placeholder="e.g. Amit"/></label><label>Your WhatsApp number<input required name="whatsapp" type="tel" placeholder="+91 98765 43210"/></label></div>
        <div className="form-row"><label>Where are you going?<input required name="destination" maxLength={80} placeholder="e.g. Rajgad fort"/></label><label>Difficulty<select name="difficulty" defaultValue="Moderate"><option>Easy</option><option>Moderate</option><option>Challenging</option></select></label></div>
        <div className="form-row"><label>Date<input required name="date" type="date" min={today()}/></label><label>Start time<input name="startTime" type="time"/></label></div>
        <div className="form-row"><label>Meeting point<input name="meetingPoint" maxLength={140} placeholder="e.g. Swargate bus stand"/></label><label>Max people (optional)<input name="maxPeople" type="number" min="1" max="30"/></label></div>
        <label>About your plan<textarea required name="summary" maxLength={400} placeholder="The route, pace, what to carry, anything people should know"/></label>
        <input className="honey" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        <label className="checkbox-label"><input type="checkbox" name="consent" required/><span>I'm sharing my own plan. I understand it is not an official Pune Trekkers trek, and that I'm responsible for my own safety and arrangements.</span></label>
        {error && <p className="admin-message" role="alert">{error}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send for review'}</button>
      </form>}
    </section>
  </>
}

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from './Icon'
import type { CommunityEvent } from '../lib/events'

export default function EventSignupForm({ event }: { event: CommunityEvent }) {
  const [spots, setSpots] = useState<number | null>(null)
  const [result, setResult] = useState<'confirmed' | 'waitlist' | ''>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    fetch(`/api/events/signup?event=${event.slug}`).then(response => response.ok ? response.json() : null).then(data => { if (data) setSpots(data.spotsLeft) }).catch(() => {})
  }, [event.slug])
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('')
    const form = new FormData(e.currentTarget)
    const get = (key: string) => String(form.get(key) || '').trim()
    setBusy(true)
    try {
      const response = await fetch('/api/events/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        event: event.slug, name: get('name'), whatsapp: get('whatsapp'), level: get('level'), friends: get('friends'), consent: form.get('consent') === 'on', website: get('website'),
      }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not complete your sign-up.')
      setResult(data.status)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not complete your sign-up.') } finally { setBusy(false) }
  }
  if (result) return <div className="interest-form" role="status"><div className="form-heading"><span className="icon-box"><Icon name="compass"/></span><h2>{result === 'confirmed' ? 'You’re in!' : 'You’re on the waitlist.'}</h2></div>
    <p>{result === 'confirmed' ? 'We’ll message you on WhatsApp with the meeting point and what to bring a few days before the hunt. Keep an eye out for it.' : 'All spots are taken for now. If someone drops out we’ll message you on WhatsApp, in order of sign-up.'}</p>
    <p className="small">Can’t make it after all? Just tell us on WhatsApp so someone else can take your spot.</p></div>
  const full = spots === 0
  return <form className="interest-form" onSubmit={submit}>
    <div className="form-heading"><span className="icon-box"><Icon name="compass"/></span><h2>{full ? 'Join the waitlist.' : 'Save your spot.'}</h2>
      <p>{spots === null ? `${event.capacity} spots, in teams of ${event.teamSize}.` : full ? 'All spots are taken. Join the waitlist and we’ll message you if one opens up.' : `${spots} of ${event.capacity} spots left.`}</p></div>
    <div className="form-row"><label>Your name <span>*</span><input required name="name" autoComplete="name" maxLength={60} placeholder="What should we call you?"/></label><label>WhatsApp number <span>*</span><input required name="whatsapp" type="tel" autoComplete="tel" placeholder="+91 98765 43210"/></label></div>
    <label>How familiar are you with maps and compasses? <span>*</span><select name="level" defaultValue="new"><option value="new">New to it, and happy to learn</option><option value="some">I’ve used a map or compass a few times</option><option value="experienced">I’m experienced</option></select></label>
    <label>Coming with friends? <span className="small">(optional)</span><input name="friends" maxLength={160} placeholder="Their names, if you’d like to be on the same team"/></label>
    <input className="honey" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <label className="checkbox-label"><input type="checkbox" name="consent" required/><span>I’ve read the <Link href="/safety">safety guidelines</Link> and <Link href="/privacy">privacy notice</Link>, and agree to be contacted on WhatsApp about this event.</span></label>
    <p className="small">Only the organisers see your details. Please don’t include private health information.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" type="submit" disabled={busy}>{busy ? 'Saving…' : full ? 'Join waitlist' : 'Save my spot'}<Icon name="arrow" size={18}/></button>
  </form>
}

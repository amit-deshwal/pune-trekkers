import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { volunteerRoles } from '../lib/volunteer-roles'
import Icon from './Icon'

export default function VolunteerForm() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    const form = new FormData(event.currentTarget)
    const get = (key: string) => String(form.get(key) || '').trim()
    setBusy(true)
    try {
      const response = await fetch('/api/volunteer/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: get('name'), whatsapp: get('whatsapp'), email: get('email'), roles: form.getAll('roles').map(String), experience: get('experience'),
        portfolio: get('portfolio'), availability: get('availability'), consent: form.get('consent') === 'on', website: get('website'),
      }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not send your application.')
      setSent(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send your application.') } finally { setBusy(false) }
  }
  if (sent) return <div className="interest-form" role="status"><div className="form-heading"><span className="icon-box"><Icon name="heart"/></span><h2>Thanks, we have your application.</h2></div><p>An admin will message you on WhatsApp, usually within a few days, to talk about fit. Sending this form doesn’t confirm a role.</p></div>
  return <form className="interest-form" onSubmit={submit}>
    <div className="form-heading"><span className="icon-box"><Icon name="heart"/></span><h2>Find your way to contribute.</h2><p>Tell us a little about you. An admin reads every application.</p></div>
    <div className="form-row"><label>Your name <span>*</span><input required name="name" autoComplete="name" maxLength={60} placeholder="What should we call you?"/></label><label>WhatsApp number <span>*</span><input required name="whatsapp" type="tel" autoComplete="tel" placeholder="+91 98765 43210"/></label></div>
    <label>Email <span className="small">(optional)</span><input name="email" type="email" autoComplete="email" maxLength={160} placeholder="you@example.com"/></label>
    <fieldset className="role-picker"><legend>Roles you’d like to help with <span>*</span></legend>{volunteerRoles.map(role => <label key={role.id} className="checkbox-label"><input type="checkbox" name="roles" value={role.id}/><span>{role.title}</span></label>)}</fieldset>
    <label>Your experience <span>*</span><textarea required name="experience" rows={4} minLength={10} maxLength={600} placeholder="What have you done that’s relevant? Treks led, posts written, cameras used, certificates held."/></label>
    <label>Link to your work <span className="small">(optional)</span><input name="portfolio" type="url" maxLength={200} placeholder="https://instagram.com/you or a portfolio"/></label>
    <label>When could you help? <span className="small">(optional)</span><input name="availability" maxLength={140} placeholder="For example, one weekend a month"/></label>
    <input className="honey" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <label className="checkbox-label"><input type="checkbox" name="consent" required/><span>I’ve read the <Link href="/terms">community guidelines</Link> and <Link href="/privacy">privacy notice</Link>, and agree to be contacted on WhatsApp about this.</span></label>
    <p className="small">Only the admins see your details. Please don’t include private health information.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send application'}<Icon name="arrow" size={18}/></button>
  </form>
}

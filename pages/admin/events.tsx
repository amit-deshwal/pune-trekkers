import { useCallback, useEffect, useState } from 'react'
import AdminChrome from '../../components/AdminChrome'
import { useAdminSession } from '../../lib/admin-session'
import { levelLabel } from '../../lib/event-signup-schema'
import { eventBySlug } from '../../lib/events'
import type { EventSignup, SignupStatus } from '../../lib/event-signups'

const label: Record<SignupStatus, string> = { confirmed: 'Confirmed', waitlist: 'Waitlist', cancelled: 'Cancelled' }

export default function AdminEvents() {
  const session = useAdminSession(); const { token } = session
  const [signups, setSignups] = useState<EventSignup[]>([]); const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    if (!token) return
    const response = await fetch('/api/admin/event-signups', { headers: { Authorization: `Bearer ${token}` } })
    const result = await response.json()
    if (response.ok) setSignups(result.signups); else setMessage(result.error || 'Could not load sign-ups.')
  }, [token])
  useEffect(() => { load() }, [load])
  async function setStatus(id: string, status: SignupStatus) {
    setMessage('')
    const response = await fetch('/api/admin/event-signups', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status }) })
    const result = await response.json()
    if (!response.ok) { setMessage(result.error || 'Could not update this sign-up.'); return }
    load()
  }
  async function remove(person: EventSignup) {
    if (!window.confirm(`Delete ${person.name}'s sign-up for good? This cannot be undone.`)) return
    setMessage('')
    const response = await fetch('/api/admin/event-signups', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: person.id }) })
    const result = await response.json()
    if (!response.ok) { setMessage(result.error || 'Could not delete this sign-up.'); return }
    setMessage('Deleted.'); load()
  }
  const slugs = Array.from(new Set(signups.map(person => person.event)))
  const row = (person: EventSignup, position: number) => <li key={person.id} className="plan-review">
    <header><h3>{position}. {person.name}</h3><span className={`plan-badge ${person.status === 'confirmed' ? 'is-approved' : person.status === 'cancelled' ? 'is-rejected' : ''}`}>{label[person.status]}</span></header>
    <dl className="plan-facts">
      <div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${person.whatsapp}`} target="_blank" rel="noopener noreferrer">+{person.whatsapp}</a></dd></div>
      <div><dt>Experience</dt><dd>{levelLabel[person.level]}</dd></div>
      <div><dt>With friends</dt><dd>{person.friends || '—'}</dd></div>
      <div><dt>Signed up</dt><dd>{new Date(person.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</dd></div>
    </dl>
    <div className="admin-actions">
      {person.status !== 'confirmed' && <button type="button" className="button button-small" onClick={() => setStatus(person.id, 'confirmed')}>Confirm</button>}
      {person.status !== 'waitlist' && <button type="button" className="button button-small button-outline" onClick={() => setStatus(person.id, 'waitlist')}>Waitlist</button>}
      {person.status !== 'cancelled' && <button type="button" className="button button-small button-outline" onClick={() => setStatus(person.id, 'cancelled')}>Cancel</button>}
      <button type="button" className="button button-small admin-danger" onClick={() => remove(person)}>Delete</button>
    </div>
  </li>
  return <AdminChrome session={session} active="events" seoTitle="Admin: event sign-ups" title="Event sign-ups." intro="See who signed up, move people between confirmed and waitlist, and message them on WhatsApp. Nothing here is public.">
    {slugs.length === 0 && <div className="interest-form admin-form"><h2>No sign-ups yet</h2><p>They appear here as people join from the event page.</p></div>}
    {slugs.map(slug => {
      const list = signups.filter(person => person.event === slug)
      const confirmed = list.filter(person => person.status === 'confirmed').length
      const event = eventBySlug(slug)
      return <div className="interest-form admin-form" key={slug}>
        <h2>{event?.title ?? slug}: {confirmed}{event ? ` of ${event.capacity}` : ''} confirmed</h2>
        <p className="small">{list.filter(person => person.status === 'waitlist').length} on the waitlist, in order of sign-up. People are listed in the order they signed up.</p>
        <ul className="admin-trek-list">{list.map((person, index) => row(person, index + 1))}</ul>
      </div>
    })}
    {message && <p className="admin-message" role="status">{message}</p>}
  </AdminChrome>
}

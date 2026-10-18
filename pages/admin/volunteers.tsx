import { useCallback, useEffect, useState } from 'react'
import AdminChrome from '../../components/AdminChrome'
import { useAdminSession } from '../../lib/admin-session'
import { roleTitle } from '../../lib/volunteer-roles'
import type { Volunteer } from '../../lib/volunteers'

const label: Record<Volunteer['status'], string> = { new: 'New', contacted: 'Contacted', onboarded: 'Onboarded', declined: 'Declined' }

export default function AdminVolunteers() {
  const session = useAdminSession(); const { token } = session
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]); const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    if (!token) return
    const response = await fetch('/api/admin/volunteers', { headers: { Authorization: `Bearer ${token}` } })
    const result = await response.json()
    if (response.ok) setVolunteers(result.volunteers); else setMessage(result.error || 'Could not load applications.')
  }, [token])
  useEffect(() => { load() }, [load])
  async function setStatus(id: string, status: Volunteer['status']) {
    setMessage('')
    const response = await fetch('/api/admin/volunteers', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status }) })
    const result = await response.json()
    if (!response.ok) { setMessage(result.error || 'Could not update this application.'); return }
    load()
  }
  async function remove(person: Volunteer) {
    if (!window.confirm(`Delete ${person.name}'s application for good? This cannot be undone.`)) return
    setMessage('')
    const response = await fetch('/api/admin/volunteers', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: person.id }) })
    const result = await response.json()
    if (!response.ok) { setMessage(result.error || 'Could not delete this application.'); return }
    setMessage('Deleted.'); load()
  }
  const group = (status: Volunteer['status']) => volunteers.filter(person => person.status === status)
  const fact = (name: string, value: string) => <div><dt>{name}</dt><dd>{value || '—'}</dd></div>
  const row = (person: Volunteer) => <li key={person.id} className="plan-review">
    <header>
      <h3>{person.name}</h3>
      <span className={`plan-badge ${person.status === 'onboarded' ? 'is-approved' : person.status === 'declined' ? 'is-rejected' : ''}`}>{label[person.status]}</span>
    </header>
    <dl className="plan-facts">
      {fact('Roles', person.roles.map(roleTitle).join(', '))}
      <div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${person.whatsapp}`} target="_blank" rel="noopener noreferrer">+{person.whatsapp}</a></dd></div>
      {person.email ? <div><dt>Email</dt><dd><a href={`mailto:${person.email}`}>{person.email}</a></dd></div> : fact('Email', '')}
      {person.portfolio ? <div><dt>Work</dt><dd><a href={person.portfolio} target="_blank" rel="noopener noreferrer nofollow">{person.portfolio}</a></dd></div> : fact('Work', '')}
      {fact('Availability', person.availability)}
      {fact('Applied', new Date(person.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }))}
    </dl>
    <div className="plan-summary"><span>Experience</span><p>{person.experience}</p></div>
    <div className="admin-actions">
      {person.status !== 'contacted' && <button type="button" className="button button-small" onClick={() => setStatus(person.id, 'contacted')}>Mark contacted</button>}
      {person.status !== 'onboarded' && <button type="button" className="button button-small button-outline" onClick={() => setStatus(person.id, 'onboarded')}>Onboarded</button>}
      {person.status !== 'declined' && <button type="button" className="button button-small button-outline" onClick={() => setStatus(person.id, 'declined')}>Decline</button>}
      <button type="button" className="button button-small admin-danger" onClick={() => remove(person)}>Delete</button>
    </div>
  </li>
  const section = (status: Volunteer['status'], title: string) => group(status).length > 0 && <div className="interest-form admin-form"><h2>{title} ({group(status).length})</h2><ul className="admin-trek-list">{group(status).map(row)}</ul></div>
  return <AdminChrome session={session} active="volunteers" seoTitle="Admin: volunteers" title="Review volunteer applications." intro="Message people on WhatsApp, then track where each one stands. Nothing here is public.">
    <>
        <div className="interest-form admin-form"><h2>New ({group('new').length})</h2>
          {group('new').length ? <ul className="admin-trek-list">{group('new').map(row)}</ul> : <p>No new applications.</p>}</div>
        {section('contacted', 'Contacted')}{section('onboarded', 'Onboarded')}{section('declined', 'Declined')}
    </>
      {message && <p className="admin-message" role="status">{message}</p>}
  </AdminChrome>
}

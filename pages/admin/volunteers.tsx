import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Seo from '../../components/Seo'
import { PageIntro } from '../../components/Shared'
import { browserSupabase, supabasePublicKey, supabasePublicUrl } from '../../lib/supabase'
import { roleTitle } from '../../lib/volunteer-roles'
import type { Volunteer } from '../../lib/volunteers'

const label: Record<Volunteer['status'], string> = { new: 'New', contacted: 'Contacted', onboarded: 'Onboarded', declined: 'Declined' }

export default function AdminVolunteers() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [token, setToken] = useState('')
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]); const [message, setMessage] = useState('')
  const configured = Boolean(supabasePublicUrl && supabasePublicKey)
  const load = useCallback(async () => {
    if (!token) return
    const response = await fetch('/api/admin/volunteers', { headers: { Authorization: `Bearer ${token}` } })
    const result = await response.json()
    if (response.ok) setVolunteers(result.volunteers); else setMessage(result.error || 'Could not load applications.')
  }, [token])
  useEffect(() => { load() }, [load])
  async function login(event: FormEvent) {
    event.preventDefault(); setMessage('')
    try {
      const { data, error } = await browserSupabase().auth.signInWithPassword({ email, password })
      if (error || !data.session) throw error || new Error('No session returned.')
      setToken(data.session.access_token)
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not sign in.') }
  }
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
  return <>
    <Seo title="Admin: volunteers" noindex/>
    <PageIntro eyebrow="PRIVATE ADMIN AREA" title="Review volunteer applications.">Message people on WhatsApp, then track where each one stands. Nothing here is public.</PageIntro>
    <section className="container admin-layout">
      <p className="admin-gallery-link"><Link href="/admin">← Back to treks</Link></p>
      {!configured ? <div className="interest-form"><p>Supabase is not connected yet.</p></div>
      : !token ? <form className="interest-form admin-form" onSubmit={login}><h2>Admin sign in</h2>
        <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/></label>
        <label>Password<input required type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></label>
        <button className="button" type="submit">Sign in</button></form>
      : <>
        <div className="interest-form admin-form"><h2>New ({group('new').length})</h2>
          {group('new').length ? <ul className="admin-trek-list">{group('new').map(row)}</ul> : <p>No new applications.</p>}</div>
        {section('contacted', 'Contacted')}{section('onboarded', 'Onboarded')}{section('declined', 'Declined')}
      </>}
      {message && <p className="admin-message" role="status">{message}</p>}
    </section>
  </>
}

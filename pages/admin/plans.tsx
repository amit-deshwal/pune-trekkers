import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Seo from '../../components/Seo'
import { PageIntro } from '../../components/Shared'
import { browserSupabase, supabasePublicKey, supabasePublicUrl } from '../../lib/supabase'
import { formatDate, formatTime } from '../../lib/site'
import type { AdminPlan } from '../../lib/member-plans'

export default function AdminPlans() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [token, setToken] = useState('')
  const [plans, setPlans] = useState<AdminPlan[]>([]); const [message, setMessage] = useState('')
  const configured = Boolean(supabasePublicUrl && supabasePublicKey)
  const load = useCallback(async () => {
    if (!token) return
    const response = await fetch('/api/admin/plans', { headers: { Authorization: `Bearer ${token}` } })
    const result = await response.json()
    if (response.ok) setPlans(result.plans); else setMessage(result.error || 'Could not load plans.')
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
  async function setStatus(id: string, status: AdminPlan['status']) {
    setMessage('')
    const response = await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status }) })
    const result = await response.json()
    if (!response.ok) { setMessage(result.error || 'Could not update this plan.'); return }
    setMessage(status === 'approved' ? 'Approved. It appears on the member hikes page within a minute.' : 'Updated.'); load()
  }
  async function remove(plan: AdminPlan) {
    if (!window.confirm(`Delete the ${plan.destination} plan by ${plan.name} for good? This cannot be undone.`)) return
    setMessage('')
    const response = await fetch('/api/admin/plans', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: plan.id }) })
    const result = await response.json()
    if (!response.ok) { setMessage(result.error || 'Could not delete this plan.'); return }
    setMessage('Deleted.'); load()
  }
  const group = (status: AdminPlan['status']) => plans.filter(plan => plan.status === status)
  const fact = (label: string, value: string) => <div><dt>{label}</dt><dd>{value || '—'}</dd></div>
  const row = (plan: AdminPlan) => <li key={plan.id} className="plan-review">
    <header>
      <h3>{plan.destination}</h3>
      <span className={`plan-badge is-${plan.status}`}>{plan.status === 'pending' ? 'Waiting' : plan.status === 'approved' ? 'Live' : 'Rejected'}</span>
    </header>
    <dl className="plan-facts">
      {fact('Date', formatDate(plan.date))}
      {fact('Start time', plan.startTime ? formatTime(plan.startTime) : '')}
      {fact('Difficulty', plan.difficulty)}
      {fact('Max people', plan.maxPeople ? String(plan.maxPeople) : '')}
      {fact('Meeting point', plan.meetingPoint)}
      {fact('Posted by', plan.name)}
      <div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${plan.whatsapp}`} target="_blank" rel="noopener noreferrer">+{plan.whatsapp}</a></dd></div>
      {fact('Submitted', new Date(plan.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }))}
    </dl>
    <div className="plan-summary"><span>About the plan</span><p>{plan.summary}</p></div>
    <div className="admin-actions">
      {plan.status !== 'approved' && <button type="button" className="button button-small" onClick={() => setStatus(plan.id, 'approved')}>Approve</button>}
      {plan.status !== 'rejected' && <button type="button" className="button button-small button-outline" onClick={() => setStatus(plan.id, 'rejected')}>{plan.status === 'approved' ? 'Take down' : 'Reject'}</button>}
      <button type="button" className="button button-small admin-danger" onClick={() => remove(plan)}>Delete</button>
    </div>
  </li>
  return <>
    <Seo title="Admin: member plans" noindex/>
    <PageIntro eyebrow="PRIVATE ADMIN AREA" title="Review member hike plans.">Approve plans that look safe and genuine. Nothing is public until you approve it.</PageIntro>
    <section className="container admin-layout">
      <p className="admin-gallery-link"><Link href="/admin">← Back to treks</Link></p>
      {!configured ? <div className="interest-form"><p>Supabase is not connected yet.</p></div>
      : !token ? <form className="interest-form admin-form" onSubmit={login}><h2>Admin sign in</h2>
        <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/></label>
        <label>Password<input required type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></label>
        <button className="button" type="submit">Sign in</button></form>
      : <>
        <div className="interest-form admin-form"><h2>Waiting for review ({group('pending').length})</h2>
          {group('pending').length ? <ul className="admin-trek-list">{group('pending').map(row)}</ul> : <p>Nothing waiting. 🎉</p>}</div>
        {group('approved').length > 0 && <div className="interest-form admin-form"><h2>Live ({group('approved').length})</h2><ul className="admin-trek-list">{group('approved').map(row)}</ul></div>}
        {group('rejected').length > 0 && <div className="interest-form admin-form"><h2>Rejected ({group('rejected').length})</h2><ul className="admin-trek-list">{group('rejected').map(row)}</ul></div>}
      </>}
      {message && <p className="admin-message" role="status">{message}</p>}
    </section>
  </>
}

import { FormEvent, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Seo from './Seo'
import { Note, PageIntro } from './Shared'
import type { AdminSession } from '../lib/admin-session'

const tabs = [['treks', '/admin', 'Treks'], ['weekend', '/admin/weekend', 'This weekend'], ['gallery', '/admin/gallery', 'Gallery'], ['plans', '/admin/plans', 'Member plans'], ['volunteers', '/admin/volunteers', 'Volunteers']] as const
export type AdminTab = (typeof tabs)[number][0]

// Shared frame for every admin page: sign in once, switch sections from the tab bar, and sign out from anywhere.
export default function AdminChrome({ session, active, seoTitle, title, intro, children }: { session: AdminSession; active: AdminTab; seoTitle: string; title: string; intro: string; children: ReactNode }) {
  const { configured, token, checking, signIn, signOut } = session
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function login(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await signIn(email, password) } catch (e) { setError(e instanceof Error ? e.message : 'Could not sign in.') } finally { setBusy(false) }
  }
  return <>
    <Seo title={seoTitle} noindex/>
    <PageIntro eyebrow="PRIVATE ADMIN AREA" title={title}>{intro}</PageIntro>
    <section className="container admin-layout">
      {token && <nav className="admin-tabs" aria-label="Admin sections">
        {tabs.map(([id, href, label]) => <Link key={id} href={href} aria-current={id === active ? 'page' : undefined}>{label}</Link>)}
        <button type="button" className="admin-signout" onClick={signOut}>Sign out</button>
      </nav>}
      {!configured ? <Note><strong>Supabase is not connected yet.</strong> Add the project URL, publishable key and server-side service-role key to the environment, then apply the supplied migrations. This page stays inactive until then.</Note>
      : checking ? <p>Checking your sign-in…</p>
      : !token ? <form className="interest-form admin-form" onSubmit={login}><h2>Admin sign in</h2>
          <label>Email<input required type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)}/></label>
          <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}/></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form>
      : children}
    </section>
  </>
}

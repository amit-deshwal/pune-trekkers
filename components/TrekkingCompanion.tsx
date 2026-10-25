import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import type { Act, Companion } from './CompanionScene'
import { useTrailMusic } from './TrailMusic'
import type { Trek } from '../lib/content-schema'
import { upcomingTreks } from '../lib/upcoming-treks'
import { formatDate, site } from '../lib/site'

// What the buddy says on each section of the site (first match wins).
const LINES: [string, string][] = [
  ['/treks-near-pune', 'Close to Pune means more chai stops.'],
  ['/treks', 'Pick one, I’ll bring the snacks.'],
  ['/past-treks', 'Trekked with us? Tap me to leave a review.'],
  ['/safety', 'Two litres of water, minimum!'],
  ['/join', 'Yay, a new trail buddy!'],
  ['/about', 'Nice to meet you properly.'],
  ['/faq', 'Ask away, I’m all ears.'],
  ['/contact', 'Say hi from me too.'],
  ['/conservation', 'Leave only footprints.'],
  ['/volunteer', 'Lead a trek with us someday?'],
]
const lineFor = (path: string) => LINES.find(([prefix]) => path.startsWith(prefix))?.[1] ?? 'New here? Tap me for a head start.'
const ACT_LINES: Partial<Record<Act, string>> = {
  enter: 'Hi! I’m your trail buddy.', wake: 'Huh? I’m up, I’m up!', dizzy: 'Whoa… the trail is spinning.',
  whoa: 'Easy on the scroll!', sleep: 'Zzz… poke me to wake me up.',
}

// `treks` comes from the current page's content when it has any, so the buddy can point to the next trek.
export default function TrekkingCompanion({ treks }: { treks?: Trek[] }) {
  const { pathname } = useRouter()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [tucked, setTucked] = useState(false)
  const [mode, setMode] = useState<'loading' | 'live' | 'poster'>('loading')
  const [act, setAct] = useState<Act>('idle')
  const [say, setSay] = useState<string | null>(null)
  const root = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)
  const restore = useRef<HTMLButtonElement>(null)
  const stage = useRef<HTMLSpanElement>(null)
  const buddy = useRef<Companion | null>(null)
  const sayTimer = useRef(0)
  const spoken = useRef(false)
  const excluded = pathname.startsWith('/admin')
  const music = useTrailMusic(!excluded)
  const upcoming = treks ? upcomingTreks(treks) : []
  const next = upcoming.find(t => t.status === 'confirmed') ?? upcoming[0]

  function speak(text: string, ms = 3200) {
    window.clearTimeout(sayTimer.current)
    setSay(text)
    sayTimer.current = window.setTimeout(() => setSay(null), ms)
  }

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    try { setMinimized(sessionStorage.getItem('trek-companion-minimized') === 'true') } catch {}
  }, [])
  useEffect(() => {
    buddy.current?.setAttention(open)
    if (!open) return
    firstLink.current?.focus({ preventScroll: true })
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  // Step aside while the join banner or footer is on screen, so the buddy never covers them.
  useEffect(() => {
    if (excluded) return
    const targets = document.querySelectorAll('.join-banner, .site-footer')
    if (!targets.length || !('IntersectionObserver' in window)) return
    const visible = new Set<Element>()
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target) })
      setTucked(visible.size > 0)
    })
    targets.forEach(t => io.observe(t))
    return () => { io.disconnect(); setTucked(false) }
  }, [pathname, excluded])

  // Load three.js and the character once the browser is idle; data-saver users and browsers without WebGL get the still portrait.
  useEffect(() => {
    const el = stage.current
    if (excluded || minimized || !el) return
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) { setMode('poster'); return }
    let cancelled = false
    const onAct = (next: Act) => {
      setAct(next)
      let greeted = false
      if (next === 'enter') try { greeted = !!sessionStorage.getItem('trek-companion-greeted'); sessionStorage.setItem('trek-companion-greeted', 'true') } catch {}
      const line = greeted ? null : ACT_LINES[next]
      if (line) speak(line, next === 'sleep' ? 60000 : 3200)
      else if (next === 'wake' || next === 'idle') setSay(s => (s === ACT_LINES.sleep ? null : s))
    }
    const start = () => {
      Promise.all([import('three'), import('./CompanionScene')]).then(([THREE, { buildCompanion }]) => {
        if (cancelled) return
        buddy.current = buildCompanion(THREE, el, onAct, () => setMode('live'))
        if (!buddy.current) setMode('poster')
      }).catch(() => setMode('poster'))
    }
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void }
    const idle = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 800)
    return () => {
      cancelled = true
      if (w.requestIdleCallback) w.cancelIdleCallback?.(idle); else clearTimeout(idle)
      buddy.current?.dispose(); buddy.current = null
      setMode('loading'); setAct('idle')
    }
  }, [excluded, minimized])

  // A page-specific line the first time each section is visited this session.
  useEffect(() => {
    if (mode !== 'live') return
    const seen = `trek-companion-said:${lineFor(pathname)}`
    try { if (sessionStorage.getItem(seen)) return; sessionStorage.setItem(seen, 'true') } catch {}
    // Wait out the greeting on the first page; later pages chime in sooner.
    const t = window.setTimeout(() => speak(lineFor(pathname)), spoken.current ? 1200 : 4200)
    spoken.current = true
    return () => window.clearTimeout(t)
  }, [pathname, mode])
  useEffect(() => () => window.clearTimeout(sayTimer.current), [])
  useEffect(() => { if (mode === 'live') buddy.current?.setMusic(music.on) }, [music.on, mode])

  function minimize(value: boolean) {
    setMinimized(value)
    setOpen(false)
    try { sessionStorage.setItem('trek-companion-minimized', String(value)) } catch {}
    requestAnimationFrame(() => (value ? restore.current : trigger.current)?.focus({ preventScroll: true }))
  }
  function close() { setOpen(false); trigger.current?.focus({ preventScroll: true }) }

  if (excluded) return null
  return <aside ref={root} className={`trail-buddy${minimized ? ' is-minimized' : ''}${open ? ' is-open' : ''}${say && !open ? ' is-talking' : ''}${tucked && !open ? ' is-tucked' : ''}`} data-act={act} aria-label="Trekking companion" onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
  }}>
    <button className={`trail-buddy-music${music.on ? ' is-playing' : ''}`} data-music-toggle aria-pressed={music.on}
      aria-label={music.on ? 'Pause trail music' : 'Play trail music'} title={music.on ? 'Pause trail music' : 'Play trail music'}
      onClick={() => { music.toggle(); if (!music.on && !minimized) speak('Ooh, trail music!', 2200) }}>
      {music.on
        ? <span className="trail-buddy-eq" aria-hidden="true"><i/><i/><i/></span>
        : <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>}
    </button>
    {minimized ? <button ref={restore} className="trail-buddy-restore" onClick={() => minimize(false)} aria-label="Show trekking companion">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m2 19 7-12 4 6 3-4 6 10H2Z"/><path d="m7 10 2 2 2-2"/></svg>
    </button> : <>
      <div className="trail-buddy-perch">
        <span className="trail-buddy-whisper" aria-hidden="true">{say ?? lineFor(pathname)}</span>
        <button ref={trigger} className={`trail-buddy-character is-${mode}`} aria-label={open ? 'Close trail buddy tips' : 'Take a trail break with your trekking companion'} aria-expanded={open} aria-controls={open ? 'trail-buddy-note' : undefined}
          onClick={() => { buddy.current?.poke(); setOpen(v => !v) }}
          onPointerEnter={e => { if (e.pointerType === 'mouse') buddy.current?.hover() }}
          onFocus={() => buddy.current?.hover()}>
          {mode === 'poster'
            ? <img className="trail-buddy-portrait" src="/images/companion/trail-buddy-v2.webp" width="388" height="640" alt="" draggable={false} />
            : <span ref={stage} className="trail-buddy-stage" aria-hidden="true" />}
          <span className="trail-buddy-fx" aria-hidden="true">
            <span className="fx-spark">✦</span><span className="fx-spark">✧</span>
            <span className="fx-z">z</span><span className="fx-z">z</span><span className="fx-z">Z</span>
            <span className="fx-note">♪</span><span className="fx-note">♫</span>
            <span className="fx-star">★</span><span className="fx-star">✦</span><span className="fx-star">★</span>
          </span>
        </button>
        <button className="trail-buddy-minimize" onClick={() => minimize(true)} aria-label="Minimize trekking companion" title="Let me explore">−</button>
      </div>
      {open && <div className="trail-buddy-note" id="trail-buddy-note">
        <span className="trail-buddy-eyebrow"><span aria-hidden="true">↟</span> A HEAD START</span>
        <h2>Come trek with us.</h2>
        <p>Joining is free and costs are shared.<br/>Beginners and solo trekkers welcome.</p>
        {next
          ? <Link ref={firstLink} href={`/treks/${next.slug}`} onClick={() => setOpen(false)}>Next: {next.name}{next.date ? ` · ${formatDate(next.date)}` : ''} <span aria-hidden="true">↗</span></Link>
          : <Link ref={firstLink} href="/join" onClick={() => setOpen(false)}>Join free on WhatsApp <span aria-hidden="true">↗</span></Link>}
        {next && <Link className="trail-buddy-secondary" href="/join" onClick={() => setOpen(false)}>Join free on WhatsApp</Link>}
        <Link className="trail-buddy-secondary" href="/treks" onClick={() => setOpen(false)}>See all upcoming treks</Link>
        <Link className="trail-buddy-secondary" href="/safety" onClick={() => setOpen(false)}>First trek? What to pack</Link>
        <a className="trail-buddy-secondary" href={site.reviewLink} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Trekked with us? Review us ⭐</a>
        <button className="trail-buddy-close" aria-label="Close companion message" onClick={close}>×</button>
      </div>}
    </>}
  </aside>
}

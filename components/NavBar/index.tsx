import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon, { type IconName } from '../Icon'
import { setTheme, useTheme } from '../../lib/theme'
export function Brand() { return <Link href="/" className="brand" aria-label="Pune Trekkers home"><span className="brand-symbol"><img src="/images/brand/pune-trekkers-hiking-mark-v3-header.webp" alt="" width={34} height={34} /></span><span>PUNE <strong>TREKKERS</strong><small>FIND YOUR PEOPLE. FIND YOUR TRAIL.</small></span></Link> }
const links:[string,string,IconName][]=[['/about','Our story','people'],['/treks','Treks','calendar'],['/plans','Member hikes','people'],['/treks-near-pune','Find hikes','pin'],['/past-treks','Archive','mountain'],['/conservation','Give back','leaf']]
export default function Navbar() {
  const [open, setOpen] = useState(false); const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const theme = useTheme(); const dark = theme === 'dark'
  const pill = useRef<HTMLDivElement>(null)
  useEffect(() => { setOpen(false) }, [router.asPath])
  // Freeze the page behind the open mobile menu so it doesn't scroll underneath.
  useEffect(() => { if (!open) return; const root = document.documentElement; const previous = root.style.overflow; root.style.overflow = 'hidden'; return () => { root.style.overflow = previous } }, [open])
  useEffect(() => { const onScroll=()=>setScrolled(window.scrollY>24); onScroll(); window.addEventListener('scroll',onScroll,{passive:true}); return ()=>window.removeEventListener('scroll',onScroll) }, [])
  const moveTo = useCallback((el: HTMLElement | null) => {
    const box = pill.current; if (!box) return
    if (!el) { box.style.setProperty('--ind-o','0'); return }
    box.style.setProperty('--ind-x',`${el.offsetLeft}px`); box.style.setProperty('--ind-w',`${el.offsetWidth}px`); box.style.setProperty('--ind-o','1')
  }, [])
  const rest = useCallback(() => moveTo(pill.current?.querySelector<HTMLElement>('a[aria-current=page]') ?? null), [moveTo])
  useEffect(() => { rest(); window.addEventListener('resize',rest); return ()=>window.removeEventListener('resize',rest) }, [rest, router.asPath])
  return <header className={scrolled?'site-header is-scrolled':'site-header'}>{open&&<div className="nav-backdrop" onClick={()=>setOpen(false)} aria-hidden="true"/>}<div className="nav-wrap"><Brand/><button className="menu-toggle" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)}><Icon name={open?'close':'menu'}/></button><nav id="main-navigation" aria-label="Main navigation" className={open?'navigation is-open':'navigation'} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);(document.querySelector('.menu-toggle') as HTMLButtonElement)?.focus()}}}><div className="nav-pill" ref={pill} onMouseLeave={rest} onBlur={rest}><span className="nav-indicator" aria-hidden="true"/>{links.map(([url,label,icon])=><Link href={url} key={url} onClick={()=>setOpen(false)} onMouseEnter={e=>moveTo(e.currentTarget)} onFocus={e=>moveTo(e.currentTarget)} aria-current={router.asPath===url||router.asPath.startsWith(url+'/')?'page':undefined}><span className="nav-ico" aria-hidden="true"><Icon name={icon} size={18}/></span>{label}</Link>)}</div><Link href="/join" className="nav-join" onClick={()=>setOpen(false)}>Join the community<span className="nav-join-arrow"><Icon name="arrow" size={16}/></span></Link></nav><button type="button" className="theme-toggle" aria-label={dark?'Switch to light theme':'Switch to dark theme'} title={dark?'Light theme':'Dark theme'} onClick={()=>setTheme(dark?'light':'dark')}><Icon name={dark?'sun':'moon'} size={20}/></button></div></header>
}

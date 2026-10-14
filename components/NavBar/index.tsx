import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Icon from '../Icon'
export function Brand() { return <Link href="/" className="brand" aria-label="Pune Trekkers home"><span className="brand-symbol"><img src="/images/brand/pune-trekkers-hiking-mark-v3-header.png" alt="" /></span><span>PUNE <strong>TREKKERS</strong><small>FIND YOUR PEOPLE. FIND YOUR TRAIL.</small></span></Link> }
export default function Navbar() {
  const [open, setOpen] = useState(false); const router = useRouter()
  useEffect(() => { setOpen(false) }, [router.asPath])
  const links=[['/about','Our story'],['/treks','Upcoming treks'],['/explore-maharashtra','Explore MH'],['/past-treks','Past treks'],['/conservation','Give back']]
  return <header className="site-header"><div className="nav-wrap"><Brand/><button className="menu-toggle" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)}><Icon name={open?'close':'menu'}/></button><nav id="main-navigation" aria-label="Main navigation" className={open?'navigation is-open':'navigation'} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);(document.querySelector('.menu-toggle') as HTMLButtonElement)?.focus()}}}>{links.map(([url,label])=><Link href={url} key={url} aria-current={router.asPath===url?'page':undefined}>{label}</Link>)}<Link href="/join" className="button button-small">Join the community <Icon name="arrow" size={17}/></Link></nav></div></header>
}

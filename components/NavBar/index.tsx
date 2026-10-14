import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Icon, { type IconName } from '../Icon'
export function Brand() { return <Link href="/" className="brand" aria-label="Pune Trekkers home"><span className="brand-symbol"><img src="/images/brand/pune-trekkers-hiking-mark-v3-header.png" alt="" /></span><span>PUNE <strong>TREKKERS</strong><small>FIND YOUR PEOPLE. FIND YOUR TRAIL.</small></span></Link> }
const links:[string,string,IconName][]=[['/about','Our story','people'],['/treks','Treks','calendar'],['/find-hikes','Find hikes','pin'],['/explore-maharashtra','Explore','compass'],['/past-treks','Archive','mountain'],['/conservation','Give back','leaf']]
export default function Navbar() {
  const [open, setOpen] = useState(false); const router = useRouter()
  useEffect(() => { setOpen(false) }, [router.asPath])
  return <header className="site-header"><div className="nav-wrap"><Brand/><button className="menu-toggle" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)}><Icon name={open?'close':'menu'}/></button><nav id="main-navigation" aria-label="Main navigation" className={open?'navigation is-open':'navigation'} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);(document.querySelector('.menu-toggle') as HTMLButtonElement)?.focus()}}}>{links.map(([url,label,icon])=><Link href={url} key={url} aria-current={router.asPath===url||router.asPath.startsWith(url+'/')?'page':undefined}><Icon name={icon} size={18}/>{label}</Link>)}<Link href="/join" className="nav-join"><Icon name="chat" size={18}/>Join the community</Link></nav></div></header>
}

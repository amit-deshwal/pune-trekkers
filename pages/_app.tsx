// Global CSS, split by feature. Order matters: it is the cascade order (responsive overrides the files before it).
import '../styles/base.css'
import '../styles/home.css'
import '../styles/treks.css'
import '../styles/sections.css'
import '../styles/content.css'
import '../styles/responsive.css'
import '../styles/about.css'
import '../styles/hikes.css'
import '../styles/admin.css'
import '../styles/trail-buddy.css'
import { useEffect } from 'react'
import type { AppProps } from 'next/app'
import BaseLayout from '../components/BaseLayout'
import { Analytics } from '@vercel/analytics/react'
import Loading from '../components/Loading'
import TrekkingCompanion from '../components/TrekkingCompanion'
import { site } from '../lib/site'
// iOS browsers restore a previous scroll position after load, so a fresh visit can open part-way down the page. Reset it a few times until the visitor touches the screen.
export default function MyApp({ Component, pageProps }: AppProps) { useEffect(() => {
    if (window.location.hash) return
    const top = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    let touched = false
    const touch = () => { touched = true }
    top()
    window.addEventListener('touchstart', touch, { once: true, passive: true })
    window.addEventListener('wheel', touch, { once: true, passive: true })
    const retries = [100, 400, 1000].map(ms => setTimeout(() => { if (!touched && window.scrollY > 0) top() }, ms))
    return () => { retries.forEach(clearTimeout); window.removeEventListener('touchstart', touch); window.removeEventListener('wheel', touch) }
  }, []); return <BaseLayout><Loading/><Component {...pageProps}/><TrekkingCompanion/>{site.analytics && site.launchReady && <Analytics/>}</BaseLayout> }

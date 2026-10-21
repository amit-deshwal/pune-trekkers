import Head from 'next/head'
import Navbar from '../NavBar'
import Footer from '../Footer'
import { site } from '../../lib/site'
import type { ReactNode } from 'react'
import { useTheme } from '../../lib/theme'
export default function BaseLayout({ children }: { children: ReactNode }) { const theme = useTheme(); return <><Head><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content={theme === 'dark' ? '#0e1512' : '#244936'}/><link rel="icon" href="/favicon.ico?v=2" sizes="48x48"/><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2"/><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2"/><link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png?v=2"/><link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2"/><link rel="manifest" href="/site.webmanifest"/>{!site.launchReady&&<meta name="robots" content="noindex,nofollow" key="robots"/>}{site.googleVerification&&<meta name="google-site-verification" content={site.googleVerification}/>}</Head><a className="skip-link" href="#main-content">Skip to content</a><Navbar/><main id="main-content">{children}</main><Footer/></> }

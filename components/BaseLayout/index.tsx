import Head from 'next/head'
import Navbar from '../NavBar'
import Footer from '../Footer'
import { site } from '../../lib/site'
import type { ReactNode } from 'react'
export default function BaseLayout({ children }: { children: ReactNode }) { return <><Head><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#244936"/><link rel="icon" href="/favicon.ico" sizes="48x48"/><link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/><link rel="manifest" href="/site.webmanifest"/>{!site.launchReady&&<meta name="robots" content="noindex,nofollow" key="robots"/>}{site.googleVerification&&<meta name="google-site-verification" content={site.googleVerification}/>}</Head><a className="skip-link" href="#main-content">Skip to content</a><Navbar/><main id="main-content">{children}</main><Footer/></> }

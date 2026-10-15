import '../styles/globals.css'
import type { AppProps } from 'next/app'
import BaseLayout from '../components/BaseLayout'
import { Analytics } from '@vercel/analytics/react'
import Loading from '../components/Loading'
import TrekkingCompanion from '../components/TrekkingCompanion'
import { site } from '../lib/site'
export default function MyApp({ Component, pageProps }: AppProps) { return <BaseLayout><Loading/><Component {...pageProps}/><TrekkingCompanion/>{site.analytics && site.launchReady && <Analytics/>}</BaseLayout> }

import '../styles/globals.css'
import type { AppProps } from 'next/app'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'
config.autoAddCss = false
import BaseLayout from '../components/BaseLayout'
import { Analytics } from '@vercel/analytics/react'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <BaseLayout>
      <>
        <Component {...pageProps} />
        <Analytics />
      </>
    </BaseLayout>
  )
}

export default MyApp

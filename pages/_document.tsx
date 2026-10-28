import { Html, Head, Main, NextScript } from 'next/document'
import { phaseBootScript } from '../lib/phase'
import { themeBootScript } from '../lib/theme'
import { photoSizesUrl } from '../lib/media'
// Trek photos load from Supabase, so open that connection while the page is still arriving.
const photoOrigin=photoSizesUrl.startsWith('https://')?new URL(photoSizesUrl).origin:''
export default function Document(){return <Html lang="en-IN"><Head><script dangerouslySetInnerHTML={{__html:`${phaseBootScript};${themeBootScript}`}}/>{photoOrigin&&<link rel="preconnect" href={photoOrigin}/>}{/* Otherwise the font is only found after the stylesheet arrives. */}<link rel="preload" href="/fonts/manrope.woff2" as="font" type="font/woff2" crossOrigin=""/></Head><body><Main/><NextScript/></body></Html>}

import Head from 'next/head'
import { useRouter } from 'next/router'
import { site } from '../lib/site'
import type { JsonLd } from '../lib/seo'

// `title` gets the brand suffix; `fullTitle` replaces the whole <title> (the home page leads with the brand instead).
export default function Seo({ title, fullTitle, description = site.description, noindex = false, jsonLd = [] }: { title: string; fullTitle?: string; description?: string; noindex?: boolean; jsonLd?: JsonLd | JsonLd[] }) {
  const router = useRouter()
  const url = site.url + router.asPath.split(/[?#]/)[0]
  const pageTitle = fullTitle || `${title} | ${site.name}`
  const image = `${site.url}/social-card.png`
  const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
  return <Head>
    <title>{pageTitle}</title>
    <meta name="description" content={description} key="description"/>
    <link rel="canonical" href={url} key="canonical"/>
    {noindex && <meta name="robots" content="noindex,nofollow" key="robots"/>}
    <meta property="og:site_name" content={site.name} key="og:site_name"/>
    <meta property="og:locale" content="en_IN" key="og:locale"/>
    <meta property="og:type" content="website" key="og:type"/>
    <meta property="og:title" content={pageTitle} key="og:title"/>
    <meta property="og:description" content={description} key="og:description"/>
    <meta property="og:url" content={url} key="og:url"/>
    <meta property="og:image" content={image} key="og:image"/>
    <meta property="og:image:width" content="1200" key="og:image:width"/>
    <meta property="og:image:height" content="630" key="og:image:height"/>
    <meta property="og:image:alt" content="Pune Trekkers, a free trekking community in Pune" key="og:image:alt"/>
    <meta name="twitter:card" content="summary_large_image" key="twitter:card"/>
    <meta name="twitter:title" content={pageTitle} key="twitter:title"/>
    <meta name="twitter:description" content={description} key="twitter:description"/>
    <meta name="twitter:image" content={image} key="twitter:image"/>
    {site.launchReady && !noindex && schemas.map((schema, i) => <script key={`ld-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>)}
  </Head>
}

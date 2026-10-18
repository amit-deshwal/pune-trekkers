import type { Trek } from './content-schema'

// Structured data (schema.org JSON-LD) builders. Kept free of runtime imports so tests can load them directly.
export type JsonLd = Record<string, unknown>
type SiteInfo = { name: string; url: string; description: string; email: string; instagram: string }

const context = 'https://schema.org'
const absolute = (base: string, src: string) => /^https?:\/\//.test(src) ? src : base + src

export function organizationJsonLd(site: SiteInfo): JsonLd {
  return {
    '@context': context, '@type': 'Organization', '@id': `${site.url}/#organization`,
    name: site.name, alternateName: ['Pune Trekkers Community', 'Pune Trekking Group', 'punetrekkers.org'], slogan: 'Community over commerce',
    url: site.url, logo: `${site.url}/android-chrome-512x512.png`,
    description: site.description, email: site.email, sameAs: [site.instagram],
    areaServed: { '@type': 'City', name: 'Pune', containedInPlace: { '@type': 'State', name: 'Maharashtra' } },
    knowsAbout: ['Trekking', 'Hiking', 'Sahyadri forts', 'Treks near Pune', 'Free trekking group in Pune'],
    foundingLocation: { '@type': 'City', name: 'Pune' },
  }
}

export function websiteJsonLd(site: SiteInfo): JsonLd {
  return { '@context': context, '@type': 'WebSite', '@id': `${site.url}/#website`, name: site.name, alternateName: 'Pune Trekkers Community', url: site.url, inLanguage: 'en-IN', publisher: { '@id': `${site.url}/#organization` } }
}

export function faqJsonLd(items: string[][]): JsonLd {
  return { '@context': context, '@type': 'FAQPage', mainEntity: items.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) }
}

export function aboutPageJsonLd(site: SiteInfo): JsonLd {
  return { '@context': context, '@type': 'AboutPage', url: `${site.url}/about`, name: `About ${site.name}`, about: { '@id': `${site.url}/#organization` }, isPartOf: { '@id': `${site.url}/#website` } }
}

// Crumbs are [label, path] pairs, starting from the home page.
export function breadcrumbJsonLd(base: string, crumbs: [string, string][]): JsonLd {
  return { '@context': context, '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: base + path })) }
}

export function itemListJsonLd(name: string, items: { name: string; url?: string }[]): JsonLd {
  return { '@context': context, '@type': 'ItemList', name, numberOfItems: items.length, itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, ...(item.url ? { url: item.url } : {}) })) }
}

// "₹850", "Rs 1,200 approx." → 850 / 1200. Ranges use the first figure.
export function parseRupees(cost: string): number | null {
  const match = cost.replace(/,/g, '').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : null
}

// Only organizer-confirmed treks with a verified date are events; proposals must not appear in event search results.
export function trekEventJsonLd(trek: Trek, site: SiteInfo): JsonLd | null {
  if (trek.status !== 'confirmed' || !trek.date) return null
  const url = `${site.url}/treks/${trek.slug}`
  const price = parseRupees(trek.approximateCost)
  const availability = { Open: 'InStock', Full: 'SoldOut', Closed: 'SoldOut', 'Not open': 'PreOrder' }[trek.registrationStatus]
  return {
    '@context': context, '@type': 'Event', name: trek.name, description: trek.summary, url,
    startDate: trek.startTime ? `${trek.date}T${trek.startTime}:00+05:30` : trek.date, eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: trek.destination, address: { '@type': 'PostalAddress', addressRegion: 'Maharashtra', addressCountry: 'IN' } },
    organizer: { '@type': 'Organization', name: site.name, url: site.url },
    ...(trek.photos[0] ? { image: [absolute(site.url, trek.photos[0].src)] } : {}),
    ...(trek.capacity ? { maximumAttendeeCapacity: trek.capacity } : {}),
    ...(price === 0 ? { isAccessibleForFree: true } : {}),
    ...(price !== null ? { offers: { '@type': 'Offer', price, priceCurrency: 'INR', availability: `https://schema.org/${availability}`, url } } : {}),
  }
}

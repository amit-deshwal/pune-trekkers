import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { breadcrumbJsonLd, faqJsonLd, parseRupees, trekEventJsonLd, organizationJsonLd } from '../lib/seo.ts'
import { km, nearbyHikes, PUNE, type HikeRecord } from '../lib/hikes.ts'
import type { Trek } from '../lib/content-schema.ts'

const site = { name: 'Pune Trekkers', url: 'https://example.org', description: 'A community', email: 'a@example.org', instagram: 'https://instagram.com/x' }
const trek = (over: Partial<Trek> = {}): Trek => ({ slug: 'rajgad', name: 'Rajgad trek', destination: 'Rajgad Fort', status: 'confirmed', kind: 'trek', organizerConfirmed: true, date: '2026-11-08', dateVerified: true, difficulty: 'Moderate', duration: '1 day', approximateCost: '₹1,250 approx.', capacity: 20, registrationStatus: 'Open', registrationUrl: null, beginnerGuidance: '', fitness: '', transport: '', meetingPoint: '', inclusions: '', exclusions: '', cancellation: '', route: '', summary: 'A day on Rajgad.', highlights: [], participantCount: null, countVerified: false, archiveYear: null, photos: [], videos: [], organizerName: '', organizerWhatsapp: '', organizerChat: false, ...over })

test('confirmed, dated treks become events with an INR offer', () => {
  const event = trekEventJsonLd(trek(), site) as any
  assert.equal(event['@type'], 'Event')
  assert.equal(event.startDate, '2026-11-08')
  assert.equal(event.url, 'https://example.org/treks/rajgad')
  assert.deepEqual(event.offers, { '@type': 'Offer', price: 1250, priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: 'https://example.org/treks/rajgad' })
  assert.equal(event.location.address.addressCountry, 'IN')
})

test('proposed or undated treks are never marked up as events', () => {
  assert.equal(trekEventJsonLd(trek({ status: 'proposed' }), site), null)
  assert.equal(trekEventJsonLd(trek({ date: null }), site), null)
  assert.equal(trekEventJsonLd(trek({ status: 'completed' }), site), null)
})

test('events omit the offer when the cost has no figure, and absolutise photo URLs', () => {
  const event = trekEventJsonLd(trek({ approximateCost: 'To be confirmed', photos: [{ id: 'p', src: '/images/a.jpg', alt: 'Rajgad ridge', caption: '', credit: '' }] }), site) as any
  assert.equal(event.offers, undefined)
  assert.deepEqual(event.image, ['https://example.org/images/a.jpg'])
})

test('rupee parsing handles symbols, commas and words', () => {
  assert.equal(parseRupees('₹850'), 850)
  assert.equal(parseRupees('Rs 1,200 per person'), 1200)
  assert.equal(parseRupees('₹700–900'), 700)
  assert.equal(parseRupees('Shared on the day'), null)
})

test('FAQ and breadcrumb schemas keep order and absolute URLs', () => {
  const faq = faqJsonLd([['Q1', 'A1'], ['Q2', 'A2']]) as any
  assert.deepEqual(faq.mainEntity.map((q: any) => [q.name, q.acceptedAnswer.text]), [['Q1', 'A1'], ['Q2', 'A2']])
  const crumbs = breadcrumbJsonLd(site.url, [['Home', '/'], ['Treks near Pune', '/treks-near-pune']]) as any
  assert.deepEqual(crumbs.itemListElement.map((c: any) => [c.position, c.item]), [[1, 'https://example.org/'], [2, 'https://example.org/treks-near-pune']])
  assert.equal((organizationJsonLd(site) as any).sameAs[0], site.instagram)
})

test('nearby hikes measure to the nearest listed base village, else the mapped place', () => {
  const hikes: HikeRecord[] = [
    { slug: 'far', name: 'Far Fort', kind: 'fort', lat: 19.5, lon: 73.85, region: null, starts: [] },
    { slug: 'near', name: 'Near Fort', kind: 'fort', lat: 18.7, lon: 73.85, region: null, starts: [{ name: 'Unchecked', lat: 18.53, lon: 73.85, verified: false }, { name: 'Base', lat: 18.6, lon: 73.85, verified: true }] },
    { slug: 'ignored', name: 'Ignored', kind: 'peak', lat: 18.52, lon: 73.85, region: null, starts: [] },
  ]
  const list = nearbyHikes(hikes, ['far', 'near'])
  assert.deepEqual(list.map(h => [h.slug, h.baseVillage]), [['near', 'Base'], ['far', null]])
  assert.equal(list[0].km, Math.round(km(PUNE, { lat: 18.6, lon: 73.85 })))
})

test('every featured hike resolves in the shipped dataset', () => {
  const hikes: HikeRecord[] = JSON.parse(readFileSync(new URL('../public/data/hikes.json', import.meta.url), 'utf8'))
  const featured = JSON.parse(readFileSync(new URL('../data/hike-review.json', import.meta.url), 'utf8')).featured.map((h: { slug: string }) => h.slug)
  assert.equal(nearbyHikes(hikes, featured).length, featured.length)
})

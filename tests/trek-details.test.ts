import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contentSchema, publicContent, trekSchema, whatsappDigits, type SiteContent } from '../lib/content-schema.ts'
import { realText } from '../lib/places.ts'
import { costLabel } from '../lib/site.ts'
import { trekEventJsonLd } from '../lib/seo.ts'

const trek = (over: Record<string, unknown> = {}) => trekSchema.parse({ slug: 'ghoradeshwar', name: 'Ghoradeshwar morning hike', destination: 'Ghoradeshwar', status: 'confirmed', organizerConfirmed: true, date: '2026-10-17', dateVerified: true, difficulty: 'Moderate', duration: '3 hours', approximateCost: '0', capacity: null, registrationStatus: 'Not open', registrationUrl: null, beginnerGuidance: '', fitness: '', transport: '', meetingPoint: '', inclusions: '', exclusions: '', cancellation: '', route: '', summary: 'Caves above the temple.', highlights: [], participantCount: null, countVerified: false, archiveYear: null, photos: [], ...over })

test('WhatsApp numbers are stored as digits with a country code', () => {
  assert.equal(whatsappDigits('+91 98765 43210'), '919876543210')
  assert.equal(whatsappDigits('98765-43210'), '919876543210')
  assert.equal(whatsappDigits('098765 43210'), '919876543210')
  assert.equal(whatsappDigits('+44 7700 900123'), '447700900123')
  assert.equal(trek({ organizerWhatsapp: '98765 43210' }).organizerWhatsapp, '919876543210')
  assert.throws(() => trek({ organizerWhatsapp: '12345' }), /country code/)
})

test('public content hides the number but keeps the chat button, even when applied twice', () => {
  const content = { treks: [trek({ organizerName: 'Amit', organizerWhatsapp: '+91 98765 43210' })], hero: null, timeline: [], people: [], testimonials: [], socialLinks: [], impactReports: [] } as SiteContent
  const once = publicContent(contentSchema.parse(content))
  assert.equal(once.treks[0].organizerWhatsapp, '')
  assert.equal(once.treks[0].organizerChat, true)
  assert.equal(JSON.stringify(once).includes('98765'), false)
  assert.equal(publicContent(contentSchema.parse(once)).treks[0].organizerChat, true)
  assert.equal(publicContent(contentSchema.parse({ ...content, treks: [trek()] })).treks[0].organizerChat, false)
})

test('placeholder text from older admin forms is hidden', () => {
  for (const placeholder of ['To be confirmed', 'To be confirmed by the organizer.', 'Route details to be confirmed', 'Personal gear and anything not listed in the trek briefing.', 'The organizer will share the trek-specific cancellation and cost-adjustment terms.']) assert.equal(realText(placeholder), '', placeholder)
  assert.equal(realText('Meet at the Bhugaon bus stop'), 'Meet at the Bhugaon bus stop')
})

test('costs read naturally', () => {
  assert.equal(costLabel('0'), 'Free')
  assert.equal(costLabel('₹0'), 'Free')
  assert.equal(costLabel('850'), '₹850')
  assert.equal(costLabel('₹850, actual cost shared'), '₹850, actual cost shared')
  assert.equal(costLabel(''), '')
})

test('free treks are marked as free events', () => {
  const site = { name: 'Pune Trekkers', url: 'https://example.org', description: '', email: '', instagram: '' }
  assert.equal((trekEventJsonLd(trek(), site) as any).isAccessibleForFree, true)
  assert.equal((trekEventJsonLd(trek({ approximateCost: '850' }), site) as any).isAccessibleForFree, undefined)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { eventSignupSchema } from '../lib/event-signup-schema.ts'
import { eventBySlug, isEventOver } from '../lib/events.ts'
import { communityEventJsonLd } from '../lib/seo.ts'

const valid = { event: 'treasure-trail', name: 'Asha', whatsapp: '98765 43210', level: 'new', friends: '', consent: true, website: '' }
const site = { name: 'Pune Trekkers', url: 'https://punetrekkers.org', description: '', email: 'hello@punetrekkers.org', instagram: '' }

test('a sign-up is accepted and the number is stored as digits with a country code', () => {
  assert.equal(eventSignupSchema.parse(valid).whatsapp, '919876543210')
})
test('unknown events, bad levels, links, a filled honeypot and missing consent are rejected', () => {
  assert.throws(() => eventSignupSchema.parse({ ...valid, event: 'nope' }))
  assert.throws(() => eventSignupSchema.parse({ ...valid, level: 'pro' }))
  assert.throws(() => eventSignupSchema.parse({ ...valid, friends: 'visit https://spam.example' }))
  assert.throws(() => eventSignupSchema.parse({ ...valid, website: 'bot' }))
  assert.throws(() => eventSignupSchema.parse({ ...valid, consent: false }))
})
test('the treasure trail is on a Saturday with 24 spots', () => {
  const event = eventBySlug('treasure-trail')!
  assert.equal(new Date(`${event.date}T12:00:00+05:30`).getDay(), 6)
  assert.equal(event.capacity, 24)
  assert.equal(isEventOver(event, '2026-11-01'), true)
  assert.equal(isEventOver(event, '2026-10-31'), false)
})
test('event structured data is a free event that keeps the exact place back', () => {
  const data = communityEventJsonLd(eventBySlug('treasure-trail')!, site) as Record<string, any>
  assert.equal(data['@type'], 'Event')
  assert.equal(data.startDate, '2026-10-31T07:00:00+05:30')
  assert.equal(data.isAccessibleForFree, true)
  assert.match(data.location.name, /Near Pune/)
})

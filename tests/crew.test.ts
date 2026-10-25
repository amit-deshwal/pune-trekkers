import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCrew } from '../lib/crew-schema.ts'
import { sinceLabel } from '../lib/site.ts'

const member = { name: 'Asha', role: 'Trek post writer', since: '2026-10', blurb: 'Writes the trail reports.', instagram: '', consent: true }

test('only people who agreed to be named are listed, oldest volunteers first', () => {
  const list = parseCrew([{ ...member, name: 'Zed', since: '2026-11' }, { ...member, name: 'Hidden', consent: false }, member])
  assert.deepEqual(list.map(item => item.name), ['Asha', 'Zed'])
})
test('bad dates and non-Instagram links are rejected', () => {
  assert.throws(() => parseCrew([{ ...member, since: 'October 2026' }]))
  assert.throws(() => parseCrew([{ ...member, instagram: 'https://evil.example/asha' }]))
  assert.equal(parseCrew([{ ...member, instagram: 'https://www.instagram.com/asha.treks' }]).length, 1)
})
test('start month and photo are optional, and photos must live in the crew folder', () => {
  const [founder] = parseCrew([{ name: 'Amit', role: 'Founder & admin', consent: true, photo: '/images/crew/amit.webp' }])
  assert.equal(founder.since, '')
  assert.throws(() => parseCrew([{ ...member, photo: 'https://evil.example/x.jpg' }]))
})
test('website must be https and email must be valid', () => {
  assert.equal(parseCrew([{ ...member, website: 'https://amitdeshwal.com', email: 'hi@example.com' }]).length, 1)
  assert.throws(() => parseCrew([{ ...member, website: 'javascript:alert(1)' }]))
  assert.throws(() => parseCrew([{ ...member, email: 'nope' }]))
})
test('the join month is shown in words', () => {
  assert.equal(sinceLabel('2026-10'), 'Oct 2026')
})

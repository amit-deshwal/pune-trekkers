import test from 'node:test'
import assert from 'node:assert/strict'
import { hikeMessage, weekendHikes, weekendMessage, weekendOf } from '../lib/weekend-share.ts'

const site = 'https://punetrekkers.org'
const trek = { slug: 'rajgad', name: 'Rajgad sunrise trek', destination: 'Velhe', date: '2026-10-25', startTime: '06:30', difficulty: 'Moderate', status: 'confirmed', meetingPoint: 'Swargate', approximateCost: '850' }
const plan = { id: 'abc', name: 'Asha', destination: 'Sinhagad', date: '2026-10-24', startTime: '', difficulty: 'Easy', status: 'approved', meetingPoint: '' }

test('weekdays look ahead to the coming weekend, weekends use the one under way', () => {
  assert.deepEqual(weekendOf('2026-10-22'), { saturday: '2026-10-24', sunday: '2026-10-25', from: '2026-10-24' }) // Thursday
  assert.deepEqual(weekendOf('2026-10-24'), { saturday: '2026-10-24', sunday: '2026-10-25', from: '2026-10-24' }) // Saturday
  assert.deepEqual(weekendOf('2026-10-25'), { saturday: '2026-10-24', sunday: '2026-10-25', from: '2026-10-25' }) // Sunday skips Saturday
  assert.deepEqual(weekendOf('2026-10-25', 1), { saturday: '2026-10-31', sunday: '2026-11-01', from: '2026-10-31' })
})
test('only live treks and approved member plans on that weekend are included, in date order', () => {
  const weekend = weekendOf('2026-10-23')
  const hikes = weekendHikes(site, [trek, { ...trek, slug: 'gone', status: 'cancelled' }, { ...trek, slug: 'later', date: '2026-11-01' }], [plan, { ...plan, id: 'x', status: 'pending' }], weekend)
  assert.deepEqual(hikes.map(hike => hike.url), [`${site}/plans#plan-abc`, `${site}/treks/rajgad`])
})
test('the group message has a greeting, each hike with its details and link, and the invite', () => {
  const weekend = weekendOf('2026-10-23')
  const message = weekendMessage(site, weekendHikes(site, [trek], [plan], weekend), weekend, 'https://chat.whatsapp.com/x')
  assert.match(message, /^Hi everyone 👋 Here’s what’s happening this weekend \(Sat 24 – Sun 25 Oct\)/)
  assert.match(message, /\*Rajgad sunrise trek\*\n📅 Sun, 25 Oct, 6:30 AM\n⛰️ Moderate · ₹850 shared cost\n📍 Swargate\n👉 Details and sign-up: https:\/\/punetrekkers\.org\/treks\/rajgad/)
  assert.match(message, /🥾 \*Member hikes\*\n\n\*Sinhagad\* \(planned by Asha\)\n📅 Sat, 24 Oct\n⛰️ Easy\n👉 Message Asha to join: /)
  assert.match(message, /Join the community: https:\/\/chat\.whatsapp\.com\/x$/)
})
test('one hike can be sent on its own, and an empty weekend still gives a useful message', () => {
  const weekend = weekendOf('2026-10-23')
  assert.match(hikeMessage(weekendHikes(site, [trek], [], weekend)[0]), /^🥾 Pune Trekkers trek this weekend – come along!\n\n\*Rajgad sunrise trek\*/)
  assert.match(weekendMessage(site, [], weekend), /Nothing is listed for this weekend.*\n\nHeading out yourself\?.*\/plans\/new/)
})

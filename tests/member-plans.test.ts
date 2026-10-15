import test from 'node:test'
import assert from 'node:assert/strict'
import { planInputSchema } from '../lib/member-plan-schema.ts'

const valid = { name: 'Asha', whatsapp: '98765 43210', destination: 'Rajgad fort', date: '2030-01-10', startTime: '06:30', meetingPoint: 'Swargate', difficulty: 'Moderate', maxPeople: 4, summary: 'Easy pace, back by noon.', consent: true, website: '' }

test('a member plan is accepted and the number is stored as digits with a country code', () => {
  const plan = planInputSchema.parse(valid)
  assert.equal(plan.whatsapp, '919876543210')
})
test('links are rejected in free-text fields', () => {
  assert.throws(() => planInputSchema.parse({ ...valid, summary: 'Join my group at https://spam.example now' }))
  assert.throws(() => planInputSchema.parse({ ...valid, meetingPoint: 'www.example.com' }))
})
test('the honeypot field must stay empty and consent is required', () => {
  assert.throws(() => planInputSchema.parse({ ...valid, website: 'bot' }))
  assert.throws(() => planInputSchema.parse({ ...valid, consent: false }))
})
test('a bad number or time is rejected', () => {
  assert.throws(() => planInputSchema.parse({ ...valid, whatsapp: '12345' }))
  assert.throws(() => planInputSchema.parse({ ...valid, startTime: '25:99' }))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { volunteerInputSchema } from '../lib/volunteer-schema.ts'
import { roleTitle } from '../lib/volunteer-roles.ts'

const valid = { name: 'Asha', whatsapp: '98765 43210', email: '', roles: ['trek-writer', 'reddit'], experience: 'Wrote trek reports for a college club.', portfolio: '', availability: 'One weekend a month', consent: true, website: '' }

test('an application is accepted and the number is stored as digits with a country code', () => {
  const application = volunteerInputSchema.parse(valid)
  assert.equal(application.whatsapp, '919876543210')
  assert.deepEqual(application.roles, ['trek-writer', 'reddit'])
})
test('at least one known role is required', () => {
  assert.throws(() => volunteerInputSchema.parse({ ...valid, roles: [] }))
  assert.throws(() => volunteerInputSchema.parse({ ...valid, roles: ['admin'] }))
})
test('links are only allowed in the portfolio field', () => {
  assert.throws(() => volunteerInputSchema.parse({ ...valid, experience: 'See https://spam.example for my work' }))
  assert.equal(volunteerInputSchema.parse({ ...valid, portfolio: 'https://instagram.com/asha' }).portfolio, 'https://instagram.com/asha')
  assert.throws(() => volunteerInputSchema.parse({ ...valid, portfolio: 'javascript:alert(1)' }))
})
test('an optional email must be valid, the honeypot empty and consent given', () => {
  assert.throws(() => volunteerInputSchema.parse({ ...valid, email: 'not-an-email' }))
  assert.throws(() => volunteerInputSchema.parse({ ...valid, website: 'bot' }))
  assert.throws(() => volunteerInputSchema.parse({ ...valid, consent: false }))
})
test('role ids map back to readable titles', () => {
  assert.equal(roleTitle('trek-writer'), 'Trek post writer')
})

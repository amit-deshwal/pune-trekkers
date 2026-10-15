import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { districtLabel, districtName, isDistrict } from '../lib/hike-labels.ts'

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('district spellings collapse to one current name', () => {
  assert.equal(districtName('Kolhaapur'), 'Kolhapur')
  assert.equal(districtName('Nahsik'), 'Nashik')
  assert.equal(districtName('C.Sambhaji Nagar'), 'Chhatrapati Sambhajinagar (Aurangabad)')
  assert.equal(districtName('Nagar'), 'Ahilyanagar (Ahmednagar)')
  assert.equal(districtName(' Pune '), 'Pune')
  assert.equal(districtLabel('Usmanabad'), 'Dharashiv (Osmanabad) district')
  assert.equal(districtLabel(''), null)
})

test('ranges are not mistaken for districts', () => {
  for (const range of ['Naneghat', 'Mahabaleshwar', 'Kalsubai', 'Lonavala', 'Konkan']) assert.equal(isDistrict(range), false, range)
  for (const district of ['Pune', 'Raigad', 'Ahmednagar', 'Sindhudurga']) assert.equal(isDistrict(district), true, district)
})

test('every listing the finder shows has a region ending in a known district', () => {
  const hikes = read('../public/data/hikes.json') as any[]
  const review = read('../data/hike-review.json')
  const featured = new Set(review.featured.map((h: { slug: string }) => h.slug)), excluded = new Set(review.exclude)
  const visible = hikes.filter(h => !excluded.has(h.slug) && (featured.has(h.slug) || h.links.some((l: { label: string }) => l.label === 'Trekshitiz' || l.label === 'Maharashtra Tourism')))
  for (const hike of visible) {
    assert.match(hike.region ?? '', / district$/, hike.slug)
    assert.ok(isDistrict(hike.region.split(' · ').pop().replace(/ district$/, '')), `${hike.slug}: ${hike.region}`)
    assert.ok(!hike.areas.some((area: string) => isDistrict(area)), hike.slug)
  }
  const bySlug = new Map(hikes.map(h => [h.slug, h]))
  assert.equal(bySlug.get('kalasubai-peak').kind, 'peak')
  assert.equal(bySlug.get('murud-janjira').kind, 'fort')
})

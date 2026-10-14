// Structural audit of every published hike and location record.
// This does not establish that a mapped place is a safe or accessible walking route.
import { readFileSync } from 'node:fs'

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
const hikes = read('public/data/hikes.json') as any[]
const places = read('public/data/places.json') as any[]
const review = read('data/hike-review.json') as { featured: { slug: string; evidence: string }[]; exclude: string[] }
const errors: string[] = []
const slugs = new Set<string>()
const inBox = (lat: number, lon: number) => Number.isFinite(lat) && Number.isFinite(lon) && lat >= 15.5 && lat <= 22.1 && lon >= 72.5 && lon <= 80.95
const rad = (degrees: number) => degrees * Math.PI / 180
const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
  12742 * Math.asin(Math.sqrt(Math.sin(rad(a.lat - b.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(a.lon - b.lon) / 2) ** 2))

for (const hike of hikes) {
  if (!hike.slug || slugs.has(hike.slug)) errors.push(`Missing or duplicate slug: ${hike.slug}`)
  slugs.add(hike.slug)
  if (!inBox(hike.lat, hike.lon)) errors.push(`Out-of-bounds hike: ${hike.slug}`)
  if (!['fort', 'peak'].includes(hike.kind)) errors.push(`Invalid kind: ${hike.slug}`)
  if (hike.elevationM !== null && (!Number.isFinite(hike.elevationM) || hike.elevationM < 0 || hike.elevationM > 1646)) errors.push(`Implausible elevation: ${hike.slug}`)
  for (const start of hike.starts) {
    if (!inBox(start.lat, start.lon) || km(hike, start) > 20) errors.push(`Invalid or distant village: ${hike.slug} / ${start.name}`)
  }
  for (const link of hike.links) if (!/^https:\/\//.test(link.url)) errors.push(`Invalid source URL: ${hike.slug}`)
}
for (const place of places) if (!inBox(place[1], place[2])) errors.push(`Out-of-bounds place: ${place[0]}`)
for (const item of review.featured) {
  if (!slugs.has(item.slug) || !/^https:\/\//.test(item.evidence)) errors.push(`Invalid featured entry: ${item.slug}`)
}
for (const slug of review.exclude) if (!slugs.has(slug)) errors.push(`Unknown exclusion: ${slug}`)

const withSourceLink = hikes.filter(h => h.links.some((l: { label: string }) => l.label === 'Trekshitiz' || l.label === 'Maharashtra Tourism'))
const withListedVillage = hikes.filter(h => h.starts.some((s: { verified: boolean }) => s.verified))
console.log(JSON.stringify({ hikes: hikes.length, places: places.length, sourceLinked: withSourceLink.length, withListedVillage: withListedVillage.length, featured: review.featured.length, structurallyInvalid: errors.length }, null, 2))
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
}

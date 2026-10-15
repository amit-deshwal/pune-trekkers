// Re-hosts photos from the old site's gallery (data/legacy-gallery.json, already downloaded as <id>.img) in our bucket
// and adds them as completed gallery trips; Devkund and Kalavantin photos join the trips that already exist.
// Run: node --env-file=.env.local --experimental-strip-types scripts/import-legacy-gallery.ts
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { contentSchema, publicContent, trekSchema } from '../lib/content-schema.ts'

const DIR = '/private/tmp/claude-501/-Users-amitdeshwal-Documents-Personal-work-pune-trekkers/6a02d48d-04f4-4c59-b615-29873bf6b74c/scratchpad/legacy'
const legacy: { id: number; name: string; place: string }[] = JSON.parse(readFileSync(new URL('../data/legacy-gallery.json', import.meta.url), 'utf8'))
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const { data, error } = await s.from('site_content').select('data').eq('id', 'main').single()
if (error) throw error
const content = contentSchema.parse(data.data)

// legacy place -> [trip name, destination, date | null, existing trip to join instead of creating one]
const map: Record<string, [string, string, string | null, string?]> = {
  'Jivdhan Night Camping': ['Jivdhan Night Camping', 'Jivdhan', '2023-12-13'],
  'Ratangad': ['Ratangad', 'Ratangad', null],
  'Tarsar Marsar Trek': ['Tarsar Marsar Trek', 'Tarsar Marsar', null],
  'Rohida Fort': ['Rohida Fort', 'Rohida Fort', null],
  'Goradeshwar': ['Goradeshwar', 'Goradeshwar', null],
  'Rajgad Fort': ['Rajgad Fort', 'Rajgad Fort', null],
  'Devkund Waterfall': ['Devkund Waterfall', '', null, 'Devkund Waterfall'],
  'Kalavantin & Prabalgad': ['Kalavantin + Prabhalgad', '', null, 'Kalavantin + Prabhalgad'],
}
const groups = new Map<string, typeof legacy>()
for (const item of [...legacy].sort((a, b) => a.id - b.id)) { const key = item.place.trim(); groups.set(key, [...(groups.get(key) || []), item]) }

const added = []
for (const [place, items] of groups) {
  const [name, destination, date, joins] = map[place] ?? (() => { throw new Error('unmapped place ' + place) })()
  const existing = joins ? content.treks.find(t => t.name === joins) : content.treks.find(t => t.name === name && t.date === date)
  if (!joins && existing) { console.log('SKIP exists:', name); continue }
  if (joins && !existing) throw new Error('missing trip to join: ' + joins)
  const photos = []
  for (const [i, item] of items.entries()) {
    const path = `trip-uploads/${crypto.randomUUID()}/${crypto.randomUUID()}.jpg`
    const up = await s.storage.from('trip-uploads').upload(path, readFileSync(`${DIR}/${item.id}.img`), { contentType: 'image/jpeg', upsert: false })
    if (up.error) throw new Error(`${item.id}: ${up.error.message}`)
    photos.push({ id: crypto.randomUUID(), src: `/api/media/${path}`, alt: `${name} trek photo ${(existing?.photos.length ?? 0) + i + 1}`, caption: '', credit: item.name })
  }
  if (existing) { existing.photos.push(...photos); console.log('ADDED', photos.length, 'photos to', name); continue }
  added.push(trekSchema.parse({
    slug: crypto.randomUUID(), name, destination, status: 'completed', kind: 'trek', organizerConfirmed: false, date, dateVerified: Boolean(date),
    difficulty: 'To be confirmed', duration: '', approximateCost: '', capacity: null, registrationStatus: 'Not open', registrationUrl: null,
    beginnerGuidance: '', fitness: '', transport: '', meetingPoint: '', inclusions: '', exclusions: '', cancellation: '', route: '',
    summary: '', highlights: [], participantCount: null, countVerified: false, archiveYear: null, photos, videos: [],
  }))
  console.log('ADDED trip', name, date ?? 'no date', photos.length, 'photos')
}
const next = contentSchema.parse({ ...content, treks: [...added, ...content.treks] }), now = new Date().toISOString()
for (const [t, d] of [['site_content', next], ['public_site_content', publicContent(next)]] as const) { const r = await s.from(t).upsert({ id: 'main', data: d, updated_at: now }); if (r.error) throw r.error }
console.log('Saved.')

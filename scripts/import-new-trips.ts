// Uploads the Oct 2026 batch of trip photos (already converted to JPEG) and adds them as completed gallery trips.
// Run: node --env-file=.env.local --experimental-strip-types scripts/import-new-trips.ts
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { contentSchema, publicContent, trekSchema } from '../lib/content-schema.ts'

const NEW = '/private/tmp/claude-501/-Users-amitdeshwal-Documents-Personal-work-pune-trekkers/6a02d48d-04f4-4c59-b615-29873bf6b74c/scratchpad/new'
// name, destination, date (from photo EXIF), files in folder order, files to show first
const trips: [string, string, string, string, string[], string[]][] = [
  ['Aadrai Trek', 'Aadrai', '2026-07-25', 'Aadrai', ['20260725_093752', '20260725_124726', '20260725_125447', 'IMG_7137', 'IMG_7634', 'IMG_7661', 'IMG_7809'], ['20260725_124726', '20260725_125447', 'IMG_7634', 'IMG_7809']],
  ['AMK Trek', 'Alang, Madan and Kulang', '2026-10-10', 'AMKTr', ['20261011_112921_Original', 'IMG_0320', 'IMG_0484', 'IMG_0540', 'IMG_0577', 'IMG_0645', 'IMG_0663', 'IMG_0687'], ['IMG_0320', 'IMG_0577', 'IMG_0645', '20261011_112921_Original']],
  ['Supwati Dongarvadi', 'Supwati and Dongarvadi', '2026-08-01', 'Supwat', ['IMG_7898', 'IMG_7921', 'IMG_7960', 'IMG_7967', 'IMG_8005'], []],
  ['Tung Fort', 'Tung Fort', '2026-10-03', 'TungF', ['IMG_0014', 'IMG_0015', 'IMG_0070', 'IMG_0105', 'IMG_0112', 'IMG_9975'], ['IMG_0112', 'IMG_0105']],
]
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const { data, error } = await s.from('site_content').select('data').eq('id', 'main').single()
if (error) throw error
const content = contentSchema.parse(data.data)
const added = []
for (const [name, destination, date, dir, files, firstFiles] of trips) {
  if (content.treks.some(t => t.name === name && t.date === date)) { console.log('SKIP exists:', name, date); continue }
  const byFile: Record<string, any> = {}
  for (const [i, f] of files.entries()) {
    const path = `trip-uploads/${crypto.randomUUID()}/${crypto.randomUUID()}.jpg`
    // IMG_0015 was filed under Aadrai but belongs to Tung Fort (it lives in the Aadrai scratch folder)
    const local = f === 'IMG_0015' ? `${NEW}/Aadrai/IMG_0015.jpg` : `${NEW}/${dir}/${f}.jpg`
    const up = await s.storage.from('trip-uploads').upload(path, readFileSync(local), { contentType: 'image/jpeg', upsert: false })
    if (up.error) throw new Error(`${f}: ${up.error.message}`)
    byFile[f] = { id: crypto.randomUUID(), src: `/api/media/${path}`, alt: `${name} trek photo ${i + 1}`, caption: '', credit: '' }
  }
  const photos = [...firstFiles, ...files.filter(f => !firstFiles.includes(f))].map(f => byFile[f])
  added.push(trekSchema.parse({
    slug: crypto.randomUUID(), name, destination, status: 'completed', organizerConfirmed: false, date, dateVerified: true,
    difficulty: 'To be confirmed', duration: '', approximateCost: '', capacity: null, registrationStatus: 'Not open', registrationUrl: null,
    beginnerGuidance: '', fitness: '', transport: '', meetingPoint: '', inclusions: '', exclusions: '', cancellation: '', route: '',
    summary: '', highlights: [], participantCount: null, countVerified: false, archiveYear: null, photos, videos: [],
  }))
  console.log('ADDED', name, date, photos.length, 'photos')
}
const next = contentSchema.parse({ ...content, treks: [...added, ...content.treks] }), now = new Date().toISOString()
for (const [t, d] of [['site_content', next], ['public_site_content', publicContent(next)]] as const) { const r = await s.from(t).upsert({ id: 'main', data: d, updated_at: now }); if (r.error) throw r.error }
console.log('Saved.')

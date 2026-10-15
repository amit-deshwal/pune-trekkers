// Puts chosen photos first for a trip, keeping the rest in order.
// Run: node --env-file=.env.local --experimental-strip-types scripts/reorder-photos.ts
import { createClient } from '@supabase/supabase-js'
import { contentSchema, publicContent } from '../lib/content-schema.ts'
// trip name -> photo numbers (from the alt text "… photo N") to show first
const first: Record<string, number[]> = {
  'Kalu Waterfall Night Camping': [1, 2, 3, 4],
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const { data, error } = await s.from('site_content').select('data').eq('id', 'main').single()
if (error) throw error
const c = contentSchema.parse(data.data)
const num = (p: { alt: string }) => Number(p.alt.match(/(\d+)$/)![1])
for (const t of c.treks) {
  const order = first[t.name]; if (!order) continue
  const head = order.map(n => t.photos.find(p => num(p) === n)).filter(Boolean) as typeof t.photos
  t.photos = [...head, ...t.photos.filter(p => !head.includes(p))]
  console.log(t.name, t.photos.map(num).join(','))
}
const next = contentSchema.parse(c), now = new Date().toISOString()
for (const [t, d] of [['site_content', next], ['public_site_content', publicContent(next)]] as const) { const r = await s.from(t).upsert({ id: 'main', data: d, updated_at: now }); if (r.error) throw r.error }

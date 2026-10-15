// Marks gallery trips as community initiatives (or back to treks) by name.
// Run: node --env-file=.env.local --experimental-strip-types scripts/set-kind.ts
import { createClient } from '@supabase/supabase-js'
import { contentSchema, publicContent } from '../lib/content-schema.ts'
const initiatives = ['Hill Cleaning Initiatives', 'Tree Plantation Initiatives']
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const { data, error } = await s.from('site_content').select('data').eq('id', 'main').single()
if (error) throw error
const c = contentSchema.parse(data.data)
for (const t of c.treks) if (initiatives.includes(t.name)) { t.kind = 'initiative'; console.log('initiative:', t.name) }
const next = contentSchema.parse(c), now = new Date().toISOString()
for (const [t, d] of [['site_content', next], ['public_site_content', publicContent(next)]] as const) { const r = await s.from(t).upsert({ id: 'main', data: d, updated_at: now }); if (r.error) throw r.error }

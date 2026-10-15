// Sets a gallery trip's date by name. Run: node --env-file=.env.local --experimental-strip-types scripts/set-date.ts "Rajgad Fort" 2023-07-12
import { createClient } from '@supabase/supabase-js'
import { contentSchema, publicContent } from '../lib/content-schema.ts'
const [name, date] = process.argv.slice(2)
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const { data, error } = await s.from('site_content').select('data').eq('id', 'main').single()
if (error) throw error
const c = contentSchema.parse(data.data)
const matches = c.treks.filter(t => t.name === name)
if (matches.length !== 1) throw new Error(`Expected one trip named "${name}", found ${matches.length}`)
matches[0].date = date; matches[0].dateVerified = true
const next = contentSchema.parse(c), now = new Date().toISOString()
for (const [t, d] of [['site_content', next], ['public_site_content', publicContent(next)]] as const) { const r = await s.from(t).upsert({ id: 'main', data: d, updated_at: now }); if (r.error) throw r.error }
console.log(`${name} -> ${date}`)

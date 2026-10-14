// Publishes data/community.json to Supabase so the site has content before the first trek is added in /admin.
// Run: npm run seed   (reads .env.local; needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { contentSchema, publicContent } from '../lib/content-schema.ts'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.'); process.exit(1) }

async function main() {
  const content = contentSchema.parse(JSON.parse(readFileSync(new URL('../data/community.json', import.meta.url), 'utf8')))
  const supabase = createClient(url!, key!, { auth: { persistSession: false } })
  const now = new Date().toISOString()
  for (const [table, data] of [['site_content', content], ['public_site_content', publicContent(content)]] as const) {
    const { error } = await supabase.from(table).upsert({ id: 'main', data, updated_at: now })
    if (error) { console.error(`${table}: ${error.message}`); process.exit(1) }
    console.log(`Seeded ${table}`)
  }
}
main()

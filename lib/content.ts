import fallback from '../data/community.json'
import { contentSchema, publicContent, type SiteContent } from './content-schema'

export async function getContent(): Promise<{ content: SiteContent; contentUnavailable: boolean; preview: boolean }> {
  let raw: unknown = fallback
  let contentUnavailable = false
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (base && key) {
    try {
      const response = await fetch(`${base}/rest/v1/public_site_content?id=eq.main&select=data`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) throw new Error('Content request failed')
      const rows = await response.json()
      raw = contentSchema.parse(rows[0]?.data)
    } catch { contentUnavailable = true }
  }
  const content = publicContent(contentSchema.parse(raw))
  // Unapproved legacy images are available only on the local development server.
  const preview = process.env.NODE_ENV === 'development'
  return { content, contentUnavailable, preview }
}

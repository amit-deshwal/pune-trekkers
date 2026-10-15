import type { NextApiRequest, NextApiResponse } from 'next'
import { contentSchema, upcomingTreks } from '../../../lib/content-schema'
import { serverSupabase } from '../../../lib/supabase'
import { formatDate, site } from '../../../lib/site'

// Opens a WhatsApp chat with the trek's organizer. The number is read from the private content here, so it never
// appears in page HTML or the public content feed where scrapers could collect it.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  const slug = String(req.query.slug || '')
  try {
    const { data, error } = await serverSupabase().from('site_content').select('data').eq('id', 'main').maybeSingle()
    if (error) throw error
    const trek = upcomingTreks(contentSchema.parse(data?.data).treks).find(t => t.slug === slug)
    if (!trek?.organizerWhatsapp) return res.redirect(302, trek ? `/treks/${slug}` : '/treks')
    const hello = trek.organizerName ? `Hi ${trek.organizerName}` : 'Hi'
    const when = trek.date ? ` on ${formatDate(trek.date)}` : ''
    const text = `${hello}, I found the ${trek.name}${when} on Pune Trekkers and would like to join. ${site.url}/treks/${slug}`
    return res.redirect(302, `https://wa.me/${trek.organizerWhatsapp}?text=${encodeURIComponent(text)}`)
  } catch {
    return res.redirect(302, `/treks/${slug}`)
  }
}

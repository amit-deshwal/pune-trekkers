import type { NextApiRequest, NextApiResponse } from 'next'
import { serverSupabase } from '../../../lib/supabase'
import { createMediaResolver } from '../../../lib/media'

const resolveMedia = createMediaResolver({
  async loadPublished() {
    const { data, error } = await serverSupabase().from('public_site_content').select('data').eq('id', 'main').maybeSingle()
    if (error) throw error
    return data?.data
  },
  async sign(path, lifetime) {
    const { data, error } = await serverSupabase().storage.from('trip-uploads').createSignedUrl(path, lifetime)
    if (error || !data?.signedUrl) throw error || new Error('Media URL unavailable')
    return data.signedUrl
  },
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).end()
  }
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : ''
  // Never cache failed publication reads or signing failures.
  res.setHeader('Cache-Control', 'no-store')
  try {
    const media = await resolveMedia(path)
    if (!media) return res.status(404).end()
    res.setHeader('Cache-Control', `public, max-age=${media.maxAge}, s-maxage=${media.maxAge}`)
    return res.redirect(307, media.url)
  } catch {
    return res.status(404).end()
  }
}

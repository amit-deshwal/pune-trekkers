import type { NextApiRequest, NextApiResponse } from 'next'
import { serverSupabase } from '../../../lib/supabase'
import sharp from 'sharp'
import { createMediaResolver, isResizable, mediaWidths } from '../../../lib/media'

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
    const width = Number(req.query.w)
    if (width && mediaWidths.includes(width) && isResizable(path)) {
      // A HEAD request (link checkers, some crawlers) doesn't need the image, so don't pull the original from Supabase for it.
      if (req.method === 'HEAD') { res.setHeader('Content-Type', 'image/webp'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); return res.status(200).end() }
      // Resized copies are cached by the CDN and browsers, so Supabase serves each original only once per variant.
      const source = await fetch(media.url, { signal: AbortSignal.timeout(10000) })
      if (!source.ok) return res.status(404).end()
      const image = await sharp(Buffer.from(await source.arrayBuffer()), { limitInputPixels: 80_000_000 })
        .rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer()
      res.setHeader('Content-Type', 'image/webp')
      // An upload never changes, so the CDN keeps a resized copy for a week instead of re-downloading the original from Supabase
      // every day. Kept short enough that a photo an admin removes (e.g. after a no-photo request) disappears within a week.
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
      return res.status(200).send(image)
    }
    res.setHeader('Cache-Control', `public, max-age=${media.maxAge}, s-maxage=${media.maxAge}`)
    return res.redirect(307, media.url)
  } catch {
    return res.status(404).end()
  }
}

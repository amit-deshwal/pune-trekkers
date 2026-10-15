import type { NextApiRequest, NextApiResponse } from 'next'
import sharp from 'sharp'
import { getContent } from '../../../lib/content'

// A 1200x630 JPEG of a trek's cover photo for link previews. Uploaded photos can be several MB, and WhatsApp drops
// previews whose image is too large, so this resizes and compresses them. Falls back to the default card.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const fallback = () => res.redirect(302, '/social-card.png?v=2')
  try {
    const slug = String(req.query.slug || '')
    const { content } = await getContent()
    const src = content.treks.find(trek => trek.slug === slug)?.photos[0]?.src
    if (!src) return fallback()
    const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`
    const response = await fetch(src.startsWith('http') ? src : origin + src, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) return fallback()
    const image = await sharp(Buffer.from(await response.arrayBuffer()), { limitInputPixels: 60_000_000 })
      .rotate().resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 76, mozjpeg: true }).toBuffer()
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    return res.status(200).send(image)
  } catch {
    return fallback()
  }
}

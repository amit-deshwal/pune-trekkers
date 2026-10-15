import type { NextApiRequest, NextApiResponse } from 'next'
import { planForChat } from '../../../../lib/member-plans'
import { formatDate, site } from '../../../../lib/site'

// Opens a WhatsApp chat with the member who posted an approved plan. The number is read here, on the server,
// so it never appears in page HTML where scrapers could collect it.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  try {
    const plan = await planForChat(String(req.query.id || ''))
    if (!plan) return res.redirect(302, '/plans')
    const text = `Hi ${plan.name}, I saw your hike to ${plan.destination} on ${formatDate(plan.date)} on Pune Trekkers and I'm interested in joining. ${site.url}/plans`
    return res.redirect(302, `https://wa.me/${plan.whatsapp}?text=${encodeURIComponent(text)}`)
  } catch {
    return res.redirect(302, '/plans')
  }
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { eventSignupSchema } from '../../../lib/event-signup-schema'
import { eventBySlug } from '../../../lib/events'
import { spotsLeft, submitSignup } from '../../../lib/event-signups'

// Public endpoint. GET ?event=slug returns the spots left; POST stores a sign-up (confirmed, or on the waitlist once full).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  try {
    if (req.method === 'GET') {
      const event = eventBySlug(String(req.query.event || ''))
      if (!event) return res.status(404).json({ error: 'Unknown event' })
      return res.status(200).json({ capacity: event.capacity, spotsLeft: await spotsLeft(event.slug) })
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }) }
    const input = eventSignupSchema.parse(req.body)
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
    return res.status(201).json({ ok: true, status: await submitSignup(input, ip) })
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map(issue => issue.message).join('; ') : error instanceof Error ? error.message : 'Could not complete your sign-up.'
    return res.status(req.method === 'GET' ? 500 : 400).json({ error: message })
  }
}

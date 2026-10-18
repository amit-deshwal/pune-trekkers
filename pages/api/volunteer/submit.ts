import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { volunteerInputSchema } from '../../../lib/volunteer-schema'
import { submitVolunteer } from '../../../lib/volunteers'

// Public endpoint: validates a volunteer application and stores it for the admins. Nothing is published.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }) }
  try {
    const input = volunteerInputSchema.parse(req.body)
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
    await submitVolunteer(input, ip)
    return res.status(201).json({ ok: true })
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map(issue => issue.message).join('; ') : error instanceof Error ? error.message : 'Could not send your application.'
    return res.status(400).json({ error: message })
  }
}

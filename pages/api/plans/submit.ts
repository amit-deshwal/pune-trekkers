import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { planInputSchema } from '../../../lib/member-plan-schema'
import { submitPlan } from '../../../lib/member-plans'

// Public endpoint: validates a member's hike plan and stores it as "pending". Nothing is shown until an admin approves it.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }) }
  try {
    const input = planInputSchema.parse(req.body)
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
    await submitPlan(input, ip)
    return res.status(201).json({ ok: true })
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map(issue => issue.message).join('; ') : error instanceof Error ? error.message : 'Could not send your plan.'
    return res.status(400).json({ error: message })
  }
}

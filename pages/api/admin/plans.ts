import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { requireAdmin } from '../../../lib/admin'
import { deletePlan, listPlansForAdmin, setPlanStatus } from '../../../lib/member-plans'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  try {
    const { service } = await requireAdmin(req.headers.authorization)
    if (req.method === 'GET') return res.status(200).json({ plans: await listPlansForAdmin(service) })
    if (req.method === 'DELETE') { await deletePlan(service, z.string().uuid().parse(req.body?.id)); return res.status(200).json({ ok: true }) }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST, DELETE'); return res.status(405).json({ error: 'Method not allowed' }) }
    const { id, status } = z.object({ id: z.string().uuid(), status: z.enum(['pending', 'approved', 'rejected']) }).parse(req.body)
    await setPlanStatus(service, id, status)
    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(400).json({ error: error instanceof z.ZodError ? error.issues.map(issue => issue.message).join('; ') : error instanceof Error ? error.message : 'Could not update this plan.' })
  }
}

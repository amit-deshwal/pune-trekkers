import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { requireAdmin } from '../../../lib/admin'
import { errorMessage } from '../../../lib/error-message'
import { deleteSignup, listSignups, setSignupStatus } from '../../../lib/event-signups'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  try {
    const { service } = await requireAdmin(req.headers.authorization)
    if (req.method === 'GET') return res.status(200).json({ signups: await listSignups(service) })
    if (req.method === 'DELETE') { await deleteSignup(service, z.string().uuid().parse(req.body?.id)); return res.status(200).json({ ok: true }) }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST, DELETE'); return res.status(405).json({ error: 'Method not allowed' }) }
    const { id, status } = z.object({ id: z.string().uuid(), status: z.enum(['confirmed', 'waitlist', 'cancelled']) }).parse(req.body)
    await setSignupStatus(service, id, status)
    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Could not update this sign-up.') })
  }
}

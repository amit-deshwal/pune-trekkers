import type { NextApiRequest, NextApiResponse } from 'next'
export default function handler(_req: NextApiRequest,res: NextApiResponse){return res.status(410).json({message:'Content is loaded on each request. Revalidation is no longer required.'})}

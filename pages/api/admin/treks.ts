import type { NextApiRequest, NextApiResponse } from 'next'
import { addTrek } from '../../../lib/admin'
import { trekSchema } from '../../../lib/content-schema'

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'})}
  try{const trek=trekSchema.parse(req.body?.trek);await addTrek(req.headers.authorization,trek);return res.status(201).json({ok:true})}
  catch(error){return res.status(400).json({error:error instanceof Error?error.message:'Could not save this trek.'})}
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { listUpcomingTreks, saveTrek } from '../../../lib/admin'
import { z } from 'zod'
import { trekSchema } from '../../../lib/content-schema'

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  res.setHeader('Cache-Control','private, no-store')
  try{
    if(req.method==='GET')return res.status(200).json({treks:await listUpcomingTreks(req.headers.authorization)})
    if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed'})}
    const trek=trekSchema.parse(req.body?.trek);await saveTrek(req.headers.authorization,trek,req.body?.replace===true);return res.status(201).json({ok:true})
  }
  catch(error){return res.status(400).json({error:error instanceof z.ZodError?error.issues.map(issue=>issue.message).join('; '):error instanceof Error?error.message:'Could not save this trek.'})}
}

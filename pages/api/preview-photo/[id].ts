import type { NextApiRequest, NextApiResponse } from 'next'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
export default async function handler(req: NextApiRequest,res: NextApiResponse){
  if(process.env.NODE_ENV !== 'development' || !/^([1-9]|1[0-3])$/.test(String(req.query.id)))return res.status(404).end()
  try{const image=await readFile(path.join(process.cwd(),'data/preview-photos',`${req.query.id}.webp`));res.setHeader('Content-Type','image/webp');res.setHeader('Cache-Control','private, max-age=3600');return res.send(image)}catch{return res.status(404).end()}
}

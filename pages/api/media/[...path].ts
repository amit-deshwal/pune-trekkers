import type { NextApiRequest, NextApiResponse } from 'next'
import { serverSupabase } from '../../../lib/supabase'

function containsPublishedPath(value:unknown,path:string):boolean{return typeof value==='string'?value===`/api/media/${path}`:Array.isArray(value)?value.some(item=>containsPublishedPath(item,path)):typeof value==='object'&&value!==null?Object.values(value).some(item=>containsPublishedPath(item,path)):false}
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const path=Array.isArray(req.query.path)?req.query.path.join('/'):''
  if(!/^trip-uploads\/[0-9a-f-]+\/[0-9a-f-]+\.(webp|avif|jpg|jpeg|png|mp4|webm)$/i.test(path))return res.status(404).end()
  try{const service=serverSupabase();const {data:published,error}=await service.from('public_site_content').select('data').eq('id','main').maybeSingle();if(error||!containsPublishedPath(published?.data,path))return res.status(404).end();const {data,error:signError}=await service.storage.from('trip-uploads').createSignedUrl(path,60);if(signError||!data?.signedUrl)return res.status(404).end();res.setHeader('Cache-Control','public, max-age=45, s-maxage=45');return res.redirect(307,data.signedUrl)}catch{return res.status(404).end()}
}

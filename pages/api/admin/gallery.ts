import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../../lib/admin'
import { contentSchema, publicContent, trekSchema, photoSchema, videoSchema, type Trek } from '../../../lib/content-schema'
import fallback from '../../../data/community.json'
import { revalidatePages } from '../../../lib/content'
import { z } from 'zod'

const galleryInput = z.object({
  // New trips send an empty slug; the server assigns the id.
  slug: z.preprocess(value=>value||undefined,z.string().regex(/^[a-z0-9-]+$/).optional()),
  name: z.string().trim().min(1),
  kind: z.enum(['trek','initiative']).default('trek'),
  destination: z.string().trim(),
  date: z.string().nullable(),
  summary: z.string().trim(),
  photos: z.array(photoSchema),
  videos: z.array(videoSchema),
})

// Storage paths of uploaded media referenced by the given treks.
const mediaPaths = (treks:Trek[]) => treks.flatMap(t=>[...t.photos,...t.videos]).map(m=>m.src).filter(src=>src.startsWith('/api/media/')).map(src=>src.slice('/api/media/'.length))

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(!['GET','POST','PATCH','DELETE'].includes(req.method||'')){res.setHeader('Allow','GET, POST, PATCH, DELETE');return res.status(405).json({error:'Method not allowed'})}
  try{
    const {service}=await requireAdmin(req.headers.authorization)
    const {data,error}=await service.from('site_content').select('data').eq('id','main').maybeSingle()
    if(error)throw error
    const content=contentSchema.parse(data?.data||fallback)
    if(req.method==='GET')return res.status(200).json({treks:content.treks.filter(t=>t.status==='completed').map(t=>({slug:t.slug,name:t.name,kind:t.kind,destination:t.destination,date:t.date,summary:t.summary,photos:t.photos,videos:t.videos}))})
    const before=mediaPaths(content.treks)
    const publish=async()=>{
      const next=contentSchema.parse(content)
      const updatedAt=new Date().toISOString()
      const saved=await service.from('site_content').upsert({id:'main',data:next,updated_at:updatedAt})
      if(saved.error)throw saved.error
      const published=await service.from('public_site_content').upsert({id:'main',data:publicContent(next),updated_at:updatedAt})
      if(published.error)throw published.error
      await revalidatePages(res)
      // Delete files no trip uses any more. Best effort: content is already saved.
      const after=mediaPaths(next.treks),unused=before.filter(path=>!after.includes(path))
      if(unused.length){const {error}=await service.storage.from('trip-uploads').remove(unused);if(error)console.error('Could not delete unused media',error)}
    }
    if(req.method==='DELETE'){
      const slug=z.string().regex(/^[a-z0-9-]+$/).parse(req.query.slug)
      if(!content.treks.some(t=>t.slug===slug&&t.status==='completed'))throw new Error('Gallery trip was not found.')
      content.treks=content.treks.filter(t=>t.slug!==slug)
      await publish()
      return res.status(200).json({ok:true})
    }
    const input=galleryInput.parse(req.body)
    const date=input.date||null
    if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Enter a valid date.')
    let trek:Trek
    if(req.method==='PATCH'){
      const old=content.treks.find(t=>t.slug===input.slug&&t.status==='completed')
      if(!old)throw new Error('Gallery trip was not found.')
      trek=trekSchema.parse({...old,...input,date,dateVerified:Boolean(date)})
      content.treks=content.treks.map(t=>t.slug===old.slug?trek:t)
    }else{
      // Internal id only; trips are shown in a modal, so names may repeat across visits.
      const slug=crypto.randomUUID()
      trek=trekSchema.parse({...input,slug,date,dateVerified:Boolean(date),status:'completed',organizerConfirmed:false,difficulty:'To be confirmed',duration:'',approximateCost:'',capacity:null,registrationStatus:'Not open',registrationUrl:null,beginnerGuidance:'',fitness:'',transport:'',meetingPoint:'',inclusions:'',exclusions:'',cancellation:'',route:'',highlights:[],participantCount:null,countVerified:false,archiveYear:null})
      content.treks.unshift(trek)
    }
    await publish()
    return res.status(200).json({trek:{slug:trek.slug,name:trek.name,kind:trek.kind,destination:trek.destination,date:trek.date,summary:trek.summary,photos:trek.photos,videos:trek.videos}})
  }catch(error){
    const message=error instanceof z.ZodError?error.issues.map(issue=>`${issue.path.join('.')||'Input'}: ${issue.message}`).join('; '):error instanceof Error?error.message:''
    return res.status(400).json({error:message||'Could not save the gallery trip.'})
  }
}

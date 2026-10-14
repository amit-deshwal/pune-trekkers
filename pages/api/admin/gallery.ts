import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../../lib/admin'
import { contentSchema, publicContent, trekSchema, photoSchema, videoSchema, type Trek } from '../../../lib/content-schema'
import fallback from '../../../data/community.json'
import { z } from 'zod'

const galleryInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().trim().min(1),
  destination: z.string().trim(),
  date: z.string().nullable(),
  summary: z.string().trim(),
  photos: z.array(photoSchema),
  videos: z.array(videoSchema),
})

const slugify = (name:string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(!['GET','POST','PATCH'].includes(req.method||'')){res.setHeader('Allow','GET, POST, PATCH');return res.status(405).json({error:'Method not allowed'})}
  try{
    const {service}=await requireAdmin(req.headers.authorization)
    const {data,error}=await service.from('site_content').select('data').eq('id','main').maybeSingle()
    if(error)throw error
    const content=contentSchema.parse(data?.data||fallback)
    if(req.method==='GET')return res.status(200).json({treks:content.treks.filter(t=>t.status==='completed').map(t=>({slug:t.slug,name:t.name,destination:t.destination,date:t.date,summary:t.summary,photos:t.photos,videos:t.videos}))})
    const input=galleryInput.parse(req.body)
    const date=input.date||null
    if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Enter a valid date.')
    input.destination ||= 'Location not recorded'
    input.summary ||= 'A day on the trail with Pune Trekkers.'
    let trek:Trek
    if(req.method==='PATCH'){
      const old=content.treks.find(t=>t.slug===input.slug&&t.status==='completed')
      if(!old)throw new Error('Gallery trip was not found.')
      trek=trekSchema.parse({...old,...input,date,dateVerified:Boolean(date)})
      content.treks=content.treks.map(t=>t.slug===old.slug?trek:t)
    }else{
      const slug=slugify(input.name)
      if(!slug||content.treks.some(t=>t.slug===slug))throw new Error('A trip with this name or web address already exists.')
      trek=trekSchema.parse({...input,slug,date,dateVerified:Boolean(date),status:'completed',organizerConfirmed:false,difficulty:'To be confirmed',duration:'',approximateCost:'',capacity:null,registrationStatus:'Not open',registrationUrl:null,beginnerGuidance:'',fitness:'',transport:'',meetingPoint:'',inclusions:'',exclusions:'',cancellation:'',route:'',highlights:[],participantCount:null,countVerified:false,archiveYear:null})
      content.treks.unshift(trek)
    }
    const next=contentSchema.parse(content)
    const updatedAt=new Date().toISOString()
    const saved=await service.from('site_content').upsert({id:'main',data:next,updated_at:updatedAt})
    if(saved.error)throw saved.error
    const published=await service.from('public_site_content').upsert({id:'main',data:publicContent(next),updated_at:updatedAt})
    if(published.error)throw published.error
    return res.status(200).json({trek:{slug:trek.slug,name:trek.name,destination:trek.destination,date:trek.date,summary:trek.summary,photos:trek.photos,videos:trek.videos}})
  }catch(error){return res.status(400).json({error:error instanceof Error?error.message:'Could not save the gallery trip.'})}
}

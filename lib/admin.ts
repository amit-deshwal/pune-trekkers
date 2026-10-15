import { createClient } from '@supabase/supabase-js'
import { contentSchema, publicContent, upcomingTreks, type Trek } from './content-schema'
import fallback from '../data/community.json'
import { serverSupabase, supabasePublicKey, supabasePublicUrl } from './supabase'

export async function requireAdmin(authorization:string|undefined){
  if(!authorization?.startsWith('Bearer ')||!supabasePublicUrl||!supabasePublicKey)throw new Error('Please sign in as an administrator.')
  const client=createClient(supabasePublicUrl,supabasePublicKey,{global:{headers:{Authorization:authorization}}})
  const {data:{user},error}=await client.auth.getUser()
  if(error||!user)throw new Error('Please sign in again.')
  const service=serverSupabase()
  const {data:admin}=await service.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle()
  if(!admin)throw new Error('This account is not approved to manage the website.')
  return {user,service}
}
async function readContent(service:ReturnType<typeof serverSupabase>){
  const {data:existing}=await service.from('site_content').select('data').eq('id','main').maybeSingle()
  return contentSchema.parse(existing?.data||fallback)
}
// Upcoming treks with their private fields (organizer WhatsApp), for the admin edit form.
export async function listUpcomingTreks(authorization:string|undefined){
  const {service}=await requireAdmin(authorization)
  return upcomingTreks((await readContent(service)).treks)
}
// Adds a trek, or with `replace` updates the trek with the same slug, keeping its photos and adding any new uploads.
export async function saveTrek(authorization:string|undefined,trek:Trek,replace=false){
  const {service}=await requireAdmin(authorization)
  const content=await readContent(service)
  const old=content.treks.find(item=>item.slug===trek.slug)
  if(old&&!replace)throw new Error('A trek with that web address already exists.')
  if(!old&&replace)throw new Error('That trek no longer exists. Reload the page and try again.')
  const treks=old?content.treks.map(item=>item===old?{...trek,photos:[...old.photos,...trek.photos],videos:old.videos,highlights:old.highlights}:item):[trek,...content.treks]
  const next=contentSchema.parse({...content,treks})
  const saved=await service.from('site_content').upsert({id:'main',data:next,updated_at:new Date().toISOString()})
  if(saved.error)throw saved.error
  const published=await service.from('public_site_content').upsert({id:'main',data:publicContent(next),updated_at:new Date().toISOString()})
  if(published.error)throw published.error
}

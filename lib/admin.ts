import { createClient } from '@supabase/supabase-js'
import { contentSchema, publicContent, type Trek } from './content-schema'
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
export async function addTrek(authorization:string|undefined,trek:Trek){
  const {service}=await requireAdmin(authorization)
  const {data:existing}=await service.from('site_content').select('data').eq('id','main').maybeSingle()
  const content=contentSchema.parse(existing?.data||fallback)
  if(content.treks.some(item=>item.slug===trek.slug))throw new Error('A trek with that web address already exists.')
  const next=contentSchema.parse({...content,treks:[trek,...content.treks]})
  const saved=await service.from('site_content').upsert({id:'main',data:next,updated_at:new Date().toISOString()})
  if(saved.error)throw saved.error
  const published=await service.from('public_site_content').upsert({id:'main',data:publicContent(next),updated_at:new Date().toISOString()})
  if(published.error)throw published.error
}

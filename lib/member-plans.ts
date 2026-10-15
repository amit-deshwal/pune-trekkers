import { createHash } from 'node:crypto'
import type { PlanInput } from './member-plan-schema'
import { serverSupabase } from './supabase'

export type PublicPlan = {
  id: string; name: string; destination: string; date: string; startTime: string
  meetingPoint: string; difficulty: 'Easy' | 'Moderate' | 'Challenging'; maxPeople: number | null; summary: string
}
export type AdminPlan = PublicPlan & { status: 'pending' | 'approved' | 'rejected'; whatsapp: string; createdAt: string }

type Row = { id: string; created_at: string; status: AdminPlan['status']; name: string; whatsapp: string; destination: string; date: string
  start_time: string; meeting_point: string; difficulty: PublicPlan['difficulty']; max_people: number | null; summary: string }

const publicFrom = (row: Row): PublicPlan => ({ id: row.id, name: row.name, destination: row.destination, date: row.date, startTime: row.start_time,
  meetingPoint: row.meeting_point, difficulty: row.difficulty, maxPeople: row.max_people, summary: row.summary })
export const adminFrom = (row: Row): AdminPlan => ({ ...publicFrom(row), status: row.status, whatsapp: row.whatsapp, createdAt: row.created_at })

export const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export function hashIp(ip: string) {
  return createHash('sha256').update(`${process.env.SUPABASE_SERVICE_ROLE_KEY || 'pune-trekkers'}:${ip}`).digest('hex').slice(0, 32)
}

// Approved plans that haven't happened yet. The WhatsApp number is never selected, so it can't leak to a page.
export async function listApprovedPlans(): Promise<PublicPlan[]> {
  const { data, error } = await serverSupabase().from('member_plans')
    .select('id,created_at,status,name,whatsapp,destination,date,start_time,meeting_point,difficulty,max_people,summary')
    .eq('status', 'approved').gte('date', todayIST()).order('date', { ascending: true }).limit(60)
  if (error) throw error
  return (data as Row[]).map(publicFrom)
}

export async function submitPlan(input: PlanInput, ip: string) {
  if (input.date < todayIST()) throw new Error('Pick a date that has not passed yet')
  const service = serverSupabase()
  const ipHash = hashIp(ip)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const recent = await service.from('member_plans').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
  if (recent.error) throw recent.error
  if ((recent.count ?? 0) >= 3) throw new Error('You have submitted a few plans today already. Please try again tomorrow.')
  const pending = await service.from('member_plans').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  if (pending.error) throw pending.error
  if ((pending.count ?? 0) >= 100) throw new Error('We have a lot of plans waiting for review. Please try again in a few days.')
  const saved = await service.from('member_plans').insert({
    name: input.name, whatsapp: input.whatsapp, destination: input.destination, date: input.date, start_time: input.startTime,
    meeting_point: input.meetingPoint, difficulty: input.difficulty, max_people: input.maxPeople, summary: input.summary, ip_hash: ipHash,
  })
  if (saved.error) throw saved.error
}

export async function planForChat(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data, error } = await serverSupabase().from('member_plans').select('*').eq('id', id).eq('status', 'approved').gte('date', todayIST()).maybeSingle()
  if (error) throw error
  return data ? adminFrom(data as Row) : null
}

export async function listPlansForAdmin(service: ReturnType<typeof serverSupabase>): Promise<AdminPlan[]> {
  const { data, error } = await service.from('member_plans').select('*').order('created_at', { ascending: false }).limit(200)
  if (error) throw error
  return (data as Row[]).map(adminFrom)
}

export async function setPlanStatus(service: ReturnType<typeof serverSupabase>, id: string, status: AdminPlan['status']) {
  const { error } = await service.from('member_plans').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deletePlan(service: ReturnType<typeof serverSupabase>, id: string) {
  const { error } = await service.from('member_plans').delete().eq('id', id)
  if (error) throw error
}

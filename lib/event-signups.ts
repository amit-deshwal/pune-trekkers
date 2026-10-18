import type { EventSignupInput } from './event-signup-schema'
import { eventBySlug } from './events'
import { hashIp, todayIST } from './member-plans'
import { serverSupabase } from './supabase'

export type SignupStatus = 'confirmed' | 'waitlist' | 'cancelled'
export type EventSignup = { id: string; createdAt: string; event: string; status: SignupStatus; name: string; whatsapp: string; level: EventSignupInput['level']; friends: string }
type Row = { id: string; created_at: string; event: string; status: SignupStatus; name: string; whatsapp: string; level: EventSignupInput['level']; friends: string }
const from = (row: Row): EventSignup => ({ id: row.id, createdAt: row.created_at, event: row.event, status: row.status, name: row.name, whatsapp: row.whatsapp, level: row.level, friends: row.friends })

async function confirmedCount(service: ReturnType<typeof serverSupabase>, event: string) {
  const { count, error } = await service.from('event_signups').select('id', { count: 'exact', head: true }).eq('event', event).eq('status', 'confirmed')
  if (error) throw error
  return count ?? 0
}

export async function spotsLeft(slug: string) {
  const event = eventBySlug(slug)
  if (!event) throw new Error('Unknown event')
  return Math.max(0, event.capacity - await confirmedCount(serverSupabase(), slug))
}

// First come, first served: the first `capacity` people are confirmed, everyone after joins the waitlist.
export async function submitSignup(input: EventSignupInput, ip: string): Promise<SignupStatus> {
  const event = eventBySlug(input.event)
  if (!event) throw new Error('Unknown event')
  if (event.date < todayIST()) throw new Error('Sign-ups for this event have closed')
  const service = serverSupabase()
  const ipHash = hashIp(ip)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const recent = await service.from('event_signups').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
  if (recent.error) throw recent.error
  if ((recent.count ?? 0) >= 6) throw new Error('Too many sign-ups from this connection today. Please try again tomorrow.')
  const existing = await service.from('event_signups').select('id', { count: 'exact', head: true }).eq('event', input.event).eq('whatsapp', input.whatsapp).neq('status', 'cancelled')
  if (existing.error) throw existing.error
  if ((existing.count ?? 0) > 0) throw new Error('This WhatsApp number is already signed up. See you there!')
  const status: SignupStatus = await confirmedCount(service, input.event) < event.capacity ? 'confirmed' : 'waitlist'
  const saved = await service.from('event_signups').insert({ event: input.event, status, name: input.name, whatsapp: input.whatsapp, level: input.level, friends: input.friends, ip_hash: ipHash })
  if (saved.error) throw saved.error
  return status
}

export async function listSignups(service: ReturnType<typeof serverSupabase>): Promise<EventSignup[]> {
  const { data, error } = await service.from('event_signups').select('*').order('created_at', { ascending: true }).limit(500)
  if (error) throw error
  return (data as Row[]).map(from)
}
export async function setSignupStatus(service: ReturnType<typeof serverSupabase>, id: string, status: SignupStatus) {
  const { error } = await service.from('event_signups').update({ status }).eq('id', id)
  if (error) throw error
}
export async function deleteSignup(service: ReturnType<typeof serverSupabase>, id: string) {
  const { error } = await service.from('event_signups').delete().eq('id', id)
  if (error) throw error
}

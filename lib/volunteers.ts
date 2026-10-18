import type { VolunteerInput } from './volunteer-schema'
import { hashIp } from './member-plans'
import { serverSupabase } from './supabase'

export type Volunteer = {
  id: string; createdAt: string; status: 'new' | 'contacted' | 'onboarded' | 'declined'
  name: string; whatsapp: string; email: string; roles: string[]; experience: string; portfolio: string; availability: string
}
type Row = { id: string; created_at: string; status: Volunteer['status']; name: string; whatsapp: string; email: string; roles: string[]
  experience: string; portfolio: string; availability: string }

const from = (row: Row): Volunteer => ({ id: row.id, createdAt: row.created_at, status: row.status, name: row.name, whatsapp: row.whatsapp,
  email: row.email, roles: row.roles, experience: row.experience, portfolio: row.portfolio, availability: row.availability })

// Stored as "new". Contact details are only ever read by admins, never by a public page.
export async function submitVolunteer(input: VolunteerInput, ip: string) {
  const service = serverSupabase()
  const ipHash = hashIp(ip)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const recent = await service.from('volunteer_applications').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
  if (recent.error) throw recent.error
  if ((recent.count ?? 0) >= 3) throw new Error('You have applied a few times today already. Please try again tomorrow.')
  const waiting = await service.from('volunteer_applications').select('id', { count: 'exact', head: true }).eq('status', 'new')
  if (waiting.error) throw waiting.error
  if ((waiting.count ?? 0) >= 200) throw new Error('We have a lot of applications waiting. Please try again in a few days.')
  const saved = await service.from('volunteer_applications').insert({
    name: input.name, whatsapp: input.whatsapp, email: input.email, roles: input.roles, experience: input.experience,
    portfolio: input.portfolio, availability: input.availability, ip_hash: ipHash,
  })
  if (saved.error) throw saved.error
}

export async function listVolunteers(service: ReturnType<typeof serverSupabase>): Promise<Volunteer[]> {
  const { data, error } = await service.from('volunteer_applications').select('*').order('created_at', { ascending: false }).limit(300)
  if (error) throw error
  return (data as Row[]).map(from)
}

export async function setVolunteerStatus(service: ReturnType<typeof serverSupabase>, id: string, status: Volunteer['status']) {
  const { error } = await service.from('volunteer_applications').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteVolunteer(service: ReturnType<typeof serverSupabase>, id: string) {
  const { error } = await service.from('volunteer_applications').delete().eq('id', id)
  if (error) throw error
}

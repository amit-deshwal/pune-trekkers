import { realText } from './places.ts'
import { costLabel } from './site.ts'

// Builds the "hikes this weekend" messages admins paste into the WhatsApp groups on Thursday or Friday.
export type ShareTrek = { slug: string; name: string; destination: string; date: string | null; startTime: string; difficulty: string; status: string; meetingPoint: string; approximateCost: string }
export type SharePlan = { id: string; name: string; destination: string; date: string; startTime: string; difficulty: string; status: string; meetingPoint: string }
export type WeekendHike = { kind: 'trek' | 'plan'; title: string; date: string; startTime: string; difficulty: string; by: string; meetingPoint: string; cost: string; url: string }

const dayOf = (date: string) => new Date(date + 'T12:00:00Z').getUTCDay()
const addDays = (date: string, days: number) => new Date(Date.parse(date + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10)
const label = (date: string, options: Intl.DateTimeFormatOptions) => new Date(date + 'T12:00:00Z').toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' })
const time = (value: string) => { if (!value) return ''; const [h, m] = value.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}` }

// Mon–Fri look ahead to the coming Saturday; on Saturday or Sunday it is the weekend already under way. `weeksAhead` skips to later weekends.
export function weekendOf(today: string, weeksAhead = 0) {
  const day = dayOf(today)
  const saturday = addDays(today, (day === 0 ? -1 : 6 - day) + weeksAhead * 7)
  return { saturday, sunday: addDays(saturday, 1), from: weeksAhead ? saturday : today > saturday ? today : saturday }
}

// Treks and plans in one shape, so the same message format serves the admin post and the public Share buttons.
export const trekHike = (siteUrl: string, trek: ShareTrek): WeekendHike => ({ kind: 'trek', title: trek.name, date: trek.date || '', startTime: trek.startTime, difficulty: trek.difficulty, by: '',
  meetingPoint: realText(trek.meetingPoint), cost: realText(trek.approximateCost) ? costLabel(trek.approximateCost) : '', url: `${siteUrl}/treks/${trek.slug}` })
export const planHike = (siteUrl: string, plan: SharePlan): WeekendHike => ({ kind: 'plan', title: plan.destination, date: plan.date, startTime: plan.startTime, difficulty: plan.difficulty, by: plan.name,
  meetingPoint: plan.meetingPoint.trim(), cost: '', url: `${siteUrl}/plans#plan-${plan.id}` })

export function weekendHikes(siteUrl: string, treks: ShareTrek[], plans: SharePlan[], weekend: ReturnType<typeof weekendOf>): WeekendHike[] {
  const inRange = (date: string | null) => Boolean(date && date >= weekend.from && date <= weekend.sunday)
  return [
    ...treks.filter(trek => (trek.status === 'confirmed' || trek.status === 'proposed') && inRange(trek.date)).map(trek => trekHike(siteUrl, trek)),
    ...plans.filter(plan => plan.status === 'approved' && inRange(plan.date)).map(plan => planHike(siteUrl, plan)),
  ].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
}

// One hike as a WhatsApp block: *bold* title, a line per detail, and the link last so WhatsApp previews it.
function hikeBlock(hike: WeekendHike) {
  const when = [hike.date && label(hike.date, { weekday: 'short', day: 'numeric', month: 'short' }), time(hike.startTime)].filter(Boolean).join(', ')
  const level = [hike.difficulty === 'To be confirmed' ? '' : hike.difficulty, hike.cost === 'Free' ? 'Free' : hike.cost ? `${hike.cost} shared cost` : ''].filter(Boolean).join(' · ')
  return [`*${hike.title}*${hike.by ? ` (planned by ${hike.by})` : ''}`, when && `📅 ${when}`, level && `⛰️ ${level}`, hike.meetingPoint && `📍 ${hike.meetingPoint}`,
    hike.kind === 'trek' ? `👉 Details and sign-up: ${hike.url}` : `👉 Message ${hike.by} to join: ${hike.url}`].filter(Boolean).join('\n')
}

// The full weekend post for the community groups.
export function weekendMessage(siteUrl: string, hikes: WeekendHike[], weekend: ReturnType<typeof weekendOf>, groupInvite = '') {
  const range = `${label(weekend.saturday, { weekday: 'short', day: 'numeric' })} – ${label(weekend.sunday, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')}`
  const section = (heading: string, list: WeekendHike[]) => list.length ? [`🥾 *${heading}*`, ...list.map(hikeBlock)].join('\n\n') : ''
  const treks = hikes.filter(hike => hike.kind === 'trek'); const plans = hikes.filter(hike => hike.kind === 'plan')
  const body = hikes.length
    ? [`Hi everyone 👋 Here’s what’s happening this weekend (${range}).`, section('Pune Trekkers treks', treks), section('Member hikes', plans)]
    : [`Hi everyone 👋 Nothing is listed for this weekend (${range}) yet.`]
  return [...body,
    `Heading out yourself? Share your plan and find company: ${siteUrl}/plans/new`,
    `All upcoming hikes: ${siteUrl}/treks`,
    groupInvite && `New here? Join the community: ${groupInvite}`,
  ].filter(Boolean).join('\n\n')
}

// A post about just one hike, for sending it on its own.
export function hikeMessage(hike: WeekendHike) {
  return `${hike.kind === 'trek' ? '🥾 Pune Trekkers trek this weekend' : '🥾 Member hike this weekend'} – come along!\n\n${hikeBlock(hike)}`
}

// What a member sends when they share one hike with friends.
export function shareMessage(hike: WeekendHike) {
  return `Who’s coming? 🥾\n\n${hikeBlock(hike)}`
}

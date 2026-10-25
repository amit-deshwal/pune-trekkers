import { z } from 'zod'

export const safeUrl = z.string().refine(value => {
  try { return new URL(value).protocol === 'https:' } catch { return false }
}, 'Use a full HTTPS URL')
const imagePath = z.string().refine(value => /^\/(images|api\/media)\/[a-zA-Z0-9/_-]+\.(webp|avif|jpg|jpeg|png)$/.test(value) || safeUrl.safeParse(value).success, 'Use /images/…, /api/media/… or HTTPS')
const videoPath = z.string().refine(value => /^\/api\/media\/[a-zA-Z0-9/_-]+\.(mp4|webm)$/.test(value), 'Use an uploaded MP4 or WebM video')
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Use a real calendar date')
export const photoSchema = z.object({
  id: z.string(), src: imagePath, alt: z.string().min(8), caption: z.string(),
  credit: z.string().default(''),
})
export const videoSchema = z.object({
  id: z.string(), src: videoPath, caption: z.string(),
})
// "+91 98765 43210", "098765 43210" or "9876543210" → "919876543210". Ten-digit numbers are taken as Indian mobiles.
export function whatsappDigits(raw: string) { const digits = raw.replace(/\D/g, '').replace(/^0+/, ''); return digits.length === 10 ? `91${digits}` : digits }
const whatsapp = z.string().default('').transform(whatsappDigits).refine(value => value === '' || /^\d{11,15}$/.test(value), 'Use a WhatsApp number with country code, e.g. +91 98765 43210')
const startTime = z.string().default('').refine(value => value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), 'Use a 24-hour time like 06:30')
const whatsappGroup = z.string().default('').transform(value => value.trim()).refine(value => value === '' || /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+\/?(\?.*)?$/.test(value), 'Use a WhatsApp group invite link (https://chat.whatsapp.com/…)')
export const trekSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/), name: z.string().min(1), destination: z.string(),
  status: z.enum(['proposed', 'confirmed', 'completed', 'cancelled']),
  kind: z.enum(['trek', 'initiative']).default('trek'), organizerConfirmed: z.boolean().default(false), date: date.nullable(), dateVerified: z.boolean(),
  difficulty: z.enum(['Easy', 'Moderate', 'Challenging', 'To be confirmed']),
  startTime, whatsappGroupUrl: whatsappGroup, duration: z.string(), approximateCost: z.string(), capacity: z.number().int().positive().nullable(),
  registrationStatus: z.enum(['Not open', 'Open', 'Full', 'Closed']), registrationUrl: safeUrl.nullable(),
  beginnerGuidance: z.string(), fitness: z.string(), transport: z.string(), meetingPoint: z.string(),
  inclusions: z.string(), exclusions: z.string(), cancellation: z.string(), route: z.string(),
  summary: z.string(), highlights: z.array(z.string()), participantCount: z.number().int().positive().nullable(),
  countVerified: z.boolean(), archiveYear: z.string().regex(/^\d{4}$/).nullable(), photos: z.array(photoSchema), videos: z.array(videoSchema).default([]),
  // The number stays in the private content; public pages only learn that a chat link exists (see /api/organizer-chat).
  organizerName: z.string().default(''), organizerWhatsapp: whatsapp, organizerChat: z.boolean().default(false),
})
export const contentSchema = z.object({
  treks: z.array(trekSchema),
  hero: photoSchema.nullable(),
  timeline: z.array(z.object({ date, title: z.string(), detail: z.string(), verified: z.boolean() })),
  people: z.array(z.object({ name: z.string(), role: z.string(), bio: z.string(), consentApproved: z.boolean() })),
  testimonials: z.array(z.object({ name: z.string(), quote: z.string(), consentApproved: z.boolean() })),
  socialLinks: z.array(z.object({ label: z.string(), url: safeUrl })),
  impactReports: z.array(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string(), date, location: z.string(), methodology: z.string(), outcomes: z.string(), limitations: z.string(), nextSteps: z.string(), verified: z.boolean() })),
})
export type Trek = z.infer<typeof trekSchema>
export type Photo = z.infer<typeof photoSchema>
export type Video = z.infer<typeof videoSchema>
export type SiteContent = z.infer<typeof contentSchema>

export function publicContent(content: SiteContent): SiteContent {
  return {
    ...content,
    hero: content.hero,
    timeline: content.timeline.filter(item => item.verified),
    people: content.people.filter(item => item.consentApproved),
    testimonials: content.testimonials.filter(item => item.consentApproved),
    impactReports: content.impactReports.filter(item => item.verified),
    treks: content.treks.map(trek => ({ ...trek,
      status: trek.status === 'confirmed' && (!trek.organizerConfirmed || !trek.dateVerified || !trek.date) ? 'proposed' : trek.status,
      date: trek.dateVerified ? trek.date : null,
      participantCount: trek.countVerified ? trek.participantCount : null,
      registrationUrl: trek.status === 'confirmed' && trek.organizerConfirmed && trek.dateVerified && trek.date && trek.registrationStatus === 'Open' ? trek.registrationUrl : null,
      registrationStatus: trek.status === 'confirmed' && trek.organizerConfirmed && trek.dateVerified && trek.date ? trek.registrationStatus : 'Not open',
      organizerWhatsapp: '', organizerChat: trek.organizerChat || Boolean(trek.organizerWhatsapp),
    })),
  }
}

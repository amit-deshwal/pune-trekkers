import { z } from 'zod'
import { whatsappDigits } from './content-schema.ts'
import { eventSlugs } from './events.ts'

const noLinks = (value: string) => !/https?:|www\.|\.(com|org|net)\b/i.test(value)

export const eventSignupSchema = z.object({
  event: z.enum(eventSlugs),
  name: z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long').refine(noLinks, 'Please leave links out of your name'),
  whatsapp: z.string().transform(whatsappDigits).refine(value => /^\d{11,15}$/.test(value), 'Use a WhatsApp number with country code, e.g. +91 98765 43210'),
  level: z.enum(['new', 'some', 'experienced']),
  // Names of friends to be put on the same team. Optional; everyone else is matched by the organisers.
  friends: z.string().trim().max(160, 'Friends list is too long').refine(noLinks, 'Please leave links out of the friends list').default(''),
  consent: z.literal(true, { message: 'Please confirm you agree to be contacted' }),
  website: z.string().max(0).default(''),
})
export type EventSignupInput = z.infer<typeof eventSignupSchema>
export const levelLabel: Record<EventSignupInput['level'], string> = { new: 'New to navigation', some: 'Some experience', experienced: 'Experienced' }

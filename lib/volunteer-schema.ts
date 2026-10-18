import { z } from 'zod'
import { whatsappDigits } from './content-schema.ts'
import { volunteerRoleIds } from './volunteer-roles.ts'

const noLinks = (value: string) => !/https?:|www\.|\.(com|org|net)\b/i.test(value)
const text = (label: string, min: number, max: number) =>
  z.string().trim().min(min, `${label} is too short`).max(max, `${label} is too long`).refine(noLinks, `Please leave links out of ${label.toLowerCase()}`)

export const volunteerInputSchema = z.object({
  name: text('Name', 2, 60),
  whatsapp: z.string().transform(whatsappDigits).refine(value => /^\d{11,15}$/.test(value), 'Use a WhatsApp number with country code, e.g. +91 98765 43210'),
  email: z.string().trim().max(160).refine(value => value === '' || z.email().safeParse(value).success, 'Use a valid email address').default(''),
  roles: z.array(z.enum(volunteerRoleIds)).min(1, 'Pick at least one role').max(volunteerRoleIds.length),
  experience: text('Experience', 10, 600),
  // Portfolios and Instagram pages are useful for the creative roles, so one link is allowed here and only here.
  portfolio: z.string().trim().max(200, 'Portfolio link is too long').refine(value => value === '' || /^https?:\/\/\S+$/i.test(value), 'Start the portfolio link with https://').default(''),
  availability: text('Availability', 0, 140).default(''),
  consent: z.literal(true, { message: 'Please confirm you agree to be contacted' }),
  website: z.string().max(0).default(''),
})
export type VolunteerInput = z.infer<typeof volunteerInputSchema>

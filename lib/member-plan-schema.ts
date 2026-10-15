import { z } from 'zod'
import { whatsappDigits } from './content-schema.ts'

const noLinks = (value: string) => !/https?:|www\.|\.(com|org|net)\b/i.test(value)
const text = (label: string, min: number, max: number) =>
  z.string().trim().min(min, `${label} is too short`).max(max, `${label} is too long`).refine(noLinks, `Please leave links out of ${label.toLowerCase()}`)

export const planInputSchema = z.object({
  name: text('Name', 2, 40),
  whatsapp: z.string().transform(whatsappDigits).refine(value => /^\d{11,15}$/.test(value), 'Use a WhatsApp number with country code, e.g. +91 98765 43210'),
  destination: text('Destination', 2, 80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  startTime: z.string().refine(value => value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), 'Use a valid start time').default(''),
  meetingPoint: z.string().trim().max(140, 'Meeting point is too long').refine(noLinks, 'Please leave links out of the meeting point').default(''),
  difficulty: z.enum(['Easy', 'Moderate', 'Challenging']),
  maxPeople: z.number().int().min(1).max(30).nullable().default(null),
  summary: text('Description', 10, 400),
  consent: z.literal(true, { message: 'Please confirm the plan details before submitting' }),
  website: z.string().max(0).default(''),
})
export type PlanInput = z.infer<typeof planInputSchema>


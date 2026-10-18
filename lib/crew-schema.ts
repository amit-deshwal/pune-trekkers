import { z } from 'zod'

// Volunteers shown on /crew. Add someone to data/crew.json only after they have agreed to be named.
export const crewMemberSchema = z.object({
  name: z.string().trim().min(2).max(60),
  role: z.string().trim().min(2).max(80),
  // Month they started, as YYYY-MM, e.g. "2026-10". Leave empty to hide it, e.g. for founders.
  since: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM').or(z.literal('')).default(''),
  // Square photo in public/images/crew/, e.g. "/images/crew/asha.webp". Empty shows their initial.
  photo: z.string().regex(/^\/images\/crew\/[\w-]+\.(webp|jpg|png)$/, 'Put the photo in public/images/crew/').or(z.literal('')).default(''),
  blurb: z.string().trim().max(240).default(''),
  instagram: z.string().trim().regex(/^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/, 'Use a full Instagram profile link').or(z.literal('')).default(''),
  website: z.string().trim().regex(/^https:\/\/[\w.-]+\.[a-z]{2,}(\/\S*)?$/i, 'Use a full https:// link').or(z.literal('')).default(''),
  // Shown publicly as a mailto link, so use an address the person is happy to have scraped.
  email: z.string().trim().max(160).refine(value => value === '' || z.email().safeParse(value).success, 'Use a valid email address').default(''),
  consent: z.boolean(),
})
export type CrewMember = z.infer<typeof crewMemberSchema>

export const parseCrew = (data: unknown) => z.array(crewMemberSchema).parse(data).filter(member => member.consent).sort((a, b) => a.since.localeCompare(b.since) || a.name.localeCompare(b.name))
export const sinceLabel = (since: string) => new Date(`${since}-15T12:00:00+05:30`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

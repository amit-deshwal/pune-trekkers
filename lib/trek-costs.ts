import { z } from 'zod'
import costData from '../data/trek-costs.json'

// Real cost sheets shown on /where-the-money-goes. Leave out names, phone numbers and UPI IDs.
const lineSchema = z.object({ label: z.string().trim().min(2).max(90), amount: z.number().int().nonnegative() })
export const trekCostSchema = z.object({
  trek: z.string().trim().min(2).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  people: z.number().int().positive(),
  // What each participant paid, as announced on the sheet.
  perPerson: z.number().int().positive(),
  expenses: z.array(lineSchema).min(1),
  // Who paid what. Totals may differ from expenses by a few rupees of rounding.
  shares: z.array(lineSchema).min(1),
  settlement: z.string().trim().max(240),
  note: z.string().trim().max(400).default(''),
})
export type TrekCost = z.infer<typeof trekCostSchema>

export const trekCosts = z.array(trekCostSchema).parse(costData).sort((a, b) => b.date.localeCompare(a.date))

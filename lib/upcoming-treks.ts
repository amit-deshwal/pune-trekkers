import type { Trek } from './content-schema'

// Kept apart from content-schema so pages and the trail buddy can use it without shipping zod to the browser.
export function upcomingTreks(treks: Trek[], today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })) {
  return treks.filter(trek => (trek.status === 'confirmed' || trek.status === 'proposed') && (!trek.date || trek.date >= today))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
}

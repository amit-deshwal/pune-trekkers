import type { Trek } from './content-schema'

// Placeholder text saved by older admin forms and the archive import; hide it from visitors.
const placeholders=[/^location not recorded$/i,/^from the community.s original .+ photo archive\.?$/i,/^a day on the trail with pune trekkers\.?$/i]
export function realText(value?: string | null) { const text = value?.trim() || ''; return placeholders.some(p => p.test(text)) ? '' : text }

export type Place = { key: string; name: string; visits: Trek[] }
// Newest first; undated visits sort last and keep their original order.
const newestFirst = (a: Trek, b: Trek) => (b.date || '').localeCompare(a.date || '')

// Past trips are grouped by destination (or trip name when no destination is recorded).
export function groupPlaces(treks: Trek[]): Place[] {
  const places = new Map<string, Place>()
  for (const trek of treks) {
    // Initiatives (tree plantation, hill cleaning) stay separate cards even when they share a location.
    const name = trek.kind === 'initiative' ? trek.name.trim() : realText(trek.destination) || trek.name.trim()
    const key = name.toLowerCase().replace(/\s+/g, ' ')
    const place = places.get(key)
    if (place) place.visits.push(trek)
    else places.set(key, { key, name, visits: [trek] })
  }
  const list = Array.from(places.values())
  list.forEach(place => place.visits.sort(newestFirst))
  return list.sort((a, b) => newestFirst(a.visits[0], b.visits[0]))
}

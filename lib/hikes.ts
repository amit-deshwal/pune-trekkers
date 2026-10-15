// Distance helpers shared by the fort finder and the Treks near Pune guide.
export type Origin = { name: string; lat: number; lon: number }
export const PUNE: Origin = { name: 'Pune', lat: 18.5214, lon: 73.8545 }

// Straight-line (haversine) distance in km. Road distance in the Ghats is usually much longer.
export function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

type HikeStart = { name: string; lat: number; lon: number; verified: boolean }
export type HikeRecord = { slug: string; name: string; kind: 'fort' | 'peak'; lat: number; lon: number; region: string | null; starts: HikeStart[] }
export type NearbyHike = { slug: string; name: string; kind: 'fort' | 'peak'; region: string | null; km: number; baseVillage: string | null; lat: number; lon: number }

// Like the finder, distance runs to the nearest listed base village, or to the mapped place when none is listed.
export function nearbyHikes(hikes: HikeRecord[], slugs: string[], origin: Origin = PUNE): NearbyHike[] {
  const wanted = new Set(slugs)
  return hikes.filter(h => wanted.has(h.slug)).map(h => {
    const base = h.starts.filter(s => s.verified).map(s => ({ s, d: km(origin, s) })).sort((a, b) => a.d - b.d)[0]
    const point = base?.s ?? h
    return { slug: h.slug, name: h.name, kind: h.kind, region: h.region, km: Math.round(base?.d ?? km(origin, h)), baseVillage: base?.s.name ?? null, lat: point.lat, lon: point.lon }
  }).sort((a, b) => a.km - b.km || a.name.localeCompare(b.name))
}

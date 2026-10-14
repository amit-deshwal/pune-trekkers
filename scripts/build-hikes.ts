// Merges open-data dumps (OpenStreetMap via Overpass, Wikidata) into public/data/hikes.json and public/data/places.json.
// Usage: node --experimental-strip-types scripts/build-hikes.ts <rawDir>
// <rawDir> must contain osm.json, wd.json, towns.json and v*.json (see scripts/README-data.md).
// Only facts (names, coordinates, elevation) are taken. No prose is copied from third-party sites.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const raw = process.argv[2]
if (!raw) throw new Error('pass the raw data directory')
const load = (f: string) => JSON.parse(readFileSync(join(raw, f), 'utf8'))

type Pt = { name: string; lat: number; lon: number }
const R = 6371
export function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
const norm = (s: string) => s.toLowerCase().replace(/\b(fort|killa|kila|killaa|durg|peak|hill|tekdi|gad|garh|gadh|ghad|ballekilla)\b/g, '').replace(/[^a-z0-9]/g, '')
// Some map names are all lowercase ("jivdhan fort", "korlai"); capitalise words but keep small joining words.
const titleCase = (s: string) => s.replace(/\b([a-z])([a-z]*)/g, (w, f, rest, i) => i > 0 && /^(of|and|the|ka|ki|cha|chi)$/.test(w) ? w : f.toUpperCase() + rest)
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const latin = (s: string) => /[A-Za-z]/.test(s) && !/[ऀ-ॿ]/.test(s)

type Cand = { name: string; alt: string[]; lat: number; lon: number; kind: 'fort' | 'peak'; elevationM: number | null; sources: string[] }
const cands: Cand[] = []

for (const e of load('osm.json').elements) {
  const t = e.tags || {}
  const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon
  const name = [t['name:en'], t.name].find(n => n && latin(n))
  if (!name || lat == null) continue
  const ele = parseFloat(t.ele)
  cands.push({ name, alt: [t.alt_name, t.name].filter(Boolean), lat, lon, kind: t.historic || t.fort_type ? 'fort' : 'peak', elevationM: Number.isFinite(ele) ? Math.round(ele) : null, sources: ['OpenStreetMap'] })
}
for (const b of load('wd.json').results.bindings) {
  const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.c.value)
  if (!m || !latin(b.l.value) || /^Q\d+$/.test(b.l.value)) continue
  const ele = b.e ? Math.round(parseFloat(b.e.value)) : null
  cands.push({ name: b.l.value, alt: [], lat: +m[2], lon: +m[1], kind: /fort|gad|garh|durg|killa/i.test(b.l.value) ? 'fort' : 'peak', elevationM: ele, sources: ['Wikidata'] })
}

// Dedupe: same normalised name within 3 km, or any record within 150 m with a similar name.
const merged: Cand[] = []
for (const c of cands) {
  const n = norm(c.name)
  const hit = merged.find(m => (norm(m.name) === n && n.length > 2 && km(m, c) < 3) || (km(m, c) < 0.15 && (norm(m.name).includes(n) || n.includes(norm(m.name)))))
  if (hit) {
    hit.alt.push(c.name, ...c.alt)
    if (hit.elevationM == null) hit.elevationM = c.elevationM
    if (c.kind === 'fort') hit.kind = 'fort'
    for (const s of c.sources) if (!hit.sources.includes(s)) hit.sources.push(s)
  } else merged.push({ ...c, alt: [...c.alt] })
}

// Keep Maharashtra-ish box and drop obvious city hills/viewpoints with no fort signal or elevation.
const inMH = (c: Cand) => c.lat > 15.5 && c.lat < 22.1 && c.lon > 72.5 && c.lon < 80.95
// Wikidata has some descriptive labels ("Remains of an old fort", "Palace of …") that are not hikes.
const descriptive = (c: Cand) => /^(old|remains|ruins|palace)\b/i.test(c.name)
const kept = merged.filter(c => inMH(c) && !descriptive(c))

const places: Pt[] = []
const rankOf: Record<string, number> = { city: 0, town: 1, suburb: 2, quarter: 2, neighbourhood: 2 }
const rank = new Map<Pt, number>()
for (const e of load('towns.json').elements) {
  const n = [e.tags?.['name:en'], e.tags?.name].find(n => n && latin(n))
  const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon
  if (lat == null || !n) continue
  const p = { name: n, lat, lon }
  places.push(p); rank.set(p, rankOf[e.tags.place] ?? 3)
}
const villages: Pt[] = []
const seen = new Set<string>()
for (const f of readdirSync(raw).filter(f => /^v\d+\.json$/.test(f))) {
  for (const e of load(f).elements) {
    const n = [e.tags?.['name:en'], e.tags?.name].find(n => n && latin(n))
    if (!n || e.lat == null || !latin(n) || seen.has(e.id)) continue
    seen.add(e.id)
    villages.push({ name: n, lat: e.lat, lon: e.lon })
  }
}

// Trekshitiz (volunteer fort database): facts only — district, range, grade, height and listed base villages.
const opt = (f: string, d: any) => { try { return load(f) } catch { return d } }
type TS = { name: string; type: string; district: string; taluka: string | null; difficulty: string | null; heightFt: number | null; villages: string[]; url: string }
const ts: TS[] = opt('ts.json', [])
const geo: Record<string, [number, number]> = opt('ts-geo.json', {}) // "Village|District" -> [lat, lon] from Nominatim
const mt: { name: string; url: string }[] = opt('mt.json', []) // Maharashtra Tourism fort pages
const districtCentre = (d: string) => places.find(p => p.name.toLowerCase() === d.toLowerCase())
// Transliterations vary ("Sandashi" vs "Sandshi"), so compare names without vowels and h. Accept only when every hit is one place.
const loose = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiouh]/g, '')
const looseVillage = (name: string): [number, number] | undefined => {
  const k = loose(name)
  const hits = k.length >= 3 ? villages.filter(v => loose(v.name) === k) : []
  return hits.length && hits.every(h => km(h, hits[0]) < 10) ? [hits[0].lat, hits[0].lon] : undefined
}
type Linked = Cand & { ts?: TS; links: { label: string; url: string }[]; approx?: boolean }
const linked: Linked[] = kept.map(c => ({ ...c, links: [] }))
const findMatch = (name: string, near?: Pt) => {
  const n = norm(name)
  const hits = linked.filter(c => n.length > 2 && [c.name, ...c.alt].some(a => norm(a) === n))
  return near ? hits.sort((a, b) => km(a, near) - km(b, near))[0] : hits[0]
}
for (const t of ts) {
  const centre = districtCentre(t.district)
  let c: Linked | undefined = findMatch(t.name, centre)
  if (c && centre && km(c, centre) > 150) c = undefined
  if (!c) {
    const g = t.villages.map(v => geo[`${v}|${t.district}`] ?? looseVillage(v)).find(Boolean)
    if (!g) continue
    c = { name: /fort|gad|garh|durg|bahiri/i.test(t.name) ? t.name.replace(/-/g, ' ') : `${t.name.replace(/-/g, ' ')} Fort`, alt: [], lat: g[0], lon: g[1], kind: 'fort', elevationM: null, sources: [], links: [], approx: true }
    linked.push(c)
  }
  c.ts = t; c.kind = 'fort'
  if (!c.sources.includes('Trekshitiz')) c.sources.push('Trekshitiz')
  c.links.push({ label: 'Trekshitiz', url: t.url })
}
for (const m of mt) { const c = findMatch(m.name); if (c) { c.sources.push('Maharashtra Tourism'); c.links.push({ label: 'Maharashtra Tourism', url: m.url }) } }

const manual: any[] = JSON.parse(readFileSync('data/hike-overrides.json', 'utf8'))._add ?? []
for (const m of manual) linked.push({ name: m.name, alt: [], lat: m.lat, lon: m.lon, kind: m.kind ?? 'fort', elevationM: m.elevationM ?? null, sources: ['Pune Trekkers'], links: m.links ?? [], approx: !!m.approx })

const grade = (g?: string | null) => !g ? null : /^eas/i.test(g) ? 'Easy' : /medium|moderate/i.test(g) ? 'Moderate' : /hard|difficult|tough/i.test(g) ? 'Challenging' : null
const overrides: Record<string, any> = JSON.parse(readFileSync('data/hike-overrides.json', 'utf8'))
const slugs = new Set<string>()
const byName = (name: string, near: Pt, maxKm: number, district?: string) => {
  const hit = [...villages, ...places].filter(v => v.name.toLowerCase() === name.toLowerCase()).sort((a, b) => km(near, a) - km(near, b))[0]
  if (hit && km(near, hit) <= maxKm) return hit
  const g = district && (geo[`${name}|${district}`] ?? looseVillage(name))
  return g && km(near, { lat: g[0], lon: g[1] }) <= maxKm ? { name, lat: g[0], lon: g[1] } : undefined
}
const hikes = linked.map(c => {
  let slug = slugify(c.name)
  if (slugs.has(slug)) slug += '-' + slugify(String(c.lat.toFixed(2)))
  slugs.add(slug)
  const o = overrides[slug] ?? manual.find(m => slugify(m.name) === slug)
  const fmt = (v: Pt, note: string, verified: boolean) => ({ name: v.name, lat: +v.lat.toFixed(5), lon: +v.lon.toFixed(5), note, verified })
  let starts
  if (o?.starts?.length) {
    starts = o.starts.map((s: any) => {
      const hit = byName(s.name, c, 20)
      if (!hit) { console.warn(`override start "${s.name}" not found near ${slug}`); return null }
      return fmt({ ...hit, name: s.name }, s.note ?? '', true)
    }).filter(Boolean)
  } else {
    starts = (c.ts?.villages ?? []).map(v => byName(v, c, 15, c.ts!.district)).filter(Boolean).map(v => fmt(v!, 'Base village listed by Trekshitiz.', true))
    if (!starts.length) starts = villages.map(v => ({ ...v, d: km(c, v) })).filter(v => v.d < 6).sort((a, b) => a.d - b.d).slice(0, 3)
      .map(v => fmt(v, 'Nearest village in OpenStreetMap, which may not be the trailhead. Confirm locally.', false))
  }
  starts = starts.filter((s: Pt, i: number, all: Pt[]) => all.findIndex(o => o.name === s.name) === i)
  const ele = o?.elevationM ?? c.elevationM ?? (c.ts?.heightFt ? Math.round(c.ts.heightFt * 0.3048) : null)
  const range = c.ts?.taluka && !/^(nil|none|-)$/i.test(c.ts.taluka) && c.ts.taluka !== c.ts.district ? c.ts.taluka : null
  const region = o?.region ?? (c.ts ? [range, c.ts.district].filter(Boolean).join(' · ') : null)
  return {
    slug, name: o?.name ?? titleCase(c.name), kind: c.kind, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5),
    elevationM: ele && ele > 0 ? ele : null, difficulty: o?.difficulty ?? grade(c.ts?.difficulty), region,
    hidden: o?.hidden ?? (!o && (c.sources.length === 1 || (!c.sources.includes('Wikidata') && !c.sources.includes('Maharashtra Tourism')))),
    // Popular = well documented (official page, curated, or in both Trekshitiz and Wikidata). Curated "hidden" wins.
    popular: !(o?.hidden) && (!!o || c.sources.includes('Maharashtra Tourism') || (c.sources.includes('Trekshitiz') && c.sources.includes('Wikidata'))),
    approxLocation: !!c.approx, notes: o?.notes ?? null,
    aliases: Array.from(new Set(c.alt.filter(a => a !== c.name && latin(a)))).slice(0, 4), starts, sources: c.sources, links: c.links,
  }
}).sort((a, b) => a.name.localeCompare(b.name))

// Search list rows: [name, lat, lon, rank (0 city … 3 village), nearest city for telling same-named places apart].
const cities = places.filter(p => rank.get(p) === 0)
const searchPlaces = [...places, ...villages.filter(v => !places.some(p => p.name === v.name && km(p, v) < 5))]
  .map(p => {
    const city = cities.reduce<Pt | undefined>((best, c) => !best || km(p, c) < km(p, best) ? c : best, undefined)
    return [p.name, +p.lat.toFixed(4), +p.lon.toFixed(4), rank.get(p) ?? 3, city && city.name !== p.name ? city.name : '']
  })
  .sort((a, b) => (a[3] as number) - (b[3] as number))
writeFileSync('public/data/hikes.json', JSON.stringify(hikes))
writeFileSync('public/data/places.json', JSON.stringify(searchPlaces))
console.log(`hikes ${hikes.length} (${hikes.filter(h => h.starts.length).length} with start points), places ${searchPlaces.length}`)

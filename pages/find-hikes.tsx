import { useEffect, useMemo, useState } from 'react'
import Seo from '../components/Seo'
import Icon from '../components/Icon'
import { PageIntro } from '../components/Shared'

type Start = { name: string; lat: number; lon: number; note: string; verified: boolean }
type Hike = { slug: string; name: string; kind: 'fort' | 'peak'; lat: number; lon: number; elevationM: number | null; difficulty: string | null; region: string | null; popular: boolean; hidden: boolean; approxLocation: boolean; notes: string | null; aliases: string[]; starts: Start[]; sources: string[]; links: { label: string; url: string }[] }
type Place = [string, number, number, number, string] // name, lat, lon, rank (0 city … 3 village), nearest city
type Origin = { name: string; lat: number; lon: number }

const ROAD_FACTOR = 1.4 // Straight-line distance understates winding Sahyadri roads; Google Maps gives the real figure.
const PUNE: Origin = { name: 'Pune', lat: 18.5214, lon: 73.8545 }
const PAGE = 18
const views = [['popular', 'Popular'], ['all', 'All nearby'], ['hidden', 'Lesser known']] as const
const filters = [['fort', 'Forts'], ['peak', 'Peaks'], ['Easy', 'Easy'], ['Moderate', 'Moderate'], ['Challenging', 'Challenging'], ['trailhead', 'Known trailhead']] as const
const radii = [50, 100, 200, 0] // 0 = any distance

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const road = (d: number) => Math.round(d * ROAD_FACTOR)
const dirUrl = (o: Origin, s: { lat: number; lon: number }) => `https://www.google.com/maps/dir/?api=1&origin=${o.lat},${o.lon}&destination=${s.lat},${s.lon}&travelmode=driving`

export default function FindHikes() {
  const [hikes, setHikes] = useState<Hike[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loadError, setLoadError] = useState(false)
  const [text, setText] = useState('')
  const [origin, setOrigin] = useState<Origin>(PUNE)
  const [typing, setTyping] = useState(false)
  const [view, setView] = useState<typeof views[number][0]>('popular')
  const [active, setActive] = useState<string[]>([])
  const [radius, setRadius] = useState(100)
  const [shown, setShown] = useState(PAGE)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([fetch('/data/hikes.json').then(r => r.json()), fetch('/data/places.json').then(r => r.json())])
      .then(([h, p]) => { setHikes(h); setPlaces(p) })
      .catch(() => setLoadError(true))
  }, [])
  useEffect(() => setShown(PAGE), [origin, view, active, radius])

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase()
    if (!typing || q.length < 2) return []
    // places.json is pre-sorted cities first, so prefix matches surface the big places before villages.
    const starts = places.filter(p => p[0].toLowerCase().startsWith(q))
    const contains = places.filter(p => !p[0].toLowerCase().startsWith(q) && p[0].toLowerCase().includes(q))
    return [...starts, ...contains].slice(0, 7)
  }, [text, places, typing])

  const nearby = useMemo(() => hikes.map(h => {
    const starts = h.starts.map(s => ({ ...s, d: km(origin, s) })).sort((a, b) => a.d - b.d)
    return { hike: h, starts, d: starts[0]?.d ?? km(origin, h) }
  }).filter(r => !radius || r.d <= radius).sort((a, b) => a.d - b.d), [hikes, origin, radius])

  const has = (f: string) => active.includes(f)
  const results = nearby.filter(({ hike: h }) =>
    (view === 'all' || (view === 'popular' ? h.popular : h.hidden && !h.popular)) &&
    (!has('fort') && !has('peak') || has(h.kind)) &&
    (!['Easy', 'Moderate', 'Challenging'].some(has) || (h.difficulty != null && has(h.difficulty))) &&
    (!has('trailhead') || h.starts.some(s => s.verified)))
  const counts = Object.fromEntries(views.map(([v]) => [v, nearby.filter(({ hike: h }) => v === 'all' || (v === 'popular' ? h.popular : h.hidden && !h.popular)).length]))

  function choose(o: Origin) { setOrigin(o); setText(o.name); setTyping(false); setMsg('') }
  // Fallback for localities the bundled list lacks (e.g. Kothrud is only a boundary in OSM). One request per submit, per Nominatim policy.
  async function lookup() {
    const q = text.trim()
    if (!q) return
    if (suggestions[0]?.[0].toLowerCase() === q.toLowerCase()) return choose({ name: suggestions[0][0], lat: suggestions[0][1], lon: suggestions[0][2] })
    setMsg('Searching the map…'); setTyping(false)
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: 'json', limit: '1', countrycodes: 'in', viewbox: '72.6,22.1,80.9,15.6' })}`)
      const [hit] = await r.json()
      if (!hit) return setMsg(`Couldn't find “${q}”. Try a nearby town.`)
      choose({ name: hit.display_name.split(',')[0], lat: +hit.lat, lon: +hit.lon })
    } catch { setMsg('Map search is unavailable right now. Pick a suggestion instead.') }
  }
  function locate() {
    if (!navigator.geolocation) return setMsg('Your browser cannot share location. Type an area instead.')
    setMsg('Finding you…')
    navigator.geolocation.getCurrentPosition(pos => choose({ name: 'Your location', lat: pos.coords.latitude, lon: pos.coords.longitude }), () => setMsg('Location was blocked. Type an area instead.'))
  }

  return <>
    <Seo title="Find hikes near you" description="Search forts and peaks across Maharashtra by area and see how far each trailhead is." />
    <PageIntro eyebrow="FIND A TRAIL NEAR YOU" title="Where are you starting from?">Forts and peaks around you, with the distance to the village where trekkers usually start.</PageIntro>
    <section className="container listing-section">
      <form className="hike-search" onSubmit={e => { e.preventDefault(); lookup() }}>
        <div className="hike-field">
          <Icon name="pin" size={18} />
          <input value={text} onChange={e => { setText(e.target.value); setTyping(true) }} placeholder="Kothrud, Lonavala, Thane, Nashik…" autoComplete="off" aria-label="Your area, town or village" role="combobox" aria-expanded={suggestions.length > 0} aria-controls="area-list" />
          {suggestions.length > 0 && <ul id="area-list" className="suggest" role="listbox">{suggestions.map(p => <li key={p[0] + p[1]} role="option" aria-selected="false"><button type="button" onClick={() => choose({ name: p[0], lat: p[1], lon: p[2] })}>{p[0]}{p[4] && <small> · near {p[4]}</small>}</button></li>)}</ul>}
        </div>
        <button className="button" type="submit">Search</button>
        <button type="button" className="text-button" onClick={locate}>Use my location</button>
      </form>
      {msg && <p className="hike-msg" role="status">{msg}</p>}

      <div className="chip-row" role="tablist" aria-label="Which hikes">
        {views.map(([v, label]) => <button key={v} role="tab" aria-selected={view === v} className={`chip ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>{label} <span>{counts[v]}</span></button>)}
      </div>
      <div className="chip-row small" aria-label="Filters">
        {filters.map(([f, label]) => <button key={f} aria-pressed={has(f)} className={`chip ${has(f) ? 'on' : ''}`} onClick={() => setActive(a => a.includes(f) ? a.filter(x => x !== f) : [...a, f])}>{label}</button>)}
        <span className="chip-sep" />
        {radii.map(r => <button key={r} aria-pressed={radius === r} className={`chip ${radius === r ? 'on' : ''}`} onClick={() => setRadius(r)}>{r ? `${r} km` : 'Any distance'}</button>)}
      </div>

      <p className="hike-count" aria-live="polite">{loadError ? 'Hike data could not be loaded. Please refresh.' : hikes.length ? <>{results.length} {view === 'popular' ? 'popular ' : view === 'hidden' ? 'lesser-known ' : ''}{results.length === 1 ? 'hike' : 'hikes'} {radius ? `within ${radius} km of` : 'from'} <strong>{origin.name}</strong></> : 'Loading hikes…'}</p>

      {hikes.length > 0 && results.length === 0 && <div className="empty-state"><Icon name="mountain" size={56} /><h2>Nothing here yet.</h2><p>{view === 'popular' ? <>Try <button className="text-button" onClick={() => setView('all')}>all nearby hikes</button> or a wider distance.</> : 'Try fewer filters or a wider distance.'}</p></div>}

      <div className="hike-list">
        {results.slice(0, shown).map(({ hike, starts, d }) => {
          const [main, ...more] = starts
          return <article className="hike-row" key={hike.slug}>
            <div className="hike-head">
              <h2>{hike.name}</h2>
              <span className="hike-dist">~{road(d)} km</span>
            </div>
            <p className="hike-meta">{[hike.kind === 'fort' ? 'Fort' : 'Peak', hike.difficulty, hike.elevationM ? `${hike.elevationM} m` : null, hike.region].filter(Boolean).join(' · ')}</p>
            {main ? <p className="hike-start">
              Start at <strong>{main.name}</strong>{!main.verified && <span className="tag" title={main.note}>unconfirmed</span>} · <a href={dirUrl(origin, main)} target="_blank" rel="noopener noreferrer">Directions ↗</a>
            </p> : <p className="hike-start"><a href={`https://www.google.com/maps/search/?api=1&query=${hike.lat},${hike.lon}`} target="_blank" rel="noopener noreferrer">View on map ↗</a></p>}
            {(more.length > 0 || main?.note || hike.links.length > 0) && <details>
              <summary>{more.length ? `${more.length} more starting point${more.length > 1 ? 's' : ''} & details` : 'Details'}</summary>
              <ul className="starts">{starts.map(s => <li key={s.name + s.lat}><strong>{s.name}</strong> · ~{road(s.d)} km · <a href={dirUrl(origin, s)} target="_blank" rel="noopener noreferrer">Directions ↗</a>{s.note && <small>{s.note}</small>}</li>)}</ul>
              {hike.approxLocation && <small>Location is approximate (taken from the base village).</small>}
              <small>Data: {hike.sources.join(', ')}{hike.links.map(l => <> · <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a></>)}</small>
            </details>}
          </article>
        })}
      </div>
      {results.length > shown && <button className="button button-outline show-more" onClick={() => setShown(s => s + PAGE)}>Show more ({results.length - shown} left)</button>}

      <p className="source-note">Distances are approximate road estimates; use Directions for the real drive. “Unconfirmed” starts are the nearest village on the map, so ask locally. Data © OpenStreetMap contributors (ODbL), Wikidata, Trekshitiz and Maharashtra Tourism.</p>
    </section>
  </>
}

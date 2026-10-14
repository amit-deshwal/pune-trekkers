import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Seo from '../components/Seo'
import Icon from '../components/Icon'
import { PageIntro } from '../components/Shared'
import hikeReview from '../data/hike-review.json'

type Start = { name: string; lat: number; lon: number; note: string; verified: boolean }
type Hike = { slug: string; name: string; kind: 'fort' | 'peak'; lat: number; lon: number; elevationM: number | null; difficulty: string | null; region: string | null; popular: boolean; hidden: boolean; approxLocation: boolean; notes: string | null; aliases: string[]; starts: Start[]; sources: string[]; links: { label: string; url: string }[] }
type Origin = { name: string; lat: number; lon: number }

const PUNE: Origin = { name: 'Pune', lat: 18.5214, lon: 73.8545 }
const startingAreas: Origin[] = [PUNE,
  { name: 'Lonavala', lat: 18.7549, lon: 73.4017 },
  { name: 'Karjat', lat: 18.9128, lon: 73.3228 },
  { name: 'Panvel', lat: 18.9895, lon: 73.1222 },
  { name: 'Mumbai', lat: 19.055, lon: 72.8692 },
  { name: 'Thane', lat: 19.1943, lon: 72.9702 },
  { name: 'Satara', lat: 17.6883, lon: 74.0042 },
  { name: 'Nashik', lat: 20.0112, lon: 73.7902 },
  { name: 'Junnar', lat: 19.2094, lon: 73.8772 },
]
const PAGE = 12
const radii = [50, 100, 200, 0] // 0 = any distance
const featured = new Set(hikeReview.featured.map(h => h.slug))
const excluded = new Set(hikeReview.exclude)

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const dirUrl = (o: Origin, s: { lat: number; lon: number }) => `https://www.google.com/maps/dir/?api=1&origin=${o.lat},${o.lon}&destination=${s.lat},${s.lon}&travelmode=driving`

export default function FindHikes() {
  const [hikes, setHikes] = useState<Hike[]>([])
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState('')
  const [text, setText] = useState('')
  const [origin, setOrigin] = useState<Origin>(PUNE)
  const [typing, setTyping] = useState(false)
  const [view, setView] = useState<'featured' | 'all'>('featured')
  const [kind, setKind] = useState<'fort' | 'peak' | 'all'>('fort')
  const [knownStartOnly, setKnownStartOnly] = useState(false)
  const [radius, setRadius] = useState(100)
  const [shown, setShown] = useState(PAGE)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/data/hikes.json').then(r => r.json())
      .then(h => setHikes(h))
      .catch(() => setLoadError(true))
  }, [])
  useEffect(() => setShown(PAGE), [origin, view, knownStartOnly, radius, query, kind])

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase()
    if (!typing || q.length < 2) return []
    return startingAreas.filter(p => p.name.toLowerCase().includes(q))
  }, [text, typing])

  const nearby = useMemo(() => hikes.filter(h => !excluded.has(h.slug) &&
    (featured.has(h.slug) || h.links.some(l => l.label === 'Trekshitiz' || l.label === 'Maharashtra Tourism'))).map(h => {
    const starts = h.starts.map(s => ({ ...s, d: km(origin, s) })).sort((a, b) => Number(b.verified) - Number(a.verified) || a.d - b.d)
    return { hike: h, starts, d: starts.find(s => s.verified)?.d ?? km(origin, h) }
  }).sort((a, b) => a.d - b.d), [hikes, origin])

  const search = query.trim().toLowerCase()
  const results = nearby.filter(({ hike: h, d }) =>
    (search || kind === 'all' || h.kind === kind) &&
    (search ? [h.name, ...h.aliases, h.region ?? ''].some(value => value.toLowerCase().includes(search)) :
      (!radius || Math.round(d) <= radius) && (view === 'all' || featured.has(h.slug))) &&
    (!knownStartOnly || h.starts.some(s => s.verified)))
    .sort((a, b) => search ? Number(b.hike.name.toLowerCase().startsWith(search)) - Number(a.hike.name.toLowerCase().startsWith(search)) || a.hike.name.localeCompare(b.hike.name) : a.d - b.d)
  const browseCount = nearby.filter(({ hike: h, d }) =>
    (kind === 'all' || h.kind === kind) && (!radius || Math.round(d) <= radius) &&
    (!knownStartOnly || h.starts.some(s => s.verified))).length
  const visibleResults = view === 'featured' && !search ? results : results.slice(0, shown)
  function choose(o: Origin) { setOrigin(o); setText(o.name); setTyping(false); setMsg('') }
  // Fallback for localities the bundled list lacks (e.g. Kothrud is only a boundary in OSM). One request per submit, per Nominatim policy.
  async function lookup() {
    const q = text.trim()
    if (!q) return
    if (q.toLowerCase() === origin.name.toLowerCase()) { setMsg(''); setTyping(false); return }
    const known = startingAreas.find(place => place.name.toLowerCase() === q.toLowerCase())
    if (known) return choose(known)
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
    <Seo title="Find hikes near Pune" description="Browse referenced fort hikes near Pune, or search sourced listings across Maharashtra." />
    <PageIntro eyebrow="FIND HIKES" title="Find a hike near Pune.">Start with well-known forts nearby. Have a place in mind? Search for it below.</PageIntro>
    <section className="container listing-section">
      <div className="fort-finder">
        <div className="fort-search-block">
          <label htmlFor="fort-search">Search a fort or peak</label>
          <div className="hike-field fort-search-field">
            <Icon name="mountain" size={20} />
            <input id="fort-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rajgad, Sinhagad, Kalsubai…" autoComplete="off" />
          </div>
          <p>Search sourced fort listings across Maharashtra, or browse the nearby suggestions below.</p>
        </div>
      </div>
      <p className="fort-community-link">Want to join a group? <Link href="/treks">See upcoming community treks →</Link></p>

      <details className="fort-more-options">
        <summary>Change starting area or filters</summary>
        <div className="fort-browse-block">
          <div className="fort-browse-heading"><span>Starting from <strong>{origin.name}</strong></span><button type="button" className="text-button" onClick={locate}>Use my location</button></div>
          <form className="hike-search" onSubmit={e => { e.preventDefault(); lookup() }}>
            <div className="hike-field">
              <Icon name="pin" size={18} />
              <input value={text} onChange={e => { setText(e.target.value); setTyping(true) }} placeholder="Change starting town or area" autoComplete="off" aria-label="Starting town or area" role="combobox" aria-expanded={suggestions.length > 0} aria-controls="area-list" />
              {suggestions.length > 0 && <ul id="area-list" className="suggest" role="listbox">{suggestions.map(p => <li key={p.name} role="option" aria-selected="false"><button type="button" onClick={() => choose(p)}>{p.name}</button></li>)}</ul>}
            </div>
            <button className="button button-small" type="submit">Set area</button>
          </form>
          {msg && <p className="hike-msg" role="status">{msg}</p>}
        </div>
        <div className="fort-controls">
          <div className="fort-control-group"><span>Show</span><div className="chip-row small" aria-label="Type of hike">
            {([['fort', 'Forts'], ['peak', 'Peaks'], ['all', 'Both']] as const).map(([value, label]) => <button key={value} aria-pressed={kind === value} className={`chip ${kind === value ? 'on' : ''}`} onClick={() => setKind(value)}>{label}</button>)}
          </div></div>
          {!search && <div className="fort-control-group"><span>Straight-line distance</span><div className="chip-row small" aria-label="Straight-line distance from starting area">
            {radii.map(r => <button key={r} aria-pressed={radius === r} className={`chip ${radius === r ? 'on' : ''}`} onClick={() => setRadius(r)}>{r ? `${r} km` : 'Any'}</button>)}
          </div></div>}
          <label className="trailhead-toggle"><input type="checkbox" checked={knownStartOnly} onChange={e => setKnownStartOnly(e.target.checked)} /> Listed base village only</label>
        </div>
      </details>

      <div className="fort-results-heading"><div><h2>{search ? 'Search results' : view === 'featured' ? `Well-known ${kind === 'fort' ? 'forts' : 'hikes'} near ${origin.name}` : `More mapped places near ${origin.name}`}</h2><p className="hike-count" aria-live="polite">{loadError ? 'Hike data could not be loaded. Please refresh.' : hikes.length ? <>{results.length} {kind === 'fort' ? results.length === 1 ? 'fort' : 'forts' : results.length === 1 ? 'listing' : 'listings'}{search ? ` matching “${query.trim()}”` : radius ? ` within ${radius} km in a straight line` : ''}</> : 'Loading hikes…'}</p></div>
        {!search && hikes.length > 0 && <button type="button" className={`button fort-browse-button ${view === 'all' ? 'button-outline' : ''}`} onClick={() => { setView(view === 'featured' ? 'all' : 'featured'); setShown(PAGE) }}>{view === 'featured' ? `Explore all ${browseCount} nearby listings` : 'Show starting picks'} <Icon name="arrow" size={18}/></button>}
      </div>
      {(search || view === 'all') && <p className="source-note">These additional listings come from source directories. We have not checked every route or access condition.</p>}

      {hikes.length > 0 && results.length === 0 && <div className="empty-state"><Icon name="mountain" size={56} /><h2>No matching hikes found.</h2><p>{search ? 'Try another spelling, a shorter name or fewer filters.' : 'Try a wider distance or fewer filters.'}</p></div>}

      <div className="hike-list">
        {visibleResults.map(({ hike, starts, d }) => {
          const [main, ...more] = starts
          const reviewEvidence = hikeReview.featured.find(item => item.slug === hike.slug)?.evidence
          return <article className="hike-row" key={hike.slug}>
            <div className="hike-head">
              <h2>{hike.name}</h2>
              <span className="hike-dist">~{Math.round(d)} km away · straight line</span>
            </div>
            <p className="hike-meta">{[hike.kind === 'fort' ? 'Fort' : 'Peak', hike.region].filter(Boolean).join(' · ')}</p>
            {main?.verified ? <p className="hike-start">Listed base village: <strong>{main.name}</strong> · <a href={dirUrl(origin, main)} target="_blank" rel="noopener noreferrer">Directions to village ↗</a></p> : <p className="hike-start">Start point not checked · <a href={`https://www.google.com/maps/search/?api=1&query=${hike.lat},${hike.lon}`} target="_blank" rel="noopener noreferrer">View place on map ↗</a></p>}
            {(more.length > 0 || main?.note || hike.links.length > 0 || reviewEvidence) && <details>
              <summary>{more.length ? `${more.length} more starting point${more.length > 1 ? 's' : ''} & details` : 'Details'}</summary>
              <ul className="starts">{starts.map(s => <li key={s.name + s.lat}><strong>{s.name}</strong>{s.verified ? <> · listed base village · <a href={dirUrl(origin, s)} target="_blank" rel="noopener noreferrer">Directions to village ↗</a></> : <> · nearby map village, not a checked start</>}{s.note && <small>{s.note}</small>}</li>)}</ul>
              {hike.approxLocation && <small>Location is approximate (taken from the base village).</small>}
              <small>Data: {hike.sources.join(', ')}{hike.links.map(l => <span key={l.url}> · <a href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a></span>)}{reviewEvidence && !hike.links.some(l => l.url === reviewEvidence) && <> · <a href={reviewEvidence} target="_blank" rel="noopener noreferrer">Destination reference ↗</a></>}</small>
            </details>}
          </article>
        })}
      </div>
      {results.length > visibleResults.length && <button className="button button-outline show-more" onClick={() => setShown(s => s + PAGE)}>Show more ({results.length - shown} left)</button>}

      <p className="source-note">Distances are straight-line estimates to a listed base village, or to the mapped place if no base village is listed. Driving distance, walking route, current access and conditions must be checked separately. Data © OpenStreetMap contributors (ODbL), Wikidata, Trekshitiz and Maharashtra Tourism.</p>
    </section>
  </>
}

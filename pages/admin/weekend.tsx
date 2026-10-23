import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminChrome from '../../components/AdminChrome'
import { useAdminSession } from '../../lib/admin-session'
import { formatDate, formatTime, site } from '../../lib/site'
import { copyText } from '../../lib/clipboard'
import { hikeMessage, weekendHikes, weekendMessage, weekendOf, type SharePlan, type ShareTrek } from '../../lib/weekend-share'

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export default function AdminWeekend() {
  const session = useAdminSession(); const { token } = session
  const [treks, setTreks] = useState<(ShareTrek & { dateVerified: boolean })[]>([]); const [plans, setPlans] = useState<SharePlan[]>([])
  const [weeksAhead, setWeeksAhead] = useState(0); const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(''); const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    const [trekResponse, planResponse] = await Promise.all([fetch('/api/admin/treks', { headers }), fetch('/api/admin/plans', { headers })])
    const [trekResult, planResult] = await Promise.all([trekResponse.json(), planResponse.json()])
    if (trekResponse.ok) setTreks(trekResult.treks); else setMessage(trekResult.error || 'Could not load treks.')
    if (planResponse.ok) setPlans(planResult.plans); else setMessage(planResult.error || 'Could not load member plans.')
    setLoaded(true)
  }, [token])
  useEffect(() => { load() }, [load])
  const weekend = useMemo(() => weekendOf(todayIST(), weeksAhead), [weeksAhead])
  const hikes = useMemo(() => weekendHikes(site.url, treks, plans, weekend), [treks, plans, weekend])
  const text = useMemo(() => weekendMessage(site.url, hikes, weekend, site.whatsappInvite), [hikes, weekend])
  const unverified = treks.filter(trek => !trek.dateVerified && hikes.some(hike => hike.url.endsWith(`/treks/${trek.slug}`)))
  async function copy(value: string, key: string) {
    if (!await copyText(value)) { setMessage('Could not copy. Select the text and copy it by hand.'); return }
    setCopied(key); setTimeout(() => setCopied(current => current === key ? '' : current), 2500)
  }
  return <AdminChrome session={session} active="weekend" seoTitle="Admin: this weekend" title="Share this weekend’s hikes." intro="One message with every trek and approved member hike for the weekend. Copy it on Thursday or Friday and paste it into the WhatsApp groups.">
    <>
      <div className="interest-form admin-form">
        <div className="admin-heading"><div><span className="eyebrow">{weeksAhead ? 'NEXT WEEKEND' : 'THIS WEEKEND'}</span><h2>{formatDate(weekend.saturday)} – {formatDate(weekend.sunday)}</h2></div>
          <button type="button" className="text-button" onClick={() => setWeeksAhead(weeksAhead ? 0 : 1)}>{weeksAhead ? 'Back to this weekend' : 'Show next weekend'}</button></div>
        <textarea className="weekend-message" readOnly value={loaded ? text : 'Loading…'} rows={Math.min(22, text.split('\n').length + 1)} onFocus={event => event.target.select()} aria-label="Message to share"/>
        <div className="admin-actions">
          <button type="button" className="button" disabled={!loaded} onClick={() => copy(text, 'all')}>{copied === 'all' ? 'Copied ✓ Paste it in the group' : 'Copy message for WhatsApp'}</button>
          <a className="button button-outline" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Open in WhatsApp</a>
        </div>
        {unverified.length > 0 && <p className="small">Heads up: {unverified.map(trek => trek.name).join(', ')} {unverified.length === 1 ? 'has' : 'have'} an unverified date, so the public page won’t show it yet. Tick “Date has been verified” on the Treks tab first.</p>}
      </div>
      {hikes.length > 0 && <div className="interest-form admin-form"><h2>Send one hike on its own ({hikes.length})</h2>
        <ul className="admin-trek-list">{hikes.map(hike => <li key={hike.url}>
          <span><strong>{hike.title}</strong> · {formatDate(hike.date)}{hike.startTime ? `, ${formatTime(hike.startTime)}` : ''} · {hike.kind === 'trek' ? 'Pune Trekkers trek' : `Member hike by ${hike.by}`}</span>
          <button type="button" className="button button-small button-outline" onClick={() => copy(hikeMessage(hike), hike.url)}>{copied === hike.url ? 'Copied ✓' : 'Copy this hike'}</button>
        </li>)}</ul></div>}
    </>
    {message && <p className="admin-message" role="status">{message}</p>}
  </AdminChrome>
}

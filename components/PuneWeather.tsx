import { useEffect, useState } from 'react'
import Icon from './Icon'

// Live Pune temperature from Open-Meteo (free, no API key). It is city weather, not trail weather, and says so.
export default function PuneWeather() {
  const [temp, setTemp] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=18.5204&longitude=73.8567&current=temperature_2m', { signal: controller.signal })
      .then(response => response.json())
      .then(json => {
        if (!active) return
        const value = json?.current?.temperature_2m
        if (typeof value === 'number') setTemp(Math.round(value)); else setFailed(true)
      })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false; clearTimeout(timer); controller.abort() }
  }, [])
  if (failed) return null
  const band = temp === null ? null : temp < 18 ? 'Cold' : temp <= 28 ? 'Mild' : 'Hot'
  return (
    <aside className="weather" aria-label="Current city temperature in Pune. Always check the forecast for the trail itself." title="City temperature, not trail weather">
      <Icon name="sun" size={18}/>
      <strong>{temp === null ? '–' : `${temp}°C`}</strong>
      <span>Pune now{band ? ` · ${band}` : ''}</span>
    </aside>
  )
}

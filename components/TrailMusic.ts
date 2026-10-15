import { useEffect, useRef, useState } from 'react'

// Opt-in background music. Browsers block sound until the visitor interacts, so it only starts from the music
// button, or, for someone who switched it on during an earlier visit, from their first click or key press on this one.
// Volume runs through a Web Audio gain node because iOS ignores <audio>.volume. Client-side navigation keeps
// _app mounted, so the track carries on across pages.
export const TRACK = {
  src: '/audio/living-voyage.m4a', title: 'Living Voyage', artist: 'Kevin MacLeod', source: 'https://incompetech.com',
  license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  loopFrom: 0, // seconds: playback starts here and each loop jumps back here, skipping any intro
}
const VOLUME = 0.16
const KEY = 'trail-music'

type Player = { el: HTMLAudioElement; ctx: AudioContext; gain: GainNode }

export function useTrailMusic(enabled: boolean) {
  const [on, setOn] = useState(false)
  const player = useRef<Player | null>(null)
  const pauseTimer = useRef(0)
  const wanted = useRef(false)

  function ensure() {
    if (player.current) return player.current
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const el = new Audio(TRACK.src)
    if (TRACK.loopFrom > 0) {
      el.addEventListener('loadedmetadata', () => { el.currentTime = TRACK.loopFrom }, { once: true })
      el.addEventListener('ended', () => { el.currentTime = TRACK.loopFrom; el.play().catch(() => {}) })
    } else el.loop = true
    const ctx = new Ctx(), gain = ctx.createGain()
    gain.gain.value = 0
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination)
    return (player.current = { el, ctx, gain })
  }
  function fade(p: Player, to: number, seconds: number) {
    const g = p.gain.gain, t = p.ctx.currentTime
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + seconds)
  }
  function start() {
    const p = ensure()
    window.clearTimeout(pauseTimer.current)
    wanted.current = true
    setOn(true)
    p.ctx.resume().then(() => p.el.play()).then(() => fade(p, VOLUME, 2.5)).catch(() => { wanted.current = false; setOn(false) })
  }
  function stop() {
    wanted.current = false
    setOn(false)
    const p = player.current
    if (!p) return
    fade(p, 0, 0.6)
    pauseTimer.current = window.setTimeout(() => p.el.pause(), 650)
  }
  function toggle() {
    const next = !wanted.current
    if (next) start(); else stop()
    try { localStorage.setItem(KEY, next ? 'on' : 'off') } catch {}
  }

  // Returning visitors who left it on: resume on their first interaction (but not when that interaction is the music
  // button itself, which would immediately switch it back off).
  useEffect(() => {
    if (!enabled) return
    let saved = false
    try { saved = localStorage.getItem(KEY) === 'on' } catch {}
    if (!saved || wanted.current) return
    const resume = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('[data-music-toggle]')) return
      remove()
      if (!wanted.current) start()
    }
    const remove = () => { window.removeEventListener('click', resume, true); window.removeEventListener('keydown', resume, true) }
    window.addEventListener('click', resume, true)
    window.addEventListener('keydown', resume, true)
    return remove
  }, [enabled])

  // Fall silent in background tabs and on pages without the companion (admin).
  useEffect(() => {
    if (!enabled && wanted.current) stop()
    const onVisibility = () => {
      const p = player.current
      if (!p || !wanted.current) return
      if (document.hidden) p.el.pause(); else p.el.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [enabled])

  useEffect(() => () => {
    window.clearTimeout(pauseTimer.current)
    const p = player.current
    if (p) { p.el.pause(); p.ctx.close().catch(() => {}) }
  }, [])

  return { on, toggle }
}

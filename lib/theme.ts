// Light/dark colour theme. Follows the visitor's system setting until they pick one with the header toggle,
// then remembers that choice. Dark also turns the scenes to night (sky, mountain light, the trail buddy's headlamp).
import { useEffect, useState } from 'react'
import { phaseAt } from './phase'

export type Theme = 'light' | 'dark'
const KEY = 'theme'

function stored(): Theme | null {
  try { const value = localStorage.getItem(KEY); return value === 'light' || value === 'dark' ? value : null } catch { return null }
}
function system(): Theme { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }

function apply(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.dataset.phase = theme === 'dark' ? 'night' : phaseAt()
}

export function setTheme(theme: Theme) {
  try { localStorage.setItem(KEY, theme) } catch {}
  apply(theme)
}

// Current theme; re-renders when it changes from the toggle or (with no saved choice) from the system setting.
export function useTheme(): Theme {
  const [theme, set] = useState<Theme>('light')
  useEffect(() => {
    const root = document.documentElement
    const read = () => set(root.dataset.theme === 'dark' ? 'dark' : 'light')
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => { if (!stored()) apply(system()) }
    query.addEventListener('change', follow)
    return () => { observer.disconnect(); query.removeEventListener('change', follow) }
  }, [])
  return theme
}

// Runs in <head> after phaseBootScript, before first paint, so a dark visitor never sees a flash of the light theme.
export const themeBootScript = `(function(){var t;try{t=localStorage.getItem('${KEY}')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var r=document.documentElement;r.dataset.theme=t;if(t==='dark')r.dataset.phase='night'})()`

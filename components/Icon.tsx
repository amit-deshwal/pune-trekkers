import type { CSSProperties } from 'react'
export type IconName = 'mountain' | 'arrow' | 'people' | 'leaf' | 'shield' | 'pin' | 'calendar' | 'clock' | 'menu' | 'close' | 'check' | 'mail' | 'compass' | 'heart' | 'rupee' | 'sun' | 'chat'
const paths: Record<IconName, React.ReactNode> = {
  mountain: <><path d="m2 20 7-14 5 9 3-6 5 11H2Z"/><path d="m6 12 3 2 2-3M15 13l2 1 2-1"/></>,
  arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>, people:<><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/></>,
  leaf:<><path d="M20 3C8 2 2 8 5 15c4 8 16 3 15-12Z"/><path d="M3 22 15 10"/></>,
  shield:<><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></>,
  pin:<><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/></>,
  clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, menu:<path d="M4 6h16M4 12h16M4 18h16"/>,close:<path d="m6 6 12 12M6 18 18 6"/>, check:<path d="m5 12 4 4L19 6"/>, mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,
  compass:<><circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/></>, heart:<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 8 15 8 15S25 10 20 5Z"/>,rupee:<path d="M6 4h12M6 8h12M8 4c8 0 8 8-1 8l9 8"/>,sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/></>,chat:<><path d="M21 11a9 9 0 0 1-13 8l-5 2 1-5A9 9 0 1 1 21 11Z"/><path d="M8 10h8m-8 4h5"/></>,
}
export default function Icon({ name, size = 22, style }: { name: IconName; size?: number; style?: CSSProperties }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg> }

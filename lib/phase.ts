// Time-of-day for the home-page scene. Uses the visitor's own clock, so someone browsing at night sees a night mountain.
export type Phase = 'morning' | 'afternoon' | 'evening' | 'night'
export const phases: { id: Phase; label: string }[] = [
  { id: 'morning', label: 'Morning' }, { id: 'afternoon', label: 'Day' }, { id: 'evening', label: 'Dusk' }, { id: 'night', label: 'Night' },
]
export function phaseAt(date = new Date()): Phase {
  const h = date.getHours() + date.getMinutes() / 60
  return h >= 5.5 && h < 11 ? 'morning' : h >= 11 && h < 16.5 ? 'afternoon' : h >= 16.5 && h < 19.5 ? 'evening' : 'night'
}
// Runs in <head> before first paint so the sky never flashes the wrong colour.
export const phaseBootScript = `(function(){var d=new Date(),h=d.getHours()+d.getMinutes()/60;document.documentElement.dataset.phase=h>=5.5&&h<11?'morning':h>=11&&h<16.5?'afternoon':h>=16.5&&h<19.5?'evening':'night'})()`

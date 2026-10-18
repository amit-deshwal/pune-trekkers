// Community events with limited spots and a sign-up form. Treks themselves live in the site content, not here.
export type CommunityEvent = {
  slug: string; title: string; tagline: string; description: string
  date: string; startTime: string; endTime: string
  capacity: number; teamSize: number; image: string
}

export const events: CommunityEvent[] = [
  {
    slug: 'treasure-trail',
    title: 'Treasure Trail',
    tagline: 'Find the treasure with a map and a compass.',
    description: 'A free navigation treasure hunt near Pune. Teams of four learn to read a map and use a compass, then follow clues across the hills to find a hidden treasure.',
    date: '2026-10-31', startTime: '07:00', endTime: '12:30',
    capacity: 24, teamSize: 4, image: '/images/events/treasure-trail.webp',
  },
]

export const eventBySlug = (slug: string) => events.find(event => event.slug === slug)
export const eventSlugs = events.map(event => event.slug) as [string, ...string[]]
export const isEventOver = (event: CommunityEvent, today: string) => event.date < today

export const site = {
  name: 'Pune Trekkers',
  email: 'amit1.deshwal@gmail.com',
  instagram: 'https://www.instagram.com/r.punetrekkers',
  whatsappInvite: 'https://chat.whatsapp.com/Gn2Thc2HQCo4hwGhplNlj5?mode=r_c',
  upcomingTrekBoard: 'https://pune-trekkers.notion.site/pune-trekkers/Pune-Trekkers-Events-ac0739549832414a8d59a3dca62417d1',
  description: 'Free-to-join trekking community in Pune. Weekend treks near Pune at actual shared cost, with no organiser fee or markup. Beginners, women and solo trekkers welcome.',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://punetrekkers.org').replace(/\/$/, ''),
  safetyEmail: process.env.NEXT_PUBLIC_SAFETY_EMAIL || '',
  launchReady: process.env.NEXT_PUBLIC_LAUNCH_READY === 'true',
  analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  // Token from Google Search Console's HTML-tag verification method.
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
}
export const routes = ['/', '/about', '/treks', '/treks-near-pune', '/past-treks', '/safety', '/join', '/conservation', '/volunteer', '/contact', '/faq', '/privacy', '/terms']
export function formatDate(date: string) { return new Date(date + 'T12:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) }

export function formatMonth(date: string) { return new Date(date + 'T12:00:00+05:30').toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) }

/** @type {import('next').NextConfig} */
const supabaseHost = (() => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').hostname } catch { return '' } })()
module.exports = {
   allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: supabaseHost ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : [],
  },
  // punetrekkers.org is canonical: the old subdomain and www send visitors (and search rankings) there.
  async redirects() { return [...['pune-trekkers.amitdeshwal.com', 'www.punetrekkers.org'].map(host => ({ source: '/:path*', has: [{ type: 'host', value: host }], destination: 'https://punetrekkers.org/:path*', permanent: true })), { source: '/events/treasure-trail', destination: '/treks', permanent: false }, { source: '/gallery', destination: '/past-treks', permanent: true }, { source: '/past-treks/:slug', destination: '/past-treks', permanent: false }, { source: '/upcoming-treks', destination: '/treks', permanent: true }, { source: '/join-us', destination: '/join', permanent: true }, { source: '/conservation/impact-template', destination: '/conservation', permanent: false }, { source: '/find-hikes', destination: '/treks-near-pune', permanent: true }, { source: '/explore-maharashtra', destination: '/treks-near-pune', permanent: true }, { source: '/explore-maharashtra/:slug', destination: '/treks-near-pune/:slug', permanent: true }] },
  async headers() { return [{ source: '/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'DENY' }, ...(process.env.NEXT_PUBLIC_LAUNCH_READY !== 'true' ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : [])] }] },
}

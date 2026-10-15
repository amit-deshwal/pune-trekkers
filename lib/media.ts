const mediaPrefix = '/api/media/'
const mediaPath = /^trip-uploads\/[0-9a-f-]+\/[0-9a-f-]+\.(webp|avif|jpg|jpeg|png|mp4|webm)$/i
const cacheMs = 45_000
export const signedMediaLifetime = 120

export function isMediaPath(path: string) { return mediaPath.test(path) }

function publishedPaths(value: unknown, paths = new Set<string>()): Set<string> {
  if (typeof value === 'string' && value.startsWith(mediaPrefix)) {
    const path = value.slice(mediaPrefix.length)
    if (isMediaPath(path)) paths.add(path)
  } else if (Array.isArray(value)) {
    for (const item of value) publishedPaths(item, paths)
  } else if (typeof value === 'object' && value !== null) {
    for (const item of Object.values(value)) publishedPaths(item, paths)
  }
  return paths
}

// One publication read per warm server, even when a page requests many images
// concurrently. Keep the private bucket and authorize every path before signing.
export function createMediaResolver({ loadPublished, sign, now = Date.now }: {
  loadPublished: () => Promise<unknown>
  sign: (path: string, lifetime: number) => Promise<string>
  now?: () => number
}) {
  let published: { paths: Set<string>; expires: number } | undefined
  let loading: Promise<NonNullable<typeof published>> | undefined
  const signed = new Map<string, { url: string; expires: number }>()
  const signing = new Map<string, Promise<{ url: string; expires: number }>>()

  async function getPublished() {
    if (published && published.expires > now()) return published
    if (!loading) {
      const started = now()
      loading = loadPublished().then(data => {
        published = { paths: publishedPaths(data), expires: started + cacheMs }
        // Bound memory and discard URLs for media removed from publication.
        const paths = published.paths
        signed.forEach((entry, path) => {
          if (!paths.has(path) || entry.expires <= now()) signed.delete(path)
        })
        return published
      }).finally(() => { loading = undefined })
    }
    return loading
  }

  return async function resolve(path: string) {
    if (!isMediaPath(path)) return null
    const snapshot = await getPublished()
    if (!snapshot.paths.has(path)) return null
    let entry = signed.get(path)
    if (!entry || entry.expires <= now()) {
      let pending = signing.get(path)
      if (!pending) {
        const started = now()
        pending = sign(path, signedMediaLifetime).then(url => {
          const result = { url, expires: started + cacheMs }
          signed.set(path, result)
          return result
        }).finally(() => { signing.delete(path) })
        signing.set(path, pending)
      }
      entry = await pending
    }
    // A cached redirect must not outlive the publication check or URL cache.
    const maxAge = Math.max(0, Math.floor((Math.min(snapshot.expires, entry.expires) - now()) / 1000))
    return { url: entry.url, maxAge }
  }
}

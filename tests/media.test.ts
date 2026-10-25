import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMediaResolver, mediaSrc, mediaSrcSet, signedMediaLifetime } from '../lib/media.ts'

const a = 'trip-uploads/abc/def.jpg'
const b = 'trip-uploads/abc/aaa.webp'
const content = (...paths: string[]) => ({ treks: [{ photos: paths.map(path => ({ src: `/api/media/${path}` })) }] })

test('concurrent archive images share a publication read and duplicate signing', async () => {
  let reads = 0
  const signs: string[] = []
  const resolve = createMediaResolver({
    loadPublished: async () => { reads++; return content(a, b) },
    sign: async (path, lifetime) => { signs.push(path); assert.equal(lifetime, signedMediaLifetime); return `https://storage.example/${path}` },
  })
  const results = await Promise.all([resolve(a), resolve(b), resolve(a)])
  assert.equal(reads, 1)
  assert.deepEqual(signs.sort(), [a, b].sort())
  assert.deepEqual(results[0], results[2])
  await resolve(b)
  assert.equal(reads, 1)
  assert.equal(signs.length, 2)
})

test('redirect cache lifetime shrinks and removed media cannot reuse a signed URL', async () => {
  let time = 0
  let published = content(a)
  const resolve = createMediaResolver({ now: () => time, loadPublished: async () => published, sign: async () => 'https://storage.example/signed' })
  assert.equal((await resolve(a))?.maxAge, 45)
  time = 40_000
  assert.equal((await resolve(a))?.maxAge, 5)
  published = content()
  time = 45_000
  assert.equal(await resolve(a), null)
})

test('expired signed URLs are renewed along with the publication snapshot', async () => {
  let time = 0
  let signs = 0
  const resolve = createMediaResolver({ now: () => time, loadPublished: async () => content(a), sign: async () => `https://storage.example/${++signs}` })
  assert.equal((await resolve(a))?.url, 'https://storage.example/1')
  time = 45_000
  assert.equal((await resolve(a))?.url, 'https://storage.example/2')
})

test('unpublished and malformed paths are never signed', async () => {
  let reads = 0
  const resolve = createMediaResolver({
    loadPublished: async () => { reads++; return content(a) },
    sign: async () => { assert.fail('Must not sign unpublished media') },
  })
  assert.equal(await resolve('../private.jpg'), null)
  assert.equal(reads, 0)
  assert.equal(await resolve(b), null)
})

test('publication and signing failures are retried instead of cached', async () => {
  let reads = 0
  let signs = 0
  const resolve = createMediaResolver({
    loadPublished: async () => { if (++reads === 1) throw new Error('Database unavailable'); return content(a) },
    sign: async () => { if (++signs === 1) throw new Error('Storage unavailable'); return 'https://storage.example/signed' },
  })
  await assert.rejects(resolve(a), /Database unavailable/)
  await assert.rejects(resolve(a), /Storage unavailable/)
  assert.equal((await resolve(a))?.url, 'https://storage.example/signed')
  assert.equal(reads, 2)
  assert.equal(signs, 2)
})

test('uploaded photos are served from their stored resized copies', () => {
  const src = '/api/media/trip-uploads/abc-1/def-2.jpg'
  assert.equal(mediaSrc(src, 800), '/photos/abc-1/def-2-800.webp')
  assert.equal(mediaSrcSet(src)?.split(', ')[0], '/photos/abc-1/def-2-240.webp 240w')
  // Videos and bundled images are left alone.
  assert.equal(mediaSrc('/api/media/trip-uploads/abc/def.mp4', 800), '/api/media/trip-uploads/abc/def.mp4')
  assert.equal(mediaSrc('/images/brand/logo.webp', 800), '/images/brand/logo.webp')
  assert.equal(mediaSrcSet('/images/brand/logo.webp'), undefined)
})

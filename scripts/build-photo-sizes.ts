// Backs up every uploaded original to temp/photo-originals/, makes the resized copies the site serves, and with
// --shrink replaces originals over 1 MB with a 2400px JPEG (same path, so content needs no changes).
// Run: node --env-file=.env.local --experimental-strip-types scripts/build-photo-sizes.ts [--shrink]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { photoSizesBucket } from '../lib/media.ts'
import { savePhotoSizes } from '../lib/photo-sizes.ts'

const shrink = process.argv.includes('--shrink')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

const bucket = await s.storage.getBucket(photoSizesBucket)
if (bucket.error) {
  const made = await s.storage.createBucket(photoSizesBucket, { public: true, fileSizeLimit: 2097152, allowedMimeTypes: ['image/webp'] })
  if (made.error) throw made.error
  console.log('Created bucket', photoSizesBucket)
}

async function list(prefix: string): Promise<{ path: string; size: number }[]> {
  const { data, error } = await s.storage.from('trip-uploads').list(prefix, { limit: 1000 })
  if (error) throw error
  const files = []
  for (const item of data) {
    const path = prefix ? `${prefix}/${item.name}` : item.name
    files.push(...(item.id ? [{ path, size: item.metadata?.size ?? 0 }] : await list(path)))
  }
  return files
}

const files = await list('')
let before = 0, after = 0
for (const [i, { path, size }] of files.entries()) {
  const local = `temp/photo-originals/${path}`
  if (!existsSync(local)) {
    const { data, error } = await s.storage.from('trip-uploads').download(path)
    if (error) throw new Error(`${path}: ${error.message}`)
    const backup = Buffer.from(await data.arrayBuffer())
    if (backup.length !== size) throw new Error(`${path}: downloaded ${backup.length} bytes, storage has ${size}`)
    mkdirSync(dirname(local), { recursive: true })
    writeFileSync(local, backup)
  }
  const original = readFileSync(local)
  // Sizes come from the full-resolution backup, so shrinking the stored original later costs no quality.
  await savePhotoSizes(s, path, original)
  before += size
  let stored = size
  if (shrink && /\.jpe?g$/i.test(path) && size > 1_000_000 && original.length === size) {
    const small = await sharp(original, { limitInputPixels: 80_000_000 }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    if (small.length < size) {
      const { error } = await s.storage.from('trip-uploads').upload(path, small, { contentType: 'image/jpeg', upsert: true })
      if (error) throw new Error(`${path}: ${error.message}`)
      stored = small.length
    }
  }
  after += stored
  console.log(`${i + 1}/${files.length} ${path} ${(size / 1e6).toFixed(1)} MB${stored !== size ? ` -> ${(stored / 1e6).toFixed(1)} MB` : ''}`)
}
console.log(`Originals: ${(before / 1e6).toFixed(0)} MB -> ${(after / 1e6).toFixed(0)} MB`)

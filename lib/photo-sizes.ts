import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isResizable, mediaWidths, photoSizePath, photoSizesBucket } from './media.ts'

// A week, like the resized photos the media API used to serve: a photo an admin removes stops showing within a week.
const cacheControl = '604800'

// The resized WebP copies of one original, made from a single decode.
export async function resizePhoto(original: Buffer) {
  const image = sharp(original, { limitInputPixels: 80_000_000 }).rotate()
  return Promise.all(mediaWidths.map(async width => ({ width, data: await image.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer() })))
}

// Makes and stores the resized copies of an uploaded photo (a trip-uploads storage path). Other media is skipped.
export async function savePhotoSizes(service: SupabaseClient, path: string, original?: Buffer) {
  if (!isResizable(path)) return
  if (!original) {
    const { data, error } = await service.storage.from('trip-uploads').download(path)
    if (error) throw error
    original = Buffer.from(await data.arrayBuffer())
  }
  for (const { width, data } of await resizePhoto(original)) {
    const { error } = await service.storage.from(photoSizesBucket).upload(photoSizePath(path, width), data, { contentType: 'image/webp', cacheControl, upsert: true })
    if (error) throw error
  }
}

// Three at a time, so a big upload doesn't exhaust the server's memory.
export async function saveAllPhotoSizes(service: SupabaseClient, paths: string[]) {
  const queue = [...paths]
  await Promise.all(Array.from({ length: 3 }, async () => { for (let path; (path = queue.shift());) await savePhotoSizes(service, path) }))
}

export async function removePhotoSizes(service: SupabaseClient, paths: string[]) {
  const sized = paths.filter(isResizable).flatMap(path => mediaWidths.map(width => photoSizePath(path, width)))
  if (!sized.length) return
  const { error } = await service.storage.from(photoSizesBucket).remove(sized)
  if (error) throw error
}

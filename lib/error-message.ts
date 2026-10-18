import { z } from 'zod'

// Supabase/PostgREST errors are plain objects with a `message`, not Error instances, so check for that too.
export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues.map(issue => issue.message).join('; ')
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' && error.message) return error.message
  return fallback
}

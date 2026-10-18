import { useCallback, useEffect, useState } from 'react'
import { browserSupabase, supabasePublicKey, supabasePublicUrl } from './supabase'

// The admin's sign-in is saved by Supabase in the browser, so it survives moving between admin pages and reopening the tab.
// The token here is kept fresh as Supabase refreshes it, so a long editing session doesn't suddenly fail.
export function useAdminSession() {
  const configured = Boolean(supabasePublicUrl && supabasePublicKey)
  const [token, setToken] = useState('')
  const [checking, setChecking] = useState(configured)
  useEffect(() => {
    if (!configured) return
    const client = browserSupabase()
    client.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? '')).catch(() => setToken('')).finally(() => setChecking(false))
    const { data } = client.auth.onAuthStateChange((_event, session) => setToken(session?.access_token ?? ''))
    return () => data.subscription.unsubscribe()
  }, [configured])
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await browserSupabase().auth.signInWithPassword({ email, password })
    if (error || !data.session) throw error || new Error('No session returned.')
    setToken(data.session.access_token)
  }, [])
  const signOut = useCallback(async () => { await browserSupabase().auth.signOut(); setToken('') }, [])
  return { configured, token, checking, signIn, signOut }
}
export type AdminSession = ReturnType<typeof useAdminSession>

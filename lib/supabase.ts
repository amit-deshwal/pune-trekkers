import { createClient } from '@supabase/supabase-js'

export const supabasePublicUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL||''
export const supabasePublicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.SUPABASE_ANON_KEY||''
// One shared browser client, so every admin page reuses the saved sign-in (kept in localStorage) and its automatic token refresh.
let browserClient:ReturnType<typeof createClient>|undefined
export function browserSupabase(){
  if(!supabasePublicUrl||!supabasePublicKey)throw new Error('Supabase is not configured yet.')
  return browserClient??=createClient(supabasePublicUrl,supabasePublicKey)
}
export function serverSupabase(){
  const serviceRole=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!supabasePublicUrl||!serviceRole)throw new Error('Server-side Supabase is not configured yet.')
  return createClient(supabasePublicUrl,serviceRole,{auth:{autoRefreshToken:false,persistSession:false}})
}

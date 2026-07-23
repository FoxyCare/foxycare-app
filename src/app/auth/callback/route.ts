import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Lands here after any OAuth provider (Google/Facebook/Apple) redirects back
// through Supabase. Exchanges the auth code for a session, then decides
// where to send the user:
//   - terms_accepted_at already set  → returning user, straight to /dashboard
//   - terms_accepted_at still null   → first sign-in via this provider,
//     handle_new_user() (foxycare-db migration 0016) already created the
//     public.users row with role defaulted to 'parent' and no terms
//     acceptance recorded (OAuth providers don't let us attach our own
//     signup metadata the way email/password signUp() does) → send to
//     /onboarding, which shows a mandatory role + terms step whenever
//     terms_accepted_at is null.
//
// The `role` query param (attached to redirectTo only by the /register
// page — /login sends none) lets a first-time sign-in respect the
// parent/nanny choice already made on that page, without trusting it blindly:
// it's applied only if terms_accepted_at is still null (i.e. genuinely the
// first completion) and only to 'parent'/'nanny' — never 'admin', regardless
// of what a crafted URL might request.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role')

  if (!code) {
    console.error('[auth/callback] no code in redirect URL:', request.url)
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error)
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('terms_accepted_at')
    .eq('id', data.user.id)
    .single()

  if (profile?.terms_accepted_at) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  if (roleParam === 'parent' || roleParam === 'nanny') {
    await supabase
      .from('users')
      .update({ role: roleParam })
      .eq('id', data.user.id)
      .is('terms_accepted_at', null)
  }

  return NextResponse.redirect(`${origin}/onboarding`)
}

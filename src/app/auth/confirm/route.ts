import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Generic landing point for auth e-mails that carry a PKCE `?code=` but
// aren't the OAuth sign-in flow /auth/callback already handles — today
// that's just the "forgot password" recovery link (ForgotPasswordForm sets
// redirectTo to here). Exchanging the code server-side, via the server
// client's cookie-backed storage, is what @supabase/ssr's browser client
// relies on: it writes the PKCE code verifier to a cookie specifically so a
// route handler like this one can read it back and complete the exchange —
// same mechanism /auth/callback already uses for OAuth, just without any of
// that route's OAuth-specific onboarding/terms redirect logic.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  // Only ever redirect within the app — next comes from a URL query param,
  // so treat it as untrusted input rather than following it blindly.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/reset-password?error=invalid_link`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/confirm] exchangeCodeForSession failed:', error)
    return NextResponse.redirect(`${origin}/reset-password?error=invalid_link`)
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}

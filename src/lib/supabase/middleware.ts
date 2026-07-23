import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Catches a session that was already active when the admin banned the
    // account — LoginForm only blocks the ban at sign-in time, so an
    // existing session needs its own check to be kicked out promptly.
    const { data: profile } = await supabase
      .from('users')
      .select('is_banned, role, terms_accepted_at')
      .eq('id', user.id)
      .single()

    if (profile?.is_banned) {
      await supabase.auth.signOut()
      return { supabaseResponse, user: null, banned: true, needsOnboarding: false }
    }

    // OAuth sign-ins (Google/Facebook/Apple) can't carry our terms-acceptance
    // metadata through the provider redirect the way email/password signUp()
    // does — /auth/callback sends a first-time OAuth user to /onboarding to
    // collect it, but this is the real enforcement: without it, a user could
    // just navigate straight to /dashboard and skip consent entirely. Admins
    // are exempt — they're seeded directly, not through registration.
    const needsOnboarding = !!profile && profile.role !== 'admin' && !profile.terms_accepted_at
    return { supabaseResponse, user, banned: false, needsOnboarding }
  }

  return { supabaseResponse, user, banned: false, needsOnboarding: false }
}

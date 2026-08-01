import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// /auth/callback must stay public — it's what *establishes* the session
// (OAuth code exchange), so requiring a session to reach it would make it
// unreachable for exactly the case it exists for.
// /auth/confirm (password-recovery code exchange, mirrors /auth/callback's
// OAuth exchange) and /reset-password must stay public for the same reason
// /auth/callback does: they're reached before any session cookie exists,
// so gating them behind auth would redirect the one-time recovery code away
// before it's ever exchanged.
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/search',
  '/terms',
  '/privacy',
  '/auth/callback',
  '/auth/confirm',
  '/forgot-password',
  '/reset-password',
]
const AUTH_ROUTES = ['/login', '/register', '/onboarding']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user, banned, needsOnboarding } = await updateSession(request)

  // Allow public routes — nanny profile pages (/nanny/[id]) require a
  // session, so they are intentionally not in this list.
  if (PUBLIC_ROUTES.includes(pathname)) {
    // Redirect authenticated users away from auth pages
    if (user && AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // A session that was active when the admin banned the account gets
  // signed out above (see updateSession) — send it to /login with an
  // explanation instead of a bare "please sign in" redirect.
  if (banned) {
    return NextResponse.redirect(new URL('/login?banned=1', request.url))
  }

  // Protected routes – require authentication
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // First OAuth sign-in (Google/Facebook/Apple) hasn't recorded terms
  // acceptance yet — /auth/callback already sends it here, but this is the
  // actual enforcement: without it, navigating straight to e.g. /dashboard
  // would skip consent entirely. See middleware.ts for how this is derived.
  if (needsOnboarding && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

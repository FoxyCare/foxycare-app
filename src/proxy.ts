import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/search', '/terms', '/privacy']
const AUTH_ROUTES = ['/login', '/register', '/onboarding']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user, banned } = await updateSession(request)

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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

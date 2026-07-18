'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import type { Profile } from '@/types'

interface NavbarProps {
  profile?: Profile | null
}

export function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🦊</span>
          <span className="text-xl font-bold text-indigo-600">FoxyCare</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {profile ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600"
              >
                Dashboard
              </Link>
              {profile.role === 'parent' && (
                <Link
                  href="/search"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600"
                >
                  Find Nannies
                </Link>
              )}
              <Link
                href="/booking"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600"
              >
                Bookings
              </Link>
              <Link
                href="/chat"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600"
              >
                Messages
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600"
              >
                Home
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.full_name}
                  size="sm"
                />
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

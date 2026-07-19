'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo, BrandWordmark } from '@/components/brand/BrandLogo'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import type { User } from '@/types'

interface NavbarProps {
  profile?: User | null
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
    <header className="sticky top-0 z-50 bg-cream">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo className="h-9 w-9" priority />
          <BrandWordmark className="text-lg font-bold" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {profile ? profile.role === 'admin' ? (
            <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-brand-600">
              Panel Administratora
            </Link>
          ) : (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-brand-600">
                Panel
              </Link>
              {profile.role === 'parent' && (
                <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-brand-600">
                  Znajdź nianię
                </Link>
              )}
              <Link href="/chat" className="text-sm font-medium text-gray-700 hover:text-brand-600">
                Wiadomości
              </Link>
            </>
          ) : (
            <>
              <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-brand-600">
                Znajdź nianię
              </Link>
              <Link href="/register?role=nanny" className="text-sm font-medium text-gray-700 hover:text-brand-600">
                Zostań nianią
              </Link>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand-600">
                Zaloguj się
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-3">
              <Link href={profile.role === 'admin' ? '/admin' : '/profile'}>
                <Avatar name={profile.full_name} size="sm" />
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Wyloguj
              </Button>
            </div>
          ) : (
            <Link href="/register" className="hidden md:block">
              <Button size="sm" className="rounded-full">
                Zarejestruj się
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

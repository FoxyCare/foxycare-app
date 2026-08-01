'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo, BrandWordmark } from '@/components/brand/BrandLogo'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { MenuIcon, CloseIcon } from '@/components/ui/icons'
import type { User } from '@/types'

interface NavbarProps {
  profile?: User | null
}

export function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  async function handleSignOut() {
    setIsMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Same set of links renders in both the desktop <nav> and the mobile
  // dropdown — only the per-link className (and whether the mobile panel
  // closes itself afterwards) differs, so this takes that className rather
  // than hardcoding one, instead of maintaining two separate link lists.
  function renderLinks(className: string) {
    if (!profile) {
      return (
        <>
          <Link href="/search" className={className}>
            Znajdź nianię
          </Link>
          <Link href="/register?role=nanny" className={className}>
            Zostań nianią
          </Link>
          <Link href="/login" className={className}>
            Zaloguj się
          </Link>
        </>
      )
    }

    if (profile.role === 'admin') {
      return (
        <Link href="/admin" className={className}>
          Panel Administratora
        </Link>
      )
    }

    return (
      <>
        <Link href="/dashboard" className={className}>
          Panel
        </Link>
        <Link href="/search" className={className}>
          {profile.role === 'nanny' ? 'Znajdź rodzinę' : 'Znajdź nianię'}
        </Link>
        <Link href="/chat" className={className}>
          Wiadomości
        </Link>
      </>
    )
  }

  const desktopLinkClass = 'text-sm font-medium text-gray-700 hover:text-brand-600'
  const mobileLinkClass = 'block py-2 text-sm font-medium text-gray-700 hover:text-brand-600'

  return (
    <header className="sticky top-0 z-50 bg-cream">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
          <BrandLogo className="h-9 w-9" priority />
          <BrandWordmark className="text-lg font-bold" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">{renderLinks(desktopLinkClass)}</nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <div className="hidden items-center gap-3 md:flex">
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

          <button
            type="button"
            aria-label={isMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-gray-700 hover:bg-black/5 md:hidden"
          >
            {isMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          className="flex flex-col divide-y divide-black/5 border-t border-black/5 bg-cream px-4 pb-2 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          {renderLinks(mobileLinkClass)}
          {profile ? (
            <>
              <Link href={profile.role === 'admin' ? '/admin' : '/profile'} className={mobileLinkClass}>
                Mój profil
              </Link>
              <button type="button" onClick={handleSignOut} className={`${mobileLinkClass} text-left`}>
                Wyloguj
              </button>
            </>
          ) : (
            <Link href="/register" className={mobileLinkClass}>
              Zarejestruj się
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}

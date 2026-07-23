'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { GoogleIcon, FacebookIcon } from '@/components/ui/icons'
import { translateAuthError } from '@/lib/utils'
import type { UserRole } from '@/types'

type Provider = 'google' | 'facebook'

// Apple deliberately omitted for now (needs a paid Apple Developer account) —
// re-add by importing AppleIcon and adding { id: 'apple', label: 'Apple',
// Icon: AppleIcon } here; 'apple' is already a valid Supabase provider id.
const PROVIDERS: { id: Provider; label: string; Icon: typeof GoogleIcon }[] = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
]

// Shared by /login and /register. `role` is only meaningful on the register
// page (attached to the callback URL so /auth/callback can set it on the
// user's very first OAuth sign-in — see that route for why terms acceptance
// is deliberately NOT passed the same way and is instead handled as a
// mandatory onboarding step).
export function OAuthButtons({
  disabled,
  role,
  onError,
}: {
  disabled?: boolean
  role?: UserRole
  onError?: (message: string) => void
}) {
  const [pending, setPending] = useState<Provider | null>(null)

  async function handleClick(provider: Provider) {
    onError?.('')
    setPending(provider)
    try {
      const supabase = createClient()
      const redirectTo = new URL('/auth/callback', window.location.origin)
      if (role) redirectTo.searchParams.set('role', role)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectTo.toString() },
      })
      if (error) {
        onError?.(translateAuthError(error.message))
        setPending(null)
      }
      // On success the browser navigates away to the provider, so there's
      // nothing further to do here.
    } catch {
      onError?.('Nie udało się rozpocząć logowania. Spróbuj ponownie.')
      setPending(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVIDERS.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          disabled={disabled}
          isLoading={pending === id}
          onClick={() => handleClick(id)}
          aria-label={`Kontynuuj przez ${label}`}
          className="px-0"
        >
          {pending !== id && <Icon className="h-5 w-5" />}
        </Button>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { translateAuthError } from '@/lib/utils'
import { TERMS_VERSION } from '@/lib/legal/terms'
import type { UserRole } from '@/types'

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get('role') ?? 'parent') as UserRole

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(defaultRole)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!termsAccepted) {
      setError('Aby założyć konto, musisz zaakceptować regulamin serwisu.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role, terms_version: TERMS_VERSION },
        },
      })

      if (error) {
        setError(translateAuthError(error.message))
        return
      }

      router.push('/onboarding')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Utwórz konto</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Role selector */}
        <div className="mb-4 flex rounded-lg border border-gray-200 p-1">
          {(['parent', 'nanny'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                role === r
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {r === 'parent' ? '👨‍👩‍👧 Rodzic' : '🤝 Niania'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Imię i nazwisko"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Adres e-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Hasło"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Minimum 8 znaków"
          />

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Akceptuję{' '}
              <Link
                href="/terms"
                target="_blank"
                className="font-medium text-brand-600 hover:underline"
              >
                regulamin serwisu
              </Link>{' '}
              i zapoznałem/-am się z{' '}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-brand-600 hover:underline"
              >
                polityką prywatności
              </Link>
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!termsAccepted}
            className="mt-2 w-full"
          >
            Zarejestruj się
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">lub</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <OAuthButtons disabled={!termsAccepted} role={role} onError={setError} />

        <p className="mt-6 text-center text-sm text-gray-600">
          Masz już konto?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

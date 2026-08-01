'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { translateAuthError } from '@/lib/utils'

// Reached after /auth/confirm (server route) has already exchanged the
// recovery e-mail's one-time code for a session — by the time this page's
// JS runs, the session cookie is already set, so all that's left to check
// is whether one actually landed here (?error=invalid_link means the code
// exchange failed: expired, already used, or malformed).
type Status = 'checking' | 'ready' | 'invalid'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error')) {
      setStatus('invalid')
      return
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? 'ready' : 'invalid')
    })
    // Runs once on mount to check the session /auth/confirm just established.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Podane hasła nie są identyczne.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(translateAuthError(error.message))
        return
      }

      router.push('/dashboard')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'checking') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  if (status === 'invalid') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Link nieprawidłowy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-600">
            Ten link do resetowania hasła jest nieprawidłowy lub już wygasł. Poproś o nowy.
          </p>
          <p className="mt-6 text-center text-sm text-gray-600">
            <Link
              href="/forgot-password"
              className="font-medium text-brand-600 hover:underline"
            >
              Wyślij link ponownie
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Ustaw nowe hasło</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nowe hasło"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Minimum 8 znaków"
          />
          <Input
            label="Powtórz nowe hasło"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
            Zapisz nowe hasło
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { translateAuthError } from '@/lib/utils'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      // Supabase doesn't report whether the address is actually registered
      // (and we don't surface that ourselves either) — this call "succeeds"
      // the same way whether or not an account exists, so a malicious caller
      // can't use this form to enumerate registered e-mails. It also doesn't
      // distinguish password vs. OAuth-only accounts: if the address belongs
      // to a Google/Facebook-only account, following the emailed link simply
      // adds a password as an extra sign-in method for that same account.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      })

      if (error) {
        setError(translateAuthError(error.message))
        return
      }

      setIsSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sprawdź skrzynkę e-mail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-600">
            Jeśli podany adres e-mail jest powiązany z kontem w FoxyCare, wysłaliśmy na niego
            link do zresetowania hasła. Sprawdź też folder ze spamem.
          </p>
          <p className="mt-6 text-center text-sm text-gray-600">
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Wróć do logowania
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Nie pamiętasz hasła?</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-gray-600">
          Podaj adres e-mail użyty do rejestracji — wyślemy na niego link do ustawienia nowego
          hasła.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Adres e-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
            Wyślij link do resetowania hasła
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Wróć do logowania
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

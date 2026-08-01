'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Turnstile } from '@/components/auth/Turnstile'
import { translateAuthError } from '@/lib/utils'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  // Bumped after every attempt to force Turnstile to remount — tokens are
  // single-use, so a failed request needs a fresh one before retrying.
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const captchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  function resetCaptcha() {
    setCaptchaToken(null)
    setCaptchaResetKey((k) => k + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (captchaRequired && !captchaToken) {
      setError('Potwierdź, że nie jesteś robotem.')
      return
    }

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
      // (Note: Supabase's captcha check happens after that enumeration
      // check, so a captcha_failed error only ever surfaces for an address
      // that's actually registered — same non-leaking property either way.)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
        captchaToken: captchaToken ?? undefined,
      })

      if (error) {
        setError(translateAuthError(error.message))
        resetCaptcha()
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

          {captchaRequired && (
            <Turnstile key={captchaResetKey} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={captchaRequired && !captchaToken}
            className="mt-2 w-full"
          >
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

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { TERMS_VERSION } from '@/lib/legal/terms'
import type { UserRole } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('parent')
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only true for a first-time OAuth (Google/Facebook/Apple) sign-in —
  // email/password signups already recorded terms acceptance at signUp()
  // (RegisterForm), so this step never renders for them. See
  // /auth/callback and proxy.ts for how a user ends up here needing it.
  const [needsConsent, setNeedsConsent] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    location: '',
    description: '',
    experience_years: '',
  })

  const steps = [
    ...(needsConsent ? ['Rola i regulamin'] : []),
    'Podstawowe dane',
    'Lokalizacja',
    ...(role === 'nanny' ? ['Szczegóły'] : []),
  ]

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('users')
        .select('role, full_name, terms_accepted_at')
        .eq('id', user.id)
        .single()
      if (data) {
        setRole(data.role)
        setForm((f) => ({ ...f, full_name: data.full_name ?? '' }))
        setNeedsConsent(!data.terms_accepted_at)
      }
    }
    loadRole()
  }, [router])

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleFinish() {
    setError(null)
    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const userUpdate: Record<string, unknown> = { full_name: form.full_name }
      if (needsConsent) {
        userUpdate.role = role
        userUpdate.terms_accepted_at = new Date().toISOString()
        userUpdate.terms_version = TERMS_VERSION
      }

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', user.id)

      if (userError) {
        setError(userError.message)
        return
      }

      const profileBody: Record<string, unknown> = { location: form.location }
      if (role === 'nanny') {
        profileBody.description = form.description
        profileBody.experience_years = form.experience_years ? parseInt(form.experience_years, 10) : 0
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileBody),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Nie udało się zapisać profilu')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const onConsentStep = steps[step] === 'Rola i regulamin'
  const canAdvance = !onConsentStep || termsAccepted

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="mb-2 flex gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-brand-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <CardTitle>{steps[step]}</CardTitle>
        <p className="text-sm text-gray-500">
          Krok {step + 1} z {steps.length}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {onConsentStep && (
          <>
            <p className="text-sm text-gray-600">
              Dokończ zakładanie konta — wybierz rolę i zaakceptuj regulamin.
            </p>
            <div className="flex rounded-lg border border-gray-200 p-1">
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
                <Link href="/terms" target="_blank" className="font-medium text-brand-600 hover:underline">
                  regulamin serwisu
                </Link>{' '}
                i zapoznałem/-am się z{' '}
                <Link href="/privacy" target="_blank" className="font-medium text-brand-600 hover:underline">
                  polityką prywatności
                </Link>
              </span>
            </label>
          </>
        )}
        {steps[step] === 'Podstawowe dane' && (
          <Input
            label="Imię i nazwisko"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
          />
        )}
        {steps[step] === 'Lokalizacja' && (
          <Input
            label="Lokalizacja (miasto)"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        )}
        {steps[step] === 'Szczegóły' && role === 'nanny' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Opis</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Opowiedz rodzinom o sobie..."
              />
            </div>
            <Input
              label="Lata doświadczenia"
              type="number"
              min="0"
              value={form.experience_years}
              onChange={(e) => update('experience_years', e.target.value)}
            />
          </>
        )}

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              Wstecz
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} className="flex-1">
              Dalej
            </Button>
          ) : (
            <Button onClick={handleFinish} isLoading={isLoading} disabled={!canAdvance} className="flex-1">
              Zakończ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

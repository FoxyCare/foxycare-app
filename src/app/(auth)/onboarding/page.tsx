'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { UserRole } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('parent')
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    location: '',
    description: '',
    experience_years: '',
  })

  const steps = role === 'nanny' ? ['Podstawowe dane', 'Lokalizacja', 'Szczegóły'] : ['Podstawowe dane', 'Lokalizacja']

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
      const { data } = await supabase.from('users').select('role, full_name').eq('id', user.id).single()
      if (data) {
        setRole(data.role)
        setForm((f) => ({ ...f, full_name: data.full_name ?? '' }))
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

      const { error: userError } = await supabase
        .from('users')
        .update({ full_name: form.full_name })
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
        {step === 0 && (
          <Input
            label="Imię i nazwisko"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
          />
        )}
        {step === 1 && (
          <Input
            label="Lokalizacja (miasto)"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        )}
        {step === 2 && role === 'nanny' && (
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
            <Button onClick={() => setStep((s) => s + 1)} className="flex-1">
              Dalej
            </Button>
          ) : (
            <Button onClick={handleFinish} isLoading={isLoading} className="flex-1">
              Zakończ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

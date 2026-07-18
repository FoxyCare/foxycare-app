'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const steps = ['Basic Info', 'Location', 'Details']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    hourly_rate: '',
    experience_years: '',
  })

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

      const { error } = await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        location: form.location,
        bio: form.bio,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        experience_years: form.experience_years
          ? parseInt(form.experience_years)
          : null,
        role: user.user_metadata?.role ?? 'parent',
        updated_at: new Date().toISOString(),
      })

      if (error) {
        setError(error.message)
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
                i <= step ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <CardTitle>{steps[step]}</CardTitle>
        <p className="text-sm text-gray-500">
          Step {step + 1} of {steps.length}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {step === 0 && (
          <>
            <Input
              label="Full name"
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
            />
            <Input
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </>
        )}
        {step === 1 && (
          <Input
            label="Location (city, state)"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        )}
        {step === 2 && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={4}
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Tell families about yourself..."
              />
            </div>
            <Input
              label="Hourly rate ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.hourly_rate}
              onChange={(e) => update('hourly_rate', e.target.value)}
            />
            <Input
              label="Years of experience"
              type="number"
              min="0"
              value={form.experience_years}
              onChange={(e) => update('experience_years', e.target.value)}
            />
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="flex-1">
              Next
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              isLoading={isLoading}
              className="flex-1"
            >
              Complete Setup
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { NannyPhoto } from '@/components/NannyPhoto'
import { JOB_TYPE_LABEL, AGE_RANGE_LABEL } from '@/lib/labels'
import { uploadAvatar } from '@/lib/upload/uploadAvatar'
import { ImageCompressionError } from '@/lib/upload/compressImage'
import { TERMS_VERSION } from '@/lib/legal/terms'
import { isValidPhone } from '@/lib/phone'
import type { UserRole, NannyProfile } from '@/types'

const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPE_LABEL).map(([value, label]) => ({ value, label }))
const AGE_RANGE_OPTIONS = Object.entries(AGE_RANGE_LABEL).map(([value, label]) => ({ value, label }))

export default function OnboardingPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('parent')
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Only true for a first-time OAuth (Google/Facebook/Apple) sign-in —
  // email/password signups already recorded terms acceptance at signUp()
  // (RegisterForm), so this step never renders for them. See
  // /auth/callback and proxy.ts for how a user ends up here needing it.
  const [needsConsent, setNeedsConsent] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    avatar_url: '',
    location: '',
    title: '',
    price: '',
    job_type: [] as string[],
    children_age_range: [] as string[],
    description: '',
    experience_years: '',
    phone: '',
    // Nudge new users toward sharing by default — they can still opt out
    // by unchecking the box, which is why validation below only requires
    // a valid phone when this stays true.
    phone_visible: true,
  })

  // Both roles now build a full listing (foxycare-db migration 0032 gave
  // parent_profiles the same title/job_type/children_age_range/description
  // shape as nanny_profiles, minus experience_years/price) — so every step
  // below renders for both roles now; only individual fields within a step
  // (price, experience_years) stay nanny-only.
  const steps = [
    ...(needsConsent ? ['Rola i regulamin'] : []),
    'Zdjęcie i dane',
    'Lokalizacja',
    'Tytuł ogłoszenia',
    'Typ pracy',
    'O sobie',
    'Zasady konta',
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

  function update(field: keyof typeof form, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setAvatarError(null)
    setIsUploadingAvatar(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const avatarUrl = await uploadAvatar(supabase, user.id, file)
      update('avatar_url', avatarUrl)
    } catch (err) {
      setAvatarError(
        err instanceof ImageCompressionError ? err.message : 'Nie udało się przesłać zdjęcia.'
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function handleFinish() {
    setError(null)

    // Belt-and-suspenders: canAdvance already keeps the "Dalej" button on the
    // photo step disabled until this holds, so this should be unreachable —
    // but handleFinish shouldn't trust UI gating alone to avoid saving a
    // phone_visible=true row with no usable phone behind it.
    if (!phoneValid) {
      setError('Podaj poprawny numer telefonu, aby go udostępnić, lub odznacz zgodę.')
      return
    }

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

      const profileBody: Record<string, unknown> = {
        location: form.location,
        avatar_url: form.avatar_url || undefined,
        title: form.title || undefined,
        job_type: form.job_type as NannyProfile['job_type'],
        children_age_range: form.children_age_range as NannyProfile['children_age_range'],
        description: form.description,
      }
      if (role === 'nanny') {
        profileBody.price = form.price ? parseFloat(form.price) : undefined
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

      const phoneRes = await fetch('/api/profile/phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone || null, phone_visible: form.phone_visible }),
      })
      if (!phoneRes.ok) {
        const body = await phoneRes.json()
        setError(body.error ?? 'Nie udało się zapisać numeru telefonu')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const onConsentStep = steps[step] === 'Rola i regulamin'
  const onPhotoStep = steps[step] === 'Zdjęcie i dane'
  const phoneValid = !form.phone_visible || isValidPhone(form.phone)
  const canAdvance = (!onConsentStep || termsAccepted) && (!onPhotoStep || phoneValid)

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
        {steps[step] === 'Zdjęcie i dane' && (
          <>
            <div className="flex flex-col items-center gap-3">
              <NannyPhoto
                src={form.avatar_url}
                name={form.full_name || '?'}
                className="h-32 w-32 rounded-2xl"
                initialsClassName="text-3xl"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                Dodaj zdjęcie
              </Button>
              {avatarError && <p className="text-center text-xs text-red-600">{avatarError}</p>}
            </div>
            <Input
              label="Imię i nazwisko"
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
            />
            <Input
              label="Numer telefonu"
              type="tel"
              placeholder="np. 600 123 456"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.phone_visible}
                onChange={(e) => setForm((f) => ({ ...f, phone_visible: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                Udostępnij numer telefonu — inni użytkownicy będą mogli go zobaczyć na Twoim
                profilu po kliknięciu &quot;Pokaż numer telefonu&quot; (domyślnie ukryty, wymaga
                zalogowania). Możesz to zmienić później w Mój profil.
              </span>
            </label>
            {!phoneValid && (
              <p className="text-xs text-red-600">
                {form.phone
                  ? 'Nieprawidłowy numer telefonu (np. 600 123 456).'
                  : 'Podaj numer telefonu, aby go udostępnić, lub odznacz zgodę powyżej.'}
              </p>
            )}
          </>
        )}
        {steps[step] === 'Lokalizacja' && (
          <CityAutocomplete
            label="Lokalizacja (miasto)"
            value={form.location}
            onChange={(value) => update('location', value)}
          />
        )}
        {steps[step] === 'Tytuł ogłoszenia' && (
          <>
            <Input
              label="Tytuł ogłoszenia"
              placeholder={
                role === 'nanny'
                  ? 'np. Doświadczona niania – Warszawa Mokotów'
                  : 'np. Szukamy niani – Warszawa Mokotów'
              }
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              helperText="Wymagany, żeby później opublikować profil"
            />
            {role === 'nanny' && (
              <Input
                label="Stawka za godzinę (zł, opcjonalnie)"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
              />
            )}
          </>
        )}
        {steps[step] === 'Typ pracy' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <CheckboxGroup
              label="Typ pracy"
              options={JOB_TYPE_OPTIONS}
              value={form.job_type}
              onChange={(value) => update('job_type', value)}
            />
            <CheckboxGroup
              label="Wiek dzieci"
              options={AGE_RANGE_OPTIONS}
              value={form.children_age_range}
              onChange={(value) => update('children_age_range', value)}
            />
          </div>
        )}
        {steps[step] === 'O sobie' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Opis</label>
              {role !== 'nanny' && (
                <p className="text-xs text-gray-500">
                  Opisz swoją rodzinę, dziecko i jakiej opieki szukasz. To ułatwi Ci znaleźć
                  odpowiednią opiekę dla Twojego dziecka.
                </p>
              )}
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder={role === 'nanny' ? 'Opowiedz rodzinom o sobie...' : 'Opowiedz nianiom o swojej rodzinie...'}
              />
            </div>
            {role === 'nanny' && (
              <Input
                label="Lata doświadczenia"
                type="number"
                min="0"
                value={form.experience_years}
                onChange={(e) => update('experience_years', e.target.value)}
              />
            )}
          </>
        )}

        {steps[step] === 'Zasady konta' && (
          <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-900">
            <p className="font-medium">🔒 Twoje konto jest domyślnie niepubliczne</p>
            <p className="mt-2">
              {role === 'nanny'
                ? 'Możesz od razu przeglądać profile rodziców w wyszukiwarce — ale rodzice nie zobaczą Twojego profilu, dopóki go nie opublikujesz.'
                : 'Możesz od razu przeglądać profile niań w wyszukiwarce — ale nianie nie zobaczą Twojego profilu, dopóki go nie opublikujesz.'}
            </p>
            <p className="mt-2">
              Jeśli chcesz, żeby inni użytkownicy Cię znaleźli, przejdź w dowolnym momencie do{' '}
              <span className="font-medium">Mój profil</span> i kliknij{' '}
              <span className="font-medium">&quot;Opublikuj profil&quot;</span>.
            </p>
          </div>
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

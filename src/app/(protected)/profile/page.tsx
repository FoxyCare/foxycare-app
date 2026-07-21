'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NannyPhoto } from '@/components/NannyPhoto'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { JOB_TYPE_LABEL, AGE_RANGE_LABEL } from '@/lib/labels'
import { uploadAvatar } from '@/lib/upload/uploadAvatar'
import { ImageCompressionError } from '@/lib/upload/compressImage'
import type { NannyProfile, ParentProfile, User } from '@/types'

const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPE_LABEL).map(([value, label]) => ({ value, label }))
const AGE_RANGE_OPTIONS = Object.entries(AGE_RANGE_LABEL).map(([value, label]) => ({ value, label }))

type RoleProfile = Partial<NannyProfile & ParentProfile>

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<Partial<User>>({})
  const [roleProfile, setRoleProfile] = useState<RoleProfile>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isNanny = user.role === 'nanny'

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single<User>()

      if (userRow?.role === 'admin') {
        router.push('/admin')
        return
      }

      if (userRow) {
        setUser(userRow)

        const { data: profileRow } = await supabase
          .from(userRow.role === 'nanny' ? 'nanny_profiles' : 'parent_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle<RoleProfile>()

        if (profileRow) setRoleProfile(profileRow)
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSaving(true)

    try {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      const { error: userError } = await supabase
        .from('users')
        .update({ full_name: user.full_name })
        .eq('id', authUser.id)

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleProfile),
      })
      const body = await res.json()

      if (userError) {
        setError(userError.message)
      } else if (!res.ok) {
        setError(body.error ?? 'Nie udało się zapisać profilu')
      } else {
        setSuccess(true)
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
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
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      const avatarUrl = await uploadAvatar(supabase, authUser.id, file)

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roleProfile, avatar_url: avatarUrl }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Nie udało się zapisać zdjęcia')

      setRoleProfile((p) => ({ ...p, avatar_url: avatarUrl }))
    } catch (err) {
      setAvatarError(
        err instanceof ImageCompressionError ? err.message : 'Nie udało się przesłać zdjęcia.'
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function handleTogglePublish() {
    const publishing = !roleProfile.is_published

    if (publishing && !roleProfile.title?.trim()) {
      setPublishError('Aby opublikować profil, uzupełnij tytuł ogłoszenia poniżej.')
      return
    }

    setPublishError(null)
    setIsPublishing(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roleProfile,
          is_published: publishing,
          published_at: publishing ? new Date().toISOString() : roleProfile.published_at,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setPublishError(body.error ?? 'Nie udało się zmienić statusu publikacji')
        return
      }
      setRoleProfile((p) => ({ ...p, is_published: publishing, published_at: body.published_at }))
      router.refresh()
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mój profil</h1>
        <p className="text-gray-500">Zarządzaj swoimi danymi</p>
      </div>

      <div className="grid max-w-4xl gap-6 sm:grid-cols-[240px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            <NannyPhoto
              src={roleProfile.avatar_url}
              name={user.full_name ?? '?'}
              className="h-40 w-40 rounded-2xl"
              initialsClassName="text-4xl"
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
              Zmień zdjęcie
            </Button>
            {avatarError && (
              <p className="text-center text-xs text-red-600">{avatarError}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dane osobowe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Imię i nazwisko"
                value={user.full_name ?? ''}
                onChange={(e) => setUser((u) => ({ ...u, full_name: e.target.value }))}
              />
              <Input
                label="Lokalizacja"
                value={roleProfile.location ?? ''}
                onChange={(e) => setRoleProfile((p) => ({ ...p, location: e.target.value }))}
              />

              {isNanny && (
                <>
                  <Input
                    label="Tytuł ogłoszenia"
                    placeholder="np. Doświadczona niania – Warszawa Mokotów"
                    value={roleProfile.title ?? ''}
                    onChange={(e) => setRoleProfile((p) => ({ ...p, title: e.target.value }))}
                    helperText="Wymagany do publikacji profilu"
                  />
                  <Input
                    label="Doświadczenie (lata)"
                    type="number"
                    min="0"
                    value={roleProfile.experience_years ?? ''}
                    onChange={(e) =>
                      setRoleProfile((p) => ({
                        ...p,
                        experience_years: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      }))
                    }
                  />
                  <Input
                    label="Stawka za godzinę (zł, opcjonalnie)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={roleProfile.price ?? ''}
                    onChange={(e) =>
                      setRoleProfile((p) => ({
                        ...p,
                        price: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <CheckboxGroup
                      label="Typ pracy"
                      options={JOB_TYPE_OPTIONS}
                      value={roleProfile.job_type ?? []}
                      onChange={(value) =>
                        setRoleProfile((p) => ({
                          ...p,
                          job_type: value as NannyProfile['job_type'],
                        }))
                      }
                    />
                    <CheckboxGroup
                      label="Wiek dzieci"
                      options={AGE_RANGE_OPTIONS}
                      value={roleProfile.children_age_range ?? []}
                      onChange={(value) =>
                        setRoleProfile((p) => ({
                          ...p,
                          children_age_range: value as NannyProfile['children_age_range'],
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Opis</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      rows={4}
                      value={roleProfile.description ?? ''}
                      onChange={(e) => setRoleProfile((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Opowiedz o sobie..."
                    />
                  </div>
                </>
              )}

              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              {success && (
                <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">Zapisano zmiany!</p>
              )}

              <Button type="submit" isLoading={isSaving}>
                Zapisz zmiany
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {isNanny && (
        <Card>
          <CardHeader>
            <CardTitle>Publikacja profilu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-sm text-gray-700">
              Status:
              <Badge variant={roleProfile.is_published ? 'success' : 'default'}>
                {roleProfile.is_published ? 'Opublikowany' : 'Nieopublikowany'}
              </Badge>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {roleProfile.is_published
                ? 'Twój profil jest widoczny dla rodziców w wyszukiwarce. Możesz go w każdej chwili ukryć.'
                : 'Twój profil nie jest jeszcze widoczny dla rodziców — opublikuj go, żeby pojawił się w wyszukiwarce.'}
            </p>
            {publishError && (
              <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">{publishError}</p>
            )}
            <Button
              type="button"
              variant={roleProfile.is_published ? 'outline' : 'primary'}
              className="mt-4"
              isLoading={isPublishing}
              onClick={handleTogglePublish}
            >
              {roleProfile.is_published ? 'Cofnij publikację' : 'Opublikuj profil'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

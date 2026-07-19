'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { Ad, NannyProfile, ParentProfile, User } from '@/types'

type RoleProfile = Partial<NannyProfile & ParentProfile>

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<Partial<User>>({})
  const [roleProfile, setRoleProfile] = useState<RoleProfile>({})
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isNanny = user.role === 'nanny'

  const loadAds = useCallback(async (nannyId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('ads')
      .select('*')
      .eq('nanny_id', nannyId)
      .order('created_at', { ascending: false })
      .returns<Ad[]>()
    setAds(data ?? [])
  }, [])

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

      if (userRow) {
        setUser(userRow)

        const { data: profileRow } = await supabase
          .from(userRow.role === 'nanny' ? 'nanny_profiles' : 'parent_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle<RoleProfile>()

        if (profileRow) setRoleProfile(profileRow)
        if (userRow.role === 'nanny') await loadAds(authUser.id)
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [router, loadAds])

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

  async function handleDeleteAd(id: string) {
    await fetch(`/api/ads/${id}`, { method: 'DELETE' })
    setAds((prev) => prev.filter((ad) => ad.id !== id))
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

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar src={roleProfile.avatar_url} name={user.full_name} size="xl" />
            <p className="text-sm text-gray-500 text-center">Wgrywanie zdjęcia wkrótce</p>
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
            <CardTitle>Twoje ogłoszenia</CardTitle>
          </CardHeader>
          <CardContent>
            <NewAdForm
              onCreated={(ad) => setAds((prev) => [ad, ...prev])}
            />
            {ads.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Nie masz jeszcze żadnych ogłoszeń.</p>
            ) : (
              <div className="mt-4 divide-y divide-gray-100">
                {ads.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ad.title}</p>
                      <p className="text-xs text-gray-500">{ad.location}</p>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteAd(ad.id)}>
                      Usuń
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function NewAdForm({ onCreated }: { onCreated: (ad: Ad) => void }) {
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIsSaving(true)
    setError(null)

    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const body = await res.json()

    if (res.ok) {
      onCreated(body)
      setTitle('')
    } else {
      setError(body.error ?? 'Nie udało się dodać ogłoszenia')
    }
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Tytuł nowego ogłoszenia"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" isLoading={isSaving}>
        Dodaj
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useProfile } from '@/hooks/useProfile'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { Ad, AdFilters } from '@/types'

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: 'Stała',
  part_time: 'Dorywcza',
}

const AGE_RANGE_LABEL: Record<string, string> = {
  '0_3': '0-3 lata',
  '3_6': '3-6 lat',
  '6_plus': '6+ lat',
}

export default function SearchPage() {
  const router = useRouter()
  const { user: authUser } = useUser()
  const { user: profileUser } = useProfile(authUser?.id)
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<AdFilters>({})

  const messageNanny = useCallback(
    async (nannyId: string) => {
      if (!authUser) {
        router.push('/login?redirectTo=/search')
        return
      }
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ other_user_id: nannyId }),
      })
      const conversation = await res.json()
      if (res.ok) router.push(`/chat?conversation=${conversation.id}`)
    },
    [authUser, router]
  )

  const fetchAds = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('ads')
      .select('*, images:ad_images(*), nanny:users!nanny_id(id, full_name)')
      .order('created_at', { ascending: false })

    const location = filters.location?.trim()
    if (location) query = query.ilike('location', `%${location}%`)
    if (filters.job_type) query = query.eq('job_type', filters.job_type)
    if (filters.children_age_range) query = query.eq('children_age_range', filters.children_age_range)
    if (filters.min_experience !== undefined) query = query.gte('experience_years', filters.min_experience)
    if (filters.max_experience !== undefined) query = query.lte('experience_years', filters.max_experience)

    const { data } = await query.limit(20).returns<Ad[]>()
    setAds(data ?? [])
    setIsLoading(false)
  }, [filters])

  // Only fetch on mount and on explicit "Szukaj" clicks (see Button below) —
  // not on every filter keystroke, to avoid firing a request per character.
  useEffect(() => {
    fetchAds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar profile={profileUser} />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Znajdź nianię</h1>
            <p className="text-gray-500">Przeglądaj i filtruj ogłoszenia niań</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <Input
                  label="Lokalizacja"
                  placeholder="Miasto"
                  value={filters.location ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                />
                <Input
                  label="Min. doświadczenie (lata)"
                  type="number"
                  min="0"
                  value={filters.min_experience ?? ''}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      min_experience: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))
                  }
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Wiek dzieci</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={filters.children_age_range ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        children_age_range: (e.target.value || undefined) as AdFilters['children_age_range'],
                      }))
                    }
                  >
                    <option value="">Dowolny</option>
                    <option value="0_3">0-3 lata</option>
                    <option value="3_6">3-6 lat</option>
                    <option value="6_plus">6+ lat</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Typ pracy</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={filters.job_type ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        job_type: (e.target.value || undefined) as AdFilters['job_type'],
                      }))
                    }
                  >
                    <option value="">Dowolny</option>
                    <option value="full_time">Stała</option>
                    <option value="part_time">Dorywcza</option>
                  </select>
                </div>
              </div>
              <Button onClick={fetchAds} className="mt-4" isLoading={isLoading}>
                Szukaj
              </Button>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-40 pt-6" />
                </Card>
              ))}
            </div>
          ) : ads.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Brak ogłoszeń spełniających kryteria.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ads.map((ad) => (
                <Card key={ad.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Avatar name={ad.nanny?.full_name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{ad.title}</p>
                        {ad.location && (
                          <p className="text-sm text-gray-500 truncate">📍 {ad.location}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ad.price != null && (
                            <Badge variant="info">{formatCurrency(ad.price)}/godz.</Badge>
                          )}
                          <Badge>{ad.experience_years} lat doświadczenia</Badge>
                          {ad.job_type && <Badge>{JOB_TYPE_LABEL[ad.job_type]}</Badge>}
                          {ad.children_age_range && (
                            <Badge>{AGE_RANGE_LABEL[ad.children_age_range]}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {ad.description && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{ad.description}</p>
                    )}
                    <div className="mt-4">
                      <Button size="sm" className="w-full" onClick={() => messageNanny(ad.nanny_id)}>
                        Napisz wiadomość
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

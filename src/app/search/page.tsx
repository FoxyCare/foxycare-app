'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useProfile } from '@/hooks/useProfile'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MessageUserButton } from '@/components/MessageUserButton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { formatCurrency } from '@/lib/utils'
import { JOB_TYPE_LABEL, AGE_RANGE_LABEL } from '@/lib/labels'
import type { AdFilters, NannyPublicProfile, ParentPublicProfile } from '@/types'

const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPE_LABEL).map(([value, label]) => ({ value, label }))
const AGE_RANGE_OPTIONS = Object.entries(AGE_RANGE_LABEL).map(([value, label]) => ({ value, label }))

type Listing = NannyPublicProfile | ParentPublicProfile

// A nanny viewer searches parent_public_profiles (foxycare-db migration
// 0032); everyone else (parents, and anon — who has no profileUser at all)
// keeps the original nanny search, matching /search's existing "public,
// browsable without an account" promise, which only ever applied to the
// nanny direction (parent_public_profiles isn't anon-readable by design).
export default function SearchPage() {
  const { user: authUser } = useUser()
  const { user: profileUser } = useProfile(authUser?.id)
  const searchingParents = profileUser?.role === 'nanny'

  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<AdFilters>({ min_experience: 0 })

  const fetchListings = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    let query = supabase
      .from(searchingParents ? 'parent_public_profiles' : 'nanny_public_profiles')
      .select('*')
      .order('published_at', { ascending: false })

    const location = filters.location?.trim()
    if (location) query = query.ilike('location', `%${location}%`)
    if (filters.job_type?.length) query = query.overlaps('job_type', filters.job_type)
    if (filters.children_age_range?.length)
      query = query.overlaps('children_age_range', filters.children_age_range)
    if (!searchingParents) {
      if (filters.min_experience !== undefined) query = query.gte('experience_years', filters.min_experience)
      if (filters.max_experience !== undefined) query = query.lte('experience_years', filters.max_experience)
    }

    const { data } = await query.limit(20).returns<Listing[]>()
    setListings(data ?? [])
    setIsLoading(false)
  }, [filters, searchingParents])

  // Fetch on mount, on explicit "Szukaj" clicks, and once more when
  // searchingParents resolves from its initial `false` (profileUser hasn't
  // loaded yet) to `true` for a nanny viewer — not on every filter
  // keystroke, to avoid firing a request per character.
  useEffect(() => {
    fetchListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchingParents])

  const heading = searchingParents ? 'Znajdź rodzinę' : 'Znajdź nianię'
  const subheading = searchingParents
    ? 'Przeglądaj i filtruj ogłoszenia rodzin szukających opieki'
    : 'Przeglądaj i filtruj ogłoszenia niań'
  const detailPath = searchingParents ? '/parent' : '/nanny'
  const emptyMessage = searchingParents
    ? 'Brak ogłoszeń rodzin spełniających kryteria.'
    : 'Brak ogłoszeń spełniających kryteria.'

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar profile={profileUser} />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
            <p className="text-gray-500">{subheading}</p>
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
                {!searchingParents && (
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
                )}
                <CheckboxGroup
                  label="Wiek dzieci"
                  options={AGE_RANGE_OPTIONS}
                  value={filters.children_age_range ?? []}
                  onChange={(value) =>
                    setFilters((f) => ({
                      ...f,
                      children_age_range: value as AdFilters['children_age_range'],
                    }))
                  }
                />
                <CheckboxGroup
                  label="Typ pracy"
                  options={JOB_TYPE_OPTIONS}
                  value={filters.job_type ?? []}
                  onChange={(value) =>
                    setFilters((f) => ({ ...f, job_type: value as AdFilters['job_type'] }))
                  }
                />
              </div>
              <Button onClick={fetchListings} className="mt-4" isLoading={isLoading}>
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
          ) : listings.length === 0 ? (
            <p className="text-center text-gray-500 py-12">{emptyMessage}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => {
                const price = 'price' in listing ? listing.price : undefined
                const experienceYears = 'experience_years' in listing ? listing.experience_years : undefined
                return (
                  <Card key={listing.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <Link
                        href={`${detailPath}/${listing.id}`}
                        className="flex items-start gap-3 hover:opacity-80"
                      >
                        <Avatar src={listing.avatar_url} name={listing.full_name} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {listing.title ?? listing.full_name}
                          </p>
                          {listing.location && (
                            <p className="text-sm text-gray-500 truncate">📍 {listing.location}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {price != null && <Badge variant="info">{formatCurrency(price)}/godz.</Badge>}
                            {experienceYears != null && (
                              <Badge>{experienceYears} lat doświadczenia</Badge>
                            )}
                            {listing.job_type?.map((jt) => <Badge key={jt}>{JOB_TYPE_LABEL[jt]}</Badge>)}
                            {listing.children_age_range?.map((range) => (
                              <Badge key={range}>{AGE_RANGE_LABEL[range]}</Badge>
                            ))}
                          </div>
                        </div>
                      </Link>
                      {listing.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{listing.description}</p>
                      )}
                      <div className="mt-4">
                        <MessageUserButton userId={listing.id} size="sm" className="w-full" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

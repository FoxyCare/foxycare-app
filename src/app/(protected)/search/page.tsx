'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { NannyProfile, SearchFilters } from '@/types'

export default function SearchPage() {
  const [nannies, setNannies] = useState<NannyProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    min_rate: undefined,
    max_rate: undefined,
  })

  const fetchNannies = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'nanny')
      .order('created_at', { ascending: false })

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (filters.min_rate !== undefined) {
      query = query.gte('hourly_rate', filters.min_rate)
    }
    if (filters.max_rate !== undefined) {
      query = query.lte('hourly_rate', filters.max_rate)
    }

    const { data } = await query.limit(20)
    setNannies((data as NannyProfile[]) ?? [])
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    fetchNannies()
  }, [fetchNannies])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a Nanny</h1>
        <p className="text-gray-500">Browse verified nannies in your area</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Location"
              placeholder="City or state"
              value={filters.location ?? ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, location: e.target.value }))
              }
            />
            <Input
              label="Min rate ($/hr)"
              type="number"
              min="0"
              value={filters.min_rate ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  min_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
            />
            <Input
              label="Max rate ($/hr)"
              type="number"
              min="0"
              value={filters.max_rate ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  max_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <Button onClick={fetchNannies} className="mt-4" isLoading={isLoading}>
            Search
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40 pt-6" />
            </Card>
          ))}
        </div>
      ) : nannies.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No nannies found matching your criteria.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nannies.map((nanny) => (
            <Card key={nanny.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={nanny.avatar_url}
                    name={nanny.full_name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {nanny.full_name}
                    </p>
                    {nanny.location && (
                      <p className="text-sm text-gray-500 truncate">
                        📍 {nanny.location}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {nanny.hourly_rate && (
                        <Badge variant="info">
                          {formatCurrency(nanny.hourly_rate)}/hr
                        </Badge>
                      )}
                      {nanny.experience_years && (
                        <Badge>{nanny.experience_years}y exp</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {nanny.bio && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {nanny.bio}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1">
                    Book Now
                  </Button>
                  <Button variant="outline" size="sm">
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

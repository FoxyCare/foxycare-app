'use client'

import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { JOB_TYPE_LABEL, AGE_RANGE_LABEL } from '@/lib/labels'
import type { AdminUserFilters, AdminUserRow, ChildrenAgeRange, JobType } from '@/types'

export function AdminUserList({ role }: { role: 'nanny' | 'parent' }) {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<AdminUserFilters>({})

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({ role })

    const name = filters.name?.trim()
    if (name) params.set('name', name)

    const location = filters.location?.trim()
    if (location) params.set('location', location)

    if (role === 'nanny') {
      if (filters.job_type) params.set('job_type', filters.job_type)
      if (filters.children_age_range) params.set('children_age_range', filters.children_age_range)
      if (filters.min_experience !== undefined) {
        params.set('min_experience', String(filters.min_experience))
      }
    }

    const res = await fetch(`/api/admin/users?${params.toString()}`)
    const data = await res.json()
    setUsers(res.ok ? data : [])
    setIsLoading(false)
  }, [role, filters])

  // Only fetch on mount and explicit "Szukaj" clicks — not on every keystroke.
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleBan(user: AdminUserRow) {
    if (!user.is_banned && !window.confirm(`Zbanować użytkownika ${user.full_name}? Nie będzie mógł się zalogować.`)) {
      return
    }
    setPendingId(user.id)
    const action = user.is_banned ? 'unban' : 'ban'
    const res = await fetch(`/api/admin/users/${user.id}/${action}`, { method: 'POST' })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_banned: !u.is_banned } : u))
      )
    } else {
      const body = await res.json()
      alert(body.error ?? 'Nie udało się wykonać akcji')
    }
    setPendingId(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Imię i nazwisko"
              placeholder="Szukaj po nazwie"
              value={filters.name ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Lokalizacja"
              placeholder="Miasto"
              value={filters.location ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
            />
            {role === 'nanny' && (
              <>
                <Input
                  label="Min. doświadczenie (lata)"
                  type="number"
                  min="0"
                  value={filters.min_experience ?? 0}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      min_experience: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))
                  }
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Typ pracy</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={filters.job_type ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, job_type: (e.target.value || undefined) as JobType }))
                    }
                  >
                    <option value="">Dowolny</option>
                    {Object.entries(JOB_TYPE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Wiek dzieci</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={filters.children_age_range ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        children_age_range: (e.target.value || undefined) as ChildrenAgeRange,
                      }))
                    }
                  >
                    <option value="">Dowolny</option>
                    {Object.entries(AGE_RANGE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <Button onClick={fetchUsers} className="mt-4" isLoading={isLoading}>
            Szukaj
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Ładowanie…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500">Brak wyników.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={user.profile?.avatar_url} name={user.full_name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {user.full_name}
                        {user.is_banned && (
                          <Badge variant="danger" className="ml-2">
                            Zbanowany
                          </Badge>
                        )}
                      </p>
                      <p className="truncate text-sm text-gray-500">{user.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user.profile?.location && <Badge>{user.profile.location}</Badge>}
                        {role === 'nanny' && user.profile?.experience_years !== undefined && (
                          <Badge>{user.profile.experience_years} lat doświadczenia</Badge>
                        )}
                        {role === 'nanny' && user.profile?.job_type && (
                          <Badge>{JOB_TYPE_LABEL[user.profile.job_type]}</Badge>
                        )}
                        {role === 'nanny' && user.profile?.children_age_range && (
                          <Badge>{AGE_RANGE_LABEL[user.profile.children_age_range]}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={user.is_banned ? 'outline' : 'danger'}
                    size="sm"
                    isLoading={pendingId === user.id}
                    onClick={() => toggleBan(user)}
                  >
                    {user.is_banned ? 'Odbanuj' : 'Zbanuj'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

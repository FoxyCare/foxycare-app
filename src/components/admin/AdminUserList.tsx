'use client'

import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { JOB_TYPE_LABEL, AGE_RANGE_LABEL } from '@/lib/labels'
import type { AdminUserFilters, AdminUserRow, ChildrenAgeRange, JobType } from '@/types'

const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPE_LABEL).map(([value, label]) => ({ value, label }))
const AGE_RANGE_OPTIONS = Object.entries(AGE_RANGE_LABEL).map(([value, label]) => ({ value, label }))

export function AdminUserList({ role }: { role: 'nanny' | 'parent' }) {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pendingPublishId, setPendingPublishId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [filters, setFilters] = useState<AdminUserFilters>({})

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({ role })

    const name = filters.name?.trim()
    if (name) params.set('name', name)

    const location = filters.location?.trim()
    if (location) params.set('location', location)

    if (role === 'nanny') {
      filters.job_type?.forEach((v) => params.append('job_type', v))
      filters.children_age_range?.forEach((v) => params.append('children_age_range', v))
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

  async function togglePublish(user: AdminUserRow) {
    setPendingPublishId(user.id)
    const action = user.profile?.is_published ? 'unpublish' : 'publish'
    const res = await fetch(`/api/admin/users/${user.id}/${action}`, { method: 'POST' })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id && u.profile
            ? { ...u, profile: { ...u.profile, is_published: !u.profile.is_published } }
            : u
        )
      )
    } else {
      const body = await res.json()
      alert(body.error ?? 'Nie udało się wykonać akcji')
    }
    setPendingPublishId(null)
  }

  async function deleteAccount(user: AdminUserRow) {
    if (
      !window.confirm(
        `Trwale usunąć konto użytkownika ${user.full_name}? Ta operacja jest nieodwracalna — usunięte zostaną jego profil, zdjęcie i wiadomości.`
      )
    ) {
      return
    }
    setPendingDeleteId(user.id)
    const res = await fetch(`/api/admin/users/${user.id}/delete`, { method: 'POST' })
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } else {
      const body = await res.json()
      alert(body.error ?? 'Nie udało się usunąć konta')
    }
    setPendingDeleteId(null)
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
                <CheckboxGroup
                  label="Typ pracy"
                  options={JOB_TYPE_OPTIONS}
                  value={filters.job_type ?? []}
                  onChange={(value) =>
                    setFilters((f) => ({ ...f, job_type: value as JobType[] }))
                  }
                />
                <CheckboxGroup
                  label="Wiek dzieci"
                  options={AGE_RANGE_OPTIONS}
                  value={filters.children_age_range ?? []}
                  onChange={(value) =>
                    setFilters((f) => ({ ...f, children_age_range: value as ChildrenAgeRange[] }))
                  }
                />
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
                        {role === 'nanny' && (
                          <Badge
                            variant={user.profile?.is_published ? 'success' : 'default'}
                            className="ml-2"
                          >
                            {user.profile?.is_published ? 'Opublikowany' : 'Nieopublikowany'}
                          </Badge>
                        )}
                      </p>
                      <p className="truncate text-sm text-gray-500">{user.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user.profile?.location && <Badge>{user.profile.location}</Badge>}
                        {role === 'nanny' && user.profile?.experience_years !== undefined && (
                          <Badge>{user.profile.experience_years} lat doświadczenia</Badge>
                        )}
                        {role === 'nanny' &&
                          user.profile?.job_type?.map((jt) => <Badge key={jt}>{JOB_TYPE_LABEL[jt]}</Badge>)}
                        {role === 'nanny' &&
                          user.profile?.children_age_range?.map((range) => (
                            <Badge key={range}>{AGE_RANGE_LABEL[range]}</Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {role === 'nanny' && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={pendingPublishId === user.id}
                        onClick={() => togglePublish(user)}
                      >
                        {user.profile?.is_published ? 'Cofnij publikację' : 'Opublikuj'}
                      </Button>
                    )}
                    <Button
                      variant={user.is_banned ? 'outline' : 'danger'}
                      size="sm"
                      isLoading={pendingId === user.id}
                      onClick={() => toggleBan(user)}
                    >
                      {user.is_banned ? 'Odbanuj' : 'Zbanuj'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={pendingDeleteId === user.id}
                      onClick={() => deleteAccount(user)}
                    >
                      Usuń konto
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

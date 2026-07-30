'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type { NannyProfile, ParentProfile } from '@/types'

type Profile = Partial<NannyProfile & ParentProfile>

// Quick publish/unpublish toggle for the dashboard's "Status profilu" card
// — same PUT /api/profile call the full toggle in /profile makes.
//
// Sends the *whole* profile, not just {is_published, published_at}: /api/profile's
// upsert only ever *writes* the columns present in the body, but Postgres still
// validates CHECK constraints spanning other columns (chk_..._publish_requires_title)
// against the row it would insert on a conflict — built from the payload plus
// NULL/defaults for anything omitted — before it even gets to the ON CONFLICT
// branch. A payload with just is_published:true and no title looks like
// "publish with no title" to that check and 500s, even though the existing row
// already has one. Found via testing the real button, not by reading the SQL.
export function PublishToggleButton({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    const publishing = !profile.is_published

    if (publishing && !profile.title?.trim()) {
      setError('Uzupełnij tytuł ogłoszenia w Mój profil, aby opublikować.')
      return
    }

    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          is_published: publishing,
          published_at: publishing ? new Date().toISOString() : profile.published_at,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Nie udało się zmienić statusu publikacji')
        return
      }
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={profile.is_published ? 'outline' : 'primary'}
        size="sm"
        isLoading={isLoading}
        onClick={handleClick}
      >
        {profile.is_published ? 'Cofnij publikację' : 'Opublikuj profil'}
      </Button>
      {error && <p className="text-right text-xs text-red-600">{error}</p>}
    </div>
  )
}

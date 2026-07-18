'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { Profile } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) setProfile(data as Profile)
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
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('profiles').upsert({
        ...profile,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your personal information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Avatar */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              size="xl"
            />
            <p className="text-sm text-gray-500 text-center">
              Avatar upload coming soon
            </p>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Full name"
                value={profile.full_name ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
              />
              <Input
                label="Phone"
                type="tel"
                value={profile.phone ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
              />
              <Input
                label="Location"
                value={profile.location ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, location: e.target.value }))
                }
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={4}
                  value={profile.bio ?? ''}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="Tell others about yourself..."
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                  Profile saved successfully!
                </p>
              )}

              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

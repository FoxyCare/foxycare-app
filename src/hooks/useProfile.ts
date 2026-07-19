'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, ParentProfile, NannyProfile } from '@/types'

export function useProfile(userId?: string) {
  const [user, setUser] = useState<User | null>(null)
  const [roleProfile, setRoleProfile] = useState<ParentProfile | NannyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    async function load() {
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        setError(userError.message)
        setIsLoading(false)
        return
      }

      setUser(userRow as User)

      const profileTable = userRow.role === 'nanny' ? 'nanny_profiles' : 'parent_profiles'
      const { data: profileRow, error: profileError } = await supabase
        .from(profileTable)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (profileError) setError(profileError.message)
      else setRoleProfile(profileRow as ParentProfile | NannyProfile | null)

      setIsLoading(false)
    }

    load()
  }, [userId])

  return { user, roleProfile, isLoading, error }
}

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Verifies the caller of an /api/admin/* route is signed in and has the
 * 'admin' role. Returns the user id on success, or a ready-to-return
 * NextResponse (401/403) on failure — callers do
 * `const result = await requireAdmin(supabase); if (result instanceof NextResponse) return result`.
 */
export async function requireAdmin(
  supabase: SupabaseClient
): Promise<string | NextResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return user.id
}

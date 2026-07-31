import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'
import { logAdminAction } from '@/lib/admin/logAdminAction'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (adminCheck instanceof NextResponse) return adminCheck

  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .single()
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  // id here is users.id (nanny_profiles.user_id / parent_profiles.user_id),
  // not the profile row's own id — same convention as ban/unban. Requires
  // nanny_profiles_update_admin / parent_profiles_update_admin RLS
  // (foxycare-db migrations 0020, 0032).
  const profileTable = targetUser.role === 'nanny' ? 'nanny_profiles' : 'parent_profiles'
  const { error } = await supabase
    .from(profileTable)
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('user_id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAdminAction(supabase, adminCheck, id, 'publish')
  return NextResponse.json({ success: true })
}

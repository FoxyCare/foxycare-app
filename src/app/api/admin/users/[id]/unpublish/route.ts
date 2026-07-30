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

  const profileTable = targetUser.role === 'nanny' ? 'nanny_profiles' : 'parent_profiles'
  const { error } = await supabase
    .from(profileTable)
    .update({ is_published: false })
    .eq('user_id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAdminAction(supabase, adminCheck, id, 'unpublish')
  return NextResponse.json({ success: true })
}

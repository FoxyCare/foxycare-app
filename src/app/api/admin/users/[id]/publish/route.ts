import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (adminCheck instanceof NextResponse) return adminCheck

  // id here is users.id (nanny_profiles.user_id), not nanny_profiles.id —
  // same convention as ban/unban. Requires nanny_profiles_update_admin RLS
  // (foxycare-db migration 0020).
  const { error } = await supabase
    .from('nanny_profiles')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('user_id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

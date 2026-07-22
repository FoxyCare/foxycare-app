import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'
import { logAdminAction } from '@/lib/admin/logAdminAction'
import { deleteAvatar } from '@/lib/upload/uploadAvatar'

// Admin-triggered Art. 17 fulfilment — for accounts that can't act for
// themselves via /api/account (e.g. a banned user requesting erasure by
// email per /terms §12, since a banned account can't log in at all).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (adminCheck instanceof NextResponse) return adminCheck

  if (id === adminCheck) {
    return NextResponse.json({ error: 'Nie możesz usunąć własnego konta stąd' }, { status: 400 })
  }

  // Logged before deletion — admin_actions.target_user_id has an FK to
  // users(id) that must still exist at insert time (it's ON DELETE SET NULL
  // for later deletions, not insertable against an already-gone row).
  await logAdminAction(supabase, adminCheck, id, 'delete_account')

  await deleteAvatar(supabase, id)

  const { error } = await supabase.rpc('delete_user_account', { target_id: id })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

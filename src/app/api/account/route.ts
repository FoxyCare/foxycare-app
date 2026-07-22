import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteAvatar } from '@/lib/upload/uploadAvatar'

// Self-service Art. 17 ("right to be forgotten") fulfilment. Deletes the
// caller's own account — RLS inside delete_user_account (foxycare-db
// migration 0022) enforces that a caller may only ever target their own id
// here; this route just decides *whose* id that is from the session, it's
// not itself the security boundary.
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await deleteAvatar(supabase, user.id)

  const { error } = await supabase.rpc('delete_user_account', { target_id: user.id })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

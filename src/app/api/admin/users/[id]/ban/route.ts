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

  if (id === adminCheck) {
    return NextResponse.json({ error: 'Nie możesz zbanować własnego konta' }, { status: 400 })
  }

  // Enforced entirely via the users.is_banned flag — LoginForm checks it
  // right after a successful credential check and signs the user back out
  // if set. No Supabase Auth Admin API / service_role key involved.
  const { error } = await supabase
    .from('users')
    .update({ is_banned: true, banned_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

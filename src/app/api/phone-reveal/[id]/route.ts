import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Whether [id]'s phone number can be revealed at all — side-effect-free,
// so client components (e.g. the chat header) can decide whether to render
// a "Pokaż numer telefonu" button without triggering a reveal. Backed by
// is_phone_shareable(), granted to anon too, but this route is only ever
// reached from already-authenticated pages.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('is_phone_shareable', { target_user_id: id })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ shareable: data })
}

// Reveals [id]'s phone number, if its owner has consented — records the
// reveal for their "who viewed my number" stat (skipped when id === self).
// reveal_phone() (foxycare-db migration 0023) is the actual gate; this
// route only turns its exception into a sensible HTTP status.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('reveal_phone', { target_user_id: id })
  if (error) {
    return NextResponse.json({ error: 'Numer telefonu jest niedostępny' }, { status: 404 })
  }

  return NextResponse.json({ phone: data })
}

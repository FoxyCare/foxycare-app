import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Self-service management of the caller's own phone number + "Udostępnij
// numer telefonu" consent toggle, plus how many people have revealed it.
// The number itself lives in contact_phones (foxycare-db migration 0023),
// not nanny_profiles/parent_profiles — see that migration's comment for
// why (RLS can't hide a column, only a row).
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: contactPhone, error: phoneError } = await supabase
    .from('contact_phones')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (phoneError) {
    return NextResponse.json({ error: phoneError.message }, { status: 500 })
  }

  const { count, error: countError } = await supabase
    .from('phone_reveals')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  return NextResponse.json({
    phone: contactPhone?.phone ?? null,
    phone_visible: contactPhone?.phone_visible ?? false,
    reveal_count: count ?? 0,
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { phone, phone_visible } = await request.json()

  const { data, error } = await supabase
    .from('contact_phones')
    .upsert({ user_id: user.id, phone, phone_visible }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  const profileTable = userRow.role === 'nanny' ? 'nanny_profiles' : 'parent_profiles'
  const { data: profile, error: profileError } = await supabase
    .from(profileTable)
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ user: userRow, profile })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  const body = await request.json()
  const profileTable = userRow.role === 'nanny' ? 'nanny_profiles' : 'parent_profiles'

  const { data, error } = await supabase
    .from(profileTable)
    .upsert({ ...body, user_id: user.id }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

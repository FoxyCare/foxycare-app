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

  const { data, error } = await supabase
    .from('conversations')
    .select(
      '*, user1:users!user1_id(id, full_name), user2:users!user2_id(id, full_name)'
    )
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const conversations = data.map((c) => ({
    ...c,
    other_user: c.user1_id === user.id ? c.user2 : c.user1,
  }))

  return NextResponse.json(conversations)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { other_user_id } = body

  if (!other_user_id) {
    return NextResponse.json({ error: 'other_user_id is required' }, { status: 400 })
  }

  if (other_user_id === user.id) {
    return NextResponse.json(
      { error: 'Cannot create conversation with yourself' },
      { status: 400 }
    )
  }

  // conversations.user1_id < user2_id is enforced by a DB constraint
  const [user1Id, user2Id] = [user.id, other_user_id].sort()

  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user1_id', user1Id)
    .eq('user2_id', user2Id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(existing)
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user1_id: user1Id, user2_id: user2Id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

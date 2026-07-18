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
    .select('*')
    .contains('participant_ids', [user.id])
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
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
    return NextResponse.json(
      { error: 'other_user_id is required' },
      { status: 400 }
    )
  }

  if (other_user_id === user.id) {
    return NextResponse.json(
      { error: 'Cannot create conversation with yourself' },
      { status: 400 }
    )
  }

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', [user.id, other_user_id])
    .single()

  if (existing) {
    return NextResponse.json(existing)
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      participant_ids: [user.id, other_user_id],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

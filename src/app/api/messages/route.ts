import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversation_id is required' },
      { status: 400 }
    )
  }

  // Verify user is a participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('participant_ids')
    .eq('id', conversationId)
    .single()

  if (
    !conversation ||
    !conversation.participant_ids.includes(user.id)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

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
  const { conversation_id, content } = body

  if (!conversation_id || !content?.trim()) {
    return NextResponse.json(
      { error: 'conversation_id and content are required' },
      { status: 400 }
    )
  }

  // Verify user is a participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('participant_ids')
    .eq('id', conversation_id)
    .single()

  if (
    !conversation ||
    !conversation.participant_ids.includes(user.id)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_id: user.id,
      content: content.trim(),
    })
    .select('*, sender:profiles!sender_id(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversation_id)

  return NextResponse.json(data, { status: 201 })
}

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
    return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })
  }

  // RLS already restricts this to conversations the caller participates in;
  // an empty/error result here means the caller isn't a participant.
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!sender_id(id, full_name)')
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

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('user1_id, user2_id')
    .eq('id', conversation_id)
    .single()

  if (conversationError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const receiverId =
    conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id

  // conversations.last_message_at is kept in sync by a DB trigger on insert
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    })
    .select('*, sender:users!sender_id(id, full_name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

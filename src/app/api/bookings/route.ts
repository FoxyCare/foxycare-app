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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const isNanny = profile.role === 'nanny'
  const { data, error } = await supabase
    .from('bookings')
    .select('*, parent:profiles!parent_id(*), nanny:profiles!nanny_id(*)')
    .eq(isNanny ? 'nanny_id' : 'parent_id', profile.id)
    .order('created_at', { ascending: false })

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
  const { nanny_id, start_time, end_time, hourly_rate, notes } = body

  if (!nanny_id || !start_time || !end_time || !hourly_rate) {
    return NextResponse.json(
      { error: 'Missing required fields: nanny_id, start_time, end_time, hourly_rate' },
      { status: 400 }
    )
  }

  const { data: parentProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!parentProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const hours =
    (new Date(end_time).getTime() - new Date(start_time).getTime()) /
    (1000 * 60 * 60)

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      parent_id: parentProfile.id,
      nanny_id,
      start_time,
      end_time,
      hourly_rate,
      total_amount: Math.round(hours * hourly_rate * 100) / 100,
      notes,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

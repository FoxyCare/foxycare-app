import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supabase = await createClient()

  let query = supabase
    .from('ads')
    .select('*, images:ad_images(*), nanny:users!nanny_id(id, full_name)')
    .order('created_at', { ascending: false })

  const location = searchParams.get('location')
  if (location) query = query.ilike('location', `%${location}%`)

  const jobType = searchParams.get('job_type')
  if (jobType) query = query.eq('job_type', jobType)

  const childrenAgeRange = searchParams.get('children_age_range')
  if (childrenAgeRange) query = query.eq('children_age_range', childrenAgeRange)

  const minExperience = searchParams.get('min_experience')
  if (minExperience) query = query.gte('experience_years', Number(minExperience))

  const maxExperience = searchParams.get('max_experience')
  if (maxExperience) query = query.lte('experience_years', Number(maxExperience))

  const minPrice = searchParams.get('min_price')
  if (minPrice) query = query.gte('price', Number(minPrice))

  const maxPrice = searchParams.get('max_price')
  if (maxPrice) query = query.lte('price', Number(maxPrice))

  const { data, error } = await query

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
  const { title, description, experience_years, children_age_range, job_type, location, price } = body

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ads')
    .insert({
      nanny_id: user.id,
      title,
      description,
      experience_years: experience_years ?? 0,
      children_age_range,
      job_type,
      location,
      price,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

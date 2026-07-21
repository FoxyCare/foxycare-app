import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export async function GET(request: Request) {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (adminCheck instanceof NextResponse) return adminCheck

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  if (role !== 'parent' && role !== 'nanny') {
    return NextResponse.json({ error: 'role must be "parent" or "nanny"' }, { status: 400 })
  }

  const profileTable = role === 'nanny' ? 'nanny_profiles' : 'parent_profiles'
  let query = supabase
    .from('users')
    .select(`*, profile:${profileTable}!inner(*)`)
    .eq('role', role)
    .order('created_at', { ascending: false })

  const name = searchParams.get('name')?.trim()
  if (name) query = query.ilike('full_name', `%${name}%`)

  const location = searchParams.get('location')?.trim()
  if (location) query = query.ilike('profile.location', `%${location}%`)

  if (role === 'nanny') {
    const jobType = searchParams.getAll('job_type')
    if (jobType.length) query = query.overlaps('profile.job_type', jobType)

    const ageRange = searchParams.getAll('children_age_range')
    if (ageRange.length) query = query.overlaps('profile.children_age_range', ageRange)

    const minExperience = searchParams.get('min_experience')
    if (minExperience) query = query.gte('profile.experience_years', Number(minExperience))
  }

  const { data, error } = await query.limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
